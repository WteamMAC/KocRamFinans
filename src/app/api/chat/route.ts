import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";
import { standardizeInvestmentType } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
] as const;


export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Yetkisiz erişim.", { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("GEMINI_API_KEY eksik", { status: 500 });

    const body = await req.json().catch(() => ({ messages: [] }));
    const allMessages = body.messages || [];
    if (!allMessages.length) return new Response("Geçersiz mesaj formatı.", { status: 400 });

    // ÇÖZÜM 1: History Bloat (Geçmiş Şişmesi) engellemek için sadece son 6 mesajı baz al
    const messages = allMessages.slice(-6);

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

    // Mesaj formatını resmi Google SDK (Content[]) formatına dönüştür ve ardışık mesajları birleştir (Gemini 400 hatasını önler)
    const rawHistory = messages.slice(0, -1);
    const formattedHistory: Content[] = [];

    for (const m of rawHistory) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      const text = m.content?.trim() ? m.content : "[Boş mesaj]";
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        formattedHistory[formattedHistory.length - 1].parts[0].text += `\n${text}`;
      } else {
        formattedHistory.push({ role, parts: [{ text }] });
      }
    }

    // Kural: Geçmiş kesinlikle model ile başlayamaz, aksi halde 400 fırlatır.
    if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
      formattedHistory.unshift({ role: "user", parts: [{ text: "Merhaba" }] });
    }

    // Gemini API, mesajların kesinlikle 'user' -> 'model' şeklinde değişmesini bekler.
    // Eğer geçmiş bir 'user' mesajıyla bitiyorsa, yeni göndereceğimiz mesaj da 'user' olacağı için API çöker.
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
      formattedHistory.push({ role: "model", parts: [{ text: "Anladım, lütfen devam edin." }] });
    }

    const lastMessage = messages[messages.length - 1].content?.trim() || "Merhaba";

    const maxAttempts = MODELS.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const modelName = MODELS[attempts];

      console.log(`[AI-CHAT] 🌀 Deneme ${attempts + 1}/${maxAttempts} | Model: ${modelName}`);

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
              let toolCallCount = 0;
              while (true) {
                toolCallCount++;
                if (toolCallCount > 7) {
                  controller.enqueue(new TextEncoder().encode(`\n\n*[Sistem Uyarısı]: İşlem çok uzun sürdüğü için durduruldu.*`));
                  break;
                }

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

                    // ÇÖZÜM 2: Sessiz kırılmaları engelleyerek frontend'e hatayı göster
                    const errMsg = (e as any)?.message?.toLowerCase() || "";
                    if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("too many requests")) {
                      controller.enqueue(new TextEncoder().encode(`\n\n*[Sistem Uyarısı]: İşlem kotası aşıldı, lütfen 1 dakika bekleyin.*`));
                    } else {
                      controller.enqueue(new TextEncoder().encode(`\n\n*[Sistem Uyarısı]: Ağ bağlantısında anlık bir kopma yaşandı.*`));
                    }
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
                        const cat = String(category).toLowerCase();
                        // ÇÖZÜM 3: Token patlamasını engellemek için tüm DB'yi değil, son 5 kaydı modele sun!
                        const dataMap: Record<string, any> = {
                          incomes: user.incomes.slice(-5),
                          expenses: user.expenses.slice(-5),
                          debts: user.debts.slice(-5),
                          investments: user.investments.slice(-5)
                        };

                        let selectedData: any[] = [];
                        if (cat.includes("income") || cat.includes("gelir")) selectedData = dataMap.incomes;
                        else if (cat.includes("expense") || cat.includes("gider")) selectedData = dataMap.expenses;
                        else if (cat.includes("debt") || cat.includes("borç")) selectedData = dataMap.debts;
                        else if (cat.includes("investment") || cat.includes("yatırım")) selectedData = dataMap.investments;

                        // ÇÖZÜM: API çökmesini önlemek için tool response kesinlikle Object ({ data: [...] }) olmalıdır
                        apiResponse = (cat === "all" || cat === "hepsi") ? dataMap : { data: selectedData };
                      } else if (call.name === "addFinancialRecord") {
                        const { type, amount, category, description, quantity, purchasePrice } = call.args as any;

                        // ÇÖZÜM 4: Prisma NaN çökmesini önleyen güvenlik katmanı
                        const safeAmount = Number(amount) || 0;
                        if (safeAmount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

                        const baseData = {
                          userId: user.id,
                          amount: safeAmount,
                          description: description || "",
                          type: category
                        };

                        switch (type) {
                          case "income":
                            user.incomes.push(await prisma.income.create({ data: baseData }));
                            break;
                          case "expense":
                            user.expenses.push(await prisma.expense.create({ data: baseData }));
                            break;
                          case "debt":
                            user.debts.push(await prisma.debt.create({ data: baseData }));
                            break;
                          case "investment":
                            const q = Number(quantity) > 0 ? Number(quantity) : 1;
                            const amt = Number(amount) > 0 ? Number(amount) : 0;
                            const p = Number(purchasePrice) > 0 ? Number(purchasePrice) : (amt > 0 ? amt / q : 0);
                            const finalAmt = amt > 0 ? amt : (q * p);

                            const newInv = await prisma.investment.create({
                              data: {
                                userId: user.id,
                                type: standardizeInvestmentType(category), // Veri bütünlüğü sağlandı
                                symbol: description || category,
                                quantity: q,
                                purchasePrice: p,
                                amount: finalAmt,
                                description: description || null,
                                status: "OPEN",
                                transactionType: "BUY",
                              }
                            });
                            user.investments.push(newInv as any);
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

                    // Tool işlendi ama cevap dönerken koptuysa kullanıcıyı bilgilendir
                    const errMsg = (e as any)?.message?.toLowerCase() || "";
                    if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("too many requests")) {
                      controller.enqueue(new TextEncoder().encode(`\n\n*[Sistem Uyarısı]: İşleminiz veritabanına kaydedildi ancak kota dolduğu için özet cevap oluşturulamadı.*`));
                    } else {
                      controller.enqueue(new TextEncoder().encode(`\n\n*[Sistem Uyarısı]: İşlem yapıldı ancak özet oluşturulurken bağlantı koptu.*`));
                    }
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
        const isRateLimit = err?.status === 429 || errorMessage.toLowerCase().includes("quota") || errorMessage.includes("429") || errorMessage.toLowerCase().includes("too many requests");
        const isBadRequest = err?.status === 400 || errorMessage.toLowerCase().includes("bad request") || errorMessage.includes("400");

        if (isRateLimit) {
          console.error(`[AI-CHAT] 💀 API kotası doldu. İşlem durduruluyor.`);
          return new Response("**[Sistem Uyarısı]:** Yapay zeka kullanım kotanız doldu. Lütfen 1 dakika bekleyip tekrar deneyin.", {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        } else if (isBadRequest) {
          console.error(`[AI-CHAT] ❌ Geçersiz istek (400 Bad Request):`, errorMessage);
          return new Response("**[Sistem Uyarısı]:** Yapay zeka bu mesaj formatını kabul etmedi.", {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        } else {
          attempts++;
          await sleep(500);
        }
      }
    }

    return new Response("**[Sistem Uyarısı]:** Servis şu anda yoğun, lütfen biraz bekleyip tekrar deneyin.", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (error: any) {
    console.error(`[AI-CHAT] 🚨 SİSTEM HATASI:`, error.message);
    return new Response("**[Sistem Uyarısı]:** Sunucu tarafında beklenmeyen bir hata oluştu.", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
