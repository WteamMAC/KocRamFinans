import { GoogleGenerativeAI } from "@google/generative-ai";
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
const getNextGenAI = () => {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`[ROTATION] Kullanılan Key Index: ${currentKeyIndex} (Toplam: ${API_KEYS.length})`);
  return new GoogleGenerativeAI(key);
};

// ─── MODELLER VE ARAÇLAR ─────────────────────────────────────────────────────

const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash",
  "gemini-flash-latest",
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
      type: "object",
      properties: {
        type: { type: "string", description: "Gelir türü (Salary, Rent, Freelance, Other)" },
        amount: { type: "number", description: "Miktar" },
        description: { type: "string", description: "Açıklama" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addExpense",
    description: "Yeni bir gider ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Gider türü (Rent, Bill, Groceries, Other)" },
        amount: { type: "number", description: "Miktar" },
        isRecurring: { type: "boolean", description: "Düzenli mi?" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addDebt",
    description: "Yeni bir borç ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Borç türü" },
        amount: { type: "number", description: "Miktar" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addInvestment",
    description: "Yeni bir yatırım (hisse, kripto, altın vb.) ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Yatırım türü (BIST, NASDAQ, CRYPTO, GOLD)" },
        symbol: { type: "string", description: "Sembol (Örn: THYAO, BTC, AAPL, XAU)" },
        quantity: { type: "number", description: "Adet/Miktar" },
        purchasePrice: { type: "number", description: "Birim Alış Fiyatı" },
        description: { type: "string", description: "Not" }
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
    const lastMessage = messages[messages.length - 1].content;
    const toolMode = classifyMessage(lastMessage);

    currentStage = "DB";
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { incomes: true, expenses: true, debts: true, investments: true },
    });

    if (!user) return new Response("User not found", { status: 404 });

    currentStage = "CONTEXT";
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"));

    // --- AI DENEME DÖNGÜSÜ (Key + Model Rotasyonu) ---
    currentStage = "AI";

    // Her bir anahtar için modelleri tek tek dene
    for (let keyTrial = 0; keyTrial < API_KEYS.length; keyTrial++) {
      const genAI = getNextGenAI(); // Rotasyondaki sıradaki anahtarı al

      for (let modelIndex = 0; modelIndex < FALLBACK_MODELS.length; modelIndex++) {
        const modelId = FALLBACK_MODELS[modelIndex];

        console.log(`[${traceId}] [TRIAL] KeyTrial: ${keyTrial + 1}, Model: ${modelId}, Tool: ${toolMode}`);

        try {
          let tools: any[] | undefined;
          if (toolMode === "db") tools = [{ functionDeclarations: FUNCTION_DECLARATIONS }];
          else if (toolMode === "search") tools = [{ googleSearchRetrieval: {} }];

          const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction: systemPrompt,
            ...(tools ? { tools: tools as any } : {}),
          });

          const chat = model.startChat({
            history: messages.slice(0, -1).map((m: any) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }]
            }))
          });

          const result = await chat.sendMessageStream(lastMessage);

          // Stream okuma ve Response döndürme
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.stream) {
                  let chunkText = "";
                  try { chunkText = chunk.text(); } catch { }
                  if (chunkText) controller.enqueue(encoder.encode(chunkText));

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
            const errorDetails = err.message || "Unknown error";
            const is429 = err.status === 429 || errorDetails.includes("429");
            const isAuthError = errorDetails.includes("API key expired") || errorDetails.includes("API_KEY_INVALID") || err.status === 400;
            console.warn(`[${traceId}] [FAIL] Key Index: ${currentKeyIndex}, Model: ${modelId}, Error: ${errorDetails}`);

            if (is429 || isAuthError) {
              // Teşhis Et
              if (errorDetails.includes("RPM")) lastRateLimitReason = "Dakikalık İstek Sınırı (RPM)";
              else if (errorDetails.includes("TPM")) lastRateLimitReason = "Dakikalık Token Sınırı (TPM)";
              else if (errorDetails.includes("RPD")) lastRateLimitReason = "Günlük İstek Sınırı (RPD)";
              else if (errorDetails.includes("expired")) lastRateLimitReason = "API Anahtarının Süresi Dolmuş (Expired)";
              else if (errorDetails.includes("API_KEY_INVALID")) lastRateLimitReason = "Geçersiz API Anahtarı (Invalid)";
              else if (isAuthError) lastRateLimitReason = "API Anahtarı Hatası (400/Auth)";
              else lastRateLimitReason = "Genel Kota Sınırı (429)";

              console.warn(`[${traceId}] [DIAGNOSIS] Reason: ${lastRateLimitReason}`);

              // Eğer bu anahtarda kota veya auth sorunu varsa, bir sonraki anahtara geç
              break; 
            }

          // Diğer hatalarda aynı anahtarın sonraki modelini dene
          // @ts-ignore
          global.lastAiError = errorDetails;
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
