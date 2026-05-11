"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { addAsset, deleteAsset } from "@/app/actions/assets";

interface AssetListProps {
  assets: any[];
}

export function AssetList({ assets }: AssetListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "BIST",
    symbol: "",
    quantity: 0,
    purchasePrice: 0,
  });

  async function handleAdd() {
    setLoading(true);
    try {
      // BIST için otomatik .IS ekleme (eğer girilmediyse)
      let symbol = formData.symbol.toUpperCase();
      if (formData.type === "BIST" && !symbol.endsWith(".IS")) {
        symbol += ".IS";
      } else if (formData.type === "KRİPTO" && !symbol.endsWith("-USD")) {
        symbol += "-USD";
      }

      await addAsset({
        ...formData,
        symbol
      });
      setIsAdding(false);
      setFormData({ type: "BIST", symbol: "", quantity: 0, purchasePrice: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Portföy Detayları</h3>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "ghost" : "default"}>
          {isAdding ? "Vazgeç" : <><Plus className="w-4 h-4 mr-2" /> Yeni Varlık Ekle</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-2 border-emerald-100 bg-emerald-50/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                    <SelectItem value="KRİPTO">Kripto Para</SelectItem>
                    <SelectItem value="Gold">Altın/Emtia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sembol (Örn: THYAO, TSLA, BTC)</Label>
                <Input 
                  placeholder="Sembol" 
                  value={formData.symbol} 
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input 
                  type="number" 
                  placeholder="Miktar" 
                  value={formData.quantity} 
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Alış Fiyatı</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Fiyat" 
                    value={formData.purchasePrice} 
                    onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                  />
                  <Button onClick={handleAdd} disabled={loading}>
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
