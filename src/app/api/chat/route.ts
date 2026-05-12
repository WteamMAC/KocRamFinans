
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getApiKeys = () => {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
};

const API_KEYS = getApiKeys();
const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
] as const;

const getFinancialHistorySchema = z.object({
  category: z.enum(["all", "incomes", "expenses", "debts", "investments"] as const),
});

const addFinancialRecordSchema = z.object({
  type: z.enum(["income", "expense", "debt"] as const),
  amount: z.number(),
  category: z.string(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz erişim.", { status: 401 });

    if (API_KEYS.length === 0) return new Response("GEMINI_API_KEY eksik", { status: 500 });

    const { messages } = await req.json();
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { incomes: { take: 1 }, expenses: { take: 1 }, debts: { take: 1 }, investments: { take: 1 } }
    });

    if (!user) return new Response("Kullanıcı bulunamadı.", { status: 404 });

    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"))
      .replace("{USER_DATA}", financialContext);

    const maxAttempts = API_KEYS.length * MODELS.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const keyIndex = Math.floor(attempts / MODELS.length) % API_KEYS.length;
      const modelName = MODELS[attempts % MODELS.length];
      const apiKey = API_KEYS[keyIndex];

      try {
        const googleProvider = createGoogleGenerativeAI({ apiKey });

        const result = await streamText({
          model: googleProvider(modelName),
          system: systemPrompt,
          messages,
          tools: {
            getFinancialHistory: {
              description: "Kullanıcının finansal verilerini çeker.",
              parameters: getFinancialHistorySchema,
              execute: async ({ category }: z.infer<typeof getFinancialHistorySchema>) => {
                const userData = await prisma.user.findUnique({
                  where: { clerkUserId: userId },
                  include: { incomes: true, expenses: true, debts: true, investments: true }
                });
                if (!userData) return { error: "Veri yok" };
                if (category === "all") return { incomes: userData.incomes, expenses: userData.expenses, debts: userData.debts, investments: userData.investments };
                const map: any = { incomes: userData.incomes, expenses: userData.expenses, debts: userData.debts, investments: userData.investments };
                return map[category] || { error: "Hatalı kategori" };
              },
            },
            addFinancialRecord: {
              description: "Yeni bir finansal kayıt ekler.",
              parameters: addFinancialRecordSchema,
              execute: async ({ type, amount, category, description }: z.infer<typeof addFinancialRecordSchema>) => {
                try {
                  const dbUser = await prisma.user.findUnique({ where: { clerkUserId: userId } });
                  if (!dbUser) return { error: "Kullanıcı yok" };
                  const data = { userId: dbUser.id, type: category, amount, description };
                  if (type === "income") await (prisma.income as any).create({ data });
                  else if (type === "expense") await (prisma.expense as any).create({ data });
                  else if (type === "debt") await (prisma.debt as any).create({ data });
                  return { success: true };
                } catch (e: any) {
                  return { error: e.message };
                }
              },
            },
          },
          maxSteps: 5,
        } as any);

        // Hem TS hatasını önlemek hem de runtime'da metodun varlığını zorlamak için any cast kullanıyoruz
        return (result as any).toDataStreamResponse();

      } catch (err: any) {
        attempts++;
        if (err.status === 429 || err.message?.includes("quota")) {
          attempts = (Math.floor((attempts - 1) / MODELS.length) + 1) * MODELS.length;
          await sleep(2000);
        } else {
          await sleep(500);
        }
      }
    }
    return new Response("Başarısız", { status: 500 });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
