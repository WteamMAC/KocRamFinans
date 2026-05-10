import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// API Key Rotasyonu
const getApiKeys = () => {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys.length > 0 ? keys : ["missing_api_key"];
};

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

const getNextGenAI = () => {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return new GoogleGenerativeAI(key);
};

// Sadece STABIL modeller
const FALLBACK_MODELS = [
  "gemini-1.5-flash",    // En hızlı
  "gemini-1.5-flash-8b", // En ekonomik ve hızlı
  "gemini-1.5-pro"       // En zeki (yedek)
];

const MARKET_KEYWORDS = ["dolar", "euro", "sterlin", "döviz", "altın", "borsa", "hisse", "kripto", "fiyat"];
const DB_ACTION_KEYWORDS = ["ekle", "kaydet", "sil", "güncelle", "maaş", "gider"];

// Mesaj geçmişini Gemini kurallarına (User-Model-User) göre temizler
function sanitizeHistory(messages: any[]) {
  const sanitized = [];
  let lastRole = null;

  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "model";
    // Ardışık aynı roller Gemini'de yasaktır. 
    // Eğer aynı rol gelirse, içeriği önceki mesajın sonuna ekle.
    if (role === lastRole) {
      sanitized[sanitized.length - 1].parts[0].text += "\n" + msg.content;
    } else {
      sanitized.push({
        role: role,
        parts: [{ text: msg.content || " " }]
      });
      lastRole = role;
    }
  }
  return sanitized;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const traceId = Math.random().toString(36).substring(7);
  let currentStage = "INIT";

  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz.", { status: 401 });

    const body = await req.json();
    const { messages } = body;
    if (!messages?.length) return new Response("Mesaj yok.", { status: 400 });

    const lastMessageObj = messages[messages.length - 1];
    const lastMessage = lastMessageObj.content;
    const lowerMsg = lastMessage.toLowerCase();
    
    const isDbAction = DB_ACTION_KEYWORDS.some(kw => lowerMsg.includes(kw));
    const isSearchAction = MARKET_KEYWORDS.some(kw => lowerMsg.includes(kw));

    currentStage = "DB";
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { incomes: true, expenses: true, debts: true, investments: true },
    });
    if (!user) return new Response("Kullanıcı yok.", { status: 404 });

    currentStage = "CONTEXT";
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"));

    // Geçmişi temizle (Son mesaj hariç)
    const history = sanitizeHistory(messages.slice(0, -1));

    currentStage = "AI_TRIALS";
    
    for (let k = 0; k < API_KEYS.length; k++) {
      const genAI = getNextGenAI();

      for (let m = 0; m < FALLBACK_MODELS.length; m++) {
        const modelId = FALLBACK_MODELS[m];
        console.log(`[${traceId}] Deneme: Key ${currentKeyIndex}, Model ${modelId}`);

        try {
          const modelConfig: any = {
            model: modelId,
            systemInstruction: systemPrompt,
          };

          // Gemini kısıtı: googleSearch ve functionDeclarations çakışmaması için önceliklendirme
          if (isDbAction) {
            modelConfig.tools = [{
              functionDeclarations: [
                { name: "addIncome", description: "Gelir ekler", parameters: { type: "object", properties: { type: { type: "string" }, amount: { type: "number" }, description: { type: "string" } }, required: ["type", "amount"] } },
                { name: "addExpense", description: "Gider ekler", parameters: { type: "object", properties: { type: { type: "string" }, amount: { type: "number" }, isRecurring: { type: "boolean" } }, required: ["type", "amount"] } },
                { name: "addDebt", description: "Borç ekler", parameters: { type: "object", properties: { type: { type: "string" }, amount: { type: "number" } }, required: ["type", "amount"] } },
                { name: "addInvestment", description: "Yatırım ekler", parameters: { type: "object", properties: { type: { type: "string" }, amount: { type: "number" } }, required: ["type", "amount"] } }
              ]
            }];
          } else if (isSearchAction) {
            modelConfig.tools = [{ googleSearch: {} }];
          }

          const model = genAI.getGenerativeModel(modelConfig);
          const chat = model.startChat({ history });
          
          // API çağrısını timeout ile sarmala (15 saniye her model için)
          const result = await Promise.race([
            chat.sendMessageStream(lastMessage),
            new Promise((_, reject) => setTimeout(() => reject(new Error("MODEL_TIMEOUT")), 15000))
          ]) as any;

          // Stream başlat
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.stream) {
                  let text = "";
                  try { text = chunk.text(); } catch {}
                  if (text) controller.enqueue(encoder.encode(text));
                  
                  const calls = chunk.functionCalls?.();
                  if (calls) {
                    for (const call of calls) {
                      const payload = JSON.stringify({ name: call.name, args: call.args });
                      controller.enqueue(encoder.encode(`\n\n__TOOL_CALL__:${payload}__END_TOOL_CALL__\n`));
                    }
                  }
                }
                controller.close();
              } catch (e) { controller.error(e); }
            }
          });

          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

        } catch (err: any) {
          // KRITIK: Hatayı detaylı logla!
          console.error(`[${traceId}] [ERROR_DETAIL] Key:${currentKeyIndex} Model:${modelId}:`, {
            name: err.name,
            message: err.message,
            status: err.status,
            reason: err.reason // Gemini spesifik hatalar
          });

          const is429 = err.status === 429 || err.message?.includes("429");
          if (is429) break; // Kota bittiyse sonraki anahtara geç
          continue; // Diğer hatalarda sonraki modeli dene
        }
      }
    }

    throw new Error("Tüm denemeler başarısız. Lütfen 30 saniye bekleyin.");

  } catch (error: any) {
    console.error(`[${traceId}] FINAL_ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
