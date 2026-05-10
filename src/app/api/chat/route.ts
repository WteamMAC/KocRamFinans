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
  "gemini-2.0-flash",      // Çok hızlı
  "gemini-3.1-flash-lite", // Hızlı ve yeni
  "gemini-flash-latest",   // Stabil
  "gemini-pro-latest"      // Son çare
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
    for (const modelId of FALLBACK_MODELS) {
      const modelStartTime = Date.now();
      try {
        console.log(`[AI_TRY] Trying model: ${modelId} (Elapsed: ${Date.now() - startTime}ms)`);
        
        // Vercel 10s limiti için ilk modele maksimum süreyi veriyoruz (9 saniye)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const result = await streamText({
          model: google(modelId) as any,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          abortSignal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`[AI_SUCCESS] Model ${modelId} responded in ${Date.now() - modelStartTime}ms`);
        
        return result.toDataStreamResponse();
      } catch (modelError: any) {
        const elapsed = Date.now() - startTime;
        console.warn(`[AI_FAILED] Model ${modelId} failed after ${Date.now() - modelStartTime}ms. Error: ${modelError.message}`);
        
        // Eğer 10 saniye limitine çok yaklaştıysak (örn: 9sn geçtiyse) yeni model deneme, direkt hata dön
        if (elapsed > 9000) {
          console.error(`[CRITICAL_TIMEOUT] Vercel limit exceeded (9s+), stopping fallback.`);
          throw new Error("Vercel zaman aşımı limitine yaklaşıldı.");
        }

        // Eğer bu son modelse hatayı dışarı fırlat
        if (modelId === FALLBACK_MODELS[FALLBACK_MODELS.length - 1]) {
          throw modelError;
        }
        continue;
      }
    }

    throw new Error("Hiçbir model yanıt vermedi.");

  } catch (error: any) {
    const totalElapsed = Date.now() - startTime;
    console.error(`[FINAL_ERROR] Stage: ${currentStage}, Elapsed: ${totalElapsed}ms, Error:`, error);

    return new Response(JSON.stringify({ 
      error: "Bir hata oluştu", 
      stage: currentStage,
      details: error.message,
      elapsed: totalElapsed,
      code: error.status || 500 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
