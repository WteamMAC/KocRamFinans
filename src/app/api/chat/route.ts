import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";
import { standardizeInvestmentType } from "@/lib/utils";

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
        investments: true,
        fixedAssets: true
      }
    });

    if (!user) return new Response("Kullanıcı bulunamadı.", { status: 404 });

    // Sistem Promptu Hazırlığı
    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"))
      .replace("{USER_DATA}", financialContext);

    // Mesaj formatını resmi Google SDK (Content[]) formatına dönüştür ve ardışık mesajları birleştir (Gemini 400 hatasını önler)
    const rawHistory = messages.slice(0, -1);
    const formattedHistory: Content[] = [];

    for (const m of rawHistory) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      const text = m.content || " ";
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        formattedHistory[formattedHistory.length - 1].parts[0].text += `\n${text}`;
      } else {
        formattedHistory.push({ role, parts: [{ text }] });
      }
    }

    // Gemini API, mesajların kesinlikle 'user' -> 'model' şeklinde değişmesini bekler.
    // Eğer geçmiş bir 'user' mesajıyla bitiyorsa, yeni göndereceğimiz mesaj da 'user' olacağı için API çöker.
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
      formattedHistory.push({ role: "model", parts: [{ text: "Anladım, lütfen devam edin." }] });
    }

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
                      category: { type: SchemaType.STRING, description: "all, incomes, expenses, debts, investments, fixedAssets" }
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
                      type: { type: SchemaType.STRING, description: "income, expense, debt, investment, fixedAsset" },
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

        // ÇÖZÜM 1: İlk API isteğini (stream oluşturmayı) ReadableStream içine girmeden ÖNCE yapıyoruz.
        // Böylece API Anahtarı kotası (429) veya model hatası varsa, bu asenkron çağrı direkt hata fırlatır 
        // ve dışarıdaki catch bloğuna düşerek YEDEK API ANAHTARINA GEÇİŞ (fallback) sistemini çalıştırır.
        let currentResult = await chat.sendMessageStream(lastMessage);

        // ÇÖZÜM 2: Google SDK stream'i tembel (lazy) getirir. Hata ancak okunmaya başlandığında fırlatılır.
        // Hatayı Response dönmeden önce yakalamak için stream'den İLK parçayı çekiyoruz. 
        // Eğer 429 Kota veya 400 Bad Request varsa, TAM BURADA patlar ve dış döngüdeki YEDEK modele geçer!
        let iterator = currentResult.stream[Symbol.asyncIterator]();
        let chunkResult = await iterator.next();

        const stream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                let toolCalls: any[] = [];

                // Gelen stream'i okuyoruz
                while (!chunkResult.done) {
                  const chunk = chunkResult.value;
                  const calls = chunk.functionCalls();
                  if (calls && calls.length > 0) toolCalls.push(...calls);

                  try {
                    const text = chunk.text();
                    if (text) controller.enqueue(new TextEncoder().encode(text));
                  } catch (e) { }

                  try {
                    chunkResult = await iterator.next();
                  } catch (e) {
                    console.error("[AI-CHAT] ❌ Stream Okuma Hatası:", e);
                    break; // Sistemi çökertmeden nazikçe durdur
                  }
                }

                // Eğer akış sırasında model bir araca (Tool) ihtiyaç duyduysa, onları çalıştır
                if (toolCalls.length > 0) {
                  const functionResponses: Part[] = [];
                  for (const call of toolCalls) {
                    console.log(`[TOOL] 🔍 Tool Çağrısı: ${call.name}`);
                    let apiResponse: any = {};

                    try {
                      if (call.name === "getFinancialHistory") {
                        const category = (call.args as any).category;
                        const dataMap: Record<string, any> = {
                          incomes: user.incomes,
                          expenses: user.expenses,
                          debts: user.debts,
                          investments: user.investments,
                          fixedAssets: user.fixedAssets
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
                          case "fixedAsset":
                            await prisma.fixedAsset.create({
                              data: {
                                userId: user.id,
                                name: category,
                                value: Number(amount),
                                description: description || ""
                              }
                            });
                            break;
                          case "investment":
                            await prisma.investment.create({
                              data: {
                                userId: user.id,
                                type: standardizeInvestmentType(category), // Veri bütünlüğü sağlandı
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

                  // Tool sonuçlarını modele geri gönder ve yeni cevabın stream'ini alarak döngüye devam et
                  try {
                    currentResult = await chat.sendMessageStream(functionResponses);
                    iterator = currentResult.stream[Symbol.asyncIterator]();
                    chunkResult = await iterator.next();
                  } catch (e) {
                    console.error("[AI-CHAT] ❌ Tool Stream Hatası:", e);
                    break; // Sistemi çökertmeden nazikçe durdur
                  }
                } else {
                  // Tool çağrısı yoksa modelin son doğal dil cevabı bitmiştir, döngüyü kır
                  break;
                }
              }
              console.log(`[AI-CHAT] ✅ Başarılı: ${modelName}`);
              controller.close();
            } catch (err) {
              console.error("[AI-CHAT] ❌ Genel Controller Hatası:", err);
              controller.close(); // Uygulamayı çökertmek yerine sessizce kapatıyoruz
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
        // ÇÖZÜM 3: err.message 'undefined' olursa catch bloğunun çökmesini engelliyoruz.
        const errorMessage = err?.message || err?.toString() || "";
        console.error(`[AI-CHAT] ❌ HATA [${modelName}]:`, errorMessage);

        // QUOTA / RATE LIMIT MANTIĞI
        if (err?.status === 429 || errorMessage.toLowerCase().includes("quota")) {
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
