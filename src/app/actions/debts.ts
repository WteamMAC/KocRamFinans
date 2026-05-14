"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addDebt(data: { type: string; amount: number; remainingInstallments?: number; description?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Create the debt
  await prisma.debt.create({
    data: {
      userId: user.id,
      type: data.type,
      amount: data.amount,
      remainingInstallments: data.remainingInstallments,
      description: data.description,
    },
  });

  // RECORD AS INCOME: Borrowing money is a cash inflow
  await prisma.income.create({
    data: {
      userId: user.id,
      type: "Alınan Borç / Kredi",
      amount: data.amount,
      description: `Yeni borç kaydı: ${data.description || data.type}`,
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function payDebtInstallment(debtId: string, amount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!debt) throw new Error("Debt not found");

  // Update debt amount and installments
  const newAmount = Math.max(0, debt.amount - amount);
  const newInstallments = debt.remainingInstallments ? Math.max(0, debt.remainingInstallments - 1) : null;

  await prisma.debt.update({
    where: { id: debtId },
    data: {
      amount: newAmount,
      remainingInstallments: newAmount === 0 ? 0 : newInstallments,
    },
  });

  // RECORD AS EXPENSE: Paying debt is a cash outflow
  await prisma.expense.create({
    data: {
      userId: debt.userId,
      type: "Borç Taksit Ödemesi",
      amount: amount,
      isRecurring: false,
      description: `${debt.description || debt.type} için ödeme yapıldı.`,
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function closeDebt(debtId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!debt) throw new Error("Debt not found");

  const closingAmount = debt.amount;

  await prisma.debt.update({
    where: { id: debtId },
    data: {
      amount: 0,
      remainingInstallments: 0,
    },
  });

  // RECORD AS EXPENSE
  await prisma.expense.create({
    data: {
      userId: debt.userId,
      type: "Borç Kapatma",
      amount: closingAmount,
      isRecurring: false,
      description: `${debt.description || debt.type} borcu tamamen kapatıldı.`,
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}
