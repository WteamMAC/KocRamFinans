import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

// Vercel zaman sınırı 1 dakikaya çıkarıldı
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Denenecek model sırası (3.1 modellerine öncelik verilmiştir)
const FALLBACK_MODELS = [
  "gemini-3.1-pro",
  "gemini-3.1-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest"
];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    // Kullanıcının güncel finansal verilerini çek
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        incomes: true,
        expenses: true,
        debts: true,
        investments: true,
      },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT.replace("{USER_DATA}", financialContext);

    // Modelleri sırayla dene
    for (const modelId of FALLBACK_MODELS) {
      try {
        console.log(`Trying model: ${modelId}`);
        const result = await streamText({
          model: google(modelId) as any,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        });

        // Eğer buraya kadar geldiyse model başarılıdır
        return result.toDataStreamResponse();
      } catch (modelError) {
        console.error(`Model ${modelId} failed, trying next...`);
        // Eğer bu son modelse hatayı dışarı fırlat
        if (modelId === FALLBACK_MODELS[FALLBACK_MODELS.length - 1]) {
          throw modelError;
        }
        continue; // Bir sonraki modeli dene
      }
    }
  } catch (error: any) {
    console.error("FINAL_CHAT_ERROR:", error);
    return new Response(JSON.stringify({ 
      error: "Tüm AI modelleri şu an meşgul", 
      details: error.message,
      code: error.status || 500 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
