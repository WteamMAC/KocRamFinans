export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IncomeExpenseClient } from "@/components/dashboard/income-expense-client";
import { getUserCurrencyConfig } from "@/lib/currency-formatter";
import { getLivePrices, normalizeFinancialItemsToTry } from "@/lib/price-service";
import { getExchangeRatesAction } from "@/app/actions/market";
import { RateSynchronizer } from "@/components/rate-synchronizer";

export default async function IncomeExpenseHistoryPage() {
  await cookies();
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      incomes: { orderBy: { createdAt: "desc" } },
      expenses: { orderBy: { createdAt: "desc" } },
      debts: { where: { amount: { gt: 0 } } },
    },
  });

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  const livePrices = await getLivePrices([]);
  const normalizedIncomes = normalizeFinancialItemsToTry(user.incomes, livePrices);
  const normalizedExpenses = normalizeFinancialItemsToTry(user.expenses, livePrices);

  const now = new Date();
  
  const actualIncome = normalizedIncomes
    .filter(inc => new Date(inc.date || inc.createdAt) <= now)
    .reduce((acc, inc) => acc + inc.amount, 0);
    
  const actualExpense = normalizedExpenses
    .filter(exp => new Date(exp.date || exp.createdAt) <= now)
    .reduce((acc, exp) => acc + exp.amount, 0);

  const totalIncome = normalizedIncomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpense = normalizedExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  
  const netBalance = actualIncome - actualExpense;
  const projectedBalance = totalIncome - totalExpense;

  const monthlyData: { month: string; income: number; expense: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString("tr-TR", { month: "short" });

    const monthlyIncome = normalizedIncomes
      .filter((inc) => {
        const dAt = new Date(inc.date || inc.createdAt);
        return (
          dAt.getFullYear() === d.getFullYear() &&
          dAt.getMonth() === d.getMonth()
        );
      })
      .reduce((acc, inc) => acc + inc.amount, 0);

    const monthlyExpense = normalizedExpenses
      .filter((exp) => {
        const dAt = new Date(exp.date || exp.createdAt);
        return (
          dAt.getFullYear() === d.getFullYear() &&
          dAt.getMonth() === d.getMonth()
        );
      })
      .reduce((acc, exp) => acc + exp.amount, 0);

    monthlyData.push({
      month: monthName,
      income: monthlyIncome,
      expense: monthlyExpense,
    });
  }

  const expenseCategoryMap: Record<string, number> = {};
  normalizedExpenses.forEach((exp) => {
    expenseCategoryMap[exp.type] =
      (expenseCategoryMap[exp.type] || 0) + exp.amount;
  });

  const incomeCategoryMap: Record<string, number> = {};
  normalizedIncomes.forEach((inc) => {
    incomeCategoryMap[inc.type] =
      (incomeCategoryMap[inc.type] || 0) + inc.amount;
  });

  const recentTransactions = [
    ...normalizedIncomes.map((inc) => ({
      id: inc.id,
      type: "income" as const,
      category: inc.type,
      description: inc.description || inc.type,
      amount: inc.rawAmount, // Tabloda orijinal miktar görünsün
      createdAt: inc.date || inc.createdAt,
      currency: inc.currency,
      originalAmount: inc.originalAmount || undefined,
      fxRate: inc.fxRate || undefined,
      tryAmount: inc.amount,
      isRecurring: inc.isRecurring,
      dueDate: inc.dueDate || undefined,
    })),
    ...normalizedExpenses.map((exp) => ({
      id: exp.id,
      type: "expense" as const,
      category: exp.type,
      description: exp.description || exp.type,
      amount: exp.rawAmount, // Tabloda orijinal miktar görünsün
      createdAt: exp.date || exp.createdAt,
      currency: exp.currency,
      originalAmount: exp.originalAmount || undefined,
      fxRate: exp.fxRate || undefined,
      tryAmount: exp.amount,
      isRecurring: exp.isRecurring,
      dueDate: exp.dueDate || undefined,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const maxMonthly = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1);

  const currencyConfig = await getUserCurrencyConfig(user.currency);
  const pageRates = await getExchangeRatesAction();

  return (
    <>
      <RateSynchronizer rates={pageRates} />
      <IncomeExpenseClient
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      netBalance={netBalance}
      projectedBalance={projectedBalance}
      monthlyData={monthlyData}
      maxMonthly={maxMonthly}
      expenseCategoryMap={expenseCategoryMap}
      incomeCategoryMap={incomeCategoryMap}
      recentTransactions={recentTransactions.map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt).toISOString(),
      }))}
      debts={user.debts}
    />
    </>
  );
}
