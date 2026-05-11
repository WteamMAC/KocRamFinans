"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trash2, Plus, TrendingDown, TrendingUp, RefreshCw,
  ChevronDown, ChevronUp, History, Tag, AlertCircle,
} from "lucide-react";
import { addAsset, deleteAsset, sellAsset } from "@/app/actions/assets";
import { searchSymbolsAction } from "@/app/actions/market";

interface AssetListProps {
  assets: any[];
  allInvestments?: any[];
}

export function AssetList({ assets, allInvestments = [] }: AssetListProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: "BIST" as string,
    symbol: "",
    quantity: 0,
    purchasePrice: 0,
    useCurrentPrice: false,
    description: "",
  });

  useEffect(() => { setMounted(true); }, []);

  // Gruplandırılmış varlıklar
  const groupedAssets = assets.reduce((acc: any, asset: any) => {
    const symbol = asset.symbol || "Diğer";
    if (!acc[symbol]) {
      acc[symbol] = { symbol, type: asset.type, totalQuantity: 0, totalCost: 0, currentPrice: asset.currentPrice, items: [] };
    }
    acc[symbol].totalQuantity += asset.quantity;
    acc[symbol].totalCost += asset.quantity * asset.purchasePrice;
    acc[symbol].items.push(asset);
    return acc;
  }, {});

  const groupedList = Object.values(groupedAssets).map((group: any) => {
    const avgPrice = group.totalCost / group.totalQuantity;
    const currentValue = group.totalQuantity * group.currentPrice;
    const profit = currentValue - group.totalCost;
    const profitPercent = group.totalCost > 0 ? (profit / group.totalCost) * 100 : 0;
    return { ...group, avgPrice, currentValue, profit, profitPercent };
  });

  const history = allInvestments.slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Coin arama (debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.symbol.length >= 2 && !formData.symbol.includes("(")) {
        const results = await searchSymbolsAction(formData.symbol, formData.type);
        setSearchResults(results);
        if (results.length > 0 && inputRef.current) {
          setDropdownRect(inputRef.current.getBoundingClientRect());
          setShowSearch(true);
        } else {
          setShowSearch(false);
        }
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.symbol, formData.type]);

  // Dropdown pozisyonunu scroll/resize'da güncelle
  const updateRect = useCallback(() => {
    if (showSearch && inputRef.current) {
      setDropdownRect(inputRef.current.getBoundingClientRect());
    }
  }, [showSearch]);

  useEffect(() => {
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [updateRect]);

  async function handleAdd() {
    if (!formData.symbol || formData.quantity <= 0) {
      setError("Lütfen sembol seçin ve geçerli bir miktar girin.");
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
      router.refresh();
    } catch (err: any) {
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
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Satış sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteAsset(id);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Silme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const handleNumberChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value === "" ? 0 : parseFloat(value) }));
  };

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // Portal dropdown — body seviyesinde render edilir, hiçbir overflow/z-index engeli yok
  const SearchDropdown = mounted && showSearch && searchResults.length > 0 && dropdownRect
    ? createPortal(
        <div
          style={{
            position: "fixed",
            top: dropdownRect.bottom + 4,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 999999,
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {searchResults.map((result) => (
            <button
              key={result.symbol}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", background: "none", cursor: "pointer" }}
              onMouseDown={(e) => {
                e.preventDefault(); // blur'dan önce çalışsın
                setFormData((prev) => ({
                  ...prev,
                  symbol: `${result.symbol} (${result.shortname || result.symbol})`,
                }));
                setShowSearch(false);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>{result.symbol}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {result.shortname || result.symbol}
              </div>
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="space-y-8 pb-20">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Portföy Varlıklarım</h3>
        <Button onClick={() => { setIsAdding(!isAdding); setError(null); }} variant={isAdding ? "outline" : "default"} className="shadow-sm">
          {isAdding ? "Vazgeç" : <><Plus className="w-4 h-4 mr-2" />Yeni Alım Ekle</>}
        </Button>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Yeni Alım Formu */}
      {isAdding && (
        <Card className="border-2 border-primary/10 bg-slate-50/50 shadow-md">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              {/* Varlık Türü */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">VARLIK TÜRÜ</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v), symbol: "" }))}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                    <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                    <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sembol — Portal dropdown buraya bağlı */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">SEMBOL / VARLIK</Label>
                <Input
                  ref={inputRef}
                  placeholder="Örn: BTC, THYAO"
                  value={formData.symbol}
                  onChange={(e) => setFormData((p) => ({ ...p, symbol: e.target.value }))}
                  onFocus={() => { if (searchResults.length > 0 && inputRef.current) { setDropdownRect(inputRef.current.getBoundingClientRect()); setShowSearch(true); } }}
                  onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                  className="bg-white"
                  autoComplete="off"
                />
              </div>

              {/* Miktar */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">MİKTAR (ADET)</Label>
                <Input type="number" min="0" step="any"
                  value={formData.quantity === 0 ? "" : formData.quantity}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="bg-white" />
              </div>

              {/* Fiyat + Kaydet */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="useCurrentPrice" checked={formData.useCurrentPrice}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, useCurrentPrice: !!v }))} />
                  <label htmlFor="useCurrentPrice" className="text-xs font-medium text-slate-600 cursor-pointer">
                    Güncel fiyattan aldım
                  </label>
                </div>
                {!formData.useCurrentPrice ? (
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Alış Fiyatı" min="0" step="any"
                      value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                      onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                      className="bg-white" />
                    <Button onClick={handleAdd} disabled={loading || !formData.symbol || formData.quantity <= 0} className="px-6">
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Kaydet"}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAdd} disabled={loading || !formData.symbol || formData.quantity <= 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Piyasa Fiyatıyla Ekle"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portal Dropdown */}
      {SearchDropdown}

      {/* Varlıklar Tablosu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Varlık</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Toplam Adet</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Ort. Maliyet</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Güncel Fiyat</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Kar/Zarar</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedList.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">Henüz aktif varlığınız bulunmuyor.</td></tr>
            ) : (
              groupedList.map((group: any) => (
                <React.Fragment key={group.symbol}>
                  <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => setExpandedSymbol(expandedSymbol === group.symbol ? null : group.symbol)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-bold text-primary text-xs">
                          {group.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{group.symbol.split(".")[0]}</div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase">{group.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{group.totalQuantity.toLocaleString("tr-TR")}</td>
                    <td className="p-4 text-slate-600 font-medium">{group.avgPrice.toLocaleString("tr-TR")} ₺</td>
                    <td className="p-4 font-bold text-slate-900">{group.currentPrice?.toLocaleString("tr-TR")} ₺</td>
                    <td className="p-4 text-right">
                      <div className={`font-bold flex items-center justify-end ${group.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {group.profit >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {group.profit.toLocaleString("tr-TR")} ₺
                      </div>
                      <div className={`text-[10px] font-bold ${group.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        %{group.profitPercent.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {expandedSymbol === group.symbol
                        ? <ChevronUp className="w-4 h-4 text-slate-300" />
                        : <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-primary" />}
                    </td>
                  </tr>

                  {/* Detay — Tarih + Saat */}
                  {expandedSymbol === group.symbol && (
                    <tr>
                      <td colSpan={6} className="bg-slate-50/50 p-4 pt-0">
                        <div className="space-y-2 mt-2">
                          <p className="text-[10px] font-bold text-slate-400 mb-3 px-2">BU VARLIKTAKİ TÜM ALIMLARINIZ</p>
                          {group.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <div className="grid grid-cols-4 flex-1 items-center gap-2">
                                {/* Tarih + Saat */}
                                <div className="text-xs font-medium text-slate-500 leading-relaxed">
                                  <div>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold">
                                    {new Date(item.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                                <div className="text-xs font-bold text-slate-700">{item.quantity} Adet</div>
                                <div className="text-xs text-slate-600">
                                  Fiyat: {item.purchasePrice?.toLocaleString("tr-TR")} ₺
                                </div>
                                <div className={`text-xs font-bold ${item.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                  %{item.profitPercent?.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-2 shrink-0">
                                <Button variant="ghost" size="sm" disabled={loading}
                                  onClick={(e) => { e.stopPropagation(); handleSell(item.id); }}
                                  className="h-7 text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100">
                                  {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Piyasa Fiyatından Sat"}
                                </Button>
                                <Button variant="ghost" size="icon" disabled={loading}
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                  className="h-7 w-7 text-slate-300 hover:text-rose-600">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* İşlem Geçmişi */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-700">İşlem Geçmişi</h3>
        </div>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">Henüz bir işlem kaydı yok.</div>
              ) : (
                history.map((log: any) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.transactionType === "BUY" ? "bg-emerald-50" : "bg-amber-50"}`}>
                        {log.transactionType === "BUY"
                          ? <Plus className="w-4 h-4 text-emerald-600" />
                          : <Tag className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {log.symbol?.split(".")[0] || "Bilinmiyor"} {log.transactionType === "BUY" ? "Alındı" : "Satıldı"}
                        </div>
                        {/* Tarih + Saat */}
                        <div className="text-[10px] text-slate-400 font-medium">
                          {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">{log.quantity} Adet</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Fiyat: {(log.transactionType === "BUY" ? log.purchasePrice : log.soldPrice)?.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
