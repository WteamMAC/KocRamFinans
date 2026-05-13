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
    if (isNaN(quantity) || quantity <= 0) throw new Error("Geçersiz miktar girdiniz.");

    let finalPrice = Number(data.purchasePrice) || 0;
    const trimmedSymbol = data.symbol?.trim().toUpperCase() || null;

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
    }

    const standardizedType = standardizeInvestmentType(data.type);

    await prisma.investment.create({
      data: {
        userId: user.id,
        type: standardizedType,
        symbol: trimmedSymbol,
        quantity: quantity,
        purchasePrice: finalPrice,
        amount: quantity * finalPrice,
        description: data.description || null,
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
export async function sellAsset(id: string) {
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

    revalidatePath("/dashboard/assets");
  } catch (error) {
    console.error("Fix Categories Error:", error);
  }
}

/**
 * Yeni bir sabit varlık ekler.
 */
export async function addFixedAsset(data: {
  name: string;
  type: string;
  value: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("Kullanıcı kaydı bulunamadı.");

    await prisma.fixedAsset.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        value: Number(data.value),
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
