import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";


export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro limit: 60 saniye

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "missing_api_key",
});

// Vercel Pro 60s limitine göre optimize edilmiş model listesi
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite", // En yeni ve hızlı
  "gemini-flash-latest",   // Çok stabil ve hızlı
  "gemini-pro-latest",     // Zeki ama yavaş (60s limitinde daha rahat çalışır)
  "gemini-1.5-flash-8b",   // Hafif yedek
];

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
    if (!messages || !Array.isArray(messages)) {
      console.error(`[${traceId}] [VALIDATION_FAILED] Invalid messages format`);
      throw new Error("Geçersiz mesaj formatı: messages dizisi eksik.");
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
    const systemPrompt = MASTER_PROMPT.replace("{USER_DATA}", financialContext);
    console.timeEnd(`[${traceId}] CONTEXT_TIME`);
    
    console.log(`[${traceId}] [PROMPT_INFO] Context size: ${financialContext.length}, Prompt: ${systemPrompt.length}`);

    // 5. AI Model Denemeleri
    currentStage = "AI_GENERATION";
    const GLOBAL_TIMEOUT = 58000; // 60s limitine yakın (58s)
    
    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const modelId = FALLBACK_MODELS[i];
      const elapsedTotal = Date.now() - startTime;
      const remainingTime = GLOBAL_TIMEOUT - elapsedTotal;

      console.log(`[${traceId}] [AI_TRIAL_${i+1}] Model: ${modelId} | Elapsed: ${elapsedTotal}ms | Remaining: ${remainingTime}ms`);

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

        console.log(`[${traceId}] [STREAM_START] Calling streamText for ${modelId}...`);
        
        const result = await streamText({
          model: google(modelId) as any,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          abortSignal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`[${traceId}] [STREAM_SUCCESS] ${modelId} started in ${Date.now() - trialStartTime}ms`);
        
        return result.toDataStreamResponse();
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
