"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addIncome(data: { 
  type: string; 
  amount: number; 
  isRecurring?: boolean; 
  dueDate?: number; 
  date?: Date; 
  description?: string;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  if (data.amount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

  await prisma.income.create({
    data: {
      userId: user.id,
      type: data.type,
      amount: data.amount,
      date: data.date ?? new Date(),
      isRecurring: data.isRecurring ?? false,
      dueDate: data.dueDate,
      description: data.description,
      currency: data.currency ?? "TRY",
      originalAmount: data.originalAmount,
      fxRate: data.fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function addExpense(data: { 
  type: string; 
  amount: number; 
  isRecurring: boolean; 
  dueDate?: number; 
  date?: Date; 
  description?: string;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  if (data.amount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

  await prisma.expense.create({
    data: {
      userId: user.id,
      type: data.type,
      amount: data.amount,
      date: data.date ?? new Date(),
      isRecurring: data.isRecurring,
      dueDate: data.dueDate,
      description: data.description,
      currency: data.currency ?? "TRY",
      originalAmount: data.originalAmount,
      fxRate: data.fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function editIncome(
  id: string,
  data: {
    type: string;
    amount: number;
    isRecurring?: boolean;
    dueDate?: number;
    date?: Date;
    description?: string;
    currency?: string;
    originalAmount?: number;
    fxRate?: number;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  if (data.amount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

  const existing = await prisma.income.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("İşlem bulunamadı veya yetkiniz yok.");
  }

  await prisma.income.update({
    where: { id },
    data: {
      type: data.type,
      amount: data.amount,
      date: data.date ?? new Date(),
      isRecurring: data.isRecurring ?? false,
      dueDate: data.dueDate,
      description: data.description,
      currency: data.currency ?? "TRY",
      originalAmount: data.originalAmount,
      fxRate: data.fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function deleteIncome(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const existing = await prisma.income.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("İşlem bulunamadı veya yetkiniz yok.");
  }

  await prisma.income.delete({
    where: { id },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function editExpense(
  id: string,
  data: {
    type: string;
    amount: number;
    isRecurring?: boolean;
    dueDate?: number;
    date?: Date;
    description?: string;
    currency?: string;
    originalAmount?: number;
    fxRate?: number;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  if (data.amount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

  const existing = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("İşlem bulunamadı veya yetkiniz yok.");
  }

  await prisma.expense.update({
    where: { id },
    data: {
      type: data.type,
      amount: data.amount,
      date: data.date ?? new Date(),
      isRecurring: data.isRecurring ?? false,
      dueDate: data.dueDate,
      description: data.description,
      currency: data.currency ?? "TRY",
      originalAmount: data.originalAmount,
      fxRate: data.fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const existing = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("İşlem bulunamadı veya yetkiniz yok.");
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}
