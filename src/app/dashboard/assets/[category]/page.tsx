import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLivePrices, calculatePortfolioMetrics } from "@/lib/price-service";
import { AssetList } from "@/components/dashboard/asset-list";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

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

  // Filter based on category
  let filteredInvestments = user.investments;
  let filteredFixedAssets = user.fixedAssets;

  const categoryUpper = category.toUpperCase();
  
  if (category === "fixed") {
    filteredInvestments = [];
  } else if (category === "gold") {
    filteredInvestments = user.investments.filter(inv => inv.type === "GOLD" || inv.type === "Gold");
    filteredFixedAssets = [];
  } else if (category === "crypto") {
    filteredInvestments = user.investments.filter(inv => inv.type === "CRYPTO" || inv.type === "Crypto");
    filteredFixedAssets = [];
  } else if (category === "bist") {
    filteredInvestments = user.investments.filter(inv => inv.type === "BIST" || inv.type === "Bist");
    filteredFixedAssets = [];
  } else if (category === "nasdaq") {
    filteredInvestments = user.investments.filter(inv => inv.type === "NASDAQ" || inv.type === "Nasdaq");
    filteredFixedAssets = [];
  }

  let metrics = { totalCurrentValue: 0, totalCost: 0, totalProfit: 0, profitPercent: 0, assets: [] as any[] };

  try {
    const symbols = Array.from(new Set(
      filteredInvestments
        .map(inv => inv.symbol)
        .filter((s): s is string => !!s)
    ));

    const livePrices = await getLivePrices(symbols);
    metrics = calculatePortfolioMetrics(filteredInvestments, livePrices);
  } catch (error) {
    console.error("Category Page Data Fetch Error:", error);
    metrics = calculatePortfolioMetrics(filteredInvestments, new Map());
  }

  const categoryTitles: Record<string, string> = {
    crypto: "Kripto Para Portföyü",
    bist: "BIST Hisse Portföyü",
    nasdaq: "NASDAQ Hisse Portföyü",
    gold: "Altın & Emtia Portföyü",
    fixed: "Sabit Varlıklarım"
  };

  return (
    <div className="flex-1 space-y-10 p-8 pt-10 bg-[#f8f9fa] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-[#8c5000]">{categoryTitles[category] || "Varlık Detayları"}</h1>
        <p className="text-[#554336] opacity-70">Seçili varlık kategorisine ait detaylı analiz ve listeleme.</p>
      </div>
      <AssetList 
        assets={metrics.assets} 
        allInvestments={filteredInvestments.map(inv => ({
          ...inv,
          purchasePrice: inv.purchasePrice ?? undefined,
          soldPrice: inv.soldPrice ?? undefined,
          transactionType: inv.transactionType as "BUY" | "SELL"
        }))} 
        fixedAssets={filteredFixedAssets.map(fa => ({
          id: fa.id,
          name: fa.name,
          type: fa.type,
          value: fa.value
        }))}
        metrics={metrics}
        defaultTab={category === "fixed" ? "fixed" : "financial"}
        hideTabs={true}
      />
    </div>
  );
}
