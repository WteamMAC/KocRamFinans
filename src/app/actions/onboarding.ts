"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: {
  familyCount: number;
  maritalStatus?: string;
  marriageDate?: string;
  hasChildren?: boolean;
  children?: { birthDate: string }[];
  incomes: { type: string; amount: number; description?: string }[];
  expenses: { type: string; amount: number; dueDate?: number; isRecurring: boolean; description?: string }[];
  debts: { type: string; amount: number; remainingInstallments?: number; description?: string }[];
  investments: { 
    type: string; 
    symbol?: string; 
    quantity: number; 
    purchasePrice: number; 
    currentValuation?: number; 
    description?: string 
  }[];
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Oturum açmanız gerekiyor.");
  }

  // 1. Kullanıcıyı oluştur veya güncelle
  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: { 
      familyCount: formData.familyCount,
      maritalStatus: formData.maritalStatus,
      marriageDate: formData.marriageDate ? new Date(formData.marriageDate) : null,
      hasChildren: formData.hasChildren || false,
    },
    create: { 
      clerkUserId: userId,
      familyCount: formData.familyCount,
      maritalStatus: formData.maritalStatus,
      marriageDate: formData.marriageDate ? new Date(formData.marriageDate) : null,
      hasChildren: formData.hasChildren || false,
    },
  });

  // 2. Mevcut verileri temizle ve yeniden oluştur
  await prisma.$transaction([
    prisma.income.deleteMany({ where: { userId: user.id } }),
    prisma.expense.deleteMany({ where: { userId: user.id } }),
    prisma.debt.deleteMany({ where: { userId: user.id } }),
    prisma.investment.deleteMany({ where: { userId: user.id } }),
    prisma.child.deleteMany({ where: { userId: user.id } }),

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
      data: formData.investments.map((inv) => ({ 
        ...inv, 
        userId: user.id,
        amount: inv.quantity * inv.purchasePrice
      })),
    }),
    prisma.child.createMany({
      data: (formData.children || []).map((child) => ({
        userId: user.id,
        birthDate: new Date(child.birthDate),
      })),
    }),
  ]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
