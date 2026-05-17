/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getLivePrices } from "@/lib/price-service";
import { standardizeInvestmentType } from "@/lib/utils";

/**
 * Yeni bir varlık ekler.
 */
export async function addAsset(data: {
  type: string;
  symbol?: string;
  quantity: number;
  purchasePrice?: number;
  useCurrentPrice?: boolean;
  description?: string;
  monthlyContribution?: number;
  fundType?: string;
  fundSymbol?: string;
  maturityPeriod?: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("Kullanıcı kaydı bulunamadı.");

    // Sayısal değerleri doğrula
    const quantity = Number(data.quantity);
    if (isNaN(quantity) || quantity <= 0) throw new Error("Geçersiz miktar girdiniz. Miktar 0'dan büyük olmalıdır.");
    
    if (data.purchasePrice !== undefined && Number(data.purchasePrice) < 0) {
        throw new Error("Fiyat 0 veya daha büyük olmalıdır.");
    }

    let finalPrice = Number(data.purchasePrice) || 0;
    const trimmedSymbol = data.symbol?.trim().toUpperCase() || null;
    const standardizedType = standardizeInvestmentType(data.type);

    let finalCurrency = "TRY";
    if (standardizedType === "NASDAQ" || standardizedType === "CRYPTO") {
      finalCurrency = "USD";
    } else if (standardizedType === "GOLD" && trimmedSymbol && (trimmedSymbol.includes("ONS") || trimmedSymbol.includes("GC=F") || trimmedSymbol.includes("SI=F") || trimmedSymbol.includes("BZ=F"))) {
      finalCurrency = "USD";
    }

    // Eğer güncel fiyat seçildiyse Yahoo'dan çek
    if (data.useCurrentPrice && trimmedSymbol) {
      try {
        const prices = await getLivePrices([trimmedSymbol]);
        const livePrice = prices.get(trimmedSymbol);
        if (livePrice && livePrice.price > 0) {
          finalPrice = livePrice.price;
        }
      } catch (err) {
        console.error("Live price fetch error:", err);
      }
    } else if (!data.useCurrentPrice && finalPrice > 0 && trimmedSymbol) {
      // Kullanıcı manuel fiyat girdiğinde USD mi yoksa TRY mi girdiğini tespit etme (Akıllı Kur Çevirimi)
      try {
        const prices = await getLivePrices([trimmedSymbol, "TRY=X"]);
        const livePrice = prices.get(trimmedSymbol);
        const usdTry = prices.get("TRY=X")?.price || 36.45;

        if (livePrice && livePrice.price > 0) {
          const priceAsTry = finalPrice;
          const priceAsUsdConvertedToTry = finalPrice * usdTry;

          const diffIfTry = Math.abs(priceAsTry - livePrice.price);
          const diffIfUsd = Math.abs(priceAsUsdConvertedToTry - livePrice.price);

          // Eğer kullanıcının girdiği fiyat USD olarak varsayılıp TRY'ye çevrildiğinde
          // güncel piyasa fiyatına daha yakın oluyorsa, kullanıcı kesinlikle USD girmiştir.
          if (diffIfUsd < diffIfTry && (diffIfUsd / livePrice.price < 0.5)) {
            finalPrice = priceAsUsdConvertedToTry;
          }
        }
      } catch (err) {
        console.error("Currency check error:", err);
      }
    }

    let finalQuantity = quantity;
    let desc = data.description || null;

    if (standardizedType === "BES" || standardizedType === "FAIZ") {
      // For BES and FAIZ, purchasePrice acts as the Rate (Contribution or Interest Rate),
      // and quantity acts as the Principal Amount.
      // But we want the database `amount` and `currentValuation` to just be the Principal initially.
      const rate = finalPrice; 
      finalPrice = 1; 

      const metadata = {
        rate: rate,
        monthlyContribution: Number(data.monthlyContribution) || 0,
        fundType: data.fundType || "STANDART",
        fundSymbol: data.fundSymbol || undefined,
        maturityPeriod: data.maturityPeriod || 32,
        originalDescription: desc
      };
      desc = JSON.stringify(metadata);
    }

    await prisma.investment.create({
      data: {
        userId: user.id,
        type: standardizedType,
        symbol: trimmedSymbol,
        quantity: finalQuantity,
        purchasePrice: finalPrice,
        amount: finalQuantity * finalPrice,
        description: desc,
        currency: finalCurrency,
        status: "OPEN",
        transactionType: "BUY",
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    console.error("addAsset server error:", error);
    throw new Error(error.message || "Varlık eklenirken bir hata oluştu.");
  }
}

/**
 * Bir varlığı güncel fiyattan satar (Kapatır).
 */
export async function sellAsset(id: string, postSellAction?: "KEEP_TL" | "KEEP_USDT" | "WITHDRAW") {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!investment || investment.user.clerkUserId !== userId) {
      throw new Error("Varlık bulunamadı veya yetkiniz yok.");
    }

    let sellPrice = investment.purchasePrice || 0;
    if (investment.symbol) {
      try {
        const prices = await getLivePrices([investment.symbol]);
        const livePrice = prices.get(investment.symbol.toUpperCase());
        if (livePrice && livePrice.price > 0) {
          sellPrice = livePrice.price;
        }
      } catch (err) {
        console.error("Live price fetch error for sell:", err);
      }
    }

    await prisma.investment.update({
      where: { id },
      data: {
        status: "CLOSED",
        transactionType: "SELL",
        soldPrice: sellPrice,
        soldAt: new Date(),
      },
    });

    const totalSoldAmount = investment.quantity * sellPrice;

    if (totalSoldAmount <= 0) {
      throw new Error("Satış tutarı hesaplanamadı veya geçersiz.");
    }

    if (postSellAction === "KEEP_TL") {
      await prisma.investment.create({
        data: {
          userId: investment.userId,
          type: "CASH",
          symbol: "TRY",
          quantity: totalSoldAmount,
          purchasePrice: 1,
          amount: totalSoldAmount,
          description: `${investment.symbol || 'Varlık'} satışından TL`,
          status: "OPEN",
          transactionType: "BUY",
        }
      });
    } else if (postSellAction === "KEEP_USDT") {
      let usdtPrice = 34; // Kur anlık çekilemezse diye kaba bir varsayılan değer
      try {
        const prices = await getLivePrices(["USDT-TRY", "TRY=X"]);
        const liveUsdt = prices.get("USDT-TRY") || prices.get("TRY=X");
        if (liveUsdt && liveUsdt.price > 0) {
          usdtPrice = liveUsdt.price;
        }
      } catch (err) {
        console.error("USDT price fetch error for sell:", err);
      }

      await prisma.investment.create({
        data: {
          userId: investment.userId,
          type: "CRYPTO",
          symbol: "USDT",
          quantity: totalSoldAmount / usdtPrice,
          purchasePrice: usdtPrice,
          amount: totalSoldAmount,
          description: `${investment.symbol || 'Varlık'} satışından USDT`,
          status: "OPEN",
          transactionType: "BUY",
        }
      });
    } else if (postSellAction === "WITHDRAW") {
      await prisma.income.create({
        data: {
          userId: investment.userId,
          type: "Yatırım Satışı",
          amount: totalSoldAmount,
          description: `${investment.symbol || 'Varlık'} satış geliri`,
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    console.error("sellAsset server error:", error);
    throw new Error(error.message || "Satış işlemi başarısız oldu.");
  }
}

/**
 * Bir varlık kaydını tamamen siler.
 */
export async function deleteAsset(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!investment || investment.user.clerkUserId !== userId) {
      throw new Error("Varlık bulunamadı veya yetkiniz yok.");
    }

    await prisma.investment.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    console.error("deleteAsset server error:", error);
    throw new Error(error.message || "Silme işlemi başarısız oldu.");
  }
}

/**
 * Yanlış kategorize edilmiş varlıkları düzeltir.
 */
export async function fixCategories() {
  try {
    const { userId } = await auth();
    if (!userId) return;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return;

    await prisma.investment.updateMany({
      where: { userId: user.id, OR: [{ type: "KRİPTO" }, { type: "Kripto" }] },
      data: { type: "CRYPTO" }
    });

    await prisma.investment.updateMany({
      where: { userId: user.id, OR: [{ type: "Gold" }, { type: "Altın" }] },
      data: { type: "GOLD" }
    });

    // BES ve FAIZ kayıtları hatalı BIST olarak kaydedilmiş olabilir.
    // description alanında JSON meta verisi olanlar (rate içerenler) BES/FAIZ'dır.
    // Bunları güvenli şekilde düzeltmek için description'a bakıyoruz.
    const bstInvs = await prisma.investment.findMany({
      where: { userId: user.id, type: "BIST" },
      select: { id: true, description: true },
    });

    for (const inv of bstInvs) {
      try {
        if (!inv.description) continue;
        const meta = JSON.parse(inv.description);
        if (typeof meta.rate === "number") {
          // Bu kayıt aslında BES veya FAIZ idi; tip bilgisi kaybolmuş.
          // FAIZ olarak işaretle (BES daha spesifik olduğundan bu genel düzeltme FAIZ'a çeker;
          // kullanıcı kendi FAIZ sayfasına bakarak silebilir veya tekrar ekleyebilir)
          // Güvenlik açısından BIST'te bırakıyoruz, sadece uyarı logluyoruz
          console.warn(`Investment ${inv.id} may be a misclassified BES/FAIZ record.`);
        }
      } catch {
        // JSON parse hatası - normal BIST kaydı
      }
    }

    revalidatePath("/dashboard/assets");
  } catch (error) {
    console.error("Fix Categories Error:", error);
  }
}

/**
 * Hatalı BIST olarak kaydedilmiş BES/FAIZ kayıtlarını düzeltir.
 * description alanında JSON rate verisi olan BIST kayıtlarını FAIZ'a taşır.
 */
export async function fixMisclassifiedBesFaiz() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("Kullanıcı bulunamadı.");

    // 1. Tip düzeltmesi (BIST -> FAIZ)
    const bistInvs = await prisma.investment.findMany({
      where: { userId: user.id, type: "BIST" },
    });

    let fixedCount = 0;
    for (const inv of bistInvs) {
      try {
        if (!inv.description) continue;
        const meta = JSON.parse(inv.description);
        if (typeof meta.rate === "number") {
          await prisma.investment.update({
            where: { id: inv.id },
            data: { type: "FAIZ" },
          });
          fixedCount++;
        }
      } catch { /* atla */ }
    }

    // 2. Fiyat/Miktar normalizasyonu (Mevcut BES/FAIZ kayıtları için)
    // Eğer purchasePrice > 1 ise, büyük ihtimalle "oran" olarak girilmiştir.
    // Bu durumda purchasePrice'ı 1 yapıp, amount'u quantity'e eşitlemeliyiz.
    const allBesFaiz = await prisma.investment.findMany({
      where: { userId: user.id, type: { in: ["BES", "FAIZ"] } }
    });

    for (const inv of allBesFaiz) {
      if (inv.purchasePrice && inv.purchasePrice > 1.5) { // 1.5'ten büyükse oran varsayıyoruz
        const rate = inv.purchasePrice;
        let desc = inv.description;
        try {
          const meta = JSON.parse(inv.description || "{}");
          if (!meta.rate) {
            meta.rate = rate;
            desc = JSON.stringify(meta);
          }
        } catch {
          desc = JSON.stringify({ rate, originalDescription: inv.description });
        }

        await prisma.investment.update({
          where: { id: inv.id },
          data: {
            purchasePrice: 1,
            amount: inv.quantity,
            description: desc
          }
        });
        fixedCount++;
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true, fixedCount };
  } catch (error: any) {
    console.error("fixMisclassifiedBesFaiz error:", error);
    throw new Error(error.message || "Düzeltme işlemi başarısız.");
  }
}

/**
 * Yeni bir sabit varlık ekler.
 */
export async function addFixedAsset(data: {
  name: string;
  type: string;
  value: number;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("Kullanıcı kaydı bulunamadı.");

    let fx = data.fxRate ?? 1.0;
    const curr = (data.currency || "TRY").toUpperCase();
    const orig = data.originalAmount ?? Number(data.value);
    let tryVal = Number(data.value);

    if (curr !== "TRY") {
      try {
        const live = await getLivePrices(["USDTRY=X", "EURTRY=X", "GBPTRY=X", "XAUTRY=X"]);
        if (curr === "USD" && live.get("USDTRY=X")) fx = live.get("USDTRY=X")!.price;
        else if (curr === "EUR" && live.get("EURTRY=X")) fx = live.get("EURTRY=X")!.price;
        else if (curr === "GBP" && live.get("GBPTRY=X")) fx = live.get("GBPTRY=X")!.price;
        else if ((curr === "XAU" || curr === "GOLD") && live.get("XAUTRY=X")) fx = live.get("XAUTRY=X")!.price;
        
        tryVal = orig * fx;
      } catch (err) {
        console.error("Fixed asset FX fetch error:", err);
      }
    } else {
      tryVal = orig;
    }

    await prisma.fixedAsset.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        value: tryVal,
        currency: curr,
        originalAmount: orig,
        fxRate: fx,
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Sabit varlık eklenirken bir hata oluştu.");
  }
}

/**
 * Bir sabit varlık kaydını siler.
 */
export async function deleteFixedAsset(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const asset = await prisma.fixedAsset.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!asset || asset.user.clerkUserId !== userId) {
      throw new Error("Varlık bulunamadı veya yetkiniz yok.");
    }

    await prisma.fixedAsset.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Silme işlemi başarısız oldu.");
  }
}
/**
 * Mevcut bir varlığa katkı payı (ekleme) yapar.
 * BES aylık ödemeleri veya mevduat eklemeleri için kullanılır.
 */
export async function addContributionToAsset(id: string, amount: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!investment || investment.user.clerkUserId !== userId) {
      throw new Error("Varlık bulunamadı veya yetkiniz yok.");
    }

    const contribution = Number(amount);
    if (isNaN(contribution) || contribution <= 0) {
      throw new Error("Geçerli bir tutar girmelisiniz.");
    }

    const newQuantity = Number(investment.quantity) + contribution;

    await prisma.investment.update({
      where: { id },
      data: {
        quantity: newQuantity,
        amount: newQuantity * (investment.purchasePrice || 1),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    console.error("addContributionToAsset error:", error);
    throw new Error(error.message || "Katkı payı eklenirken bir hata oluştu.");
  }
}
