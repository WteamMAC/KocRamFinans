import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── API KEY ROTASYONU ──────────────────────────────────────────────────────
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

const getKeyAtIndex = (index: number) => {
  const key = API_KEYS[index % API_KEYS.length];
  const maskedKey = `...${key.slice(-4)}`;
  return { key, maskedKey };
};

// ─── MODELLER VE ARAÇLAR ─────────────────────────────────────────────────────
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

const MARKET_KEYWORDS = [
  "dolar", "euro", "sterlin", "döviz", "kur", "altın", "gram altın", "çeyrek altın",
  "borsa", "bist", "hisse", "endeks", "bitcoin", "btc", "kripto", "fiyat", "kaç tl",
  "piyasa", "ekonomi", "faiz", "enflasyon", "güncel haber", "borsa istanbul"
];

const DB_ACTION_KEYWORDS = [
  "ekle", "kaydet", "sil", "güncelle", "yeni gelir", "yeni gider", "borç ekle", "maaş ekle", "yatırım ekle"
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
  const hasAction = ["ekle", "kaydet", "sil", "güncelle"].some(kw => lower.includes(kw));
  const hasSpecificAction = ["yeni gelir", "yeni gider", "yeni borç", "yeni yatırım"].some(kw => lower.includes(kw));

  if (hasAction || hasSpecificAction) {
     if (DB_ACTION_KEYWORDS.some(kw => lower.includes(kw))) return "db";
  }
  
  const priceKeywords = ["kaç tl", "fiyat", "kur", "ne kadar", "borsa durumu", "güncel haber", "endeks", "değeri", "borsa"];
  const hasMarketKeyword = MARKET_KEYWORDS.some(kw => lower.includes(kw));
  const isAskingPrice = priceKeywords.some(pk => lower.includes(pk));

  if (hasMarketKeyword && isAskingPrice) return "search";
  return "none";
}

export async function POST(req: Request) {
  const traceId = Math.random().toString(36).substring(7);
  let lastRateLimitReason = "";

  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz.", { status: 401 });

    const body = await req.json();
    const { messages } = body;
    const limitedMessages = messages.slice(-10);
    const lastMessage = limitedMessages[limitedMessages.length - 1].content;
    const toolMode = classifyMessage(lastMessage);

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

    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"));

    // --- AI DENEME DÖNGÜSÜ ---
    for (let keyTrial = 0; keyTrial < API_KEYS.length; keyTrial++) {
      const trialIndex = (currentKeyIndex) % API_KEYS.length;
      const { key, maskedKey } = getKeyAtIndex(trialIndex);
      const ai = new GoogleGenAI({ apiKey: key });

      for (let modelIndex = 0; modelIndex < FALLBACK_MODELS.length; modelIndex++) {
        const modelId = FALLBACK_MODELS[modelIndex];
        console.log(`[${traceId}] [TRIAL] KeyIndex: ${trialIndex}, Model: ${modelId}, Tool: ${toolMode}`);

        try {
          let tools: any[] | undefined;
          if (toolMode === "db") {
            tools = [{ functionDeclarations: FUNCTION_DECLARATIONS }];
          } else if (toolMode === "search") {
            tools = [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.3 } } } as any];
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
              systemInstruction: { parts: [{ text: systemPrompt }] },
              tools: tools as any
            }
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                let hasSentAnything = false;
                for await (const chunk of response) {
                  if (chunk.candidates?.[0]?.content?.parts) {
                    for (const part of chunk.candidates[0].content.parts) {
                      if (part.text) {
                        controller.enqueue(encoder.encode(part.text));
                        hasSentAnything = true;
                      }
                      if (part.functionCall) {
                        const payload = JSON.stringify({ name: part.functionCall.name, args: part.functionCall.args });
                        controller.enqueue(encoder.encode(`\n\n__TOOL_CALL__:${payload}__END_TOOL_CALL__\n`));
                        hasSentAnything = true;
                      }
                    }
                  }
                }
                if (!hasSentAnything) controller.enqueue(encoder.encode("Üzgünüm, şu an yanıt veremiyorum."));
                controller.close();
              } catch (e) { controller.error(e); }
            }
          });

          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

        } catch (err: any) {
          const errorDetails = err.message || JSON.stringify(err);
          const statusCode = err.status || (err.response?.status) || 0;
          console.warn(`[${traceId}] [FAIL] KeyIndex: ${trialIndex}, Model: ${modelId}, Status: ${statusCode}`);

          if (statusCode === 429 || statusCode === 401 || errorDetails.includes("quota") || errorDetails.includes("API_KEY")) {
            lastRateLimitReason = `Anahtar Hatası (${statusCode}): ${maskedKey}`;
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            break; // Bir sonraki anahtara geç
          }

          lastRateLimitReason = `Model Hatası (${statusCode}): ${modelId}`;
          continue; 
        }
      }
    }
    throw new Error("Tüm kaynaklar tükendi. Son durum: " + lastRateLimitReason);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: lastRateLimitReason || "Sistem yoğun.", details: error.message }), { status: 500 });
  }
}
