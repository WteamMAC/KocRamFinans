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
import { cn } from "@/lib/utils";
import { getLivePrices, calculatePortfolioMetrics } from "@/lib/price-service";

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

  // Benzersiz sembolleri topla
  const symbols = Array.from(new Set(
    (user.investments as any[])
      .map(inv => inv.symbol)
      .filter((s): s is string => !!s)
  ));

  // Canlı fiyatları çek
  const livePrices = await getLivePrices(symbols);
  
  // Portföy metriklerini hesapla
  const portfolioMetrics = calculatePortfolioMetrics(user.investments, livePrices);

  const totalIncome = user.incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpense = user.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalDebt = user.debts.reduce((acc, debt) => acc + debt.amount, 0);
  const totalInvestment = portfolioMetrics.totalCurrentValue;
  const totalProfit = portfolioMetrics.totalProfit;
  const profitPercent = portfolioMetrics.profitPercent;
  
  const netWorth = totalInvestment + (totalIncome - totalExpense) - totalDebt;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const debtToIncome = totalIncome > 0 ? (totalDebt / (totalIncome * 12)) * 100 : 0; // Yıllık gelire oran

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-[#f8fafc] min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Finansal Panoramik
          </h2>
          <p className="text-slate-500 text-sm mt-1">Hoş geldiniz! Finansal sağlığınızın anlık özeti burada.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tasarruf Oranı</span>
            <span className={cn(
              "text-lg font-bold",
              savingsRate > 20 ? "text-emerald-500" : "text-amber-500"
            )}>
              %{savingsRate.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Üst Özet Kartları - Premium Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Varlık</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{netWorth.toLocaleString('tr-TR')} ₺</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">Yatırım Odaklı</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aylık Nakit Akışı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{(totalIncome - totalExpense).toLocaleString('tr-TR')} ₺</div>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-emerald-600">
              Gelir: {totalIncome.toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Banknote className="h-12 w-12 text-rose-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Borç</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalDebt.toLocaleString('tr-TR')} ₺</div>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-rose-600">
              Yıllık Gelire Oran: %{debtToIncome.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <PieChart className="h-12 w-12 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portföy Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {totalProfit.toLocaleString('tr-TR')} ₺
            </div>
            <div className={cn(
              "flex items-center gap-1 mt-2 text-[10px] font-medium",
              totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              %{profitPercent.toFixed(2)} Getiri
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Bütçe Dengesi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <BudgetOverview incomes={user.incomes} expenses={user.expenses} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Ödeme Takvimi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UpcomingPayments expenses={user.expenses} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Varlık Dağılımı ve Portföy</CardTitle>
              <div className="text-xs font-medium text-slate-400">Canlı Veri (Simüle)</div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <InvestmentSummary investments={user.investments} />
          </CardContent>
        </Card>
      </div>

      <ChatAI />
    </div>
  );
}
