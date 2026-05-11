"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, TrendingDown, TrendingUp, RefreshCw, Search } from "lucide-react";
import { addAsset, deleteAsset } from "@/app/actions/assets";
import { searchSymbolsAction } from "@/app/actions/market";
import { useEffect } from "react";

interface AssetListProps {
  assets: any[];
}

export function AssetList({ assets }: AssetListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const [formData, setFormData] = useState({
    type: "BIST" as string,
    symbol: "",
    quantity: 0,
    purchasePrice: 0,
  });

  // Akıllı Arama useEffect - Kategori ve sembole göre filtreleme yapar
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Eğer kullanıcı henüz listeden seçim yapmadıysa (parantez yoksa) ara
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
    // Sembol boşsa veya miktar 0 ise ekleme
    if (!formData.symbol || formData.quantity <= 0) return;

    setLoading(true);
    try {
      let finalSymbol = formData.symbol;
      
      // Eğer listeden seçim yapıldıysa "THYAO (Turk Hava Yollari)" formatından sadece "THYAO" kısmını al
      if (finalSymbol.includes("(")) {
        finalSymbol = finalSymbol.split(" ")[0];
      }

      await addAsset({
        ...formData,
        symbol: finalSymbol.toUpperCase()
      });
      setIsAdding(false);
      setFormData({ type: "BIST", symbol: "", quantity: 0, purchasePrice: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Sayı girişi hatasını (010 sorunu) düzelten yardımcı fonksiyon
  const handleNumberChange = (field: string, value: string) => {
    // Boşsa 0 yap, değilse baştaki sıfırları atarak sayıya çevir
    const numValue = value === "" ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Portföy Detayları</h3>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "ghost" : "default"}>
          {isAdding ? "Vazgeç" : <><Plus className="w-4 h-4 mr-2" /> Yeni Varlık Ekle</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-2 border-emerald-100 bg-emerald-50/30 overflow-visible relative z-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select value={formData.type} onValueChange={(v: any) => {
                  setFormData(prev => ({ ...prev, type: String(v), symbol: "" }));
                  setSearchResults([]);
                }}>
                  <SelectTrigger>
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
                <Label>Sembol Ara</Label>
                <div className="relative">
                  <Input 
                    placeholder="Örn: THYAO, TSLA, BTC" 
                    value={formData.symbol} 
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    className="pr-10"
                    onFocus={() => formData.symbol.length >= 2 && setShowSearch(true)}
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
                
                {/* Akıllı Arama Sonuçları Listesi */}
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.symbol}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setFormData({ ...formData, symbol: `${result.symbol} (${result.shortname || result.longname})` });
                          setShowSearch(false);
                        }}
                      >
                        <div className="font-bold text-sm text-slate-900">{result.symbol}</div>
                        <div className="text-xs text-slate-500 truncate">{result.shortname || result.longname}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input 
                  type="number" 
                  placeholder="Miktar" 
                  value={formData.quantity === 0 ? "" : formData.quantity} 
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Alış Fiyatı</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Fiyat" 
                    value={formData.purchasePrice === 0 ? "" : formData.purchasePrice} 
                    onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                  />
                  <Button onClick={handleAdd} disabled={loading || !formData.symbol}>
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Ekle"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {assets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">Henüz bir varlık eklemediniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Varlık</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Adet</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Alış Fiyatı</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Güncel Fiyat</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Kar/Zarar</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{asset.symbol?.split('.')[0] || asset.type}</div>
                      <div className="text-xs text-slate-500">{asset.type}</div>
                    </td>
                    <td className="p-4 font-medium">{asset.quantity}</td>
                    <td className="p-4 text-slate-600">{asset.purchasePrice?.toLocaleString('tr-TR')} ₺</td>
                    <td className="p-4 font-semibold">{asset.currentPrice?.toLocaleString('tr-TR')} ₺</td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end font-bold ${asset.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {asset.profit >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {asset.profit?.toLocaleString('tr-TR')} ₺
                      </div>
                      <div className={`text-[10px] font-medium ${asset.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        %{asset.profitPercent?.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAsset(asset.id)}
                        className="text-slate-300 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
