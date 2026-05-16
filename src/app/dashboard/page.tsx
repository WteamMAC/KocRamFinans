export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Calendar, PieChart, TrendingUp, TrendingDown, LayoutDashboard } from "lucide-react";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { FixedAssetsSummary } from "@/components/dashboard/fixed-assets-summary";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { SmartInsights } from "@/components/dashboard/smart-insights";
import { FinancialCalendar } from "@/components/dashboard/financial-calendar";
import { InvestmentProjection } from "@/components/dashboard/investment-projection";
import { cn } from "@/lib/utils";
import { getLivePrices, calculatePortfolioMetrics, calculateFixedAssetsMetrics } from "@/lib/price-service";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";

export default async function DashboardPage() {
  await cookies();
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      incomes: true,
      expenses: true,
      debts: true,
      investments: true,
      fixedAssets: true,
      children: true,
      specialEvents: true,
    } as any,
  }) as any;

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  // Bütün ilişkili dizileri güvenli (null/undefined korumalı) ve açık tipli hale getirelim
  const incomes: any[] = Array.isArray(user.incomes) ? user.incomes : [];
  const expenses: any[] = Array.isArray(user.expenses) ? user.expenses : [];
  const debts: any[] = Array.isArray(user.debts) ? user.debts : [];
  const investments: any[] = Array.isArray(user.investments) ? user.investments : [];
  const fixedAssets: any[] = Array.isArray(user.fixedAssets) ? user.fixedAssets : [];
  const children: any[] = Array.isArray(user.children) ? user.children : [];
  const specialEvents: any[] = Array.isArray(user.specialEvents) ? user.specialEvents : [];

  let portfolioMetrics = { totalCost: 0, totalCurrentValue: 0, totalProfit: 0, profitPercent: 0, assets: [] as any[] };
  let fixedMetrics = { totalOriginalCost: 0, totalCurrentValue: 0, totalProfit: 0, totalProfitPercent: 0, assets: [] as any[] };
  let livePrices = new Map();

  try {
    const symbols: string[] = Array.from(new Set(
      investments
        .map((inv: any) => inv.symbol)
        .filter((s: any): s is string => typeof s === "string" && s.trim().length > 0)
    ));

    livePrices = await getLivePrices(symbols);
    portfolioMetrics = calculatePortfolioMetrics(investments, livePrices, incomes);
    fixedMetrics = calculateFixedAssetsMetrics(fixedAssets, livePrices);
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error);
    portfolioMetrics = calculatePortfolioMetrics(investments, new Map(), incomes);
    fixedMetrics = calculateFixedAssetsMetrics(fixedAssets, new Map());
  }

  const totalIncome = incomes.reduce((acc: number, inc: any) => acc + (inc.amount || 0), 0);
  const totalExpense = expenses.reduce((acc: number, exp: any) => acc + (exp.amount || 0), 0);
  const totalDebt = debts.reduce((acc: number, debt: any) => acc + (debt.amount || 0), 0);
  const totalInvestment = portfolioMetrics.totalCurrentValue || 0;
  const totalFixedAssets = fixedMetrics.totalCurrentValue || 0;
  const totalProfit = (portfolioMetrics.totalProfit || 0) + (fixedMetrics.totalProfit || 0);
  const profitPercent = (portfolioMetrics.totalCost + fixedMetrics.totalOriginalCost) > 0 
    ? (totalProfit / (portfolioMetrics.totalCost + fixedMetrics.totalOriginalCost)) * 100 
    : 0;
  const totalRealizedProfit = (portfolioMetrics as any).totalRealizedProfit || 0;
  const totalUnrealizedProfit = ((portfolioMetrics as any).totalUnrealizedProfit || 0) + (fixedMetrics.totalProfit || 0);
  const totalDividends = (portfolioMetrics as any).totalDividends || 0;
  
  const netWorth = totalInvestment + (totalIncome - totalExpense) + totalFixedAssets - totalDebt;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const financialDataForAI = {
    totalIncome,
    totalExpense,
    totalDebt,
    totalInvestment,
    netWorth,
    savingsRate,
    recentExpenses: expenses.slice(0, 5).map((e: any) => ({ type: e.type, amount: e.amount })),
    recentIncomes: incomes.slice(0, 5).map((i: any) => ({ type: i.type, amount: i.amount }))
  };

  return (
    <div className="flex-1 space-y-6 md:space-y-10 p-2 md:p-8 pt-6 md:pt-10 bg-background min-h-screen overflow-x-hidden w-full">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-heading font-bold text-primary tracking-tight">
            Finansal Özet
          </h2>
          <p className="text-muted-foreground mt-1 font-medium italic opacity-80">Geleceğinizi verilerle inşa ediyoruz.</p>
        </div>
        
        <div className="bg-card p-4 rounded-2xl shadow-ambient-medium border border-border/20 flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tasarruf Oranı</span>
              <span className={cn(
                "text-2xl font-bold font-heading",
                savingsRate > 20 ? "text-emerald-500" : "text-primary"
              )}>
                %{savingsRate.toFixed(1)}
              </span>
           </div>
           <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shadow-inner">
              <TrendingUp className="h-6 w-6 text-primary" />
           </div>
        </div>
      </div>
      
      {/* Smart Insights */}
      <SmartInsights financialData={financialDataForAI} />

      {/* Stats Grid */}
      <DashboardCards
        netWorth={netWorth}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        totalDebt={totalDebt}
        totalProfit={totalProfit}
        profitPercent={profitPercent}
        totalRealizedProfit={totalRealizedProfit}
        totalUnrealizedProfit={totalUnrealizedProfit}
        totalDividends={totalDividends}
        savingsRate={savingsRate}
        userCurrency={user.currency}
      />

      {/* Performance & Budget Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-8 w-full">
        <Card className="col-span-1 md:col-span-1 lg:col-span-4 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col w-full">
          <PerformanceChart 
            incomes={incomes} 
            expenses={expenses} 
            investments={investments}
          />
        </Card>

        <Card className="tour-step-6 col-span-1 md:col-span-1 lg:col-span-3 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden w-full flex flex-col">
          <CardHeader className="bg-muted/30 border-b border-border/10 h-20 !flex flex-row items-center px-6 py-0">
            <CardTitle className="text-lg md:text-xl font-heading font-bold text-primary flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent fill-accent" /> Bütçe Dengesi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-8">
            <BudgetOverview incomes={incomes} expenses={expenses} />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments & Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-8 w-full">
        <Card className="tour-step-7 col-span-1 md:col-span-1 lg:col-span-4 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full w-full">
          <CardHeader className="bg-muted/30 border-b border-border/10 h-20 !flex flex-row items-center px-6 py-0">
            <CardTitle className="text-lg md:text-xl font-heading font-bold text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Ödeme Takvimi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-8 flex-1">
            <UpcomingPayments expenses={expenses} />
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full w-full">
          <FinancialCalendar incomes={incomes} expenses={expenses} debts={debts} userChildren={children} marriageDate={user.marriageDate} specialEvents={specialEvents} />
        </div>
      </div>

      {/* Assets & Projection Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-8 w-full">
        <Card className="col-span-1 md:col-span-1 lg:col-span-4 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full w-full">
          <CardHeader className="bg-primary h-20 !flex flex-row items-center justify-between px-6 py-0">
            <CardTitle className="text-lg md:text-xl font-heading font-bold text-primary-foreground">Varlık Dağılımı</CardTitle>
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-3 py-1 rounded-full">
               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-widest">Canlı Piyasa</span>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-8 flex-1">
            <InvestmentSummary 
              investments={portfolioMetrics.assets} 
              fixedAssets={fixedMetrics.assets.map(fa => ({ ...fa, value: fa.currentValuation || fa.value }))}
            />
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full w-full">
           <InvestmentProjection 
             currentValue={totalInvestment} 
             investments={portfolioMetrics.assets}
             fixedAssets={fixedMetrics.assets.map(fa => ({ ...fa, value: fa.currentValuation || fa.value }))}
             monthlySavings={(totalIncome - totalExpense) > 0 ? (totalIncome - totalExpense) : 0}
           />
        </div>
      </div>

      {/* Fixed Assets Section */}
      <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
        <CardHeader className="bg-muted h-20 !flex flex-row items-center justify-between px-6 py-0">
          <CardTitle className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-accent" /> Sabit Varlık Analizi
          </CardTitle>
          <div className="bg-primary-foreground/10 px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Canlı Kur / Endeksleme Aktif
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-8">
          <FixedAssetsSummary fixedAssets={fixedMetrics.assets.map(fa => ({ ...fa, value: fa.currentValuation || fa.value }))} />
        </CardContent>
      </Card>
    </div>
  );
}
