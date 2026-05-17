/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext } from "@/lib/gemini";
import { standardizeInvestmentType } from "@/lib/utils";
import { getLivePrices } from "@/lib/price-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Basit Bellek İçi Kullanıcı İstek Sınırlandırması (Rate Limiting)
const userRateLimit = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Yetkisiz erişim.", { status: 401 });

    // Rate Limiting Kontrolü (Dakikada maks 20 istek)
    const now = Date.now();
    const userLimit = userRateLimit.get(clerkId) || { count: 0, resetTime: now + 60000 };
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + 60000;
    } else {
      userLimit.count++;
      if (userLimit.count > 20) {
        return new Response(JSON.stringify({ error: "Sistem güvenliği: Kısa sürede çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin." }), { status: 429, headers: { "Content-Type": "application/json" } });
      }
    }
    userRateLimit.set(clerkId, userLimit);

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return new Response("GEMINI_API_KEY eksik", { status: 500 });

    const body = await req.json().catch(() => ({ messages: [] }));
    const allMessages = body.messages || [];
    if (!allMessages.length) return new Response("Geçersiz mesaj formatı.", { status: 400 });

    const messages = allMessages.slice(-6);
    const lastMessageObj = messages[messages.length - 1];
    // Eğer metin yoksa ve sadece resim atıldıysa varsayılan bir talimat veriyoruz
    const lastMessageText = lastMessageObj.content?.trim() || (lastMessageObj.image ? "Bu fişi/faturayı analiz edip doğrudan giderlerime kaydeder misin?" : "Merhaba");

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

    // AI'a giden veri boyutunu sınırlandırarak aşırı yükü ve 503 zaman aşımı hatasını engelliyoruz
    const optimizedUser = {
      ...user,
      incomes: user.incomes.slice(-20),
      expenses: user.expenses.slice(-30),
      debts: user.debts.slice(-20),
      investments: user.investments.slice(-30)
    };

    // Sistem Promptu Hazırlığı
    const financialContext = await getFinancialContext(optimizedUser as any);
    const systemPrompt = MASTER_PROMPT
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"))
      .replace("{USER_DATA}", financialContext) +
      `\n\nÖNEMLİ TALİMAT: Eğer kullanıcı mesajında bir resim/görsel (fiş, fatura vb.) gönderirse, KESİNLİKLE ONAY BEKLEME veya SORU SORMA. Doğrudan görseldeki toplam tutarı, tarihi ve kategoriyi (market, yakıt vb.) belirle ve "addFinancialRecord" aracını (tool) çağırarak gider (expense) olarak VERİTABANINA KAYDET. İşlemi bitirince kullanıcıya "Fişinizi ... TL olarak ... kategorisine kaydettim" şeklinde bilgi ver.`;

    const formattedHistory: Content[] = [];
    const rawHistory = messages.slice(0, -1);

    for (const m of rawHistory) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      const text = m.content?.trim() ? m.content : "[Boş mesaj]";
      const parts: Part[] = [{ text }];

      // Eğer mesajın içinde bir görsel (image) Base64 string'i varsa bunu parçalara ekle
      if ((m as any).image) {
        const match = (m as any).image.match(/^data:(image\/\w+);base64,(.*)$/);
        if (match) {
          parts.push({
            inlineData: { mimeType: match[1], data: match[2] }
          });
        }
      }

      if (formattedHistory.length === 0 && role === "model") {
        formattedHistory.push({ role: "user", parts: [{ text: "Merhaba" }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        formattedHistory[formattedHistory.length - 1].parts[0].text += `\n${text}`;
        if (parts.length > 1) formattedHistory[formattedHistory.length - 1].parts.push(parts[1]);
      } else {
        formattedHistory.push({ role, parts });
      }
    }

    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
      formattedHistory.push({ role: "model", parts: [{ text: "Anladım, dinliyorum." }] });
    }

    // Son mesajı, varsa içindeki görselle birlikte API'ye hazırlıyoruz
    const lastMessageParts: Part[] = [{ text: lastMessageText }];
    if (lastMessageObj.image) {
      const match = lastMessageObj.image.match(/^data:(image\/\w+);base64,(.*)$/);
      if (match) {
        lastMessageParts.push({
          inlineData: { mimeType: match[1], data: match[2] }
        });
      }
    }

    // AI Modelleri Öncelik Sıralaması (Fallback Stratejisi)
    const FALLBACK_MODELS = [
      "gemini-3.1-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-flash"
    ];

    // Tool (Araç) Konfigürasyonunu döngüde yeniden kullanmak üzere ayırıyoruz
    const toolsConfig: any[] = [
      {
        functionDeclarations: [
          {
            name: "getFinancialHistory",
            description: "Kullanıcının mevcut kayıtlarını getirir. Silinecek verinin ID'sini bulmak için de kullanılır.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: { category: { type: SchemaType.STRING, description: "all, incomes, expenses, debts, investments" } },
              required: ["category"]
            }
          },
          {
            name: "addFinancialRecord",
            description: "Yeni bir gelir, gider, borç veya yatırım kaydı oluşturur. Kullanıcı bir fiş veya fatura resmi yüklediyse, bu araçla oradaki tutarı okuyup gider olarak kaydedebilirsin.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                type: { type: SchemaType.STRING, description: "income, expense, debt, investment" },
                amount: { type: SchemaType.NUMBER, description: "Tutar" },
                category: { type: SchemaType.STRING, description: "Kategori (örn: Market, Maaş, BIST)" },
                description: { type: SchemaType.STRING, description: "Açıklama veya Hisse Kodu" },
                isRecurring: { type: SchemaType.BOOLEAN, description: "Giderin her ay tekrarlanıp tekrarlanmayacağı. Market, fatura gibi harcamalar için false yapın. Varsayılan: false" },
                quantity: { type: SchemaType.NUMBER, description: "Yatırımlar için miktar" },
                purchasePrice: { type: SchemaType.NUMBER, description: "Yatırımlar için alış fiyatı" }
              },
              required: ["type", "amount", "category"]
            }
          },
          {
            name: "deleteFinancialRecord",
            description: "Önceden eklenmiş hatalı veya eski bir finansal kaydı veritabanından kalıcı olarak siler.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                type: { type: SchemaType.STRING, description: "income, expense, debt, investment" },
                recordId: { type: SchemaType.STRING, description: "Silinecek kaydın benzersiz ID'si" }
              },
              required: ["type", "recordId"]
            }
          },
          {
            name: "getMarketPrice",
            description: "İnternetten hisse senedi, emtia (altın), döviz veya kripto fiyatlarını canlı olarak arar.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                symbols: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: "Yahoo Finance sembolleri (Örn: AAPL, BTC-USD, TRY=X, THYAO.IS, GC=F)"
                }
              },
              required: ["symbols"]
            }
          }
        ]
      }
    ];

    const genAI = new GoogleGenerativeAI(apiKey);
    let activeChat: any = null;
    let initialStreamResponse: any = null;
    let usedModel: string = "";
    let lastError: any = null;

    // Belirlenen modelleri sırasıyla dener, biri çalışırsa döngüden çıkar.
    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[AI-CHAT] Model bağlantısı deneniyor: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          tools: toolsConfig
        });

        const chat = model.startChat({ history: formattedHistory });
        initialStreamResponse = await chat.sendMessageStream(lastMessageParts);

        activeChat = chat;
        usedModel = modelName;
        console.log(`[AI-CHAT] Başarılı! Kullanılan model: ${modelName}`);
        break; // İlk başarılı modelde döngüden güvenle çıkıyoruz.
      } catch (error: any) {
        console.warn(`[AI-CHAT] Uyarı - Model başarısız (${modelName}):`, error.message);
        lastError = error;
        // Hata alınırsa (Limit aşıldı 429 vb.) bir sonraki yedek modele geçmeye devam edecek.
      }
    }

    // Eğer hiçbir model yanıt vermediyse sistemi zarifçe kapatıp arayüze bilgi verelim.
    if (!activeChat || !initialStreamResponse) {
      console.error("[AI-CHAT] Tüm modeller başarısız oldu:", lastError?.message);
      return new Response(JSON.stringify({
        error: "Sistem yoğunluğu nedeniyle asistan şu anda yanıt veremiyor. Modellerimiz limitine ulaştı, lütfen birkaç dakika sonra tekrar deneyin."
      }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendText = (text: string) => controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
        const sendError = (text: string) => controller.enqueue(encoder.encode(`0:${JSON.stringify(`\n\n*[Sistem Uyarısı]: ${text}*`)}\n`));

        try {
          let currentStream = initialStreamResponse;
          let toolCallCount = 0;
          const MAX_STEPS = 6; // Özerk düşünme sınırı

          while (toolCallCount < MAX_STEPS) {
            let toolCalls: any[] = [];

            for await (const chunk of currentStream.stream) {
              const calls = chunk.functionCalls();
              if (calls && calls.length > 0) toolCalls.push(...calls);

              try {
                const text = chunk.text();
                if (text) sendText(text);
              } catch (err) {
                // Model sadece tool çağırdığında text olmadığı için hata fırlatabilir, yoksayıyoruz.
              }
            }

            if (toolCalls.length === 0) break; // AI'nin işi bitti, normal yanıt verdi

            toolCallCount++;

            const functionResponses: Part[] = [];
            for (const call of toolCalls) {
              console.log(`[TOOL] 🔍 Tool Çalıştırılıyor: ${call.name}`);
              let apiResponse: any = {};

              try {
                const args = call.args as any;

                if (call.name === "getFinancialHistory") {
                  const cat = String(args.category).toLowerCase();

                  const dataMap: Record<string, any> = {
                    incomes: user.incomes.slice(-10),
                    expenses: user.expenses.slice(-10),
                    debts: user.debts.slice(-10),
                    investments: user.investments.slice(-10)
                  };

                  apiResponse = (cat === "all" || cat === "hepsi") ? dataMap : { data: dataMap[cat as keyof typeof dataMap] || dataMap };
                } else if (call.name === "addFinancialRecord") {
                  const { type, amount, category, description, quantity, purchasePrice, isRecurring } = args;

                  const safeAmount = Number(amount) || 0;
                  if (safeAmount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

                  const baseData = { userId: user.id, amount: safeAmount, description: description || "", type: category };

                  if (type === "income") await prisma.income.create({ data: baseData });
                  else if (type === "expense") await prisma.expense.create({
                    data: {
                      ...baseData,
                      isRecurring: isRecurring === undefined ? false : Boolean(isRecurring)
                    }
                  });
                  else if (type === "debt") await prisma.debt.create({ data: baseData });
                  else if (type === "investment") {
                    const q = Number(quantity) > 0 ? Number(quantity) : 1;
                    const p = Number(purchasePrice) > 0 ? Number(purchasePrice) : (safeAmount > 0 ? safeAmount / q : 0);
                    const finalAmt = safeAmount > 0 ? safeAmount : (q * p);

                    await prisma.investment.create({
                      data: {
                        userId: user.id, type: standardizeInvestmentType(category),
                        symbol: description || category, quantity: q, purchasePrice: p, amount: finalAmt,
                        description: description || null, status: "OPEN", transactionType: "BUY",
                      }
                    });
                  }
                  apiResponse = { success: true, message: "Kayıt başarıyla eklendi." };
                } else if (call.name === "deleteFinancialRecord") {
                  const { type, recordId } = args;
                  if (type === "income") await prisma.income.delete({ where: { id: recordId } });
                  else if (type === "expense") await prisma.expense.delete({ where: { id: recordId } });
                  else if (type === "debt") await prisma.debt.delete({ where: { id: recordId } });
                  else if (type === "investment") await prisma.investment.delete({ where: { id: recordId } });
                  apiResponse = { success: true, message: "Kayıt veritabanından kalıcı olarak silindi." };
                } else if (call.name === "getMarketPrice") {
                  const symbols: string[] = (Array.isArray(args.symbols) ? args.symbols : [args.symbols]) as string[];
                  const resultsMap = await getLivePrices(symbols);
                  apiResponse = { data: Object.fromEntries(resultsMap) };
                }
              } catch (e: any) {
                console.error(`[TOOL] ❌ Hata:`, e.message);
                apiResponse = { error: `İşlem başarısız: ${e.message}` };
              }

              functionResponses.push({ functionResponse: { name: call.name, response: apiResponse } });
            }

            // Tool yanıtını gönderirken anlık rate limitlere/kopmalara karşı "Exponential Backoff" (Gecikmeli Yeniden Deneme)
            let retryCount = 0;
            const maxRetries = 2;
            let toolSuccess = false;

            while (retryCount <= maxRetries && !toolSuccess) {
              try {
                currentStream = await activeChat.sendMessageStream(functionResponses);
                toolSuccess = true;
              } catch (err: any) {
                retryCount++;
                console.warn(`[AI-CHAT] Ara işlem gönderilirken ağ hatası (${usedModel}), Deneme ${retryCount}/${maxRetries}:`, err.message);
                if (retryCount > maxRetries) {
                  throw new Error(`Asistan arka planda işlemi yaparken engellendi (Model: ${usedModel}). Lütfen soruyu tekrar sorun.`);
                }
                await new Promise(r => setTimeout(r, 1000 * retryCount)); // 1. saniye, sonra 2. saniye bekle
              }
            }
          }

          controller.close();
        } catch (err: any) {
          console.error("[AI-CHAT] ❌ Stream İşleme Hatası:", err.message);
          sendError(`İşlem sırasında beklenmeyen bir ağ hatası oluştu: ${err.message}`);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1", // useChat'in bunu bir stream objesi olarak görebilmesi için
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error(`[AI-CHAT] 🚨 SİSTEM HATASI:`, error.message, error.stack);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Sunucu Hatası: ${error.message}`
      : "**[Sistem Uyarısı]:** Sunucu tarafında beklenmeyen bir hata oluştu.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
