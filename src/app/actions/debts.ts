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
  dueDate?: string; // Yeni: Son ödeme tarihi
  description?: string;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
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

  let finalDescription = data.description || data.type;
  if (data.dueDate) {
    finalDescription += ` (Son Ödeme: ${new Date(data.dueDate).toLocaleDateString("tr-TR")})`;
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
      description: finalDescription,
      currency: data.currency ?? "TRY",
      originalAmount: data.originalAmount,
      fxRate: data.fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function payDebtInstallment(debtId: string, amount: number, isAuto: boolean = false, currency?: string, originalAmount?: number, fxRate?: number) {
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
      currency: currency ?? "TRY",
      originalAmount: originalAmount ?? amount,
      fxRate: fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function postponeDebtInstallment(debtId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) throw new Error("Debt not found");

  await prisma.expense.create({
    data: {
      userId: debt.userId,
      type: "Borç Taksit Ödemesi",
      amount: 0, // Nakit çıkışı yok
      isRecurring: false,
      description: `${debt.description || debt.type} için otomatik ödeme bu ay için ertelendi / atlandı.`,
      date: new Date(),
      currency: debt.currency ?? "TRY",
      originalAmount: 0,
      fxRate: debt.fxRate ?? 1,
    },
  });

  revalidatePath("/dashboard/debts");
}

export async function updateDebtPaymentDay(debtId: string, newDay: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.debt.update({
    where: { id: debtId },
    data: { paymentDay: newDay },
  });

  revalidatePath("/dashboard/debts");
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
      await payDebtInstallment(
        debt.id, 
        debt.installmentAmount, 
        true, 
        debt.currency ?? undefined, 
        debt.installmentAmount / (debt.fxRate || 1), 
        debt.fxRate ?? undefined
      );
    }
  }
}

export async function closeDebt(debtId: string, isTransfer: boolean = false) {
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

  // RECORD AS EXPENSE: Only if it's NOT a transfer
  if (!isTransfer) {
    await prisma.expense.create({
      data: {
        userId: debt.userId,
        type: "Borç Kapatma",
        amount: closingAmount,
        isRecurring: false,
        description: `${debt.description || debt.type} borcu tamamen kapatıldı.`,
        currency: debt.currency,
        originalAmount: closingAmount / (debt.fxRate || 1),
        fxRate: debt.fxRate,
      },
    });
  }

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");
}

export async function refinanceDebtWithDetails(data: {
  oldDebtId: string;
  payAmount: number; // Eski borca ödenecek tutar (yeni borç para birimi cinsinden)
  newDebt: {
    type: string;
    amount: number; // Yeni borç orijinal tutarı
    interestRate?: number;
    remainingInstallments?: number;
    paymentDay?: number;
    dueDate?: string;
    description?: string;
    currency: string;
    fxRate: number;
  };
  addRemainingAsExpense: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const oldDebt = await prisma.debt.findUnique({ where: { id: data.oldDebtId } });
  if (!oldDebt) throw new Error("Eski borç bulunamadı.");

  // Calculate new debt final total amount and installments
  let finalNewTotalAmount = data.newDebt.amount * data.newDebt.fxRate;
  let monthlyInstallment = null;

  if (data.newDebt.interestRate && data.newDebt.remainingInstallments && data.newDebt.remainingInstallments > 0) {
    const i = data.newDebt.interestRate / 100;
    const n = data.newDebt.remainingInstallments;
    const p = data.newDebt.amount * data.newDebt.fxRate;
    
    if (i > 0) {
      monthlyInstallment = (p * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      finalNewTotalAmount = monthlyInstallment * n;
    } else {
      monthlyInstallment = p / n;
    }
  }

  let finalDescription = data.newDebt.description || data.newDebt.type;
  if (data.newDebt.dueDate) {
    finalDescription += ` (Son Ödeme: ${new Date(data.newDebt.dueDate).toLocaleDateString("tr-TR")})`;
  }
  finalDescription += " (Yapılandırıldı)";

  // Create the new debt
  await prisma.debt.create({
    data: {
      userId: user.id,
      type: data.newDebt.type,
      amount: finalNewTotalAmount,
      principalAmount: data.newDebt.amount * data.newDebt.fxRate,
      interestRate: data.newDebt.interestRate,
      installmentAmount: monthlyInstallment,
      remainingInstallments: data.newDebt.remainingInstallments,
      paymentDay: data.newDebt.paymentDay,
      description: finalDescription,
      currency: data.newDebt.currency,
      originalAmount: data.newDebt.amount,
      fxRate: data.newDebt.fxRate,
    },
  });

  // Calculate old debt deduction
  // Old debt is in its own currency, and payAmount is in the new debt's currency.
  // We convert payAmount to TRY first, then subtract from old debt's amount (which is in TRY).
  const payAmountInTry = data.payAmount * data.newDebt.fxRate;
  const newOldAmount = Math.max(0, oldDebt.amount - payAmountInTry);

  if (newOldAmount <= 0) {
    await prisma.debt.update({
      where: { id: data.oldDebtId },
      data: {
        amount: 0,
        remainingInstallments: 0,
      },
    });
  } else {
    // Pro-rate or just subtract from old debt amount
    await prisma.debt.update({
      where: { id: data.oldDebtId },
      data: {
        amount: newOldAmount,
      },
    });
  }

  // Create expense for the remaining money from new debt if checked
  const remainingOriginalAmount = data.newDebt.amount - data.payAmount;
  if (data.addRemainingAsExpense && remainingOriginalAmount > 0) {
    await prisma.expense.create({
      data: {
        userId: user.id,
        type: "Diğer",
        amount: remainingOriginalAmount * data.newDebt.fxRate,
        isRecurring: false,
        description: `Yapılandırılan borçtan kalan harcama (${data.newDebt.description || data.newDebt.type}).`,
        date: new Date(),
        currency: data.newDebt.currency,
        originalAmount: remainingOriginalAmount,
        fxRate: data.newDebt.fxRate,
      },
    });
  }

  revalidatePath("/dashboard/debts");
  revalidatePath("/dashboard/income-expense");
  revalidatePath("/dashboard");

  return { success: true };
}

