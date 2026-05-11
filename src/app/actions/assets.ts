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
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
  });

  if (!user) throw new Error("User not found");

  let finalPrice = data.purchasePrice || 0;

  // Eğer güncel fiyat seçildiyse Yahoo'dan çek
  if (data.useCurrentPrice && data.symbol) {
    const prices = await getLivePrices([data.symbol]);
    const livePrice = prices.get(data.symbol.toUpperCase());
    if (livePrice && livePrice.price) {
      finalPrice = livePrice.price;
    }
  }

  // Tip standardizasyonu
  let standardizedType = data.type;
  if (data.type === "KRİPTO" || data.type === "Kripto") standardizedType = "CRYPTO";
  if (data.type === "Gold" || data.type === "Altın") standardizedType = "GOLD";

  await prisma.investment.create({
    data: {
      userId: user.id,
      type: standardizedType,
      symbol: data.symbol ? data.symbol.toUpperCase() : null,
      quantity: data.quantity,
      purchasePrice: finalPrice,
      amount: data.quantity * finalPrice,
      description: data.description || null,
      status: "OPEN",
      transactionType: "BUY",
    } as any,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
}

export async function sellAsset(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const investment = await prisma.investment.findUnique({
    where: { id },
    include: { user: true }
  }) as any;

  if (!investment || investment.user.clerkUserId !== userId) {
    throw new Error("Unauthorized or not found");
  }

  // Güncel fiyatı çek
  let sellPrice = investment.purchasePrice;
  if (investment.symbol) {
    const prices = await getLivePrices([investment.symbol]);
    const livePrice = prices.get(investment.symbol.toUpperCase());
    if (livePrice && livePrice.price) {
      sellPrice = livePrice.price;
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
      data: { type: "CRYPTO" }
    });

    await prisma.investment.updateMany({
      where: { userId: user.id, OR: [{ type: "Gold" }, { type: "Altın" }] },
      data: { type: "GOLD" }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");
  } catch (error) {
    console.error("Fix Categories Error:", error);
  }
}

export async function deleteAsset(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const investment = await prisma.investment.findUnique({
    where: { id },
    include: { user: true }
  }) as any;

  if (!investment || investment.user.clerkUserId !== userId) {
    throw new Error("Unauthorized or not found");
  }

  await prisma.investment.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
}
