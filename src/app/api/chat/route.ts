import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";


export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro için 60sn, Hobby için max 10sn limitini zorlar

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "missing_api_key",
});

// Vercel 10s limitine göre optimize edilmiş model listesi (Hız öncelikli)
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite", // En yeni ve hızlı (Doğrulandı)
  "gemini-flash-latest",   // Çok stabil ve hızlı (Doğrulandı)
  "gemini-pro-latest",    // Daha zeki ama biraz daha yavaş
  "gemini-1.5-flash-8b",   // En hafif yedek
];

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log(">>> [DEBUG] CHAT_API_START", { timestamp: new Date().toISOString() });
  
  // Ortam değişkenleri kontrolü
  console.log(">>> [DEBUG] ENV_CHECK", {
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasClerkKey: !!process.env.CLERK_SECRET_KEY,
    hasDbUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV
  });

  let currentStage = "INITIALIZATION";

  try {
    // 1. Yetkilendirme Kontrolü
    currentStage = "AUTH_CHECK";
    console.log(`>>> [DEBUG] STAGE: ${currentStage} starting...`);
    const { userId } = await auth();
    console.log(`>>> [DEBUG] STAGE: ${currentStage} completed`, { userId: userId ? "FOUND" : "NOT_FOUND" });
    if (!userId) {
      console.error(`[${currentStage}] Unauthorized access attempt`);
      return new Response("Yetkisiz erişim. Lütfen giriş yapın.", { status: 401 });
    }

    // 2. İstek Gövdesi Kontrolü
    currentStage = "REQUEST_PARSING";
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[${currentStage}] JSON parsing failed`);
      return new Response("Geçersiz JSON isteği.", { status: 400 });
    }
    
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Geçersiz mesaj formatı: messages dizisi eksik.");
    }

    // 3. Veritabanı Verisi Çekme (Timeout eklenmiş)
    currentStage = "DATABASE_FETCH";
    console.log(`>>> [DEBUG] STAGE: ${currentStage} starting...`);
    const userPromise = prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        incomes: true,
        expenses: true,
        debts: true,
        investments: true,
      },
    });

    // Veritabanı sorgusuna 3 saniye limit koy
    const user = await Promise.race([
      userPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Veritabanı yanıt vermedi (3s Timeout)")), 3000))
    ]) as any;
    console.log(`>>> [DEBUG] STAGE: ${currentStage} completed`, { userFound: !!user });

    if (!user) {
      console.error(`[${currentStage}] User not found in DB: ${userId}`);
      return new Response("Kullanıcı verileri bulunamadı.", { status: 404 });
    }

    // 4. Bağlam Hazırlama
    currentStage = "CONTEXT_PREPARATION";
    console.log(`>>> [DEBUG] STAGE: ${currentStage} starting...`);
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT.replace("{USER_DATA}", financialContext);
    console.log(`>>> [DEBUG] STAGE: ${currentStage} completed`, { 
      promptLength: systemPrompt.length,
      contextLength: financialContext.length 
    });

    // 5. AI Model Denemeleri
    currentStage = "AI_GENERATION";
    
    const GLOBAL_TIMEOUT = 9000; // 9 saniye global limit
    const limitedModels = FALLBACK_MODELS; // Tüm modelleri deneyebiliriz ama süreye bakarak

    for (const modelId of limitedModels) {
      const elapsed = Date.now() - startTime;
      const remainingTime = GLOBAL_TIMEOUT - elapsed;

      // Eğer 2 saniyeden az kaldıysa yeni model deneme, direkt hata ver
      if (remainingTime < 2000) {
        console.error(`[TIMEOUT_GUARD] Not enough time left for ${modelId} (${remainingTime}ms)`);
        break;
      }

      const modelStartTime = Date.now();
      try {
        console.log(`[AI_TRY] Trying ${modelId} | Remaining: ${remainingTime}ms | Elapsed: ${elapsed}ms`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Math.min(remainingTime, 6000)); // Max 6sn per model

        const result = await streamText({
          model: google(modelId) as any,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          abortSignal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`[AI_SUCCESS] ${modelId} responded in ${Date.now() - modelStartTime}ms`);
        
        return result.toDataStreamResponse();
      } catch (modelError: any) {
        const isRateLimit = modelError.status === 429 || modelError.message?.includes("429");
        const isTimeout = modelError.name === "AbortError" || modelError.message?.includes("abort");
        
        console.warn(`[AI_FAILED] ${modelId} | Error: ${modelError.message} | RateLimit: ${isRateLimit} | Timeout: ${isTimeout}`);

        if (isRateLimit) {
          // Kota aşımı varsa diğer modelleri denemeye gerek olmayabilir (genelde hepsi aynı kotayı paylaşır)
          // Ama yine de bir kez daha şans verelim (farklı bir model serisi ise)
          continue; 
        }

        if (modelId === limitedModels[limitedModels.length - 1]) {
          throw modelError;
        }
        continue;
      }
    }

    throw new Error("Yanıt alınamadı. Lütfen tekrar deneyin veya kota sınırlarını kontrol edin.");

  } catch (error: any) {
    const totalElapsed = Date.now() - startTime;
    const isRateLimit = error.message?.includes("429") || error.status === 429;
    
    console.error(`[FINAL_ERROR] Stage: ${currentStage}, Elapsed: ${totalElapsed}ms, Error:`, error);

    return new Response(JSON.stringify({ 
      error: isRateLimit ? "Kota Sınırı Aşıldı" : "Bir hata oluştu", 
      stage: currentStage,
      details: error.message,
      elapsed: totalElapsed,
      code: isRateLimit ? 429 : (error.status || 500) 
    }), { 
      status: isRateLimit ? 429 : 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
