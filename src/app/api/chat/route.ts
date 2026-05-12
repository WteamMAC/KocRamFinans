import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── API KEY ROTASYONU ──────────────────────────────────────────────────────
// Env içindeki GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3... anahtarlarını toplar
const getApiKeys = () => {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);

  // Ek anahtarları ara (GEMINI_API_KEY_2'den 10'a kadar)
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }

  return keys.length > 0 ? keys : ["missing_api_key"];
};

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

// Sıradaki API anahtarını veren yardımcı fonksiyon
const getNextKey = () => {
  const key = API_KEYS[currentKeyIndex];
  const maskedKey = `...${key.slice(-4)}`;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`[ROTATION] Kullanılan Key: ${maskedKey} (Index: ${currentKeyIndex})`);
  return { key, maskedKey };
};

// ─── MODELLER VE ARAÇLAR ─────────────────────────────────────────────────────

const FALLBACK_MODELS = [
  "models/gemini-3.1-flash-lite", 
  "models/gemini-2.5-flash-lite",
  "models/gemini-3-flash",
  "models/gemini-2.5-flash",
  "models/gemini-2-flash"
];

const MARKET_KEYWORDS = [
  "dolar", "euro", "sterlin", "döviz", "kur", "altın", "gram altın", "çeyrek altın",
  "borsa", "bist", "hisse", "endeks", "bitcoin", "btc", "kripto", "fiyat", "kaç tl",
  "piyasa", "ekonomi", "faiz", "enflasyon", "güncel haber", "borsa istanbul"
];

const DB_ACTION_KEYWORDS = [
  "ekle", "kaydet", "sil", "güncelle", "yeni gelir", "yeni gider", "borç", "maaş"
];

const FUNCTION_DECLARATIONS = [
  {
    name: "addIncome",
    description: "Yeni bir gelir kaynağı ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Gelir türü (Salary, Rent, Freelance, Other)" },
        amount: { type: "NUMBER", description: "Miktar" },
        description: { type: "STRING", description: "Açıklama" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addExpense",
    description: "Yeni bir gider ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Gider türü (Rent, Bill, Groceries, Other)" },
        amount: { type: "NUMBER", description: "Miktar" },
        isRecurring: { type: "BOOLEAN", description: "Düzenli mi?" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addDebt",
    description: "Yeni bir borç ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Borç türü" },
        amount: { type: "NUMBER", description: "Miktar" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addInvestment",
    description: "Yeni bir yatırım (hisse, kripto, altın vb.) ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Yatırım türü (BIST, NASDAQ, CRYPTO, GOLD)" },
        symbol: { type: "STRING", description: "Sembol (Örn: THYAO, BTC, AAPL, XAU)" },
        quantity: { type: "NUMBER", description: "Adet/Miktar" },
        purchasePrice: { type: "NUMBER", description: "Birim Alış Fiyatı" },
        description: { type: "STRING", description: "Not" }
      },
      required: ["type", "quantity", "purchasePrice"]
    }
  }
];

type ToolMode = "none" | "search" | "db";

function classifyMessage(message: string): ToolMode {
  const lower = message.toLowerCase();
  if (DB_ACTION_KEYWORDS.some(kw => lower.includes(kw))) return "db";
  if (MARKET_KEYWORDS.some(kw => lower.includes(kw))) return "search";
  return "none";
}

// ─── ANA HANDLER ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const startTime = Date.now();
  const traceId = Math.random().toString(36).substring(7);
  let currentStage = "INIT";
  let lastRateLimitReason = "";

  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz.", { status: 401 });

    const body = await req.json();
    const { messages } = body;
    
    // ─── GEÇMİŞ BUDAMA (TOKEN TASARRUFU) ────────────────────────────────────────
    // Son 10 mesajı al (Bağlamı korurken kotayı rahatlatır)
    const limitedMessages = messages.slice(-10);
    const lastMessage = limitedMessages[limitedMessages.length - 1].content;
    const toolMode = classifyMessage(lastMessage);

    currentStage = "DB";
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        incomes: { take: 10 }, 
        expenses: { take: 10 }, 
        debts: { take: 10 }, 
        investments: { take: 20 } 
      },
    });

    if (!user) return new Response("User not found", { status: 404 });

    currentStage = "CONTEXT";
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"));

    // --- AI DENEME DÖNGÜSÜ (Key + Model Rotasyonu) ---
    currentStage = "AI";

    for (let keyTrial = 0; keyTrial < API_KEYS.length; keyTrial++) {
      const { key, maskedKey } = getNextKey();
      const ai = new GoogleGenAI({ apiKey: key });

      for (let modelIndex = 0; modelIndex < FALLBACK_MODELS.length; modelIndex++) {
        const modelId = FALLBACK_MODELS[modelIndex];

        console.log(`[${traceId}] [TRIAL] [V1-SDK] Key: ${maskedKey}, Model: ${modelId}, Tool: ${toolMode}`);

        try {
          let tools: any[] | undefined;
          if (toolMode === "db") {
            tools = [{ function_declarations: FUNCTION_DECLARATIONS }];
          } else if (toolMode === "search") {
            tools = [{ google_search_retrieval: {} }];
          }

          const response = await ai.models.generateContentStream({
            model: modelId,
            contents: [
              ...limitedMessages.slice(0, -1).map((m: any) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }]
              })),
              { role: "user", parts: [{ text: lastMessage }] }
            ],
            config: {
              systemInstruction: systemPrompt,
              tools: tools as any
            }
          });

          // Stream okuma ve Response döndürme
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of response) {
                  let chunkText = "";
                  
                  // Yeni SDK'da response nesnesi doğrudan iteratördür
                  if (chunk.candidates?.[0]?.content?.parts) {
                    const parts = chunk.candidates[0].content.parts;
                    for (const part of parts) {
                      if (part.text) {
                        chunkText += part.text;
                      }
                      if (part.functionCall) {
                        const call = part.functionCall;
                        const payload = JSON.stringify({ name: call.name, args: call.args });
                        controller.enqueue(encoder.encode(`\n\n__TOOL_CALL__:${payload}__END_TOOL_CALL__\n`));
                      }
                    }
                  }
                  
                  if (chunkText) controller.enqueue(encoder.encode(chunkText));
                }
                controller.close();
              } catch (e) { controller.error(e); }
            }
          });

          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

        } catch (err: any) {
          const errorDetails = err.message || JSON.stringify(err);
          const statusCode = err.status || (err.response?.status) || 0;
          const is429 = statusCode === 429 || errorDetails.includes("429");
          const is404 = statusCode === 404 || errorDetails.includes("404") || errorDetails.includes("not found");
          const isQuotaError = is429 || errorDetails.includes("quota") || statusCode === 503 || statusCode === 500;
          const isAuthError = errorDetails.includes("API key expired") || errorDetails.includes("API_KEY_INVALID") || (statusCode === 401);
          
          console.warn(`[${traceId}] [FAIL] Key: ${maskedKey}, Model: ${modelId}, Status: ${statusCode}, Error: ${errorDetails}`);

          // Eğer model bulunamadıysa (404), bir sonraki modele geç
          if (is404) {
            lastRateLimitReason = `Model Bulunamadı (404): ${modelId}`;
            continue;
          }

          if (isQuotaError || isAuthError) {
            if (errorDetails.includes("RPM")) lastRateLimitReason = `RPM Sınırı - Anahtar: ${maskedKey}`;
            else if (errorDetails.includes("TPM")) lastRateLimitReason = `TPM Sınırı - Anahtar: ${maskedKey}`;
            else if (isAuthError) lastRateLimitReason = `Yetki Hatası - Anahtar: ${maskedKey}`;
            else lastRateLimitReason = `Sistem Hatası (${statusCode}): ${errorDetails.slice(0, 30)}`;
            break;
          }

          lastRateLimitReason = `Hata (${statusCode}): ${errorDetails.slice(0, 30)}`;
          continue;
        }
      }
    }

    throw new Error("Tüm modeller denendi. Son hata: " + (global as any).lastAiError);


  } catch (error: any) {
    const message = lastRateLimitReason
      ? `Sorun Tespit Edildi: ${lastRateLimitReason}.`
      : "Sistem şu an yoğun, lütfen 15 saniye sonra tekrar deneyin.";

    console.error(`[${traceId}] FINAL ERROR:`, error.message);
    return new Response(JSON.stringify({
      error: message,
      details: error.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
