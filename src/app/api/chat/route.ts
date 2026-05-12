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
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash-8b-latest"
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
  
  // "Borç" veya "Maaş" kelimesi tek başına DB tetiklememeli, yanında bir eylem (ekle vb.) olmalı.
  const hasAction = ["ekle", "kaydet", "sil", "güncelle"].some(kw => lower.includes(kw));
  const hasSpecificAction = ["yeni gelir", "yeni gider", "yeni borç"].some(kw => lower.includes(kw));

  if (hasAction || hasSpecificAction) {
     if (DB_ACTION_KEYWORDS.some(kw => lower.includes(kw))) return "db";
  }
  
  // Arama motoru sadece "fiyat, kur, kaç tl, ne kadar" gibi spesifik piyasa verisi sorularında tetiklensin.
  const priceKeywords = ["kaç tl", "fiyat", "kur", "ne kadar", "borsa durumu", "güncel haber", "endeks", "değeri"];
  const hasMarketKeyword = MARKET_KEYWORDS.some(kw => lower.includes(kw));
  const isAskingPrice = priceKeywords.some(pk => lower.includes(pk));

  if (hasMarketKeyword && isAskingPrice) return "search";
  
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
      // v1beta (varsayılan) sistem talimatlarını daha iyi destekler. 400 hatasını çözmek için v1'i kaldırıyoruz.
      const ai = new GoogleGenAI({ apiKey: key });

      for (let modelIndex = 0; modelIndex < FALLBACK_MODELS.length; modelIndex++) {
        const modelId = FALLBACK_MODELS[modelIndex];

        console.log(`[${traceId}] [TRIAL] [V1-SDK] Key: ${maskedKey}, Model: ${modelId}, Tool: ${toolMode}`);

        try {
          let tools: any[] | undefined;
          if (toolMode === "db") {
            tools = [{ functionDeclarations: FUNCTION_DECLARATIONS }];
          } else if (toolMode === "search") {
            // Google Arama aracını dinamik eşik değeriyle etkinleştiriyoruz
            tools = [{ 
              googleSearchRetrieval: { 
                dynamicRetrievalConfig: { 
                  mode: "MODE_DYNAMIC", 
                  dynamicThreshold: 0.3 
                } 
              } 
            } as any];
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
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              tools: tools as any
            }
          });

          // Stream okuma ve Response döndürme
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                let hasSentAnything = false;
                for await (const chunk of response) {
                  let chunkText = "";

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
                        hasSentAnything = true;
                      }
                    }
                  }

                  if (chunkText) {
                    controller.enqueue(encoder.encode(chunkText));
                    hasSentAnything = true;
                  }
                }
                
                if (!hasSentAnything) {
                  controller.enqueue(encoder.encode("Üzgünüm, bu konuda şu an bilgi sağlayamıyorum. Lütfen sorunuzu farklı bir şekilde sormayı deneyin."));
                }
                
                controller.close();
              } catch (e) { 
                console.error("[STREAM ERROR]", e);
                controller.error(e); 
              }
            }
          });

          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

        } catch (err: any) {
          const errorDetails = err.message || JSON.stringify(err);
          const statusCode = err.status || (err.response?.status) || 0;
          
          const is429 = statusCode === 429 || errorDetails.includes("429");
          const is404 = statusCode === 404 || errorDetails.includes("404") || errorDetails.includes("not found");
          
          // DİKKAT: 503 ve 500'ü buradan kaldırdık! Sadece gerçek 429 hataları kota hatasıdır.
          const isQuotaError = is429 || errorDetails.includes("quota"); 
          const isAuthError = errorDetails.includes("API key expired") || errorDetails.includes("API_KEY_INVALID") || (statusCode === 401);

          console.warn(`[${traceId}] [FAIL] Key: ${maskedKey}, Model: ${modelId}, Status: ${statusCode}, Error: ${errorDetails}`);

          // Eğer model bulunamadıysa (404) veya Google sunucuları geçici hata verdiyse (500, 503)
          // BREAK YAPMA, sıradaki modele (örneğin 2.5-flash) geçiş yap!
          if (is404 || statusCode === 503 || statusCode === 500) {
            lastRateLimitReason = `Model Geçici Hatası (${statusCode}): ${modelId}`;
            // Spam engellemek için sıradaki modele geçmeden önce 500ms bekle
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue; 
          } 

          // Eğer gerçekten API limiti dolduysa veya API Key yetkisizse:
          if (isQuotaError) {
            lastRateLimitReason = `Model Kotası Dolu (${modelId}) - Anahtar: ${maskedKey}`;
            // DİKKAT: Break yapmıyoruz, çünkü aynı key ile başka bir model (örn: 8b) hala çalışabilir!
            continue; 
          }

          if (isAuthError) {
            lastRateLimitReason = `Yetki Hatası - Anahtar: ${maskedKey}`;
            break; // Yetki hatası varsa anahtar geçersizdir, diğer anahtara geç.
          }

          // Diğer bilinmeyen hatalarda da sistemin çökmemesi için sıradaki modeli denemesini sağla
          lastRateLimitReason = `Bilinmeyen Hata (${statusCode})`;
          continue;
        }
      }
    }

    throw new Error("Tüm modeller denendi. Son hata: " + lastRateLimitReason);


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
