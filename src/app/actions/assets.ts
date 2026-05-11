"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addAsset(data: {
  type: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  description?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Tip standardizasyonu (Gelen veriyi her ihtimale karşı temizleyelim)
  let standardizedType = data.type;
  if (data.type === "KRİPTO" || data.type === "Kripto") standardizedType = "CRYPTO";
  if (data.type === "Gold" || data.type === "Altın") standardizedType = "GOLD";

  await prisma.investment.create({
    data: {
      userId: user.id,
      type: standardizedType,
      symbol: data.symbol?.toUpperCase(),
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      amount: data.quantity * data.purchasePrice,
      description: data.description,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
}

/**
 * Mevcut veritabanındaki tutarsız kategorileri düzeltir.
 */
export async function fixCategories() {
  try {
    const { userId } = await auth();
    if (!userId) return;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return;

    // Hatalı KRİPTO kayıtlarını düzelt
    await prisma.investment.updateMany({
      where: { userId: user.id, OR: [{ type: "KRİPTO" }, { type: "Kripto" }] },
      data: { type: "CRYPTO" }
    });

    // Hatalı Gold/Altın kayıtlarını düzelt
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
  });

  if (!investment || investment.user.clerkUserId !== userId) {
    throw new Error("Unauthorized or not found");
  }

  await prisma.investment.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
}
