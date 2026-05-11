"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getLivePrices } from "@/lib/price-service";

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
      where: { clerkUserId: userId as string },
    });

    if (!user) throw new Error("Kullanıcı kaydı bulunamadı.");

    let finalPrice = Number(data.purchasePrice) || 0;

    // Eğer güncel fiyat seçildiyse Yahoo'dan çek
    if (data.useCurrentPrice && data.symbol) {
      try {
        const prices = await getLivePrices([data.symbol]);
        const livePrice = prices.get(data.symbol.toUpperCase());
        if (livePrice && livePrice.price) {
          finalPrice = livePrice.price;
        }
      } catch (err) {
        console.error("Live price fetch error:", err);
      }
    }

    // Tip standardizasyonu
    let standardizedType = data.type;
    if (data.type === "KRİPTO" || data.type === "Kripto") standardizedType = "CRYPTO";
    if (data.type === "Gold" || data.type === "Altın") standardizedType = "GOLD";

    const quantity = Number(data.quantity);
    if (isNaN(quantity) || quantity <= 0) throw new Error("Geçersiz miktar.");
    if (isNaN(finalPrice)) finalPrice = 0;

    await prisma.investment.create({
      data: {
        userId: user.id,
        type: standardizedType,
        symbol: data.symbol ? data.symbol.toUpperCase() : null,
        quantity: quantity,
        purchasePrice: finalPrice,
        amount: quantity * finalPrice,
        description: data.description || null,
        status: "OPEN",
        transactionType: "BUY",
      } as any,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    console.error("addAsset server error:", error);
    throw new Error(error.message || "Varlık eklenirken bir hata oluştu.");
  }
}

export async function sellAsset(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { user: true },
    }) as any;

    if (!investment || investment.user.clerkUserId !== userId) {
      throw new Error("Varlık bulunamadı veya yetkiniz yok.");
    }

    // Güncel fiyatı çek
    let sellPrice = investment.purchasePrice || 0;
    if (investment.symbol) {
      try {
        const prices = await getLivePrices([investment.symbol]);
        const livePrice = prices.get(investment.symbol.toUpperCase());
        if (livePrice && livePrice.price) {
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
      } as any,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (error: any) {
    console.error("sellAsset server error:", error);
    throw new Error(error.message || "Satış işlemi başarısız oldu.");
  }
}

export async function deleteAsset(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Oturum açmanız gerekiyor.");

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { user: true },
    }) as any;

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

export async function fixCategories() {
  try {
    const { userId } = await auth();
    if (!userId) return;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId as string },
    });

    if (!user) return;

    await prisma.investment.updateMany({
      where: { userId: user.id, OR: [{ type: "KRİPTO" }, { type: "Kripto" }] },
      data: { type: "CRYPTO" } as any
    });

    await prisma.investment.updateMany({
      where: { userId: user.id, OR: [{ type: "Gold" }, { type: "Altın" }] },
      data: { type: "GOLD" } as any
    });
  } catch (error) {
    console.error("Fix Categories Error:", error);
  }
}
