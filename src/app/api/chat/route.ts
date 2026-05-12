
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext, FUNCTION_DECLARATIONS } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getApiKeys = () => {
  const keys = [];
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
];

let currentKeyIndex = 0;

async function executeTool(name: string, args: any, userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      incomes: { take: 20, orderBy: { createdAt: 'desc' } },
      expenses: { take: 20, orderBy: { createdAt: 'desc' } },
      debts: { take: 10, orderBy: { createdAt: 'desc' } },
      investments: { take: 20, orderBy: { createdAt: 'desc' } }
    }
  });

  if (!user) return { error: "Kullanıcı bulunamadı." };

  if (name === "getFinancialHistory") {
    const { category } = args;
    if (category === "all") return { incomes: user.incomes, expenses: user.expenses, debts: user.debts, investments: user.investments };
    if (category === "incomes") return user.incomes;
    if (category === "expenses") return user.expenses;
    if (category === "debts") return user.debts;
    if (category === "investments") return user.investments;
  }

  if (name === "addFinancialRecord") {
    const { type, amount, category, description } = args;
    try {
      if (type === "income") {
        await prisma.income.create({ data: { userId: user.id, type: category, amount, description } });
      } else if (type === "expense") {
        await prisma.expense.create({ data: { userId: user.id, type: category, amount, description } });
      } else if (type === "debt") {
        await prisma.debt.create({ data: { userId: user.id, type: category, amount, description } });
      }
      return { success: true, message: "İşlem başarıyla kaydedildi." };
    } catch (e) {
      return { error: "Kayıt sırasında hata oluştu." };
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz erişim.", { status: 401 });

    if (API_KEYS.length === 0) {
      return new Response(JSON.stringify({ 
        error: "GEMINI_API_KEY bulunamadı! Lütfen Vercel ayarlarından API anahtarını ekleyin." 
      }), { status: 500 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { incomes: { take: 1 }, expenses: { take: 1 }, debts: { take: 1 }, investments: { take: 1 } }
    });

    if (!user) return new Response("Kullanıcı kaydı tamamlanmamış.", { status: 404 });

    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"))
      .replace("{USER_DATA}", financialContext);

    // Toplam deneme hakkı (Key sayısı * Model sayısı)
    const maxAttempts = API_KEYS.length * MODELS.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const apiKey = API_KEYS[currentKeyIndex];
      // Mevcut key için uygun modeli seç (her denemede bir sonrakine geçebiliriz)
      const modelName = MODELS[attempts % MODELS.length];
      
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          tools: [
            { functionDeclarations: FUNCTION_DECLARATIONS },
            { googleSearch: {} }
          ] as any
        }, { apiVersion: "v1beta" });

        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage.content);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const parts = chunk.candidates?.[0]?.content?.parts;
                if (!parts) continue;
                for (const part of parts) {
                  if (part.text) controller.enqueue(encoder.encode(part.text));
                  if (part.functionCall) {
                    const call = part.functionCall;
                    const toolResult = await executeTool(call.name, call.args, userId);
                    const payload = JSON.stringify({ type: "tool", name: call.name, result: toolResult });
                    controller.enqueue(encoder.encode(`\n__JSON__:${payload}__END__\n`));
                  }
                }
              }
              controller.close();
            } catch (e) {
              controller.close();
            }
          }
        });

        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

      } catch (err: any) {
        attempts++;
        console.warn(`Deneme ${attempts}/${maxAttempts} başarısız (Key: ${currentKeyIndex}, Model: ${modelName}):`, err.message);

        if (err.status === 429 || err.message?.includes("quota")) {
          // Eğer key bittiyse ve başka key varsa hemen değiştir
          if (API_KEYS.length > 1) {
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            console.log("Yeni key'e geçiliyor...");
          }
          await sleep(2000); // Her halükarda 2sn bekle
        } else if (err.status === 404) {
          // Model yoksa bir sonrakini denemek için devam et (attempts artıyor zaten)
        } else {
          // Beklenmedik hata, yine de devam etmeyi dene
          await sleep(1000);
        }
      }
    }

    return new Response("Mevcut tüm kota ve modeller tükendi. Lütfen bir süre bekleyin veya yeni API anahtarları ekleyin.", { status: 500 });

  } catch (error: any) {
    console.error("Kritik Chat Hatası:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
