/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Moon,
  Sun,
  LayoutGrid,
  Coins
} from "lucide-react";
import { addAsset, deleteAsset, sellAsset, addFixedAsset, deleteFixedAsset } from "@/app/actions/assets";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { searchSymbolsAction } from "@/app/actions/market";
import { PortfolioChart } from "./portfolio-chart";

interface Asset {
  id: string;
  type: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number | null;
  amount: number;
  currentPrice?: number;
  createdAt: Date | string;
}

interface FixedAsset {
  id: string;
  name: string;
  type: string;
  value: number;
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
}

export function AssetList({ assets, allInvestments, fixedAssets, defaultTab = "financial", hideTabs = false }: AssetListProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"financial" | "fixed">(defaultTab);
  const [sellModalState, setSellModalState] = useState<{ assetId: string | null }>({ assetId: null });

  const [fixedAssetFormData, setFixedAssetFormData] = useState({
    name: "",
    type: "Gayrimenkul",
    value: 0
  });

  const [formData, setFormData] = useState({
    type: "BIST" as string,
    symbol: "",
    quantity: 0,
    purchasePrice: 0,
    useCurrentPrice: false,
    description: "",
  });

  // Search results positioning logic
  const inputRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = () => {
    if (inputRef.current) {
      setRect(inputRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (showSearch) {
      updateRect();
      window.addEventListener("scroll", updateRect);
      window.addEventListener("resize", updateRect);
    }
    return () => {
      window.removeEventListener("scroll", updateRect);
      window.removeEventListener("resize", updateRect);
    };
  }, [showSearch]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedAssets = assets.reduce((acc: Record<string, {
    symbol: string;
    type: string;
    totalQuantity: number;
    totalCost: number;
    currentPrice?: number;
    items: Asset[];
  }>, asset: Asset) => {
    const symbol = asset.symbol || "Diğer";
    if (!acc[symbol]) {
      acc[symbol] = {
        symbol,
        type: asset.type,
        totalQuantity: 0,
        totalCost: 0,
        currentPrice: asset.currentPrice,
        items: [] as Asset[]
      };
    }
    acc[symbol].totalQuantity += asset.quantity;
    acc[symbol].totalCost += asset.amount || (asset.quantity * (asset.purchasePrice || 0));
    acc[symbol].items.push(asset);
    return acc;
  }, {});

  const history = [...allInvestments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchSymbolsAction(searchQuery, formData.type);
        setSearchResults(results);
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formData.type]);

  const handleExportCSV = () => {
    const headers = ["Sembol", "Tur", "Miktar", "Maliyet", "Anlik Fiyat", "Toplam Deger", "Kar/Zarar"];
    const rows = Object.values(groupedAssets).map((g) => {
      const totalValue = g.totalQuantity * (g.currentPrice || 0);
      const profit = totalValue - g.totalCost;
      return [
        g.symbol,
        g.type,
        g.totalQuantity,
        g.totalCost.toFixed(2),
        (g.currentPrice || 0).toFixed(2),
        totalValue.toFixed(2),
        profit.toFixed(2)
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portfoy_ozeti.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value === "" ? 0 : parseFloat(value) }));
  };

  async function handleAdd() {
    if (!formData.symbol || !formData.quantity || isNaN(formData.quantity) || formData.quantity <= 0) {
      setError("Lütfen sembol seçin ve geçerli bir miktar girin.");
      return;
    }
    if (!formData.useCurrentPrice && (isNaN(formData.purchasePrice) || formData.purchasePrice < 0)) {
      setError("Lütfen geçerli bir alış fiyatı girin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let finalSymbol = formData.symbol;
      if (finalSymbol.includes("(")) finalSymbol = finalSymbol.split(" ")[0];

      await addAsset({ ...formData, symbol: finalSymbol.toUpperCase() });
      setIsAdding(false);
      setFormData({ type: "BIST", symbol: "", quantity: 0, purchasePrice: 0, useCurrentPrice: false, description: "" });
      setSearchQuery("");

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

  const handleExportFixedCSV = () => {
    const headers = ["Varlik Adi", "Tur", "Deger"];
    const rows = (fixedAssets || []).map((a) => {
      return [
        a.name,
        a.type,
        a.value.toFixed(2)
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sabit_varliklar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function handleAddFixed() {
    if (!fixedAssetFormData.name || !fixedAssetFormData.value || fixedAssetFormData.value <= 0) {
      setError("Lütfen isim girin ve geçerli bir değer belirtin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await addFixedAsset(fixedAssetFormData);
      setIsAdding(false);
      setFixedAssetFormData({ name: "", type: "Gayrimenkul", value: 0 });
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
      {/* View Tabs */}
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
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={activeTab === "financial" ? handleExportCSV : handleExportFixedCSV}
            className="rounded-full px-4 py-2 h-12 text-sm font-semibold text-primary border-border/30 hover:bg-primary/5 bg-card shadow-ambient-low"
          >
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full px-4 py-2 h-12 text-sm font-semibold text-primary border-border/30 hover:bg-primary/5 bg-card shadow-ambient-low"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Yenile
          </Button>
          <Button
            onClick={() => { setIsAdding(!isAdding); setError(null); }}
            className={cn(
              "rounded-full px-6 py-3 h-12 text-base font-semibold shadow-ambient-medium transition-all duration-300",
              isAdding ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isAdding ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
            {isAdding ? "Vazgeç" : (activeTab === "financial" ? "Yatırım Ekle" : "Varlık Ekle")}
          </Button>
        </div>
      </div>

      {/* Add Asset Form */}
      {isAdding && (
        <Card className="p-8 bg-card border-border/30 shadow-ambient-high rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
          {activeTab === "financial" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Varlık Türü</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v), symbol: "" }))}>
                  <SelectTrigger className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/30">
                    <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                    <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                    <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                    <SelectItem value="BES">BES (Bireysel Emeklilik)</SelectItem>
                    <SelectItem value="FAIZ">Vadeli Mevduat (Faiz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 relative" ref={inputRef}>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Sembol Arama</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                  <Input
                    placeholder="Örn: THYAO, BTC, AAPL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-muted border-border/30 h-12 rounded-xl focus:ring-primary"
                  />
                </div>

                {showSearch && searchResults.length > 0 && rect && createPortal(
                  <div
                    className="fixed z-[9999] bg-card border border-border/30 shadow-ambient-high rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: rect.bottom + 8, left: rect.left, width: rect.width }}
                  >
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="p-4 hover:bg-muted cursor-pointer border-b border-border/10 last:border-0 transition-colors flex items-center justify-between group"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const sym = `${result.symbol} (${result.shortname || result.symbol})`;
                          // Otomatik kategori eşleme
                          setFormData((prev) => ({
                            ...prev,
                            symbol: sym,
                            type: result.suggestedCategory || prev.type
                          }));
                          setSearchQuery(sym);
                          setShowSearch(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary group-hover:text-primary/80 transition-colors">{result.symbol}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground opacity-70">
                              {result.suggestedCategory === "CRYPTO" ? "Kripto" :
                                result.suggestedCategory === "BIST" ? "BIST" :
                                  result.suggestedCategory === "NASDAQ" ? "NASDAQ" :
                                    result.suggestedCategory === "GOLD" ? "Altın/Emtia" : "Varlık"}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground opacity-60 truncate max-w-[200px]">{result.shortname || result.longname}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Miktar</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity === 0 ? "" : formData.quantity}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Alış Fiyatı (Opsiyonel)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    disabled={formData.useCurrentPrice}
                    value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                    onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant={formData.useCurrentPrice ? "default" : "outline"}
                    onClick={() => setFormData(p => ({ ...p, useCurrentPrice: !p.useCurrentPrice }))}
                    className={cn(
                      "h-12 rounded-xl border-border/30 transition-all",
                      formData.useCurrentPrice ? "bg-accent text-accent-foreground hover:bg-accent/80" : "bg-card text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Güncel
                  </Button>
                </div>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Açıklama</Label>
                <Input
                  placeholder="Örn: Emeklilik fonu için..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Varlık Adı</Label>
                <Input
                  placeholder="Örn: 2022 Model BMW, Kadıköy'de Ev..."
                  value={fixedAssetFormData.name}
                  onChange={(e) => setFixedAssetFormData(p => ({ ...p, name: e.target.value }))}
                  className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Varlık Türü</Label>
                <Select value={fixedAssetFormData.type} onValueChange={(v) => setFixedAssetFormData((p) => ({ ...p, type: String(v) }))}>
                  <SelectTrigger className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/30">
                    <SelectItem value="Gayrimenkul">Gayrimenkul</SelectItem>
                    <SelectItem value="Taşıt">Taşıt</SelectItem>
                    <SelectItem value="Elektronik">Elektronik</SelectItem>
                    <SelectItem value="Eşya/Mobilya">Eşya/Mobilya</SelectItem>
                    <SelectItem value="Kıymetli Eşya">Kıymetli Eşya</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Değer (₺)</Label>
                <Input
                  type="number"
                  min="0"
                  value={fixedAssetFormData.value === 0 ? "" : fixedAssetFormData.value}
                  onChange={(e) => setFixedAssetFormData(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                  className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary"
                />
              </div>
            </div>
          )}

          {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

          <div className="mt-8 flex justify-end">
            <Button
              onClick={activeTab === "financial" ? handleAdd : handleAddFixed}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 py-6 h-auto text-lg font-bold shadow-ambient-medium"
            >
              {loading ? "Kaydediliyor..." : (activeTab === "financial" ? "Yatırımı Kaydet" : "Varlığı Kaydet")}
            </Button>
          </div>
        </Card>
      )}

      {/* Summary Dashboard */}
      {!isAdding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-1 p-6 bg-card border-border/30 shadow-ambient-medium rounded-[32px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-70 relative z-10">
              {activeTab === "financial" ? "Toplam Portföy Değeri" : "Toplam Varlık Değeri"}
            </h3>
            <div className="text-4xl font-heading font-bold text-primary mb-4 relative z-10">
              {activeTab === "financial"
                ? Object.values(groupedAssets).reduce((sum: number, g) => sum + (g.totalQuantity * (g.currentPrice || 0)), 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })
                : (fixedAssets || []).reduce((sum: number, a) => sum + a.value, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })
              } ₺
            </div>

            {activeTab === "financial" ? (
              <>
                <div className="text-sm font-medium text-muted-foreground relative z-10">
                  Maliyet: {Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalCost, 0).toLocaleString("tr-TR")} ₺
                </div>
                {(() => {
                  const totalCost = Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalCost, 0);
                  const currentVal = Object.values(groupedAssets).reduce((sum: number, g) => sum + (g.totalQuantity * (g.currentPrice || 0)), 0);
                  const profit = currentVal - totalCost;
                  const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
                  return (
                    <div className={cn("inline-flex items-center px-3 py-1.5 rounded-xl mt-4 w-fit font-bold relative z-10 shadow-sm", profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                      {profit >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {profitPct > 0 ? "+" : ""}{profitPct.toFixed(2)}% ({profit.toLocaleString("tr-TR")} ₺)
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
              {activeTab === "financial" ? "Portföy Dağılımı (Kategori Bazlı)" : "Sabit Varlık Dağılımı"}
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
      )}

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
                    const totalValue = group.totalQuantity * (group.currentPrice || 0);
                    const totalPortfolioValue = Object.values(groupedAssets).reduce((sum: number, g) => {
                      return sum + (g.totalQuantity * (g.currentPrice || 0));
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
                                <p className="text-muted-foreground text-sm font-medium mt-1">
                                  {group.totalQuantity.toLocaleString("tr-TR")} Adet
                                  <span className="ml-2 text-[10px] font-bold text-muted-foreground bg-muted border border-border/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    Pay: %{portfolioRatio.toFixed(1)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{totalValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</div>
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
                              {group.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-card rounded-xl border border-border/10 shadow-sm">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">{item.quantity.toLocaleString("tr-TR")} @ {item.purchasePrice?.toLocaleString("tr-TR")} ₺</span>
                                    <span className="text-[10px] text-muted-foreground opacity-60">{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSellModalState({ assetId: item.id }); setError(null); }} className="h-8 text-xs font-bold border-border/30">Sat</Button>
                                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              ))}
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
                  filteredFixed.map((asset) => (
                    <Card key={asset.id} className="p-6 hover:shadow-ambient-medium transition-all duration-300 border-border/20 group">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-bold">
                            {asset.type.substring(0, 1)}
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-lg text-primary">{asset.name}</h4>
                            <span className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase">{asset.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">{asset.value.toLocaleString("tr-TR")} ₺</div>
                            <div className="text-[10px] font-medium text-muted-foreground opacity-40">Tahmini Değer</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFixed(asset.id)}
                            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
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
                        Fiyat: {(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0)).toLocaleString("tr-TR")} ₺
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
                    <div className="text-xs font-medium text-muted-foreground opacity-60 mt-1">Fiyat: {(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0)).toLocaleString("tr-TR")} ₺</div>
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
