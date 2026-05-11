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
  DollarSign,
  Briefcase,
  History,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ArrowRight
} from "lucide-react";
import { addAsset, deleteAsset, sellAsset } from "@/app/actions/assets";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { searchSymbolsAction } from "@/app/actions/market";

interface AssetListProps {
  assets: any[];
  allInvestments: any[];
}

export function AssetList({ assets, allInvestments }: AssetListProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

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

  const groupedAssets = assets.reduce((acc: any, asset: any) => {
    const symbol = asset.symbol || "Diğer";
    if (!acc[symbol]) {
      acc[symbol] = { symbol, type: asset.type, totalQuantity: 0, totalCost: 0, currentPrice: asset.currentPrice, items: [] };
    }
    acc[symbol].totalQuantity += asset.quantity;
    acc[symbol].totalCost += asset.amount || (asset.quantity * (asset.purchasePrice || 0));
    acc[symbol].items.push(asset);
    return acc;
  }, {});

  const history = allInvestments.slice().sort(
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

  async function handleSell(id: string) {
    if (!confirm("Bu varlığı güncel piyasa fiyatından satmak istediğinize emin misiniz?")) return;
    setLoading(true);
    setError(null);
    try {
      await sellAsset(id);
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

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-[#001b44]">Varlık Portföyü</h2>
          <p className="text-[#434750] mt-1">Yatırımlarınızı profesyonel bir bakış açısıyla yönetin.</p>
        </div>
        <Button
          onClick={() => { setIsAdding(!isAdding); setError(null); }}
          className={cn(
            "rounded-full px-6 py-6 h-auto text-base font-semibold shadow-md transition-all duration-300",
            isAdding ? "bg-[#e3e2e0] text-[#1a1c1a] hover:bg-[#dbdad7]" : "bg-[#001b44] text-white hover:bg-[#002f6c]"
          )}
        >
          {isAdding ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
          {isAdding ? "Vazgeç" : "Yeni Yatırım Ekle"}
        </Button>
      </div>

      {/* Add Asset Form */}
      {isAdding && (
        <Card className="p-8 bg-white border-[#c4c6d2]/30 shadow-xl rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">Varlık Türü</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v), symbol: "" }))}>
                <SelectTrigger className="bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl focus:ring-[#001b44]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#c4c6d2]/30">
                  <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                  <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                  <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                  <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 relative" ref={inputRef}>
              <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">Sembol Arama</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#434750] opacity-50" />
                <Input
                  placeholder="Örn: THYAO, BTC, AAPL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl focus:ring-[#001b44]"
                />
              </div>

              {showSearch && searchResults.length > 0 && rect && createPortal(
                <div 
                  className="fixed z-[9999] bg-white border border-[#c4c6d2]/30 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  style={{ top: rect.bottom + 8, left: rect.left, width: rect.width }}
                >
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-4 hover:bg-[#faf9f6] cursor-pointer border-b border-[#c4c6d2]/10 last:border-0 transition-colors flex items-center justify-between group"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const sym = `${result.symbol} (${result.shortname || result.symbol})`;
                        setFormData((prev) => ({ ...prev, symbol: sym }));
                        setSearchQuery(sym);
                        setShowSearch(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[#001b44] group-hover:text-[#735c00] transition-colors">{result.symbol}</span>
                        <span className="text-[10px] text-[#434750] opacity-60 truncate max-w-[200px]">{result.shortname || result.longname}</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#fed65b] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">Miktar</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={formData.quantity === 0 ? "" : formData.quantity}
                onChange={(e) => handleNumberChange("quantity", e.target.value)}
                className="bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl focus:ring-[#001b44]"
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
                    "h-12 rounded-xl border-[#c4c6d2]/30 transition-all",
                    formData.useCurrentPrice ? "bg-[#fed65b] text-[#745c00] hover:bg-[#e9c349]" : "bg-white text-[#434750]"
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

          {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleAdd}
              disabled={loading}
              className="bg-[#001b44] text-white hover:bg-[#002f6c] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-lg"
            >
              {loading ? "Kaydediliyor..." : "Yatırımı Kaydet"}
            </Button>
          </div>
        </Card>
      )}

      {/* Asset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-[#fed65b]/20 rounded-lg">
              <Wallet className="h-5 w-5 text-[#735c00]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-[#001b44]">Aktif Varlıklarım</h3>
          </div>
          
          <div className="space-y-4">
            {Object.values(groupedAssets).length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-[#c4c6d2] text-[#434750] opacity-60">
                Henüz aktif bir varlık bulunmuyor.
              </div>
            ) : (
              Object.values(groupedAssets).map((group: any) => {
                const totalValue = group.totalQuantity * (group.currentPrice || 0);
                const totalPortfolioValue = Object.values(groupedAssets).reduce((sum: number, g: any) => {
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
                      "overflow-hidden transition-all duration-500 cursor-pointer border-[#c4c6d2]/20 group",
                      isExpanded ? "ring-2 ring-[#fed65b] shadow-2xl scale-[1.02]" : "hover:shadow-lg hover:border-[#fed65b]/40"
                    )}
                    onClick={() => setExpandedSymbol(isExpanded ? null : group.symbol)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-[#faf9f6] rounded-2xl flex items-center justify-center font-bold text-[#001b44] text-lg border border-[#c4c6d2]/20 shadow-inner group-hover:bg-[#fed65b]/10 transition-colors">
                            {group.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-heading font-bold text-xl text-[#001b44]">{group.symbol}</h4>
                              <span className="text-[10px] font-bold text-[#747781] bg-[#f4f3f1] px-2 py-0.5 rounded-full uppercase">{group.type}</span>
                            </div>
                            <p className="text-[#434750] text-sm font-medium mt-1">
                              {group.totalQuantity.toLocaleString("tr-TR")} Adet
                              <span className="ml-2 text-[10px] font-bold text-[#747781] bg-[#faf9f6] border border-[#c4c6d2]/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                Portföy Payı: %{portfolioRatio.toFixed(1)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#001b44]">{totalValue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</div>
                          <div className={cn(
                            "flex items-center justify-end text-sm font-bold mt-1",
                            profit >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {profit >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                            {profitPercent.toFixed(2)}% ({profit.toLocaleString("tr-TR")} ₺)
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-8 pt-8 border-t border-[#c4c6d2]/20 space-y-4 animate-in slide-in-from-top-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#c4c6d2]/10">
                              <p className="text-[10px] font-bold text-[#747781] uppercase tracking-wider mb-1">Maliyet</p>
                              <p className="text-lg font-bold text-[#001b44]">{group.totalCost.toLocaleString("tr-TR")} ₺</p>
                            </div>
                            <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#c4c6d2]/10">
                              <p className="text-[10px] font-bold text-[#747781] uppercase tracking-wider mb-1">Anlık Fiyat</p>
                              <p className="text-lg font-bold text-[#001b44]">{group.currentPrice?.toLocaleString("tr-TR")} ₺</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">Alım Geçmişi</p>
                            {group.items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-[#c4c6d2]/10 hover:border-[#fed65b]/50 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-[#fed65b]"></div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#1a1c1a]">{item.quantity.toLocaleString("tr-TR")} Adet @ {item.purchasePrice?.toLocaleString("tr-TR")} ₺</span>
                                    <span className="text-[10px] text-[#747781] flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(item.createdAt).toLocaleDateString("tr-TR")} {new Date(item.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleSell(item.id); }}
                                    className="h-9 px-4 rounded-xl border-[#c4c6d2]/30 text-[#001b44] font-bold text-xs hover:bg-[#001b44] hover:text-white transition-all"
                                  >
                                    Sat
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                    className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-[#001b44]/10 rounded-lg">
              <History className="h-5 w-5 text-[#001b44]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-[#001b44]">İşlem Geçmişi</h3>
          </div>
          <Card className="bg-white border-[#c4c6d2]/20 shadow-lg rounded-[32px] overflow-hidden">
            <div className="divide-y divide-[#c4c6d2]/10">
              {history.length === 0 ? (
                <div className="p-12 text-center text-[#434750] opacity-60">Kayıtlı işlem bulunamadı.</div>
              ) : (
                history.map((log: any) => (
                  <div key={log.id} className="p-6 hover:bg-[#faf9f6] transition-colors flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                        log.transactionType === "SELL" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {log.transactionType === "SELL" ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#001b44]">{log.symbol}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            log.transactionType === "SELL" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {log.transactionType === "SELL" ? "SATIŞ" : "ALIŞ"}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-[#747781] flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleDateString("tr-TR")} {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#001b44]">{log.quantity.toLocaleString("tr-TR")} Adet</div>
                      <div className="text-xs font-medium text-[#434750] opacity-60 mt-1">
                        Fiyat: {(log.transactionType === "BUY" ? (log.purchasePrice || 0) : (log.soldPrice || 0)).toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {history.length > 5 && (
               <div className="p-4 bg-[#faf9f6] border-t border-[#c4c6d2]/10 text-center text-xs font-bold text-[#001b44] cursor-pointer hover:bg-[#f4f3f1] transition-colors">
                  Tüm İşlemleri Gör
               </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
