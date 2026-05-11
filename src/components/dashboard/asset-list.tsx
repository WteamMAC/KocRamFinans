"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, TrendingDown, TrendingUp, RefreshCw, Search, ChevronDown, ChevronUp, History, Tag } from "lucide-react";
import { addAsset, deleteAsset, sellAsset } from "@/app/actions/assets";
import { searchSymbolsAction } from "@/app/actions/market";

interface AssetListProps {
  assets: any[]; // Aktif varlıklar (Hesaplanmış metriklerle birlikte)
  allInvestments?: any[]; // Tüm ham yatırım verileri (Geçmiş için)
}

export function AssetList({ assets, allInvestments = [] }: AssetListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Sembollere göre gruplandırılmış varlıklar
  const groupedAssets = assets.reduce((acc: any, asset: any) => {
    const symbol = asset.symbol || "Diğer";
    if (!acc[symbol]) {
      acc[symbol] = {
        symbol,
        type: asset.type,
        totalQuantity: 0,
        totalCost: 0,
        currentPrice: asset.currentPrice,
        items: []
      };
    }
    acc[symbol].totalQuantity += asset.quantity;
    acc[symbol].totalCost += (asset.quantity * asset.purchasePrice);
    acc[symbol].items.push(asset);
    return acc;
  }, {});

  const groupedList = Object.values(groupedAssets).map((group: any) => {
    const avgPrice = group.totalCost / group.totalQuantity;
    const currentValue = group.totalQuantity * group.currentPrice;
    const profit = currentValue - group.totalCost;
    const profitPercent = group.totalCost > 0 ? (profit / group.totalCost) * 100 : 0;
    
    return {
      ...group,
      avgPrice,
      currentValue,
      profit,
      profitPercent
    };
  });

  // Geçmiş İşlemler (Satılmış olanlar ve alımlar)
  const history = allInvestments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.symbol.length >= 2 && !formData.symbol.includes("(")) {
        const results = await searchSymbolsAction(formData.symbol, formData.type);
        setSearchResults(results);
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.symbol, formData.type]);

  async function handleAdd() {
    if (!formData.symbol || formData.quantity <= 0) return;
    setLoading(true);
    try {
      let finalSymbol = formData.symbol;
      if (finalSymbol.includes("(")) {
        finalSymbol = finalSymbol.split(" ")[0];
      }
      await addAsset({
        ...formData,
        symbol: finalSymbol.toUpperCase()
      });
      setIsAdding(false);
      setFormData({ type: "BIST", symbol: "", quantity: 0, purchasePrice: 0, useCurrentPrice: false, description: "" });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSell(id: string) {
    if (!confirm("Bu varlığı güncel piyasa fiyatından satmak istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
      await sellAsset(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Portföy Varlıklarım</h3>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"} className="shadow-sm">
          {isAdding ? "Vazgeç" : <><Plus className="w-4 h-4 mr-2" /> Yeni Alım Ekle</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-2 border-primary/10 bg-slate-50/50 shadow-md">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">VARLIK TÜRÜ</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData(prev => ({ ...prev, type: String(v), symbol: "" }))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                    <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                    <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative">
                <Label className="text-xs font-bold text-slate-500">SEMBOL / VARLIK</Label>
                <div className="relative">
                  <Input 
                    placeholder="Örn: BTC, THYAO" 
                    value={formData.symbol} 
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    className="bg-white"
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-[100] max-h-48 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.symbol}
                          className="w-full text-left px-4 py-2 hover:bg-primary/5 transition-colors border-b last:border-0"
                          onClick={() => {
                            setFormData({ ...formData, symbol: `${result.symbol} (${result.shortname || result.longname})` });
                            setShowSearch(false);
                          }}
                        >
                          <div className="font-bold text-xs">{result.symbol}</div>
                          <div className="text-[10px] text-slate-500 truncate">{result.shortname || result.longname}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">MİKTAR (ADET)</Label>
                <Input 
                  type="number" 
                  value={formData.quantity === 0 ? "" : formData.quantity} 
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="currentPrice" 
                    checked={formData.useCurrentPrice}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, useCurrentPrice: !!v }))}
                  />
                  <label htmlFor="currentPrice" className="text-xs font-medium text-slate-600 cursor-pointer">
                    Güncel fiyattan aldım
                  </label>
                </div>
                {!formData.useCurrentPrice ? (
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Alış Fiyatı"
                      value={formData.purchasePrice === 0 ? "" : formData.purchasePrice} 
                      onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                      className="bg-white"
                    />
                    <Button onClick={handleAdd} disabled={loading || !formData.symbol} className="bg-primary px-6">
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Kaydet"}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAdd} disabled={loading || !formData.symbol} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Piyasa Fiyatıyla Ekle"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mevcut Varlıklar Listesi */}
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
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 italic">Henüz aktif varlığınız bulunmuyor.</td>
              </tr>
            ) : (
              groupedList.map((group: any) => (
                <React.Fragment key={group.symbol}>
                  <tr 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => setExpandedSymbol(expandedSymbol === group.symbol ? null : group.symbol)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-bold text-primary text-xs">
                          {group.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{group.symbol.split('.')[0]}</div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase">{group.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{group.totalQuantity.toLocaleString('tr-TR')}</td>
                    <td className="p-4 text-slate-600 font-medium">{group.avgPrice.toLocaleString('tr-TR')} ₺</td>
                    <td className="p-4 font-bold text-slate-900">{group.currentPrice?.toLocaleString('tr-TR')} ₺</td>
                    <td className="p-4 text-right">
                      <div className={`font-bold flex items-center justify-end ${group.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {group.profit >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {group.profit.toLocaleString('tr-TR')} ₺
                      </div>
                      <div className={`text-[10px] font-bold ${group.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        %{group.profitPercent.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {expandedSymbol === group.symbol ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-primary" />}
                    </td>
                  </tr>
                  {/* Detay Görünümü (History for this asset) */}
                  {expandedSymbol === group.symbol && (
                    <tr>
                      <td colSpan={6} className="bg-slate-50/50 p-4 pt-0">
                        <div className="space-y-2 mt-2">
                          <p className="text-[10px] font-bold text-slate-400 mb-3 px-2">BU VARLIKTAKİ TÜM ALIMLARINIZ</p>
                          {group.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <div className="grid grid-cols-4 flex-1 items-center">
                                <div className="text-xs font-medium text-slate-500">
                                  {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                  {item.quantity} Adet
                                </div>
                                <div className="text-xs text-slate-600">
                                  Fiyat: {item.purchasePrice.toLocaleString('tr-TR')} ₺
                                </div>
                                <div className={`text-xs font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  %{item.profitPercent.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); handleSell(item.id); }}
                                  className="h-7 text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100"
                                >
                                  Piyasa Fiyatından Sat
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { e.stopPropagation(); deleteAsset(item.id); }}
                                  className="h-7 w-7 text-slate-300 hover:text-rose-600"
                                >
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

      {/* Geçmiş İşlemler Logu */}
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.transactionType === "BUY" ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        {log.transactionType === "BUY" ? <Plus className="w-4 h-4 text-emerald-600" /> : <Tag className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {log.symbol?.split('.')[0] || "Bilinmiyor"} {log.transactionType === "BUY" ? "Alındı" : "Satıldı"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {new Date(log.createdAt).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">
                        {log.quantity} Adet
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Fiyat: {log.transactionType === "BUY" ? log.purchasePrice : log.soldPrice} ₺
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

