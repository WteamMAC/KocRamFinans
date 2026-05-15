export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IncomeExpenseClient } from "@/components/dashboard/income-expense-client";

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

  const now = new Date();
  
  // Actual totals (happened so far)
  const actualIncome = user.incomes
    .filter(inc => new Date(inc.date || inc.createdAt) <= now)
    .reduce((acc, inc) => acc + inc.amount, 0);
    
  const actualExpense = user.expenses
    .filter(exp => new Date(exp.date || exp.createdAt) <= now)
    .reduce((acc, exp) => acc + exp.amount, 0);

  // Projected totals (all entries this month/total)
  const totalIncome = user.incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpense = user.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  
  const netBalance = actualIncome - actualExpense;
  const projectedBalance = totalIncome - totalExpense;

  // Build monthly data for comparison chart (last 6 months)
  const monthlyData: { month: string; income: number; expense: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString("tr-TR", { month: "short" });
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const monthlyIncome = user.incomes
      .filter((inc) => {
        const dAt = new Date(inc.date || inc.createdAt);
        return (
          dAt.getFullYear() === d.getFullYear() &&
          dAt.getMonth() === d.getMonth()
        );
      })
      .reduce((acc, inc) => acc + inc.amount, 0);

    const monthlyExpense = user.expenses
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

  // Expense categories breakdown
  const expenseCategoryMap: Record<string, number> = {};
  user.expenses.forEach((exp) => {
    expenseCategoryMap[exp.type] =
      (expenseCategoryMap[exp.type] || 0) + exp.amount;
  });

  // Income categories breakdown
  const incomeCategoryMap: Record<string, number> = {};
  user.incomes.forEach((inc) => {
    incomeCategoryMap[inc.type] =
      (incomeCategoryMap[inc.type] || 0) + inc.amount;
  });

  // Recent transactions (merged, sorted by createdAt)
  const recentTransactions = [
    ...user.incomes.slice(0, 10).map((inc) => ({
      id: inc.id,
      type: "income" as const,
      category: inc.type,
      description: inc.description || inc.type,
      amount: inc.amount,
      createdAt: inc.date || inc.createdAt,
    })),
    ...user.expenses.slice(0, 10).map((exp) => ({
      id: exp.id,
      type: "expense" as const,
      category: exp.type,
      description: exp.description || exp.type,
      amount: exp.amount,
      createdAt: exp.date || exp.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const maxMonthly = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1);

  return (
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
  );
}
