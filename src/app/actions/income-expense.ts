"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addIncome(data: { type: string; amount: number; isRecurring?: boolean; dueDate?: number; date?: Date; description?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  await prisma.income.create({
    data: {
      userId: user.id,
      type: data.type,
      amount: data.amount,
      date: data.date ?? new Date(),
      isRecurring: data.isRecurring ?? false,
      dueDate: data.dueDate,
      description: data.description,
    },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function addExpense(data: { type: string; amount: number; isRecurring: boolean; dueDate?: number; date?: Date; description?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  await prisma.expense.create({
    data: {
      userId: user.id,
      type: data.type,
      amount: data.amount,
      date: data.date ?? new Date(),
      isRecurring: data.isRecurring,
      dueDate: data.dueDate,
      description: data.description,
    },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}
