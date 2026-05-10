import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";


export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro limit: 60 saniye

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing_api_key");

const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",      // Öncelikli çalışan model
  "gemini-3.1-pro-preview",     // En yeni Pro model
  "gemini-2.5-flash",           // Güçlü ve hızlı
  "gemini-2.0-flash",           // Kararlı 2.0 sürümü
  "gemini-flash-latest"         // Genel geçerli yedek
];

// Global hata yakalayıcılar (Sadece debug için)
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED_REJECTION:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT_EXCEPTION:', err);
  });
}


export async function POST(req: Request) {
  const startTime = Date.now();
  const traceId = Math.random().toString(36).substring(7);

  console.log(`[${traceId}] >>> START CHAT_API (60s LIMIT MODE)`, { timestamp: new Date().toISOString() });

  let currentStage = "INITIALIZATION";

  try {
    // 1. Yetkilendirme Kontrolü
    currentStage = "AUTH_CHECK";
    console.time(`[${traceId}] AUTH_TIME`);
    const { userId } = await auth();
    console.timeEnd(`[${traceId}] AUTH_TIME`);

    if (!userId) {
      console.error(`[${traceId}] [AUTH_CHECK_FAILED] Unauthorized access attempt`);
      return new Response("Yetkisiz erişim. Lütfen giriş yapın.", { status: 401 });
    }

    // 2. İstek Gövdesi Kontrolü
    currentStage = "REQUEST_PARSING";
    console.time(`[${traceId}] PARSING_TIME`);
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[${traceId}] [PARSING_FAILED] JSON parsing failed`, e);
      return new Response("Geçersiz JSON isteği.", { status: 400 });
    }
    console.timeEnd(`[${traceId}] PARSING_TIME`);

    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error(`[${traceId}] [VALIDATION_FAILED] Invalid messages format or empty`, { messages });
      return new Response("Geçersiz mesaj formatı: messages dizisi eksik veya boş.", { status: 400 });
    }

    // Mesaj içeriğini doğrula (boş mesajları temizle)
    const filteredMessages = messages.filter(m => m.content && typeof m.content === 'string' && m.content.trim().length > 0);
    if (filteredMessages.length === 0) {
      console.error(`[${traceId}] [VALIDATION_FAILED] All messages are empty`);
      return new Response("Geçersiz mesaj içeriği: Boş mesaj gönderilemez.", { status: 400 });
    }


    // 3. Veritabanı Verisi Çekme
    currentStage = "DATABASE_FETCH";
    console.time(`[${traceId}] DB_TIME`);
    const userPromise = prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        incomes: true,
        expenses: true,
        debts: true,
        investments: true,
      },
    });

    const user = await Promise.race([
      userPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Veritabanı 10s limitini aştı")), 10000))
    ]) as any;
    console.timeEnd(`[${traceId}] DB_TIME`);

    if (!user) {
      console.error(`[${traceId}] [USER_NOT_FOUND] User ID ${userId} not in database`);
      return new Response("Kullanıcı verileri bulunamadı.", { status: 404 });
    }

    // 4. Bağlam Hazırlama
    currentStage = "CONTEXT_PREPARATION";
    console.time(`[${traceId}] CONTEXT_TIME`);
    const financialContext = await getFinancialContext(user);
    const currentDate = new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
    });
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", currentDate);
    console.timeEnd(`[${traceId}] CONTEXT_TIME`);

    console.log(`[${traceId}] [PROMPT_INFO] Context size: ${financialContext.length}, Prompt: ${systemPrompt.length}`);

    // 5. AI Model Denemeleri
    currentStage = "AI_GENERATION";
    const GLOBAL_TIMEOUT = 58000; // 60s limitine yakın (58s)

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const modelId = FALLBACK_MODELS[i];
      const elapsedTotal = Date.now() - startTime;
      const remainingTime = GLOBAL_TIMEOUT - elapsedTotal;

      console.log(`[${traceId}] [AI_TRIAL_${i + 1}] Model: ${modelId} | Elapsed: ${elapsedTotal}ms | Remaining: ${remainingTime}ms`);

      if (remainingTime < 3000) {
        console.error(`[${traceId}] [CRITICAL_TIMEOUT] Stopping trials, only ${remainingTime}ms left.`);
        break;
      }

      const trialStartTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`[${traceId}] [MODEL_TIMEOUT] ${modelId} exceeded trial limit`);
          controller.abort();
        }, Math.min(remainingTime - 1000, 30000)); // Her model için max 30sn

        // Direkt Gemini API kullanımı (Vercel SDK Atlatması)
        const model = genAI.getGenerativeModel({ 
          model: modelId,
          systemInstruction: systemPrompt,
          // @ts-ignore - SDK types use googleSearchRetrieval but API requires googleSearch
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: [
              {
                name: "addIncome",
                description: "Kullanıcının sistemine yeni bir gelir kaynağı (maaş, ek gelir vb.) ekler.",
                parameters: {
                  type: "object",
                  properties: {
                    type: { type: "string", description: "Gelir türü (örn: Salary, SpouseSalary, Rent, Freelance, Other)" },
                    amount: { type: "number", description: "Gelir miktarı" },
                    description: { type: "string", description: "Gelir hakkında kısa açıklama" }
                  },
                  required: ["type", "amount"]
                }
              },
              {
                name: "addExpense",
                description: "Kullanıcının sistemine yeni bir gider (kira, fatura, market vb.) ekler.",
                parameters: {
                  type: "object",
                  properties: {
                    type: { type: "string", description: "Gider türü (örn: Rent, Bill, Groceries, Transport, Other)" },
                    amount: { type: "number", description: "Gider miktarı" },
                    isRecurring: { type: "boolean", description: "Düzenli bir gider mi? (örn: her ay ödenen kira/fatura ise true)" },
                    description: { type: "string", description: "Gider hakkında kısa açıklama" }
                  },
                  required: ["type", "amount"]
                }
              },
              {
                name: "addDebt",
                description: "Kullanıcının sistemine yeni bir borç veya kredi ekler.",
                parameters: {
                  type: "object",
                  properties: {
                    type: { type: "string", description: "Borç türü (örn: CreditCard, BankLoan, Personal, Other)" },
                    amount: { type: "number", description: "Toplam borç miktarı" },
                    description: { type: "string", description: "Borç hakkında kısa açıklama" }
                  },
                  required: ["type", "amount"]
                }
              },
              {
                name: "addInvestment",
                description: "Kullanıcının sistemine yeni bir yatırım (altın, kripto, hisse vb.) ekler.",
                parameters: {
                  type: "object",
                  properties: {
                    type: { type: "string", description: "Yatırım türü (örn: Gold, Crypto, Stock, RealEstate, ForeignCurrency)" },
                    amount: { type: "number", description: "Yatırımın toplam değeri" },
                    description: { type: "string", description: "Yatırım hakkında kısa açıklama" }
                  },
                  required: ["type", "amount"]
                }
              }
            ]
          }
        ]
        });

        // Geçmişi hazırla (son mesaj hariç)
        const history = filteredMessages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const chat = model.startChat({ history });
        const lastMessage = filteredMessages[filteredMessages.length - 1].content;

        const result = await chat.sendMessageStream(lastMessage);

        clearTimeout(timeoutId);
        console.log(`[${traceId}] [STREAM_SUCCESS] ${modelId} started in ${Date.now() - trialStartTime}ms. Returning direct ReadableStream.`);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                let chunkText = "";
                try {
                  chunkText = chunk.text();
                } catch(e) { /* text() throws if there are only function calls */ }
                
                if (chunkText) {
                  controller.enqueue(encoder.encode(chunkText));
                }

                if (chunk.functionCalls && chunk.functionCalls().length > 0) {
                  for (const call of chunk.functionCalls()) {
                    const actionData = JSON.stringify({ name: call.name, args: call.args });
                    controller.enqueue(encoder.encode(`\n\n__TOOL_CALL__:${actionData}__END_TOOL_CALL__\n`));
                  }
                }
              }
              controller.close();
            } catch (err) {
              console.error(`[${traceId}] [STREAM_READ_ERROR]`, err);
              controller.error(err);
            }
          }
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
          }
        });
      } catch (modelError: any) {
        const trialDuration = Date.now() - trialStartTime;
        const isRateLimit = modelError.status === 429 || modelError.message?.includes("429");
        const isAbort = modelError.name === "AbortError";

        console.error(`[${traceId}] [TRIAL_FAILED] ${modelId} | Duration: ${trialDuration}ms | Type: ${isAbort ? "TIMEOUT" : (isRateLimit ? "RATE_LIMIT" : "OTHER")}`, {
          message: modelError.message,
          status: modelError.status
        });

        if (i === FALLBACK_MODELS.length - 1) {
          throw modelError;
        }
        continue;
      }
    }

    throw new Error("AI modelleri 60 saniye içinde yanıt vermedi.");

  } catch (error: any) {
    const finalElapsed = Date.now() - startTime;
    const isRateLimit = error.message?.includes("429") || error.status === 429;

    console.error(`[${traceId}] [FINAL_ERROR] Stage: ${currentStage}, Total: ${finalElapsed}ms`, {
      message: error.message,
      status: error.status
    });

    return new Response(JSON.stringify({
      error: isRateLimit ? "Kota Sınırı Aşıldı (Google Gemini)" : "Bir hata oluştu",
      stage: currentStage,
      details: error.message,
      traceId,
      elapsed: finalElapsed,
      code: isRateLimit ? 429 : (error.status || 500)
    }), {
      status: isRateLimit ? 429 : 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
