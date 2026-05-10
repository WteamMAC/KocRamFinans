import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

// Vercel zaman sınırı ayarı (Hobby: 10sn, Pro: 60sn+)
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

    const result = await streamText({
      model: google("gemini-3.1-flash") as any, // 2026'nın en güncel ve hızlı modeli
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ 
      error: "AI Yanıt Vermedi", 
      details: error.message,
      code: error.status || 500 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
