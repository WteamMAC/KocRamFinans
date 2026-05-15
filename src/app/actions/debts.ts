"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addDebt(data: { 
  type: string; 
  amount: number; // Ana para
  interestRate?: number; // Aylık Faiz Oranı (%)
  remainingInstallments?: number; 
  paymentDay?: number; 
  description?: string 
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (data.amount <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  let finalTotalAmount = data.amount;
  let monthlyInstallment = null;

  // Faizli taksit hesaplama (PMT Formülü: [P * i * (1+i)^n] / [(1+i)^n - 1])
  if (data.interestRate && data.remainingInstallments && data.remainingInstallments > 0) {
    const i = data.interestRate / 100;
    const n = data.remainingInstallments;
    const p = data.amount;
    
    if (i > 0) {
        monthlyInstallment = (p * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
        finalTotalAmount = monthlyInstallment * n;
    } else {
        monthlyInstallment = p / n;
    }
  }

  // Create the debt
  await prisma.debt.create({
    data: {
      userId: user.id,
      type: data.type,
      amount: finalTotalAmount,
      principalAmount: data.amount,
      interestRate: data.interestRate,
      installmentAmount: monthlyInstallment,
      remainingInstallments: data.remainingInstallments,
      paymentDay: data.paymentDay,
      description: data.description,
    },
  });

  // RECORD AS INCOME: Borrowing money is a cash inflow
  await prisma.income.create({
    data: {
      userId: user.id,
      type: "Alınan Borç / Kredi",
      amount: data.amount, // Sadece gelen ana parayı gelir sayıyoruz
      description: `Yeni borç kaydı: ${data.description || data.type}`,
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function payDebtInstallment(debtId: string, amount: number, isAuto: boolean = false) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (amount <= 0) throw new Error("Ödeme tutarı 0'dan büyük olmalıdır.");

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
      description: `${debt.description || debt.type} için ${isAuto ? "otomatik " : ""}ödeme yapıldı.`,
      date: new Date(),
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function processAutoPayments(userId: string) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  const debts = await prisma.debt.findMany({
    where: {
      userId,
      paymentDay: { lte: dayOfMonth },
      remainingInstallments: { gt: 0 },
      installmentAmount: { gt: 0 }
    }
  });

  for (const debt of debts) {
    // Check if already paid this month
    const startOfMonth = new Date(year, month, 1);
    const alreadyPaid = await prisma.expense.findFirst({
      where: {
        userId,
        type: "Borç Taksit Ödemesi",
        description: { contains: `${debt.description || debt.type} için otomatik ödeme` },
        date: { gte: startOfMonth }
      }
    });

    if (!alreadyPaid && debt.installmentAmount) {
      await payDebtInstallment(debt.id, debt.installmentAmount, true);
    }
  }
}

export async function closeDebt(debtId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!debt) throw new Error("Debt not found");

  const closingAmount = debt.amount;
  if (closingAmount <= 0) return;

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
