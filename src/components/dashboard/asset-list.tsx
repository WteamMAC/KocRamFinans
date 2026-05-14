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
  const [theme, setThemeState] = useState<"light" | "dark">("light");
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
    // Sayfa yüklendiğinde önceden seçili temayı kontrol et
    if (document.documentElement.classList.contains("dark")) {
      setThemeState("dark");
    } else if (localStorage.getItem("theme") === "dark") {
      setThemeState("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
        <div className="flex items-center gap-2 p-1.5 bg-[#8c5000]/5 w-fit rounded-2xl border border-[#8c5000]/10 mb-2">
          <button
            onClick={() => setActiveTab("financial")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "financial"
                ? "bg-[#8c5000] text-white shadow-ambient-medium"
                : "text-[#8c5000] hover:bg-[#8c5000]/10"
            )}
          >
            <Coins className="h-4 w-4" /> Finansal Yatırımlar
          </button>
          <button
            onClick={() => setActiveTab("fixed")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "fixed"
                ? "bg-[#8c5000] text-white shadow-ambient-medium"
                : "text-[#8c5000] hover:bg-[#8c5000]/10"
            )}
          >
            <LayoutGrid className="h-4 w-4" /> Sabit Varlıklar
          </button>
        </div>
      )}

      {/* Header & Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-[#8c5000]">
            {activeTab === "financial" ? "Varlık Portföyü" : "Sabit Varlıklarım"}
          </h2>
          <p className="text-[#554336] mt-1">
            {activeTab === "financial"
              ? "Yatırımlarınızı profesyonel bir bakış açısıyla yönetin."
              : "Ev, araba ve diğer somut varlıklarınızı buradan takip edin."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-12 h-12 shrink-0 text-[#8c5000] border-[#dbc2b0]/30 hover:bg-[#8c5000]/5 bg-white shadow-ambient-low transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={activeTab === "financial" ? handleExportCSV : handleExportFixedCSV}
            className="rounded-full px-4 py-2 h-12 text-sm font-semibold text-[#8c5000] border-[#dbc2b0]/30 hover:bg-[#8c5000]/5 bg-white shadow-ambient-low"
          >
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full px-4 py-2 h-12 text-sm font-semibold text-[#8c5000] border-[#dbc2b0]/30 hover:bg-[#8c5000]/5 bg-white shadow-ambient-low"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Yenile
          </Button>
          <Button
            onClick={() => { setIsAdding(!isAdding); setError(null); }}
            className={cn(
              "rounded-full px-6 py-3 h-12 text-base font-semibold shadow-ambient-medium transition-all duration-300",
              isAdding ? "bg-[#e3e2e0] text-[#191c1d] hover:bg-[#dbdad7]" : "bg-[#8c5000] text-white hover:bg-[#6e3f00]"
            )}
          >
            {isAdding ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
            {isAdding ? "Vazgeç" : (activeTab === "financial" ? "Yatırım Ekle" : "Varlık Ekle")}
          </Button>
        </div>
      </div>

      {/* Add Asset Form */}
      {isAdding && (
        <Card className="p-8 bg-white border-[#dbc2b0]/30 shadow-ambient-high rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
          {activeTab === "financial" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Varlık Türü</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v), symbol: "" }))}>
                  <SelectTrigger className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#8c5000]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#dbc2b0]/30">
                    <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                    <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                    <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 relative" ref={inputRef}>
                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Sembol Arama</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#554336] opacity-50" />
                  <Input
                    placeholder="Örn: THYAO, BTC, AAPL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#8c5000]"
                  />
                </div>

                {showSearch && searchResults.length > 0 && rect && createPortal(
                  <div
                    className="fixed z-[9999] bg-white border border-[#dbc2b0]/30 shadow-ambient-high rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: rect.bottom + 8, left: rect.left, width: rect.width }}
                  >
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="p-4 hover:bg-[#f8f9fa] cursor-pointer border-b border-[#dbc2b0]/10 last:border-0 transition-colors flex items-center justify-between group"
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
                            <span className="font-bold text-[#8c5000] group-hover:text-[#666000] transition-colors">{result.symbol}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[#554336] opacity-70">
                              {result.suggestedCategory === "CRYPTO" ? "Kripto" :
                                result.suggestedCategory === "BIST" ? "BIST" :
                                  result.suggestedCategory === "NASDAQ" ? "NASDAQ" :
                                    result.suggestedCategory === "GOLD" ? "Altın/Emtia" : "Varlık"}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#554336] opacity-60 truncate max-w-[200px]">{result.shortname || result.longname}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#efe440] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Miktar</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity === 0 ? "" : formData.quantity}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#8c5000]"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">Alış Fiyatı (Opsiyonel)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    disabled={formData.useCurrentPrice}
                    value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                    onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                    className="bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl focus:ring-[#001b44]"
                  />
                  <Button
                    type="button"
                    variant={formData.useCurrentPrice ? "default" : "outline"}
                    onClick={() => setFormData(p => ({ ...p, useCurrentPrice: !p.useCurrentPrice }))}
                    className={cn(
                      "h-12 rounded-xl border-[#dbc2b0]/30 transition-all",
                      formData.useCurrentPrice ? "bg-[#efe440] text-[#6a6500] hover:bg-[#e9c349]" : "bg-white text-[#554336]"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Güncel
                  </Button>
                </div>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">Açıklama</Label>
                <Input
                  placeholder="Örn: Emeklilik fonu için..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl focus:ring-[#001b44]"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Varlık Adı</Label>
                <Input
                  placeholder="Örn: 2022 Model BMW, Kadıköy'de Ev..."
                  value={fixedAssetFormData.name}
                  onChange={(e) => setFixedAssetFormData(p => ({ ...p, name: e.target.value }))}
                  className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#8c5000]"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Varlık Türü</Label>
                <Select value={fixedAssetFormData.type} onValueChange={(v) => setFixedAssetFormData((p) => ({ ...p, type: String(v) }))}>
                  <SelectTrigger className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#8c5000]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#dbc2b0]/30">
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
                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Değer (₺)</Label>
                <Input
                  type="number"
                  min="0"
                  value={fixedAssetFormData.value === 0 ? "" : fixedAssetFormData.value}
                  onChange={(e) => setFixedAssetFormData(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#8c5000]"
                />
              </div>
            </div>
          )}

          {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

          <div className="mt-8 flex justify-end">
            <Button
              onClick={activeTab === "financial" ? handleAdd : handleAddFixed}
              disabled={loading}
              className="bg-[#8c5000] text-white hover:bg-[#6e3f00] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-ambient-medium"
            >
              {loading ? "Kaydediliyor..." : (activeTab === "financial" ? "Yatırımı Kaydet" : "Varlığı Kaydet")}
            </Button>
          </div>
        </Card>
      )}

      {/* Summary Dashboard */}
      {!isAdding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-1 p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#efe440]/20 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-2 opacity-70 relative z-10">
              {activeTab === "financial" ? "Toplam Portföy Değeri" : "Toplam Varlık Değeri"}
            </h3>
            <div className="text-4xl font-heading font-bold text-[#8c5000] mb-4 relative z-10">
              {activeTab === "financial"
                ? Object.values(groupedAssets).reduce((sum: number, g) => sum + (g.totalQuantity * (g.currentPrice || 0)), 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })
                : (fixedAssets || []).reduce((sum: number, a) => sum + a.value, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })
              } ₺
            </div>

            {activeTab === "financial" ? (
              <>
                <div className="text-sm font-medium text-[#554336] relative z-10">
                  Maliyet: {Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalCost, 0).toLocaleString("tr-TR")} ₺
                </div>
                {(() => {
                  const totalCost = Object.values(groupedAssets).reduce((sum: number, g) => sum + g.totalCost, 0);
                  const currentVal = Object.values(groupedAssets).reduce((sum: number, g) => sum + (g.totalQuantity * (g.currentPrice || 0)), 0);
                  const profit = currentVal - totalCost;
                  const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
                  return (
                    <div className={cn("inline-flex items-center px-3 py-1.5 rounded-xl mt-4 w-fit font-bold relative z-10", profit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                      {profit >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {profitPct > 0 ? "+" : ""}{profitPct.toFixed(2)}% ({profit.toLocaleString("tr-TR")} ₺)
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-sm font-medium text-[#554336] opacity-60 relative z-10">
                {(fixedAssets || []).length} Adet Kayıtlı Varlık
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2 p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] flex flex-col">
            <h3 className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-4 opacity-70">
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
              <div className="p-2 bg-[#efe440]/20 rounded-lg shrink-0">
                <Wallet className="h-5 w-5 text-[#666000]" />
              </div>
              <h3 className="text-xl font-heading font-bold text-[#8c5000] truncate">
                {activeTab === "financial" ? "Aktif Yatırımlarım" : "Kayıtlı Sabit Varlıklarım"}
              </h3>
            </div>
            <div className="relative w-full max-w-[150px] sm:max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#554336] opacity-50" />
              <Input
                placeholder="Ara..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-white border-[#dbc2b0]/30 shadow-ambient-low rounded-xl focus:ring-[#8c5000]"
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
                  <div className="lg:col-span-2 p-12 text-center bg-white rounded-[32px] border border-dashed border-[#dbc2b0] text-[#554336] opacity-60 shadow-ambient-low">
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
                          "overflow-hidden transition-all duration-500 cursor-pointer border-[#dbc2b0]/20 group h-fit",
                          isExpanded ? "ring-2 ring-[#efe440] shadow-ambient-high scale-[1.01]" : "hover:shadow-ambient-medium hover:border-[#efe440]/40 shadow-ambient-low"
                        )}
                        onClick={() => setExpandedSymbol(isExpanded ? null : group.symbol)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <div className="w-14 h-14 bg-[#f8f9fa] rounded-2xl flex items-center justify-center font-bold text-[#8c5000] text-lg border border-[#dbc2b0]/20 shadow-inner group-hover:bg-[#efe440]/10 transition-colors">
                                {group.symbol.substring(0, 3)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-heading font-bold text-xl text-[#8c5000]">{group.symbol}</h4>
                                  <span className="text-[10px] font-bold text-[#554336] bg-[#edeeef] px-2 py-0.5 rounded-full uppercase">{group.type}</span>
                                </div>
                                <p className="text-[#554336] text-sm font-medium mt-1">
                                  {group.totalQuantity.toLocaleString("tr-TR")} Adet
                                  <span className="ml-2 text-[10px] font-bold text-[#554336] bg-[#f8f9fa] border border-[#dbc2b0]/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    Pay: %{portfolioRatio.toFixed(1)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#8c5000]">{totalValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</div>
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
                            <div className="mt-6 pt-6 border-t border-[#dbc2b0]/10 space-y-4 animate-in slide-in-from-top-2">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-[#dbc2b0]/10 shadow-sm">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#191c1d]">{item.quantity.toLocaleString("tr-TR")} @ {item.purchasePrice?.toLocaleString("tr-TR")} ₺</span>
                                    <span className="text-[10px] text-[#554336] opacity-60">{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSellModalState({ assetId: item.id }); setError(null); }} className="h-8 text-xs font-bold border-[#dbc2b0]/30">Sat</Button>
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
                  <div className="lg:col-span-2 p-12 text-center bg-white rounded-[32px] border border-dashed border-[#dbc2b0] text-[#554336] opacity-60 shadow-ambient-low">
                    {filterQuery ? "Aramanıza uygun varlık bulunamadı." : "Henüz bir sabit varlık eklemediniz."}
                  </div>
                ) : (
                  filteredFixed.map((asset) => (
                    <Card key={asset.id} className="p-6 hover:shadow-ambient-medium transition-all duration-300 border-[#dbc2b0]/20 group">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#8c5000]/5 rounded-2xl flex items-center justify-center text-[#8c5000] font-bold">
                            {asset.type.substring(0, 1)}
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-lg text-[#8c5000]">{asset.name}</h4>
                            <span className="text-[10px] font-bold text-[#554336] opacity-60 uppercase">{asset.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xl font-bold text-[#8c5000]">{asset.value.toLocaleString("tr-TR")} ₺</div>
                            <div className="text-[10px] font-medium text-[#554336] opacity-40">Tahmini Değer</div>
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
            <div className="p-2 bg-[#8c5000]/10 rounded-lg">
              <History className="h-5 w-5 text-[#8c5000]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-[#8c5000]">İşlem Geçmişi</h3>
          </div>
          <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
            <div className="divide-y divide-[#dbc2b0]/10">
              {history.length === 0 ? (
                <div className="p-12 text-center text-[#434750] opacity-60">Kayıtlı işlem bulunamadı.</div>
              ) : (
                history.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-6 hover:bg-[#f8f9fa] transition-colors flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                        log.transactionType === "SELL" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {log.transactionType === "SELL" ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#8c5000]">{log.symbol}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            log.transactionType === "SELL" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {log.transactionType === "SELL" ? "SATIŞ" : "ALIŞ"}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-[#554336] flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleDateString("tr-TR")} {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {log.description && (
                          <p className="text-[10px] text-[#554336] opacity-80 mt-1 italic">
                            &quot;{log.description}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#8c5000]">{log.quantity.toLocaleString("tr-TR")} Adet</div>
                      <div className="text-xs font-medium text-[#554336] opacity-60 mt-1">
                        Fiyat: {(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0)).toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {history.length > 5 && (
              <div onClick={() => setShowHistoryModal(true)} className="p-4 bg-[#f8f9fa] border-t border-[#dbc2b0]/10 text-center text-xs font-bold text-[#8c5000] cursor-pointer hover:bg-[#edeeef] transition-colors">
                Tüm İşlemleri Gör
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal for All History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#191c1d]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#dbc2b0]/20 flex justify-between items-center bg-[#f8f9fa]">
              <div>
                <h3 className="text-xl font-heading font-bold text-[#8c5000]">Tüm İşlem Geçmişi</h3>
                <p className="text-xs text-[#554336] mt-1">Geçmişte yaptığınız tüm alım ve satım kayıtları.</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm border border-[#dbc2b0]/30 hover:bg-rose-50 hover:text-rose-500" onClick={() => setShowHistoryModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 divide-y divide-[#dbc2b0]/10">
              {history.map((log) => (
                <div key={log.id} className="py-4 hover:bg-[#f8f9fa] transition-colors flex justify-between items-center group first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", log.transactionType === "SELL" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                      {log.transactionType === "SELL" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#8c5000]">{log.symbol}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", log.transactionType === "SELL" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>
                          {log.transactionType === "SELL" ? "SATIŞ" : "ALIŞ"}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-[#554336] mt-1">
                        {new Date(log.createdAt).toLocaleDateString("tr-TR")} {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {log.description && (
                        <p className="text-[10px] text-[#554336] opacity-80 mt-1 italic">
                          &quot;{log.description}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#8c5000]">{log.quantity.toLocaleString("tr-TR")} Adet</div>
                    <div className="text-xs font-medium text-[#554336] opacity-60 mt-1">Fiyat: {(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0)).toLocaleString("tr-TR")} ₺</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Selling Asset */}
      {sellModalState.assetId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#191c1d]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#dbc2b0]/20 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-heading font-bold text-[#8c5000]">Varlık Satışı</h3>
                <p className="text-xs text-[#554336] mt-1">Satış sonrası elde edilen tutarı ne yapmak istersiniz?</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm border border-[#dbc2b0]/30 hover:bg-rose-50 hover:text-rose-500" onClick={() => setSellModalState({ assetId: null })}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <Button onClick={() => handleSell(sellModalState.assetId!, "KEEP_TL")} disabled={loading} className="w-full justify-start p-6 text-base bg-[#f8f9fa] text-[#554336] hover:bg-[#edeeef] rounded-xl border border-[#dbc2b0]/20">
                {loading ? "İşleniyor..." : "Nakit (TL) olarak portföyde tut"}
              </Button>
              <Button onClick={() => handleSell(sellModalState.assetId!, "KEEP_USDT")} disabled={loading} className="w-full justify-start p-6 text-base bg-[#f8f9fa] text-[#554336] hover:bg-[#edeeef] rounded-xl border border-[#dbc2b0]/20">
                {loading ? "İşleniyor..." : "Nakit (USDT) olarak portföyde tut"}
              </Button>
              <Button onClick={() => handleSell(sellModalState.assetId!, "WITHDRAW")} disabled={loading} className="w-full justify-start p-6 text-base bg-[#f8f9fa] text-[#554336] hover:bg-[#edeeef] rounded-xl border border-[#dbc2b0]/20">
                {loading ? "İşleniyor..." : "Parayı çek (Aylık nakit akışına ekle)"}
              </Button>
              {error && <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
            </div>
            <div className="p-4 bg-white/50 border-t border-[#dbc2b0]/10 flex justify-end">
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
