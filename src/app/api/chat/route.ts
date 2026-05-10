import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

// En hızlı modeller (Flash serisi)
const FALLBACK_MODELS = [
  "gemini-1.5-flash",    // Hızlı ve zeki
  "gemini-1.5-flash-8b", // Işık hızında (küçük model)
  "gemini-flash-latest"  // Yedek alias
];

const MARKET_KEYWORDS = ["dolar", "euro", "döviz", "kur", "altın", "borsa", "hisse", "kripto", "fiyat", "kaç tl"];
const DB_ACTION_KEYWORDS = ["ekle", "kaydet", "sil", "güncelle", "maaş", "gelir", "gider", "borç", "yatırım"];

function sanitizeHistory(messages: any[]) {
  const sanitized = [];
  let lastRole = null;
  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "model";
    if (role === lastRole) {
      sanitized[sanitized.length - 1].parts[0].text += "\n" + (msg.content || " ");
    } else {
      sanitized.push({ role, parts: [{ text: msg.content || " " }] });
      lastRole = role;
    }
  }
  return sanitized;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const traceId = Math.random().toString(36).substring(7);

  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz.", { status: 401 });

    const body = await req.json();
    const { messages } = body;
    if (!messages?.length) return new Response("Mesaj yok.", { status: 400 });

    const lastMessage = messages[messages.length - 1].content?.trim();
    if (!lastMessage) return new Response("Boş mesaj.", { status: 400 });

    const lowerMsg = lastMessage.toLowerCase();
    const isDbAction = DB_ACTION_KEYWORDS.some(kw => lowerMsg.includes(kw));
    const isSearchAction = MARKET_KEYWORDS.some(kw => lowerMsg.includes(kw));

    // DB verisi çekme
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { incomes: true, expenses: true, debts: true, investments: true },
    });
    if (!user) return new Response("Kullanıcı bulunamadı.", { status: 404 });

    // Bağlam ve Prompt hazırlama
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"));

    const history = sanitizeHistory(messages.slice(0, -1));

    // Deneme döngüsü
    for (let k = 0; k < API_KEYS.length; k++) {
      const genAI = getNextGenAI();

      for (let modelId of FALLBACK_MODELS) {
        try {
          const modelConfig: any = { model: modelId, systemInstruction: systemPrompt };

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
          const result = await chat.sendMessageStream(lastMessage);

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
          const is429 = err.status === 429 || err.message?.includes("429");
          console.warn(`[${traceId}] [FAIL] Key:${currentKeyIndex} Model:${modelId}: ${err.message}`);
          if (is429) break; // Kota bittiyse sonraki anahtara geç
          continue;
        }
      }
    }

    throw new Error("Sistem şu an yoğun, lütfen birazdan tekrar deneyin.");

  } catch (error: any) {
    console.error(`[${traceId}] FINAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
