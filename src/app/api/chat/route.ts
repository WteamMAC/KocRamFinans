import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
    model: google("gemini-1.5-flash") as any, // Veya gemini-2.0-flash-exp
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  return result.toDataStreamResponse();
}
