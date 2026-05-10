export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Banknote, Calendar, PieChart, Wallet } from "lucide-react";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { ChatAI } from "@/components/dashboard/chat-ai";

export default async function DashboardPage() {
  await cookies();
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      incomes: true,
      expenses: true,
      debts: true,
      investments: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const totalIncome = user.incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpense = user.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalDebt = user.debts.reduce((acc, debt) => acc + debt.amount, 0);
  const totalInvestment = user.investments.reduce((acc, inv) => acc + (inv.currentValuation || inv.amount), 0);
  const netWorth = totalInvestment + (totalIncome - totalExpense) - totalDebt;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Finansal Özet
        </h2>
      </div>
      
      {/* Üst Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Net Varlık</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{netWorth.toLocaleString('tr-TR')} ₺</div>
            <p className="text-xs text-muted-foreground mt-1">Yatırım + Nakit - Borçlar</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Aylık Gelir</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalIncome.toLocaleString('tr-TR')} ₺</div>
            <p className="text-xs text-green-600 mt-1">Bu ay beklenen toplam</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Aylık Gider</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalExpense.toLocaleString('tr-TR')} ₺</div>
            <p className="text-xs text-red-600 mt-1">Sabit ve planlı harcamalar</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Toplam Borç</CardTitle>
            <Banknote className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalDebt.toLocaleString('tr-TR')} ₺</div>
            <p className="text-xs text-orange-600 mt-1">Kredi ve kart borçları</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Bütçe Analizi
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <BudgetOverview incomes={user.incomes} expenses={user.expenses} />
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Yaklaşan Ödemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingPayments expenses={user.expenses} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Yatırım Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestmentSummary investments={user.investments} />
          </CardContent>
        </Card>
      </div>
      {/* Floating AI Chat */}
      <ChatAI />
    </div>
  );
}
