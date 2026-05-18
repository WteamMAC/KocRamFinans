/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Content, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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

    const messages = allMessages.slice(-12);
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

    // AI Modelleri Öncelik Sıralaması (Fallback Stratejisi - Kesinlikle 1.5 modelleri barındırmaz)
    const FALLBACK_MODELS = [
      "gemini-3.1-flash-preview",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash"
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
                type: { type: SchemaType.STRING, description: "income, expense, debt, investment, fixedAsset" },
                amount: { type: SchemaType.NUMBER, description: "Orijinal toplam tutar (kur dönüşümü yapma). Eğer yatırım ekliyorsan ve toplam tutarı bilmiyorsan, 0 gönderebilirsin (sistem quantity * purchasePrice üzerinden kendi hesaplar)." },
                category: { type: SchemaType.STRING, description: "Kategori. Gider için: 'Mutfak & Market', 'Ev Kirası', 'Faturalar', 'Ulaşım', 'Eğitim / Sağlık', 'Diğer'. Gelir için: 'Maaş', 'Kira Geliri', 'Ek İş', 'Temettü', 'Diğer'. Borç için: 'Kredi Kartı', 'Banka Kredisi', 'Şahsi Borç'. Yatırım: 'BIST', 'NASDAQ', 'CRYPTO', 'GOLD', 'BES'. Sabit Varlık (fixedAsset) için: 'RealEstate' (Ev, Arsa), 'Vehicle' (Araba, Motor), 'Electronics' (Telefon, Bilgisayar), 'Other'." },
                symbol: { type: SchemaType.STRING, description: "Yatırımlar için Yahoo Finance sembolü (Örn: BTC-USD, ETH-USD, THYAO.IS, AAPL, GC=F). Kategori CRYPTO ise sonuna mutlaka '-USD' eklemelisin. BIST ise '.IS' eklemelisin. NASDAQ ise direkt AAPL gibi yazmalısın. KESİNLİKLE 'BTC' gibi ham yazma, 'BTC-USD' yaz." },
                currency: { type: SchemaType.STRING, description: "Para birimi kodu. Kullanıcı 'dolar' veya '$' derse USD, 'euro' veya '€' derse EUR, 'sterlin' derse GBP, belirtmezse TRY yaz." },
                date: { type: SchemaType.STRING, description: "İşlem tarihi YYYY-MM-DD formatında. Kullanıcı tarih belirtmezse bugünün tarihini yaz." },
                description: { type: SchemaType.STRING, description: "Açıklama" },
                isRecurring: { type: SchemaType.BOOLEAN, description: "Giderin her ay tekrarlanıp tekrarlanmayacağı. Market, yakıt, tek seferlik harcamalar için false. Sadece kira gibi sabit aylık ödemeler için true. Varsayılan: false" },
                quantity: { type: SchemaType.NUMBER, description: "Yatırımlar için miktar/adet" },
                purchasePrice: { type: SchemaType.NUMBER, description: "Yatırımlar için BİRİM alış fiyatı. EĞER fiyatı getMarketPrice aracı ile çektiysen, 'originalPrice' değerini kullan ve currency olarak da 'originalCurrency' değerini gönder. KESİNLİKLE kendi kendine TRY dönüşümü YAPMA. Sistem onu otomatik halleder." },
                interestRate: { type: SchemaType.NUMBER, description: "Borçlar için aylık faiz oranı (%). Belirtilmezse 0 kabul et." },
                remainingInstallments: { type: SchemaType.NUMBER, description: "Borçlar için kalan taksit sayısı. Tek seferlik borçlar için boş bırak." },
                paymentDay: { type: SchemaType.NUMBER, description: "Borçlar için taksit ödeme günü (1-31)." },
                dueDate: { type: SchemaType.STRING, description: "Tek seferlik borçlar için son ödeme tarihi (YYYY-MM-DD)." }
              },
              required: ["type", "amount", "category"]
            }
          },
          {
            name: "payDebt",
            description: "Kullanıcı bir kredi taksidini veya mevcut bir borcunu ödediğini söylediğinde kullanılır. ÖNEMLİ: Bu aracı kullanmadan önce MUTLAKA 'getFinancialHistory' (category: 'debts') aracı ile borçların listesini çekip ödenen borcun benzersiz 'debtId' değerini bulmalısın.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                debtId: { type: SchemaType.STRING, description: "Ödemesi yapılan borcun/kredinin veritabanındaki ID'si." },
                amount: { type: SchemaType.NUMBER, description: "Ödenen miktar. Eğer taksit ödeniyorsa ve miktar belirtilmemişse 0 gönder (sistem otomatik taksit tutarını düşer)." }
              },
              required: ["debtId"]
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
            description: "İnternetten hisse senedi, emtia (altın), döviz veya kripto fiyatlarını canlı olarak arar. DİKKAT: DÖNEN TÜM FİYATLAR TÜRK LİRASI (TRY) CİNSİNDENDİR! Eğer kripto veya yabancı hisse sorguluyorsan, sistem onu arka planda otomatik TRY'ye çevirip sana verir. Kayıt eklerken bunu unutma.",
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
          },
          {
            name: "manageSpecialEvent",
            description: "Kullanıcının özel günlerini (doğum günü, evlilik yıldönümü, fatura tarihi vb.) yönetir.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                action: { type: SchemaType.STRING, description: "'add', 'delete' veya 'list' (listelemek için)" },
                title: { type: SchemaType.STRING, description: "Etkinlik adı (Örn: Eşimin Doğum Günü). Sadece 'add' için." },
                date: { type: SchemaType.STRING, description: "Tarih YYYY-MM-DD. Sadece 'add' için." },
                isAnnual: { type: SchemaType.BOOLEAN, description: "Her yıl tekrarlanacak mı? (Örn: Doğum günleri true). Varsayılan: true." },
                eventId: { type: SchemaType.STRING, description: "Silinecek etkinliğin ID'si. Sadece 'delete' için." }
              },
              required: ["action"]
            }
          },
          {
            name: "updateUserProfile",
            description: "Kullanıcının profil bilgilerini (isim, biyografi, para birimi, ilgi alanları) günceller.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                firstName: { type: SchemaType.STRING, description: "Kullanıcının adı" },
                lastName: { type: SchemaType.STRING, description: "Kullanıcının soyadı" },
                bio: { type: SchemaType.STRING, description: "Kullanıcının biyografisi veya kişisel hedefi" },
                currency: { type: SchemaType.STRING, description: "Varsayılan para birimi (TRY, USD, EUR vb.)" },
                interests: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: "İlgi alanları listesi (Örn: ['kripto', 'borsa'])"
                }
              }
            }
          },
          {
            name: "createCommunityPost",
            description: "Kullanıcı adına Wteam sosyal topluluğunda herkese açık bir blog/forum gönderisi paylaşır.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                content: { type: SchemaType.STRING, description: "Gönderinin içeriği (Kısa, ilgi çekici ve samimi bir metin)" },
                tags: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: "Gönderiyle ilgili etiketler (Örn: ['bitcoin', 'yatırım', 'öneri'])"
                },
                communityId: { type: SchemaType.STRING, description: "İsteğe bağlı: Gönderinin paylaşılacağı topluluğun ID'si. Kullanıcı belirli bir topluluk adı söylerse getFinancialHistory ile topluluk listesine bakabilirsin. Belirtilmezse genel feed'e atılır." }
              },
              required: ["content", "tags"]
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

        // Eğer hata API kotası/limit aşımı ise (429) veya Güvenlik İhlali ise diğer modellere geçmeye gerek yok.
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
          return new Response(JSON.stringify({
            error: "Yapay zeka asistanı şu anda çok yoğun. Lütfen 1-2 dakika sonra tekrar deneyin."
          }), { status: 429, headers: { "Content-Type": "application/json" } });
        }
        if (msg.includes("safety") || msg.includes("blocked")) {
          return new Response(JSON.stringify({
            error: "Mesajınız veya finansal içeriğiniz güvenlik politikalarımıza takıldı. Lütfen daha net ve uygun bir dil kullanın."
          }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      }
    }

    // Eğer hiçbir model yanıt vermediyse sistemi zarifçe kapatıp arayüze bilgi verelim.
    if (!activeChat || !initialStreamResponse) {
      console.error("[AI-CHAT] Tüm modeller başarısız oldu:", lastError?.message);
      return new Response(JSON.stringify({
        error: `Asistan şu anda teknik bir sorun yaşıyor. Hata Detayı: ${lastError?.message || "Bilinmeyen Hata"}`
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
            const toolCalls: any[] = [];

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

                  // Fresh DB sorgusu: aynı sohbette eklenen kayıtlar da görünsün
                  const freshUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                      incomes: { orderBy: { createdAt: "desc" }, take: 15 },
                      expenses: { orderBy: { createdAt: "desc" }, take: 15 },
                      debts: { orderBy: { createdAt: "desc" }, take: 15 },
                      investments: { orderBy: { createdAt: "desc" }, take: 15 },
                      fixedAssets: { orderBy: { createdAt: "desc" }, take: 15 }
                    }
                  });

                  const dataMap: Record<string, any> = {
                    incomes: freshUser?.incomes || [],
                    expenses: freshUser?.expenses || [],
                    debts: freshUser?.debts || [],
                    investments: freshUser?.investments || [],
                    fixedAssets: freshUser?.fixedAssets || []
                  };

                  apiResponse = (cat === "all" || cat === "hepsi") ? dataMap : { data: dataMap[cat as keyof typeof dataMap] || dataMap };
                } else if (call.name === "addFinancialRecord") {
                  const { type, amount, category, symbol, description, quantity, purchasePrice, isRecurring,
                    currency: rawCurrency, date: rawDate,
                    interestRate, remainingInstallments, paymentDay, dueDate } = args;

                  const isInv = type === "investment";
                  const calcAmt = isInv ? (Number(quantity) || 1) * (Number(purchasePrice) || 0) : 0;
                  const safeAmount = Number(amount) || calcAmt || 0;

                  if (safeAmount <= 0) throw new Error("Tutar veya birim fiyat 0'dan büyük olmalıdır.");

                  // --- Para Birimi & Kur Dönüşümü ---
                  const currency = (rawCurrency || "TRY").toUpperCase();
                  const txDate = rawDate ? new Date(rawDate) : new Date();
                  let fxRate = 1;
                  if (currency !== "TRY") {
                    const symbolMap: Record<string, string> = {
                      USD: "USDTRY=X", EUR: "EURTRY=X", GBP: "GBPTRY=X",
                      CHF: "CHFTRY=X", JPY: "JPYTRY=X", AED: "AEDTRY=X",
                      SAR: "SARTRY=X", CAD: "CADTRY=X", AUD: "AUDTRY=X",
                    };
                    const sym = symbolMap[currency];
                    if (sym) {
                      try {
                        const prices = await getLivePrices([sym]);
                        fxRate = prices.get(sym)?.price || 1;
                      } catch (e: any) { fxRate = 1; }
                    }
                  }
                  const amountInTRY = safeAmount * fxRate;

                  if (type === "income") {
                    await prisma.income.create({
                      data: {
                        userId: user.id,
                        type: category,
                        amount: amountInTRY,
                        originalAmount: safeAmount,
                        currency,
                        fxRate,
                        date: txDate,
                        description: description || "",
                      }
                    });
                  } else if (type === "expense") {
                    await prisma.expense.create({
                      data: {
                        userId: user.id,
                        type: category,
                        amount: amountInTRY,
                        originalAmount: safeAmount,
                        currency,
                        fxRate,
                        date: txDate,
                        isRecurring: isRecurring === undefined ? false : Boolean(isRecurring),
                        description: description || "",
                      }
                    });
                  } else if (type === "debt") {
                    // PMT Faiz Hesabı (dashboard addDebt ile aynı mantık)
                    const principal = amountInTRY;
                    const n = remainingInstallments ? Number(remainingInstallments) : 0;
                    const iRate = interestRate ? Number(interestRate) : 0;
                    let finalTotal = principal;
                    let monthlyPayment: number | null = null;
                    if (iRate > 0 && n > 0) {
                      const i = iRate / 100;
                      monthlyPayment = (principal * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
                      finalTotal = monthlyPayment * n;
                    } else if (n > 0) {
                      monthlyPayment = principal / n;
                    }
                    let debtDesc = description || category;
                    if (dueDate) debtDesc += ` (Son Ödeme: ${new Date(dueDate).toLocaleDateString("tr-TR")})`;
                    await prisma.debt.create({
                      data: {
                        userId: user.id,
                        type: category,
                        amount: finalTotal,
                        principalAmount: principal,
                        interestRate: iRate || null,
                        installmentAmount: monthlyPayment,
                        remainingInstallments: n || null,
                        paymentDay: paymentDay ? Number(paymentDay) : null,
                        dueDate: dueDate ? new Date(dueDate) : null,
                        currency,
                        originalAmount: safeAmount,
                        fxRate,
                        description: debtDesc,
                      }
                    });
                  } else if (type === "investment") {
                    const q = Number(quantity) > 0 ? Number(quantity) : 1;
                    // purchasePrice: AI tarafından orijinal para biriminde (USD, TRY vb.) gönderilir
                    // amountInTRY: toplam tutar TRY'ye çevrilmiş hali (fxRate ile)
                    // Birim fiyatı da TRY'ye çevirip saklıyoruz — price-service tutarsız dönüşüm yapmaz
                    const rawPurchasePrice = Number(purchasePrice);
                    // Eğer purchasePrice orijinal para birimindeyse TRY'ye çevir; değilse amountInTRY'den türet
                    let unitPriceInTRY: number;
                    if (rawPurchasePrice > 0) {
                      unitPriceInTRY = rawPurchasePrice * fxRate; // USD*fxRate = TRY birim fiyat
                    } else if (amountInTRY > 0) {
                      unitPriceInTRY = amountInTRY / q;
                    } else {
                      unitPriceInTRY = 0;
                    }
                    const finalAmt = amountInTRY > 0 ? amountInTRY : (q * unitPriceInTRY);
                    const rawSymbol = (symbol || description || category || "").toUpperCase().trim();
                    const invType = standardizeInvestmentType(category);
                    let normalizedSymbol = rawSymbol;
                    if (invType === "CRYPTO" && !normalizedSymbol.includes("-")) {
                      normalizedSymbol = `${normalizedSymbol}-USD`;
                    } else if (invType === "BIST" && !normalizedSymbol.includes(".")) {
                      normalizedSymbol = `${normalizedSymbol}.IS`;
                    }

                    await prisma.investment.create({
                      data: {
                        userId: user.id,
                        type: invType,
                        symbol: normalizedSymbol,
                        quantity: q,
                        purchasePrice: unitPriceInTRY, // TRY cinsinden birim fiyat (tutarlı)
                        amount: finalAmt,             // TRY cinsinden toplam maliyet
                        currency,                     // Orijinal para birimi (USD, EUR vs.)
                        description: description || null,
                        status: "OPEN",
                        transactionType: "BUY",
                      }
                    });
                  } else if (type === "fixedAsset") {
                    await prisma.fixedAsset.create({
                      data: {
                        userId: user.id,
                        name: description || "Sabit Varlık",
                        type: category, // "RealEstate", "Vehicle", vs.
                        value: amountInTRY,
                        currency,
                        originalAmount: safeAmount,
                        fxRate
                      }
                    });
                  }

                  // Cache'i temizle, dashboard anında güncellensin
                  revalidatePath("/dashboard");
                  revalidatePath("/dashboard/income-expense");
                  revalidatePath("/dashboard/debts");
                  revalidatePath("/dashboard/assets");
                  revalidatePath("/dashboard/fixed-assets");

                  apiResponse = { success: true, message: `Kayıt başarıyla eklendi. (${safeAmount} ${currency}${fxRate !== 1 ? ` ≈ ${amountInTRY.toFixed(2)} TRY` : ""})` };
                } else if (call.name === "payDebt") {
                  const { debtId, amount } = args;
                  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
                  if (!debt) {
                    apiResponse = { error: "Belirtilen borç bulunamadı." };
                  } else {
                    const payAmount = (amount && Number(amount) > 0) ? Number(amount) : (debt.installmentAmount || debt.amount);
                    let newRemaining = debt.amount - payAmount;
                    if (newRemaining < 0) newRemaining = 0;

                    let newInstallments = debt.remainingInstallments;
                    if (newInstallments && newInstallments > 0) {
                      newInstallments = newInstallments - 1;
                    }

                    if (newRemaining <= 0) {
                      await prisma.debt.delete({ where: { id: debt.id } });
                    } else {
                      await prisma.debt.update({
                        where: { id: debt.id },
                        data: { amount: newRemaining, remainingInstallments: newInstallments }
                      });
                    }

                    // Gider tablosuna da işleyelim
                    await prisma.expense.create({
                      data: {
                        userId: user.id,
                        type: "Banka Kredisi", // Borç Ödemesi
                        amount: payAmount,
                        originalAmount: payAmount / (debt.fxRate || 1),
                        currency: debt.currency,
                        fxRate: debt.fxRate,
                        date: new Date(),
                        isRecurring: false,
                        description: `${debt.description || debt.type} ödemesi / taksidi`
                      }
                    });

                    revalidatePath("/dashboard");
                    revalidatePath("/dashboard/debts");
                    revalidatePath("/dashboard/income-expense");
                    apiResponse = { success: true, message: `Borç başarıyla ödendi ve gidere işlendi. Ödenen: ${payAmount}, Kalan Borç: ${newRemaining}` };
                  }
                } else if (call.name === "deleteFinancialRecord") {
                  const { type, recordId } = args;
                  // Güvenlik: Kullanıcının kendi kaydını sildiğinden emin ol (userId filtresi zorunlu)
                  if (type === "income") await prisma.income.delete({ where: { id: recordId, userId: user.id } });
                  else if (type === "expense") await prisma.expense.delete({ where: { id: recordId, userId: user.id } });
                  else if (type === "debt") await prisma.debt.delete({ where: { id: recordId, userId: user.id } });
                  else if (type === "investment") await prisma.investment.delete({ where: { id: recordId, userId: user.id } });
                  else if (type === "fixedAsset") await prisma.fixedAsset.delete({ where: { id: recordId, userId: user.id } });

                  revalidatePath("/dashboard");
                  revalidatePath("/dashboard/income-expense");
                  revalidatePath("/dashboard/debts");
                  revalidatePath("/dashboard/assets");
                  revalidatePath("/dashboard/fixed-assets");
                  apiResponse = { success: true, message: "Kayıt veritabanından kalıcı olarak silindi." };
                } else if (call.name === "getMarketPrice") {
                  const symbols: string[] = (Array.isArray(args.symbols) ? args.symbols : [args.symbols]) as string[];
                  const resultsMap = await getLivePrices(symbols);
                  const dataWithCurrency = Object.fromEntries(
                    Array.from(resultsMap.entries()).map(([k, v]) => [k, {
                      tryPrice: v.price,
                      originalPrice: v.originalPrice || v.price,
                      originalCurrency: v.originalCurrency || "TRY"
                    }])
                  );
                  apiResponse = { data: dataWithCurrency, note: "The tryPrice is the value converted to TRY. The originalPrice is the value in its native currency (originalCurrency). When adding a record, you should use the originalPrice and originalCurrency." };
                } else if (call.name === "manageSpecialEvent") {
                  const { action, title, date, isAnnual, eventId } = args;
                  if (action === "add") {
                    await prisma.specialEvent.create({
                      data: {
                        userId: user.id,
                        title: title || "Özel Gün",
                        date: date ? new Date(date) : new Date(),
                        isAnnual: isAnnual === undefined ? true : Boolean(isAnnual)
                      }
                    });
                    apiResponse = { success: true, message: "Özel gün başarıyla eklendi." };
                  } else if (action === "delete") {
                    if (eventId) {
                      await prisma.specialEvent.delete({ where: { id: eventId } });
                      apiResponse = { success: true, message: "Özel gün silindi." };
                    } else {
                      apiResponse = { error: "Silmek için eventId gerekli." };
                    }
                  } else if (action === "list") {
                    const events = await prisma.specialEvent.findMany({ where: { userId: user.id } });
                    apiResponse = { data: events };
                  }
                  revalidatePath("/dashboard/special-events"); // Varsayılan bir sayfa adı, eğer varsa güncellenir
                } else if (call.name === "updateUserProfile") {
                  const { firstName, lastName, bio, currency, interests } = args;
                  const updateData: any = {};
                  if (firstName) updateData.firstName = firstName;
                  if (lastName) updateData.lastName = lastName;
                  if (bio) updateData.bio = bio;
                  if (currency) updateData.currency = currency;
                  if (interests && Array.isArray(interests)) updateData.interests = interests;

                  await prisma.user.update({
                    where: { id: user.id },
                    data: updateData
                  });
                  revalidatePath("/dashboard/profile");
                  apiResponse = { success: true, message: "Profil bilgileri güncellendi." };
                } else if (call.name === "createCommunityPost") {
                  const { content, tags, communityId } = args;
                  await prisma.blogPost.create({
                    data: {
                      authorId: user.id,
                      content: content,
                      tags: Array.isArray(tags) ? tags : [],
                      communityId: communityId || null,
                      isAnnouncement: false
                    }
                  });
                  revalidatePath("/dashboard/blog");
                  apiResponse = { success: true, message: `Toplulukta başarıyla gönderi paylaşıldı.${communityId ? " (Topluluk ID: " + communityId + ")" : " (Genel feed)"}` };
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
