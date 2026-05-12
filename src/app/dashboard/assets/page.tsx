import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLivePrices, calculatePortfolioMetrics } from "@/lib/price-service";
import { AssetList } from "@/components/dashboard/asset-list";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Banknote, ArrowUpRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AssetsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      investments: true,
    },
  }) as any;

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  let metrics = { totalCurrentValue: 0, totalCost: 0, totalProfit: 0, profitPercent: 0, assets: [] as any[] };
  
  try {
    const symbols = Array.from(new Set(
      (user.investments as any[])
        .map(inv => inv.symbol)
        .filter((s): s is string => !!s)
    ));

    const livePrices = await getLivePrices(symbols);
    metrics = calculatePortfolioMetrics(user.investments, livePrices);
  } catch (error) {
    console.error("Assets Page Data Fetch Error:", error);
    metrics = calculatePortfolioMetrics(user.investments, new Map());
  }

  return (
    <div className="flex-1 space-y-10 p-8 pt-10 bg-[#f8f9fa] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <BarChart3 className="h-5 w-5 text-[#efe440] fill-[#efe440]" />
             <span className="text-[10px] font-bold text-[#666000] uppercase tracking-[0.2em]">Varlık Yönetimi</span>
          </div>
          <h2 className="text-4xl font-heading font-bold text-[#8c5000] tracking-tight">
            Varlık Portföyüm
          </h2>
          <p className="text-[#554336] mt-1 font-medium opacity-80">BIST, NASDAQ ve Kripto varlıklarınızı profesyonelce yönetin.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-white border-[#dbc2b0]/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-[#8c5000]/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-[#554336] uppercase tracking-widest">Toplam Portföy Değeri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-[#8c5000]">{metrics.totalCurrentValue.toLocaleString('tr-TR')} ₺</div>
            <div className="mt-3 text-[10px] font-bold text-[#554336] opacity-60 flex items-center gap-2">
               Maliyet: {metrics.totalCost.toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border-[#dbc2b0]/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-[#554336] uppercase tracking-widest">Toplam Kar / Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-heading font-bold",
              metrics.totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {metrics.totalProfit.toLocaleString('tr-TR')} ₺
            </div>
            <div className={cn(
              "mt-3 text-[10px] font-bold flex items-center gap-1",
              metrics.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              %{metrics.profitPercent.toFixed(2)} Toplam Getiri
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-[#8c5000] border-none shadow-ambient-high hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
          <div className="absolute -right-4 -top-4 p-8 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-white/60 uppercase tracking-widest">En Değerli Varlık</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.assets.length > 0 ? (
              <>
                <div className="text-3xl font-heading font-bold text-[#efe440]">
                  {metrics.assets.sort((a, b) => b.currentValue - a.currentValue)[0].symbol?.split('.')[0] || "---"}
                </div>
                <div className="mt-3 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Portföyün Amiral Gemisi
                </div>
              </>
            ) : (
              <div className="text-3xl font-bold text-white/20">---</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-1">
        <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
          <CardHeader className="bg-[#f8f9fa]/50 border-b border-[#dbc2b0]/10 py-6 px-8">
            <CardTitle className="text-xl font-heading font-bold text-[#8c5000]">Varlık Dağılımı (Anlık Değer)</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <InvestmentSummary investments={metrics.assets} />
          </CardContent>
        </Card>
      </div>

      <AssetList assets={metrics.assets} allInvestments={user.investments} />
    </div>
  );
}
