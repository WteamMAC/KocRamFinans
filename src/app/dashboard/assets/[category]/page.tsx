import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLivePrices, calculatePortfolioMetrics, calculateFixedAssetsMetrics } from "@/lib/price-service";
import { AssetList } from "@/components/dashboard/asset-list";
import { BesFaizDetail } from "@/components/dashboard/bes-faiz-detail";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default async function AssetCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      investments: true,
      fixedAssets: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  const categoryTitles: Record<string, string> = {
    crypto: "Kripto Para Portföyü",
    bist: "BIST Hisse Portföyü",
    nasdaq: "NASDAQ Hisse Portföyü",
    gold: "Altın & Emtia Portföyü",
    fixed: "Sabit Varlıklarım",
    bes: "Bireysel Emeklilik (BES)",
    faiz: "Vadeli Mevduat (Faiz)",
  };

  return (
    <div className="flex-1 space-y-10 p-8 pt-10 bg-background min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">{categoryTitles[category] || "Varlık Detayları"}</h1>
          <p className="text-muted-foreground opacity-70 italic font-medium">Finansal varlıklarınızın detaylı analizi ve yönetimi.</p>
        </div>
        <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 w-fit">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Canlı Piyasa & Kur Endeksleme Aktif
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <CategoryContent category={category} user={user} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ category, user }: { category: string; user: any }) {
  // === BES ve FAIZ için özel sayfa ===
  if (category === "bes" || category === "faiz") {
    const type = category === "bes" ? "BES" : "FAIZ";
    const investments = user.investments
      .filter((inv: any) => inv.type === type && inv.status === "OPEN")
      .map((inv: any) => ({
        id: inv.id,
        symbol: inv.symbol,
        quantity: inv.quantity,
        purchasePrice: inv.purchasePrice,
        amount: inv.amount,
        description: inv.description,
        createdAt: inv.createdAt,
        status: inv.status,
      }));

    return <BesFaizDetail type={type} investments={investments} />;
  }

  // === Diğer kategoriler için mevcut akış ===
  let filteredInvestments = user.investments;
  let filteredFixedAssets = user.fixedAssets;

  if (category === "fixed") {
    filteredInvestments = [];
  } else if (category === "gold") {
    filteredInvestments = user.investments.filter((inv: any) => inv.type === "GOLD" || inv.type === "Gold");
    filteredFixedAssets = [];
  } else if (category === "crypto") {
    filteredInvestments = user.investments.filter((inv: any) => inv.type === "CRYPTO" || inv.type === "Crypto");
    filteredFixedAssets = [];
  } else if (category === "bist") {
    filteredInvestments = user.investments.filter((inv: any) => inv.type === "BIST" || inv.type === "Bist");
    filteredFixedAssets = [];
  } else if (category === "nasdaq") {
    filteredInvestments = user.investments.filter((inv: any) => inv.type === "NASDAQ" || inv.type === "Nasdaq");
    filteredFixedAssets = [];
  }

  let metrics = { totalCurrentValue: 0, totalCost: 0, totalProfit: 0, profitPercent: 0, assets: [] as any[] };
  let fixedMetrics = { totalOriginalCost: 0, totalCurrentValue: 0, totalProfit: 0, totalProfitPercent: 0, assets: [] as any[] };

  try {
    const symbols = Array.from(new Set(
      filteredInvestments
        .map((inv: any) => inv.symbol)
        .filter((s: any): s is string => !!s)
    ));

    const livePrices = await getLivePrices(symbols);
    metrics = calculatePortfolioMetrics(filteredInvestments, livePrices);
    fixedMetrics = calculateFixedAssetsMetrics(filteredFixedAssets, livePrices);
  } catch (error) {
    console.error("Category Page Data Fetch Error:", error);
    metrics = calculatePortfolioMetrics(filteredInvestments, new Map());
    fixedMetrics = calculateFixedAssetsMetrics(filteredFixedAssets, new Map());
  }

  return (
    <div className="animate-in fade-in duration-700">
      <AssetList 
        assets={metrics.assets} 
        allInvestments={filteredInvestments.map((inv: any) => ({
          ...inv,
          purchasePrice: inv.purchasePrice ?? undefined,
          soldPrice: inv.soldPrice ?? undefined,
          transactionType: inv.transactionType as "BUY" | "SELL"
        }))} 
        fixedAssets={fixedMetrics.assets.map((fa: any) => ({
          ...fa,
          value: fa.currentValuation || fa.value,
          liveProfit: fa.liveProfit,
          liveProfitPercent: fa.liveProfitPercent
        }))}
        metrics={{ ...metrics, fixedMetrics }}
        defaultTab={category === "fixed" ? "fixed" : "financial"}
        hideTabs={true}
        defaultAssetType={
          category === "crypto" ? "CRYPTO" :
          category === "bist" ? "BIST" :
          category === "nasdaq" ? "NASDAQ" :
          category === "gold" ? "GOLD" : undefined
        }
      />
    </div>
  );
}

