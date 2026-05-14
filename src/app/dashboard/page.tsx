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
    where: { clerkUserId: userId as string },
    include: {
      incomes: true,
      expenses: true,
      debts: true,
      investments: true,
      fixedAssets: true,
    } as any,
  }) as any;

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  let portfolioMetrics = { totalCurrentValue: 0, totalProfit: 0, profitPercent: 0, assets: [] as any[] };
  let livePrices = new Map();

  try {
    const symbols = Array.from(new Set(
      (user.investments as any[])
        .map(inv => inv.symbol)
        .filter((s): s is string => !!s)
    ));

    livePrices = await getLivePrices(symbols);
    portfolioMetrics = calculatePortfolioMetrics(user.investments, livePrices);
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error);
    portfolioMetrics = calculatePortfolioMetrics(user.investments, new Map());
  }

  const totalIncome = (user.incomes as any[]).reduce((acc: number, inc: any) => acc + inc.amount, 0);
  const totalExpense = (user.expenses as any[]).reduce((acc: number, exp: any) => acc + exp.amount, 0);
  const totalDebt = (user.debts as any[]).reduce((acc: number, debt: any) => acc + debt.amount, 0);
  const totalInvestment = portfolioMetrics.totalCurrentValue;
  const totalFixedAssets = (user.fixedAssets as any[]).reduce((acc: number, asset: any) => acc + asset.value, 0);
  const totalProfit = portfolioMetrics.totalProfit;
  const profitPercent = portfolioMetrics.profitPercent;
  
  const netWorth = totalInvestment + (totalIncome - totalExpense) + totalFixedAssets - totalDebt;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <div className="flex-1 space-y-10 p-8 pt-10 bg-[#f8f9fa] min-h-screen">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-heading font-bold text-[#8c5000] tracking-tight">
            Finansal Özet
          </h2>
          <p className="text-[#554336] mt-1 font-medium italic opacity-80">Geleceğinizi verilerle inşa ediyoruz.</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-ambient-medium border border-[#dbc2b0]/20 flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#554336] uppercase tracking-widest">Tasarruf Oranı</span>
              <span className={cn(
                "text-2xl font-bold font-heading",
                savingsRate > 20 ? "text-emerald-600" : "text-[#666000]"
              )}>
                %{savingsRate.toFixed(1)}
              </span>
           </div>
           <div className="w-12 h-12 bg-[#f8f9fa] rounded-xl flex items-center justify-center shadow-inner">
              <TrendingUp className="h-6 w-6 text-[#8c5000]" />
           </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden bg-white border-[#dbc2b0]/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-[#8c5000]/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-[#554336] uppercase tracking-widest">Net Varlık</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#8c5000]">{netWorth.toLocaleString('tr-TR')} ₺</div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#efe440] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#554336] opacity-60">GÜNCEL DURUM</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border-[#dbc2b0]/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-[#554336] uppercase tracking-widest">Aylık Nakit Akışı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#8c5000]">{(totalIncome - totalExpense).toLocaleString('tr-TR')} ₺</div>
            <div className="mt-3 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              Gelir: {totalIncome.toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border-[#dbc2b0]/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-[#554336] uppercase tracking-widest">Toplam Borç</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#8c5000]">{totalDebt.toLocaleString('tr-TR')} ₺</div>
            <div className="mt-3 text-[10px] font-bold text-rose-600 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />
              Borç Yükü: %{((totalDebt / (totalIncome || 1)) * 100).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-[#8c5000] border-none shadow-ambient-high hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Portföy Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-heading font-bold",
              totalProfit >= 0 ? "text-[#efe440]" : "text-rose-400"
            )}>
              {totalProfit.toLocaleString('tr-TR')} ₺
            </div>
            <div className={cn(
              "mt-3 text-[10px] font-bold flex items-center gap-1",
              totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {totalProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              %{profitPercent.toFixed(2)} Getiri
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Budget Chart */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
          <CardHeader className="bg-[#f8f9fa] border-b border-[#dbc2b0]/10 py-6">
            <CardTitle className="text-xl font-heading font-bold text-[#8c5000] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#efe440]" /> Gelişim Grafiği (Son 30 Gün)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <PerformanceChart 
              incomes={user.incomes} 
              expenses={user.expenses} 
              investments={user.investments} 
            />
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
          <CardHeader className="bg-[#f8f9fa] border-b border-[#dbc2b0]/10 py-6">
            <CardTitle className="text-xl font-heading font-bold text-[#8c5000] flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#efe440] fill-[#efe440]" /> Bütçe Dengesi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <BudgetOverview incomes={user.incomes} expenses={user.expenses} />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
        <CardHeader className="bg-[#f8f9fa] border-b border-[#dbc2b0]/10 py-6">
          <CardTitle className="text-xl font-heading font-bold text-[#8c5000] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#8c5000]" /> Ödeme Takvimi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <UpcomingPayments expenses={user.expenses} />
        </CardContent>
      </Card>

      {/* Assets Section */}
      <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
        <CardHeader className="bg-[#8c5000] py-6 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading font-bold text-white">Varlık Dağılımı</CardTitle>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
             <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Canlı Piyasa</span>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <InvestmentSummary 
            investments={portfolioMetrics.assets} 
            fixedAssets={user.fixedAssets} 
          />
        </CardContent>
      </Card>

      {/* Fixed Assets Section */}
      <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
        <CardHeader className="bg-[#554336] py-6 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#fed65b]" /> Sabit Varlık Analizi
          </CardTitle>
          <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Taşınmaz & Araçlar
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <FixedAssetsSummary fixedAssets={user.fixedAssets} />
        </CardContent>
      </Card>

      <ChatAI />
    </div>
  );
}
