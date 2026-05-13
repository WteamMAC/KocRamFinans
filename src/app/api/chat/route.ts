import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";
import { standardizeInvestmentType } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 404 hatalarından kaçınmak için genel kullanıma açılmış güncel ve stabil modeller
const MODELS = [
  "gemini-2.0-flash",       // Güncel
  "gemini-1.5-flash"        // Stabil Fallback
] as const;


export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Yetkisiz erişim.", { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return new Response("GEMINI_API_KEY eksik", { status: 500 });

    const body = await req.json().catch(() => ({ messages: [] }));
    const allMessages = body.messages || [];
    if (!allMessages.length) return new Response("Geçersiz mesaj formatı.", { status: 400 });

    // History Bloat (Geçmiş Şişmesi) engellemek için sadece son 6 mesajı baz al
    const messages = allMessages.slice(-6);
    const lastMessage = messages[messages.length - 1].content?.trim() || "Merhaba";

    // Tüm finansal veriyi tek sorguda çekiyoruz
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

    // Mesaj geçmişini Gemini SDK standartlarına uygun formata dönüştürüyoruz
    const formattedHistory: Content[] = [];
    const rawHistory = messages.slice(0, -1);

    for (const m of rawHistory) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      const text = m.content?.trim() ? m.content : "[Boş mesaj]";

      // Gemini asla model ile başlayamaz
      if (formattedHistory.length === 0 && role === "model") {
        formattedHistory.push({ role: "user", parts: [{ text: "Merhaba" }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        formattedHistory[formattedHistory.length - 1].parts[0].text += `\n${text}`;
      } else {
        formattedHistory.push({ role, parts: [{ text }] });
      }
    }

    // Yeni mesaj atmadan önce history'nin kesinlikle "model" ile bitmesi gereklidir
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
      formattedHistory.push({ role: "model", parts: [{ text: "Anladım, dinliyorum." }] });
    }

    // Fallback/Yedek Model Seçim Sistemi
    let chat;
    let initialStreamResponse;
    let selectedModelName;
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getFinancialHistory",
                  description: "Kullanıcının mevcut finansal özetini ve geçmiş verilerini getirir.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: { category: { type: SchemaType.STRING, description: "all, incomes, expenses, debts, investments" } },
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

        chat = model.startChat({ history: formattedHistory });
        initialStreamResponse = await chat.sendMessageStream(lastMessage);
        selectedModelName = modelName;
        console.log(`[AI-CHAT] ✅ Model başarıyla bağlandı: ${modelName}`);
        break; // İlk başarılı API çağrısında döngüden çık
      } catch (err: any) {
        // Terminalde gerçek hatayı görmek için error'u yazdırıyoruz
        console.error(`[AI-CHAT] ❌ Model başarısız (${modelName}):`, err.message);
      }
    }

    // Hiçbir model başarılı olamadıysa
    if (!initialStreamResponse || !chat) {
      console.error("[AI-CHAT] 🚨 Tüm denemeler başarısız oldu. API cevap vermedi.");
      return new Response(
        "**[Sistem Uyarısı]:** Yapay zeka ile bağlantı kurulamadı. Dakikalık işlem (15 RPM) sınırını aşmış olabilirsiniz, lütfen 1 dakika bekleyin.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    // Frontend'deki useChat entegrasyonuna uyumlu manuel Stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentStream = initialStreamResponse;
          let toolCallCount = 0;

          while (true) {
            let toolCalls: any[] = [];

            // iterator.next() yerine for-await-of ile okuma (kilitlemeleri ve RAM şişmesini önler)
            for await (const chunk of currentStream.stream) {
              const calls = chunk.functionCalls();
              if (calls && calls.length > 0) {
                toolCalls.push(...calls);
              }

              const text = chunk.text();
              if (text) {
                // Frontend'de useChat kullanıyorsanız bunu Vercel Data Protocol formatına zorlamalıyız (0:"metin"\n)
                const escapedText = JSON.stringify(text);
                controller.enqueue(encoder.encode(`0:${escapedText}\n`));
              }
            }

            // Hiç tool çağrılmadıysa doğal metin akışı bitmiştir
            if (toolCalls.length === 0) {
              break;
            }

            toolCallCount++;
            if (toolCallCount > 5) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify("\n\n*[Sistem Uyarısı]: İşlem çok uzun sürdüğü için durduruldu.*")}\n`));
              break;
            }

            const functionResponses: Part[] = [];
            for (const call of toolCalls) {
              console.log(`[TOOL] 🔍 Tool Çalıştırılıyor: ${call.name}`);
              let apiResponse: any = {};

              try {
                if (call.name === "getFinancialHistory") {
                  const category = (call.args as any).category;
                  const cat = String(category).toLowerCase();

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

                  apiResponse = (cat === "all" || cat === "hepsi") ? dataMap : { data: selectedData };
                } else if (call.name === "addFinancialRecord") {
                  const { type, amount, category, description, quantity, purchasePrice } = call.args as any;

                  const safeAmount = Number(amount) || 0;
                  if (safeAmount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

                  const baseData = { userId: user.id, amount: safeAmount, description: description || "", type: category };

                  switch (type) {
                    case "income": await prisma.income.create({ data: baseData }); break;
                    case "expense": await prisma.expense.create({ data: baseData }); break;
                    case "debt": await prisma.debt.create({ data: baseData }); break;
                    case "investment":
                      const q = Number(quantity) > 0 ? Number(quantity) : 1;
                      const amt = Number(amount) > 0 ? Number(amount) : 0;
                      const p = Number(purchasePrice) > 0 ? Number(purchasePrice) : (amt > 0 ? amt / q : 0);
                      const finalAmt = amt > 0 ? amt : (q * p);

                      await prisma.investment.create({
                        data: {
                          userId: user.id, type: standardizeInvestmentType(category),
                          symbol: description || category, quantity: q, purchasePrice: p, amount: finalAmt,
                          description: description || null, status: "OPEN", transactionType: "BUY",
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

              functionResponses.push({ functionResponse: { name: call.name, response: apiResponse } });
            }

            // Tool yanıtlarını Gemini'ye ilet ve yeni akışı dinle
            currentStream = await chat.sendMessageStream(functionResponses);
          }

          controller.close();
        } catch (err: any) {
          console.error("[AI-CHAT] ❌ Stream İşleme Hatası:", err.message);
          controller.enqueue(encoder.encode(`0:${JSON.stringify(`\n\n*[Sistem Uyarısı]: Ağ bağlantısında anlık bir kopma yaşandı (${err.message}). İşleminiz yapılmış olabilir.*`)}\n`));
          controller.close();
        }
      }
    });

    // useChat entegrasyonu için HTTP Response (Vercel Data Protocol formatına tam uyumlu)
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1", // useChat'in bunu bir stream objesi olarak görebilmesi için
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error(`[AI-CHAT] 🚨 SİSTEM HATASI:`, error.message);
    return new Response(JSON.stringify({ error: "**[Sistem Uyarısı]:** Sunucu tarafında beklenmeyen bir hata oluştu." }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
