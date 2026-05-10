import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing_api_key");

// Fallback sırası: RPM limitine göre (yüksekten düşüğe)
// Kaynak: Google AI Studio rate limit tablosu
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",  // 1. Öncelik → 15 RPM (en yüksek!)
  "gemini-2.5-flash",       // 2. Öncelik → 5 RPM
  "gemini-flash-latest",    // 3. Öncelik → 5 RPM (alias)
];

// ─── Anahtar Kelime Grupları ──────────────────────────────────────────────────

// Piyasa/internet araması gereken sorgular
const MARKET_KEYWORDS = [
  "dolar", "euro", "sterlin", "döviz", "kur",
  "altın", "gram altın", "çeyrek altın",
  "borsa", "bist", "hisse", "endeks",
  "bitcoin", "btc", "ethereum", "kripto",
  "faiz", "enflasyon", "tüfe",
  "fiyat", "kaç tl", "ne kadar",
];

// Veritabanı işlemi gereken komutlar
const DB_ACTION_KEYWORDS = [
  "ekle", "kaydet", "sil", "güncelle", "düzenle",
  "yeni gelir", "yeni gider", "yeni borç", "yeni yatırım",
  "maaş ekle", "gider ekle", "borç ekle", "yatırım ekle",
];

// Araç/Function bildirimleri
const FUNCTION_DECLARATIONS = [
  {
    name: "addIncome",
    description: "Kullanıcının sistemine yeni bir gelir kaynağı ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Gelir türü (Salary, SpouseSalary, Rent, Freelance, Other)" },
        amount: { type: "number", description: "Gelir miktarı" },
        description: { type: "string", description: "Kısa açıklama" },
      },
      required: ["type", "amount"],
    },
  },
  {
    name: "addExpense",
    description: "Kullanıcının sistemine yeni bir gider ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Gider türü (Rent, Bill, Groceries, Transport, Other)" },
        amount: { type: "number", description: "Gider miktarı" },
        isRecurring: { type: "boolean", description: "Düzenli gider mi?" },
        description: { type: "string", description: "Kısa açıklama" },
      },
      required: ["type", "amount"],
    },
  },
  {
    name: "addDebt",
    description: "Kullanıcının sistemine yeni bir borç ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Borç türü (CreditCard, BankLoan, Personal, Other)" },
        amount: { type: "number", description: "Borç miktarı" },
        description: { type: "string", description: "Kısa açıklama" },
      },
      required: ["type", "amount"],
    },
  },
  {
    name: "addInvestment",
    description: "Kullanıcının sistemine yeni bir yatırım ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Yatırım türü (Gold, Crypto, Stock, RealEstate, ForeignCurrency)" },
        amount: { type: "number", description: "Yatırım değeri" },
        description: { type: "string", description: "Kısa açıklama" },
      },
      required: ["type", "amount"],
    },
  },
];

// ─── Mesaj Sınıflandırıcı ────────────────────────────────────────────────────

type ToolMode = "none" | "search" | "db";

function classifyMessage(message: string): ToolMode {
  const lower = message.toLowerCase();

  // DB işlemi mi? (Önce kontrol et — önceliklidir)
  if (DB_ACTION_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "db";
  }

  // Piyasa/internet araması mı?
  if (MARKET_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "search";
  }

  // Sıradan sohbet
  return "none";
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const startTime = Date.now();
  const traceId = Math.random().toString(36).substring(7);
  let currentStage = "INIT";

  console.log(`\n[${traceId}] ═══ CHAT REQUEST ═══ ${new Date().toISOString()}`);

  try {
    // 1. Auth
    currentStage = "AUTH";
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz erişim.", { status: 401 });

    // 2. Parse
    currentStage = "PARSE";
    const body = await req.json().catch(() => null);
    if (!body) return new Response("Geçersiz JSON.", { status: 400 });

    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Mesaj dizisi boş.", { status: 400 });
    }

    const filteredMessages = messages.filter(
      (m: any) => m?.content && typeof m.content === "string" && m.content.trim()
    );
    if (filteredMessages.length === 0) {
      return new Response("Mesaj içeriği boş.", { status: 400 });
    }

    const lastMessage: string = filteredMessages[filteredMessages.length - 1].content;

    // 3. Akıllı araç sınıflandırması
    const toolMode = classifyMessage(lastMessage);
    console.log(`[${traceId}] Son mesaj: "${lastMessage.substring(0, 80)}"`);
    console.log(`[${traceId}] Araç modu: ${toolMode.toUpperCase()} (db→functionCall, search→googleSearch, none→araçsız)`);

    // 4. DB Fetch
    currentStage = "DB";
    const user = await Promise.race([
      prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: { incomes: true, expenses: true, debts: true, investments: true },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 10000)
      ),
    ]) as any;

    if (!user) return new Response("Kullanıcı bulunamadı.", { status: 404 });

    // 5. Prompt hazırla
    currentStage = "CONTEXT";
    const financialContext = await getFinancialContext(user);
    const currentDate = new Date().toLocaleDateString("tr-TR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    });
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", currentDate);

    // 6. Fallback döngüsü
    currentStage = "AI";
    const GLOBAL_TIMEOUT = 55000;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const modelId = FALLBACK_MODELS[i];
      const remaining = GLOBAL_TIMEOUT - (Date.now() - startTime);
      if (remaining < 3000) break;

      console.log(`[${traceId}] Deneme ${i + 1}: ${modelId} | Kalan: ${remaining}ms`);

      try {
        // Araç yapılandırması
        // NOT: googleSearch ve functionDeclarations Gemini'de aynı anda kullanılamaz
        let tools: any[] | undefined;

        if (toolMode === "db") {
          tools = [{ functionDeclarations: FUNCTION_DECLARATIONS }];
        } else if (toolMode === "search") {
          tools = [{ googleSearch: {} }];
        }
        // toolMode === "none" → tools = undefined → en hızlı mod

        const model = genAI.getGenerativeModel({
          model: modelId,
          systemInstruction: systemPrompt,
          ...(tools ? { tools: tools as any } : {}),
        });

        const history = filteredMessages.slice(0, -1).map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage);

        console.log(`[${traceId}] Stream başladı — model: ${modelId}, araç: ${toolMode}`);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                let chunkText = "";
                try { chunkText = chunk.text(); } catch { /* function call chunk */ }

                if (chunkText) {
                  controller.enqueue(encoder.encode(chunkText));
                }

                const calls = chunk.functionCalls?.();
                if (calls?.length) {
                  for (const call of calls) {
                    console.log(`[${traceId}] Function call: ${call.name}`, call.args);
                    const payload = JSON.stringify({ name: call.name, args: call.args });
                    controller.enqueue(
                      encoder.encode(`\n\n__TOOL_CALL__:${payload}__END_TOOL_CALL__\n`)
                    );
                  }
                }
              }
              console.log(`[${traceId}] Stream tamamlandı. Toplam: ${Date.now() - startTime}ms`);
              controller.close();
            } catch (err: any) {
              console.error(`[${traceId}] Stream hatası:`, err.message);
              controller.error(err);
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });

      } catch (err: any) {
        const is429 = err.status === 429 || err.message?.includes("429");
        console.error(`[${traceId}] Model ${modelId} başarısız:`, {
          status: err.status,
          message: err.message?.substring(0, 200),
          toolMode,
          is429,
        });

        if (is429 && i < FALLBACK_MODELS.length - 1) {
          // Rate limit → kısa bekle, sonraki modeli dene
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        if (i === FALLBACK_MODELS.length - 1) throw err;
        continue;
      }
    }

    throw new Error("Tüm modeller başarısız oldu.");

  } catch (error: any) {
    const is429 = error.message?.includes("429") || error.status === 429;
    const elapsed = Date.now() - startTime;

    console.error(`[${traceId}] HATA | Stage: ${currentStage} | ${elapsed}ms |`, error.message);

    return new Response(
      JSON.stringify({
        error: is429
          ? "Anlık istek limiti aşıldı. 30 saniye bekleyip tekrar deneyin."
          : "Bir hata oluştu.",
        stage: currentStage,
        details: error.message,
        traceId,
        elapsed,
        code: is429 ? 429 : (error.status ?? 500),
      }),
      {
        status: is429 ? 429 : (error.status ?? 500),
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
