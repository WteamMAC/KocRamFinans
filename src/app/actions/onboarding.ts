"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: {
  familyCount: number;
  incomes: { type: string; amount: number; description?: string }[];
  expenses: { type: string; amount: number; dueDate?: number; isRecurring: boolean; description?: string }[];
  debts: { type: string; amount: number; remainingInstallments?: number; description?: string }[];
  investments: { type: string; amount: number; currentValuation?: number; description?: string }[];
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Oturum açmanız gerekiyor.");
  }

  // 1. Kullanıcıyı oluştur veya güncelle
  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: { familyCount: formData.familyCount },
    create: { 
      clerkUserId: userId,
      familyCount: formData.familyCount 
    },
  });

  // 2. Mevcut verileri temizle (opsiyonel, yeniden dolduruyorsa)
  // Not: Transaction kullanarak yapmak daha güvenlidir.
  await prisma.$transaction([
    prisma.income.deleteMany({ where: { userId: user.id } }),
    prisma.expense.deleteMany({ where: { userId: user.id } }),
    prisma.debt.deleteMany({ where: { userId: user.id } }),
    prisma.investment.deleteMany({ where: { userId: user.id } }),

    prisma.income.createMany({
      data: formData.incomes.map((inc) => ({ ...inc, userId: user.id })),
    }),
    prisma.expense.createMany({
      data: formData.expenses.map((exp) => ({ ...exp, userId: user.id })),
    }),
    prisma.debt.createMany({
      data: formData.debts.map((debt) => ({ ...debt, userId: user.id })),
    }),
    prisma.investment.createMany({
      data: formData.investments.map((inv) => ({ ...inv, userId: user.id })),
    }),
  ]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
