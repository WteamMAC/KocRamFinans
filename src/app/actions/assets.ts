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

  await prisma.investment.create({
    data: {
      userId: user.id,
      type: data.type,
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
