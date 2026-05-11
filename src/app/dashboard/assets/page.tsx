import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLivePrices, calculatePortfolioMetrics } from "@/lib/price-service";
import { AssetList } from "@/components/dashboard/asset-list";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Banknote, ArrowUpRight } from "lucide-react";

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

  let metrics = { totalCurrentValue: 0, totalCost: 0, totalProfit: 0, profitPercent: 0, assets: [] };
  
  try {
    // Benzersiz sembolleri topla
    const symbols = Array.from(new Set(
      (user.investments as any[])
        .map(inv => inv.symbol)
        .filter((s): s is string => !!s)
    ));

    // Canlı fiyatları çek
    const livePrices = await getLivePrices(symbols);
    
    // Portföy metriklerini hesapla
    metrics = calculatePortfolioMetrics(user.investments, livePrices);
  } catch (error) {
    console.error("Assets Page Data Fetch Error:", error);
    metrics = calculatePortfolioMetrics(user.investments, new Map());
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-[#f8fafc] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Varlık Portföyüm
          </h2>
          <p className="text-slate-500 text-sm mt-1">BIST, NASDAQ ve Kripto varlıklarınızı buradan yönetin.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Portföy Değeri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalCurrentValue.toLocaleString('tr-TR')} ₺</div>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-400">
              Maliyet: {metrics.totalCost.toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Kar / Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {metrics.totalProfit.toLocaleString('tr-TR')} ₺
            </div>
            <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${metrics.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              %{metrics.profitPercent.toFixed(2)} Toplam Getiri
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En Değerli Varlık</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.assets.length > 0 ? (
              <>
                <div className="text-2xl font-bold text-slate-900">
                  {metrics.assets.sort((a, b) => b.currentValue - a.currentValue)[0].symbol?.split('.')[0] || "---"}
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-1">
                  Portföyün en büyük payı
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-slate-300">---</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafiğe canlı verileri gönderiyoruz */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-500">Varlık Dağılımı (Anlık Değer)</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestmentSummary investments={metrics.assets} />
          </CardContent>
        </Card>
      </div>

      <AssetList assets={metrics.assets} />
    </div>
  );
}
