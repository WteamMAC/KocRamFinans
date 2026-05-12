import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";

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

    // Mesaj formatını resmi Google SDK (Content[]) formatına dönüştür
    const formattedHistory: Content[] = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content || " " }] // Boş metin API'nin çökmesine neden olur, koruma eklendi
    }));
    const lastMessage = messages[messages.length - 1].content || " ";

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
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt, // Sadece string olarak vermek en güvenlisidir
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getFinancialHistory",
                  description: "Kullanıcının mevcut finansal özetini ve geçmiş verilerini getirir.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      category: { type: SchemaType.STRING, description: "all, incomes, expenses, debts, investments" }
                    },
                    required: ["category"]
                  }
                },
                {
                  name: "addFinancialRecord",
                  description: "Yeni bir gelir, gider, borç veya yatırım kaydı oluşturur.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      type: { type: SchemaType.STRING, description: "income, expense, debt, investment" },
                      amount: { type: SchemaType.NUMBER, description: "Tutar" },
                      category: { type: SchemaType.STRING, description: "Kategori (örn: Market, Maaş)" },
                      description: { type: SchemaType.STRING, description: "Açıklama" },
                      quantity: { type: SchemaType.NUMBER, description: "Yatırımlar için miktar" },
                      purchasePrice: { type: SchemaType.NUMBER, description: "Yatırımlar için alış fiyatı" }
                    },
                    required: ["type", "amount", "category"]
                  }
                }
              ]
            }
          ]
        });

        const chat = model.startChat({ history: formattedHistory });
        let result = await chat.sendMessageStream(lastMessage);

        let response = await result.response;
        let functionCalls = response.functionCalls();

        // Araç (Tool) Çağrısı Kontrolü ve Döngüsü
        // Model art arda tool çağırmak isterse (Örn: Gideri ekle -> Sonra geçmişi getir)
        while (functionCalls && functionCalls.length > 0) {
          const functionResponses: Part[] = [];
          for (const call of functionCalls) {
            console.log(`[TOOL] 🔍 Tool Çağrısı: ${call.name}`);
            let apiResponse: any = {};

            try {
              if (call.name === "getFinancialHistory") {
                const category = (call.args as any).category;
                const dataMap: Record<string, any> = {
                  incomes: user.incomes,
                  expenses: user.expenses,
                  debts: user.debts,
                  investments: user.investments
                };
                apiResponse = category === "all" ? dataMap : (dataMap[category] || { error: "Kategori bulunamadı" });
              } else if (call.name === "addFinancialRecord") {
                const { type, amount, category, description, quantity, purchasePrice } = call.args as any;
                const baseData = {
                  userId: user.id,
                  amount: Number(amount),
                  description: description || "",
                  type: category
                };

                switch (type) {
                  case "income": await prisma.income.create({ data: baseData }); break;
                  case "expense": await prisma.expense.create({ data: baseData }); break;
                  case "debt": await prisma.debt.create({ data: baseData }); break;
                  case "investment":
                    await prisma.investment.create({
                      data: {
                        userId: user.id,
                        type: category.toUpperCase(),
                        symbol: description || category,
                        quantity: Number(quantity) || 1,
                        purchasePrice: Number(purchasePrice) || Number(amount),
                        amount: Number(amount),
                        description: description || null,
                        status: "OPEN",
                        transactionType: "BUY",
                      }
                    });
                    break;
                  default: throw new Error("Geçersiz işlem tipi");
                }
                apiResponse = { success: true, message: "Kayıt başarıyla eklendi." };
              }
            } catch (e: any) {
              console.error(`[TOOL] ❌ Hata:`, e.message);
              apiResponse = { error: `İşlem başarısız: ${e.message}` };
            }

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: apiResponse
              }
            });
          }

          // Tool sonuçlarını modele geri gönder ve asıl cevabı stream olarak al
          result = await chat.sendMessageStream(functionResponses);

          // Yeni yanıtın tekrar tool çağırıp çağırmadığını kontrol et
          response = await result.response;
          functionCalls = response.functionCalls();
        }

        console.log(`[AI-CHAT] ✅ Başarılı: ${modelName}`);

        // Resmi SDK'dan gelen cevabı okunabilir bir veri akışına (ReadableStream) çevirme
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                try {
                  const chunkText = chunk.text();
                  if (chunkText) {
                    controller.enqueue(new TextEncoder().encode(chunkText));
                  }
                } catch (e) {
                  // Google SDK chunk.text() metodu, eğer metin yoksa (sadece tool varsa) hata fırlatır. Bunu yoksayıyoruz.
                }
              }
              controller.close();
            } catch (err) {
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

      } catch (err: any) {
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
  } catch (error: any) {
    console.error(`[AI-CHAT] 🚨 SİSTEM HATASI:`, error.message);
    return new Response("Sunucu tarafında bir hata oluştu.", { status: 500 });
  }
}
