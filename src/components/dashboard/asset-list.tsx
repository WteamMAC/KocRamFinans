/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Trash2,
  History,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  RefreshCw,
  LayoutGrid,
  Coins,
  Globe
} from "lucide-react";
import { addAsset, deleteAsset, sellAsset, addFixedAsset, deleteFixedAsset } from "@/app/actions/assets";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getExchangeRatesAction } from "@/app/actions/market";
import { PortfolioChart } from "./portfolio-chart";
import { CompactCurrencyCalculator } from "./compact-currency-calculator";
import { AssetForm } from "./asset-form";
import { useCurrency } from "@/context/currency-context";

interface Asset {
  id: string;
  type: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number | null;
  amount: number;
  currentPrice?: number;
  description?: string | null;
  createdAt: Date | string;
}

interface FixedAsset {
  id: string;
  name: string;
  type: string;
  value: number;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
  liveProfit?: number;
  liveProfitPercent?: number;
}

interface InvestmentLog {
  id: string;
  symbol: string | null;
  type: string;
  quantity: number;
  purchasePrice?: number;
  soldPrice?: number;
  transactionType: "BUY" | "SELL";
  createdAt: Date | string;
  description?: string | null;
}

interface AssetListProps {
  assets: Asset[];
  allInvestments: InvestmentLog[];
  fixedAssets?: FixedAsset[];
  metrics?: any;
  defaultTab?: "financial" | "fixed";
  hideTabs?: boolean;
  userCurrency?: string;
  defaultAssetType?: string;
}


export function AssetList({
  assets,
  allInvestments,
  fixedAssets,
  defaultTab = "financial",
  hideTabs = false,
  userCurrency = "TRY",
  defaultAssetType
}: AssetListProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"financial" | "fixed">(defaultTab);
  const [sellModalState, setSellModalState] = useState<{ assetId: string | null }>({ assetId: null });

  // Dinamik Para Birimi Çevirme State'i (Global Context'ten)
  const { displayCurrency, setDisplayCurrency, formatAmount: formatCur, rates } = useCurrency();

  useEffect(() => {
    if (userCurrency && !sessionStorage.getItem("user_curr_synced")) {
      setDisplayCurrency(userCurrency);
      sessionStorage.setItem("user_curr_synced", "true");
    }
  }, [userCurrency, setDisplayCurrency]);

  const groupedAssets = assets.reduce((acc: Record<string, {
    symbol: string;
    type: string;
    totalQuantity: number;
    totalCost: number;
    totalValue: number;
    totalDailyReturn: number;
    currentPrice?: number;
    rate?: number;
    items: Asset[];
  }>, asset: any) => {
    const symbol = asset.symbol || "Diğer";
    if (!acc[symbol]) {
      let rate = asset.rate || 0;
      if (!rate && (asset.type === "BES" || asset.type === "FAIZ")) {
        try {
          const meta = JSON.parse(asset.description || "{}");
          rate = meta.rate || asset.purchasePrice || 0;
        } catch {
          rate = asset.purchasePrice || 0;
        }
      }

      acc[symbol] = {
        symbol,
        type: asset.type,
        totalQuantity: 0,
        totalCost: 0,
        totalValue: 0,
        totalDailyReturn: 0,
        currentPrice: asset.currentPrice,
        rate,
        items: [] as Asset[]
      };
    }
    acc[symbol].totalQuantity += asset.quantity;
    acc[symbol].totalCost += asset.cost || asset.amount || (asset.quantity * (asset.purchasePrice || 0));
    acc[symbol].totalValue += asset.currentValue || (asset.quantity * (asset.currentPrice || 0));
    
    if (asset.type === "FAIZ") {
      const itemRate = asset.rate || acc[symbol].rate || 0;
      acc[symbol].totalDailyReturn += (asset.quantity * itemRate) / 365 / 100;
    }
    
    acc[symbol].items.push(asset);
    return acc;
  }, {});

  const history = [...allInvestments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleExportCSV = () => {
    const headers = ["Sembol", "Tur", "Miktar", `Maliyet (${displayCurrency})`, `Anlik Fiyat (${displayCurrency})`, `Toplam Deger (${displayCurrency})`, `Kar/Zarar (${displayCurrency})`];
    const rows = Object.values(groupedAssets).map((g) => {
      const totalValue = g.totalQuantity * (g.currentPrice || 0);
      const profit = totalValue - g.totalCost;
      const rate = rates[displayCurrency] || 1;
      return [
        g.symbol,
        g.type,
        g.totalQuantity,
        (g.totalCost / rate).toFixed(2),
        ((g.currentPrice || 0) / rate).toFixed(2),
        (totalValue / rate).toFixed(2),
        (profit / rate).toFixed(2)
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `portfoy_ozeti_${displayCurrency}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFixedCSV = () => {
    const headers = ["Varlik Adi", "Tur", `Deger (${displayCurrency})`];
    const rows = (fixedAssets || []).map((a) => {
      const rate = rates[displayCurrency] || 1;
      return [
        a.name,
        a.type,
        (a.value / rate).toFixed(2)
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sabit_varliklar_${displayCurrency}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  async function handleAdd(data: any) {
    if (!data.symbol || !data.quantity || isNaN(data.quantity) || data.quantity <= 0) {
      setError("Lütfen sembol seçin ve geçerli bir miktar girin.");
      return;
    }
    if (!data.useCurrentPrice && (isNaN(data.purchasePrice) || data.purchasePrice < 0)) {
      setError("Lütfen geçerli bir alış fiyatı girin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let finalSymbol = data.symbol;
      if (finalSymbol.includes("(")) finalSymbol = finalSymbol.split(" ")[0];

      await addAsset({ ...data, symbol: finalSymbol.toUpperCase() });
      setIsAdding(false);

      await new Promise(r => setTimeout(r, 500));
      router.refresh();
    } catch (err: any) {
      console.error("Add error:", err);
      setError(err?.message || "Kaydetme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSell(id: string, action: "KEEP_TL" | "KEEP_USDT" | "WITHDRAW") {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      await sellAsset(id, action);
      setSellModalState({ assetId: null });
      await new Promise(r => setTimeout(r, 500));
      router.refresh();
    } catch (err: any) {
      console.error("Sell error:", err);
      setError(err?.message || "Satış sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaydı tamamen silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
      await deleteAsset(id);
      await new Promise(r => setTimeout(r, 500));
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Silme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFixed(data: any) {
    if (!data.name || (!data.value && !data.originalAmount)) {
      setError("Lütfen isim girin ve geçerli bir değer belirtin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const origAmount = Number(data.originalAmount || data.value || 0);
      const curr = data.currency || "TRY";
      const currRate = rates[curr] || 1;
      const tryValue = curr === "TRY" ? origAmount : origAmount * currRate;

      await addFixedAsset({
        name: data.name,
        type: data.type,
        value: tryValue,
        currency: curr,
        originalAmount: origAmount,
        fxRate: currRate
      });
      setIsAdding(false);
      await new Promise(r => setTimeout(r, 500));
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Varlık eklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFixed(id: string) {
    if (!confirm("Bu sabit varlığı silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
      await deleteFixedAsset(id);
      await new Promise(r => setTimeout(r, 500));
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Silme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Bar: View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {!hideTabs && (
          <div className="flex p-1 bg-muted rounded-2xl border border-border/20 w-fit">
            <button
              onClick={() => setActiveTab("financial")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "financial"
                  ? "bg-primary text-primary-foreground shadow-ambient-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Coins className="h-4 w-4" /> Finansal Yatırımlar
            </button>
            <button
              onClick={() => setActiveTab("fixed")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "fixed"
                  ? "bg-primary text-primary-foreground shadow-ambient-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="h-4 w-4" /> Sabit Varlıklar
            </button>
          </div>
        )}
      </div>

      {/* Header & Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-primary">
            {activeTab === "financial" ? "Varlık Portföyü" : "Sabit Varlıklarım"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {activeTab === "financial"
              ? "Yatırımlarınızı profesyonel bir bakış açısıyla yönetin."
              : "Ev, araba ve diğer somut varlıklarınızı buradan takip edin."}
          </p>
        </div>

        <CompactCurrencyCalculator />

        <div className="flex items-center gap-3 mt-4 md:mt-0 shrink-0">
          <Button
            variant="outline"
            onClick={activeTab === "financial" ? handleExportCSV : handleExportFixedCSV}
            className="rounded-full px-5 h-[52px] text-sm font-semibold text-primary border-border/30 hover:bg-primary/5 bg-card shadow-ambient-low transition-all duration-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full px-5 h-[52px] text-sm font-semibold text-primary border-border/30 hover:bg-primary/5 bg-card shadow-ambient-low transition-all duration-300"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Yenile
          </Button>
          <Button
            onClick={() => { setIsAdding(!isAdding); setError(null); }}
            className={cn(
              "rounded-full px-6 h-[52px] text-sm font-semibold shadow-ambient-medium transition-all duration-300",
              isAdding ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isAdding ? "Vazgeç" : (activeTab === "financial" ? "Yatırım Ekle" : "Varlık Ekle")}
          </Button>
        </div>
      </div>

      {/* Add Asset Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-background/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto no-scrollbar rounded-[32px] shadow-2xl border border-border/40">
            <AssetForm 
              activeTab={activeTab} 
              loading={loading} 
              error={error} 
              defaultAssetType={defaultAssetType}
              onCancel={() => setIsAdding(false)} 
              onAdd={activeTab === "financial" ? handleAdd : handleAddFixed} 
            />
          </div>
        </div>
      )}

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-1 p-6 bg-card border-border/30 shadow-ambient-medium rounded-[32px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-70 relative z-10">
              {activeTab === "financial" ? `Toplam Portföy Değeri (${displayCurrency})` : `Toplam Varlık Değeri (${displayCurrency})`}
            </h3>
            <div className="text-4xl font-heading font-bold text-primary mb-4 relative z-10">
              {activeTab === "financial"
                ? formatCur(Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalValue, 0))
                : formatCur((fixedAssets || []).reduce((sum: number, a) => sum + a.value, 0))
              }
            </div>

            {activeTab === "financial" ? (
              <>
                <div className="text-sm font-medium text-muted-foreground relative z-10">
                  Maliyet: {formatCur(Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalCost, 0))}
                </div>
                {activeTab === "financial" && Object.values(groupedAssets).some((g: any) => g.type === "FAIZ") && (
                  <div className="text-xs font-bold text-emerald-500 mt-1 relative z-10 flex items-center gap-1 bg-emerald-500/5 w-fit px-2 py-0.5 rounded-md border border-emerald-500/10">
                    <TrendingUp className="h-3 w-3" />
                    Günlük Faiz Getirisi: {formatCur(Object.values(groupedAssets).reduce((sum: number, g: any) => sum + (g.totalDailyReturn || 0), 0))}
                  </div>
                )}
                {(() => {
                  const totalCost = Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalCost, 0);
                  const currentVal = Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalValue, 0);
                  const profit = currentVal - totalCost;
                  const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
                  return (
                    <div className={cn("inline-flex items-center px-3 py-1.5 rounded-xl mt-4 w-fit font-bold relative z-10 shadow-sm", profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                      {profit >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {profitPct > 0 ? "+" : ""}{profitPct.toFixed(2)}% ({formatCur(profit)})
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-sm font-medium text-muted-foreground opacity-60 relative z-10">
                {(fixedAssets || []).length} Adet Kayıtlı Varlık
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2 p-6 bg-card border-border/30 shadow-ambient-medium rounded-[32px] flex flex-col">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 opacity-70">
              {activeTab === "financial" ? (
                assets.length > 0 && new Set(assets.map(a => a.type)).size === 1
                  ? `${assets[0].type} Portföy Dağılımı (Sembol Bazlı)`
                  : "Portföy Dağılımı (Kategori Bazlı)"
              ) : "Sabit Varlık Dağılımı"}
            </h3>
            <div className="flex-1 min-h-[250px] -ml-4">
              <PortfolioChart assets={activeTab === "financial"
                ? Object.values(groupedAssets).map((g) => ({
                  id: g.symbol,
                  symbol: g.symbol,
                  type: g.type,
                  currentValue: g.totalQuantity * (g.currentPrice || 0)
                }))
                : (fixedAssets || []).map((a) => ({
                  id: a.id,
                  symbol: a.name,
                  type: a.type,
                  currentValue: a.value
                }))
              } />
            </div>
          </Card>
        </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold text-primary truncate">
                {activeTab === "financial" ? "Aktif Yatırımlarım" : "Kayıtlı Sabit Varlıklarım"}
              </h3>
            </div>
            <div className="relative w-full max-w-[150px] sm:max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Ara..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-card border-border/30 shadow-ambient-low rounded-xl focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTab === "financial" ? (
              (() => {
                const filteredGroups = Object.values(groupedAssets).filter((g) =>
                  g.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
                  g.type.toLowerCase().includes(filterQuery.toLowerCase())
                );
                return filteredGroups.length === 0 ? (
                  <div className="lg:col-span-2 p-12 text-center bg-card rounded-[32px] border border-dashed border-border text-muted-foreground opacity-60 shadow-ambient-low">
                    {filterQuery ? "Aramanıza uygun yatırım bulunamadı." : "Henüz aktif bir yatırım bulunmuyor."}
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const staticPrice = (group.type === "BES" || group.type === "FAIZ" || group.type === "CASH") ? 1 : 0;
                    const cPrice = group.currentPrice || staticPrice;
                    const totalValue = group.totalQuantity * cPrice;

                    const totalPortfolioValue = Object.values(groupedAssets).reduce((sum: number, g) => {
                      const sp = (g.type === "BES" || g.type === "FAIZ" || g.type === "CASH") ? 1 : 0;
                      return sum + (g.totalQuantity * (g.currentPrice || sp));
                    }, 0);
                    const portfolioRatio = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0;
                    const profit = totalValue - group.totalCost;
                    const profitPercent = group.totalCost > 0 ? (profit / group.totalCost) * 100 : 0;
                    const isExpanded = expandedSymbol === group.symbol;

                    return (
                      <Card
                        key={group.symbol}
                        className={cn(
                          "overflow-hidden transition-all duration-500 cursor-pointer border-border/20 group h-fit",
                          isExpanded ? "ring-2 ring-accent shadow-ambient-high scale-[1.01]" : "hover:shadow-ambient-medium hover:border-accent/40 shadow-ambient-low"
                        )}
                        onClick={() => setExpandedSymbol(isExpanded ? null : group.symbol)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center font-bold text-primary text-lg border border-border/20 shadow-inner group-hover:bg-accent/10 transition-colors">
                                {group.symbol.substring(0, 3)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-heading font-bold text-xl text-primary">{group.symbol}</h4>
                                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">{group.type}</span>
                                </div>
                                {group.type === "FAIZ" && (
                                  <div className="flex items-center gap-1.5 mt-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg w-fit border border-emerald-500/10 shadow-sm border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Günlük Getiri: ~{formatCur(group.totalDailyReturn)}</span>
                                  </div>
                                )}
                                <p className="text-muted-foreground text-sm font-medium mt-1">
                                  {group.type === "BES" || group.type === "FAIZ" 
                                    ? formatCur(group.totalQuantity) 
                                    : `${group.totalQuantity.toLocaleString("tr-TR")} Adet`}
                                  <span className="ml-2 text-[10px] font-bold text-muted-foreground bg-muted border border-border/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    Pay: %{portfolioRatio.toFixed(1)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{formatCur(group.totalValue)}</div>
                              <div className={cn(
                                "flex items-center justify-end text-sm font-bold mt-1",
                                profit >= 0 ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {profit >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                {profitPercent.toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-6 pt-6 border-t border-border/10 space-y-4 animate-in slide-in-from-top-2">
                              {group.items.map((item) => {
                                let meta: any = {};
                                let isSpecial = group.type === "BES" || group.type === "FAIZ";
                                if (isSpecial) {
                                  try { meta = JSON.parse(item.description as string || "{}"); } catch(e){}
                                }
                                return (
                                  <div key={item.id} className="flex justify-between items-center p-3 bg-card rounded-xl border border-border/10 shadow-sm">
                                    <div className="flex flex-col">
                                      {isSpecial ? (
                                        <>
                                          <span className="text-sm font-bold text-foreground">{formatCur(item.quantity)}</span>
                                          <span className="text-[10px] font-bold text-emerald-500">
                                            {group.type === "BES" ? `Devlet Katkısı: %${meta.rate || 0}` : `Faiz Oranı: %${meta.rate || 0}`}
                                          </span>
                                          {meta.originalDescription && <span className="text-[10px] text-muted-foreground opacity-80">{meta.originalDescription}</span>}
                                        </>
                                      ) : (
                                        <span className="text-sm font-bold text-foreground">{item.quantity.toLocaleString("tr-TR")} @ {formatCur(item.purchasePrice || 0)}</span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      {!isSpecial && (
                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSellModalState({ assetId: item.id }); setError(null); }} className="h-8 text-xs font-bold border-border/30">Sat</Button>
                                      )}
                                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                );
              })()
            ) : (
              (() => {
                const filteredFixed = (fixedAssets || []).filter((a) =>
                  (a.name || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
                  (a.type || "").toLowerCase().includes(filterQuery.toLowerCase())
                );
                return filteredFixed.length === 0 ? (
                  <div className="lg:col-span-2 p-12 text-center bg-card rounded-[32px] border border-dashed border-border text-muted-foreground opacity-60 shadow-ambient-low">
                    {filterQuery ? "Aramanıza uygun varlık bulunamadı." : "Henüz bir sabit varlık eklemediniz."}
                  </div>
                ) : (
                  filteredFixed.map((asset) => {
                    const isTry = !asset.currency || asset.currency === "TRY";
                    const origAmount = asset.originalAmount || (asset.fxRate ? asset.value / asset.fxRate : asset.value);
                    const fxSymbol = asset.currency || "TRY";
                    const hasProfit = asset.liveProfit && Math.abs(asset.liveProfit) > 0.01;

                    return (
                      <Card key={asset.id} className="p-6 bg-card hover:shadow-ambient-medium transition-all duration-300 border-border/40 shadow-sm rounded-2xl group">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg border border-primary/15">
                              {asset.type.substring(0, 1)}
                            </div>
                            <div>
                              <h4 className="font-heading font-bold text-lg text-primary">{asset.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md uppercase tracking-tight">
                                  {asset.type}
                                </span>
                                {!isTry && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-tight">
                                    Kur: {asset.fxRate?.toFixed(2) || "1.00"} ₺
                                  </span>
                                )}
                                {hasProfit && (
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight",
                                    asset.liveProfit! >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                  )}>
                                    Artış: {asset.liveProfit! >= 0 ? "+" : ""}{formatCur(asset.liveProfit, "TRY")} ({asset.liveProfitPercent?.toFixed(1) || 0}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {!isTry ? (
                                <>
                                  <div className="text-xl font-heading font-black text-primary">
                                    {origAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fxSymbol === "USD" ? "$" : fxSymbol === "EUR" ? "€" : fxSymbol === "GBP" ? "£" : fxSymbol === "XAU" ? "ALT" : fxSymbol}
                                  </div>
                                  <div className="text-xs font-bold text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                                    <span>Güncel Değer:</span>
                                    <span className="text-foreground font-black">{formatCur(asset.value, "TRY")}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xl font-heading font-black text-primary">
                                    {formatCur(asset.value, "TRY")}
                                  </div>
                                  <div className="text-[10px] font-medium text-muted-foreground opacity-60 mt-0.5">Tahmini Değer</div>
                                </>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFixed(asset.id)}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors h-9 w-9 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                );
              })()
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-heading font-bold text-primary">İşlem Geçmişi</h3>
          </div>
          <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
            <div className="divide-y divide-border/10">
              {history.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground opacity-60">Kayıtlı işlem bulunamadı.</div>
              ) : (
                history.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-6 hover:bg-muted transition-colors flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                        log.transactionType === "SELL" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {log.transactionType === "SELL" ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{log.symbol}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-sm",
                            log.transactionType === "SELL" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {log.transactionType === "SELL" ? "SATIŞ" : "ALIŞ"}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleDateString("tr-TR")} {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {log.description && (
                          <p className="text-[10px] text-muted-foreground opacity-80 mt-1 italic">
                            &quot;{log.description}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{log.quantity.toLocaleString("tr-TR")} Adet</div>
                      <div className="text-xs font-medium text-muted-foreground opacity-60 mt-1">
                        Fiyat: {formatCur(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {history.length > 5 && (
              <div onClick={() => setShowHistoryModal(true)} className="p-4 bg-muted border-t border-border/10 text-center text-xs font-bold text-primary cursor-pointer hover:bg-muted/80 transition-colors">
                Tüm İşlemleri Gör
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal for All History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
          <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border/20 flex justify-between items-center bg-muted">
              <div>
                <h3 className="text-xl font-heading font-bold text-primary">Tüm İşlem Geçmişi</h3>
                <p className="text-xs text-muted-foreground mt-1">Geçmişte yaptığınız tüm alım ve satım kayıtları.</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card shadow-sm border border-border/30 hover:bg-rose-50 hover:text-rose-500" onClick={() => setShowHistoryModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 divide-y divide-border/10">
              {history.map((log) => (
                <div key={log.id} className="py-4 hover:bg-muted transition-colors flex justify-between items-center group first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm", log.transactionType === "SELL" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>
                      {log.transactionType === "SELL" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{log.symbol}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-sm", log.transactionType === "SELL" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>
                          {log.transactionType === "SELL" ? "SATIŞ" : "ALIŞ"}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground mt-1">
                        {new Date(log.createdAt).toLocaleDateString("tr-TR")} {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {log.description && (
                        <p className="text-[10px] text-muted-foreground opacity-80 mt-1 italic">
                          &quot;{log.description}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{log.quantity.toLocaleString("tr-TR")} Adet</div>
                    <div className="text-xs font-medium text-muted-foreground opacity-60 mt-1">Fiyat: {formatCur(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0))}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Selling Asset */}
      {sellModalState.assetId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
          <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border/20 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-heading font-bold text-primary">Varlık Satışı</h3>
                <p className="text-xs text-muted-foreground mt-1">Satış sonrası elde edilen tutarı ne yapmak istersiniz?</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card shadow-sm border border-border/30 hover:bg-rose-50 hover:text-rose-500" onClick={() => setSellModalState({ assetId: null })}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <Button onClick={() => handleSell(sellModalState.assetId!, "KEEP_TL")} disabled={loading} className="w-full justify-start p-6 text-base bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl border border-border/20">
                {loading ? "İşleniyor..." : "Nakit (TL) olarak portföyde tut"}
              </Button>
              <Button onClick={() => handleSell(sellModalState.assetId!, "KEEP_USDT")} disabled={loading} className="w-full justify-start p-6 text-base bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl border border-border/20">
                {loading ? "İşleniyor..." : "Nakit (USDT) olarak portföyde tut"}
              </Button>
              <Button onClick={() => handleSell(sellModalState.assetId!, "WITHDRAW")} disabled={loading} className="w-full justify-start p-6 text-base bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl border border-border/20">
                {loading ? "İşleniyor..." : "Parayı çek (Aylık nakit akışına ekle)"}
              </Button>
              {error && <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
            </div>
            <div className="p-4 bg-card/50 border-t border-border/10 flex justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => setSellModalState({ assetId: null })}>
                Vazgeç
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
