
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
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

const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
] as const;

// Şemalar Merkezi Olarak Tanımlandı
const getFinancialHistorySchema = z.object({
  category: z.enum(["all", "incomes", "expenses", "debts", "investments"]),
});

const addFinancialRecordSchema = z.object({
  type: z.enum(["income", "expense", "debt", "investment"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Yetkisiz erişim.", { status: 401 });

    const API_KEYS = getApiKeys();
    if (API_KEYS.length === 0) return new Response("GEMINI_API_KEY eksik", { status: 500 });

    const { messages } = await req.json();

    // PERFORMANS: Tüm finansal veriyi tek sorguda çekiyoruz
    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkId },
      include: { 
        incomes: true, 
        expenses: true, 
        debts: true, 
        investments: true 
      }
    });

    if (!user) return new Response("Kullanıcı bulunamadı.", { status: 404 });

    // Sistem Promptu Hazırlığı
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"))
      .replace("{USER_DATA}", financialContext);

    const maxAttempts = API_KEYS.length * MODELS.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const keyIndex = Math.floor(attempts / MODELS.length);
      const modelIndex = attempts % MODELS.length;
      
      if (keyIndex >= API_KEYS.length) break;

      const apiKey = API_KEYS[keyIndex];
      const modelName = MODELS[modelIndex];

      console.log(`[AI-CHAT] 🌀 Deneme ${attempts + 1}/${maxAttempts} | KeyIndex: ${keyIndex} | Model: ${modelName}`);

      try {
        const googleProvider = createGoogleGenerativeAI({ apiKey });

        const result = await streamText({
          model: googleProvider(modelName),
          system: systemPrompt,
          messages,
          tools: {
            getFinancialHistory: tool({
              description: "Kullanıcının mevcut finansal özetini ve geçmiş verilerini getirir.",
              parameters: getFinancialHistorySchema,
              execute: async ({ category }) => {
                console.log(`[TOOL] 🔍 getFinancialHistory | Kategori: ${category}`);
                // OPTİMİZASYON: Başta çekilen 'user' verisini kullanıyoruz, tekrar DB'ye gitmiyoruz
                const dataMap: Record<string, unknown> = {
                  incomes: user.incomes,
                  expenses: user.expenses,
                  debts: user.debts,
                  investments: user.investments
                };
                return category === "all" ? dataMap : (dataMap[category] || { error: "Kategori bulunamadı" });
              },
            }),
            addFinancialRecord: tool({
              description: "Yeni bir gelir, gider, borç veya yatırım kaydı oluşturur.",
              parameters: addFinancialRecordSchema,
              execute: async ({ type, amount, category, description }) => {
                console.log(`[TOOL] ➕ addFinancialRecord | Tip: ${type} | Tutar: ${amount}`);
                try {
                  // Tip Güvenli Model Erişimi
                  switch (type) {
                    case "income": 
                      await prisma.income.create({ data: { userId: user.id, amount, description: description || "", type: category } }); 
                      break;
                    case "expense": 
                      await prisma.expense.create({ data: { userId: user.id, amount, description: description || "", type: category, isRecurring: false } }); 
                      break;
                    case "debt": 
                      await prisma.debt.create({ data: { userId: user.id, amount, description: description || "", type: category } }); 
                      break;
                    case "investment": 
                      await prisma.investment.create({ data: { userId: user.id, amount, description: description || "", type: category, quantity: 1, purchasePrice: amount, status: "OPEN", transactionType: "BUY" } }); 
                      break;
                    default: throw new Error("Geçersiz işlem tipi");
                  }

                  console.log(`[TOOL] ✅ Kayıt başarılı: ${type}`);
                  return { success: true, message: "Kayıt başarıyla eklendi." };
                } catch (e) {
                  const error = e as Error;
                  console.error(`[TOOL] ❌ addFinancialRecord Hatası:`, error.message);
                  return { error: `Kayıt başarısız: ${error.message}` };
                }
              },
            }),
          },
        });

        console.log(`[AI-CHAT] ✅ Başarılı: ${modelName}`);
        return result.toTextStreamResponse();

      } catch (e) {
        const err = e as Error & { status?: number };
        console.error(`[AI-CHAT] ❌ HATA [${modelName}]:`, err.message);

        // QUOTA / RATE LIMIT MANTIĞI
        if (err.status === 429 || err.message?.toLowerCase().includes("quota")) {
          if (API_KEYS.length === 1) {
            console.error(`[AI-CHAT] 💀 Tek anahtar kotası doldu. İşlem durduruluyor.`);
            break; // Tek key varsa diğer modelleri deneme (paylaşımlı kota)
          }
          console.warn(`[AI-CHAT] ⏳ Kota aşıldı, sonraki anahtara geçiliyor...`);
          attempts = (keyIndex + 1) * MODELS.length; // Bir sonraki anahtarın başına atla
          await sleep(2000);
        } else {
          attempts++;
          await sleep(500);
        }
      }
    }

    return new Response("Servis şu anda yoğun, lütfen biraz bekleyip tekrar deneyin.", { status: 503 });
  } catch (e) {
    const error = e as Error;
    console.error(`[AI-CHAT] 🚨 SİSTEM HATASI:`, error.message);
    return new Response("Sunucu tarafında bir hata oluştu.", { status: 500 });
  }
}
