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
import { getLivePrices, calculatePortfolioMetrics } from "@/lib/price-service";
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

  // Kullanıcı Profilinden gelen eski yapılandırma iptal edildi, client side context kullanılıyor.

  let portfolioMetrics = { totalCurrentValue: 0, totalProfit: 0, profitPercent: 0, assets: [] as any[] };
  let livePrices = new Map();

  try {
    const symbols = Array.from(new Set(
      (user.investments as any[])
        .map(inv => inv.symbol)
        .filter((s): s is string => !!s)
    ));

    livePrices = await getLivePrices(symbols);
    portfolioMetrics = calculatePortfolioMetrics(user.investments, livePrices, user.incomes);
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error);
    portfolioMetrics = calculatePortfolioMetrics(user.investments, new Map(), user.incomes);
  }

  const totalIncome = (user.incomes as any[]).reduce((acc: number, inc: any) => acc + inc.amount, 0);
  const totalExpense = (user.expenses as any[]).reduce((acc: number, exp: any) => acc + exp.amount, 0);
  const totalDebt = (user.debts as any[]).reduce((acc: number, debt: any) => acc + debt.amount, 0);
  const totalInvestment = portfolioMetrics.totalCurrentValue;
  const totalFixedAssets = (user.fixedAssets as any[]).reduce((acc: number, asset: any) => acc + asset.value, 0);
  const totalProfit = portfolioMetrics.totalProfit;
  const profitPercent = portfolioMetrics.profitPercent;
  const totalRealizedProfit = (portfolioMetrics as any).totalRealizedProfit || 0;
  const totalUnrealizedProfit = (portfolioMetrics as any).totalUnrealizedProfit || 0;
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
    recentExpenses: user.expenses.slice(0, 5).map((e: any) => ({ type: e.type, amount: e.amount })),
    recentIncomes: user.incomes.slice(0, 5).map((i: any) => ({ type: i.type, amount: i.amount }))
  };

  return (
    <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 md:pt-10 bg-background min-h-screen overflow-x-hidden">
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
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col">
          <PerformanceChart 
            incomes={user.incomes} 
            expenses={user.expenses} 
            investments={user.investments}
          />
        </Card>

        <Card className="tour-step-6 col-span-3 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/10 py-6">
            <CardTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent fill-accent" /> Bütçe Dengesi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <BudgetOverview incomes={user.incomes} expenses={user.expenses} />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments & Calendar */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="tour-step-7 col-span-4 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-muted/30 border-b border-border/10 py-6">
            <CardTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Ödeme Takvimi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8 flex-1">
            <UpcomingPayments expenses={user.expenses} />
          </CardContent>
        </Card>
        
        <div className="col-span-3 h-full">
          <FinancialCalendar incomes={user.incomes} expenses={user.expenses} debts={user.debts} userChildren={user.children} marriageDate={user.marriageDate} specialEvents={user.specialEvents} />
        </div>
      </div>

      {/* Assets & Projection Section */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-primary py-6 px-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-heading font-bold text-primary-foreground">Varlık Dağılımı</CardTitle>
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-3 py-1 rounded-full">
               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-widest">Canlı Piyasa</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8 flex-1">
            <InvestmentSummary 
              investments={portfolioMetrics.assets} 
              fixedAssets={user.fixedAssets}
            />
          </CardContent>
        </Card>
        
        <div className="col-span-3 h-full">
           <InvestmentProjection 
             currentValue={totalInvestment} 
             investments={portfolioMetrics.assets}
             fixedAssets={user.fixedAssets}
             monthlySavings={(totalIncome - totalExpense) > 0 ? (totalIncome - totalExpense) : 0}
           />
        </div>
      </div>

      {/* Fixed Assets Section */}
      <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
        <CardHeader className="bg-muted py-6 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-accent" /> Sabit Varlık Analizi
          </CardTitle>
          <div className="bg-primary-foreground/10 px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Taşınmaz & Araçlar
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-8">
          <FixedAssetsSummary fixedAssets={user.fixedAssets} />
        </CardContent>
      </Card>
    </div>
  );
}
