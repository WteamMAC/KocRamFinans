import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLivePrices, calculatePortfolioMetrics } from "@/lib/price-service";
import { AssetList } from "@/components/dashboard/asset-list";

export default async function AssetsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      investments: true,
      fixedAssets: true,
    } as any,
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
    <div className="flex-1 space-y-10 p-8 pt-10 bg-background min-h-screen">
      <AssetList 
        assets={metrics.assets} 
        allInvestments={user.investments} 
        fixedAssets={user.fixedAssets}
        metrics={metrics}
        userCurrency={user.currency}
      />
    </div>
  );
}
