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
import { Search, Clock, ArrowUpRight, X } from "lucide-react";
import { searchSymbolsAction } from "@/app/actions/market";
import { cn } from "@/lib/utils";

interface AssetFormProps {
  activeTab: "financial" | "fixed";
  onAdd: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export function AssetForm({ activeTab, onAdd, onCancel, loading, error }: AssetFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "BIST",
    symbol: "",
    quantity: 0,
    purchasePrice: 0,
    useCurrentPrice: false,
    description: "",
  });

  const [fixedAssetFormData, setFixedAssetFormData] = useState({
    name: "",
    type: "Gayrimenkul",
    value: 0
  });

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
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2 && formData.type !== "BES" && formData.type !== "FAIZ") {
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

  const handleSubmit = () => {
    if (activeTab === "financial") {
      onAdd(formData);
    } else {
      onAdd(fixedAssetFormData);
    }
  };

  return (
    <Card className="p-8 bg-card/60 backdrop-blur-2xl border border-primary/20 shadow-2xl rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
      {activeTab === "financial" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Varlık Türü */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Varlık Türü</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v), symbol: "" }))}>
              <SelectTrigger className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl">
                <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                <SelectItem value="BES">BES (Bireysel Emeklilik)</SelectItem>
                <SelectItem value="FAIZ">Vadeli Mevduat (Faiz)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "BES" || formData.type === "FAIZ" ? (
             <>
               <div className="space-y-3 relative" ref={inputRef}>
                 <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">
                   {formData.type === "BES" ? "Firma Adı" : "Banka / Hesap Adı"}
                 </Label>
                 <Input
                   placeholder={formData.type === "BES" ? "Örn: Agesa..." : "Örn: Garanti Vadeli..."}
                   value={formData.symbol}
                   onChange={(e) => setFormData(p => ({ ...p, symbol: e.target.value }))}
                   className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">
                   {formData.type === "BES" ? "İlk Giriş Tutarı" : "Ana Para Tutarı (₺)"}
                 </Label>
                 <Input
                   type="number"
                   value={formData.quantity === 0 ? "" : formData.quantity}
                   onChange={(e) => handleNumberChange("quantity", e.target.value)}
                   className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">
                   {formData.type === "BES" ? "Devlet Katkı Payı (%)" : "Faiz Oranı (%)"}
                 </Label>
                 <Input
                   type="number"
                   value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                   onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                   className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
                 />
               </div>
             </>
          ) : (
            <>
              <div className="space-y-3 relative" ref={inputRef}>
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Sembol Arama</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                  <Input
                    placeholder="Örn: THYAO, BTC, AAPL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
                  />
                </div>

                {showSearch && searchResults.length > 0 && rect && createPortal(
                  <div
                    className="fixed z-[9999] bg-card/95 backdrop-blur-2xl border border-primary/20 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: rect.bottom + 8, left: rect.left, width: rect.width }}
                  >
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="p-4 hover:bg-primary/5 cursor-pointer border-b border-border/10 last:border-0 transition-colors flex items-center justify-between group"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const sym = `${result.symbol} (${result.shortname || result.symbol})`;
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
                            <span className="font-bold text-primary">{result.symbol}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary uppercase">
                              {result.suggestedCategory}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{result.shortname}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Miktar</Label>
                <Input
                  type="number"
                  value={formData.quantity === 0 ? "" : formData.quantity}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Alış Fiyatı</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    disabled={formData.useCurrentPrice}
                    value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                    onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                    className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant={formData.useCurrentPrice ? "default" : "outline"}
                    onClick={() => setFormData(p => ({ ...p, useCurrentPrice: !p.useCurrentPrice }))}
                    className={cn(
                      "h-12 rounded-2xl border-primary/10 transition-all",
                      formData.useCurrentPrice ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Güncel
                  </Button>
                </div>
              </div>
            </>
          )}
          
          <div className="space-y-3 lg:col-span-3">
            <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Açıklama (Opsiyonel)</Label>
            <Input
              placeholder="Varlıkla ilgili notlar..."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Varlık Adı</Label>
            <Input
              placeholder="Örn: 2022 Model BMW..."
              value={fixedAssetFormData.name}
              onChange={(e) => setFixedAssetFormData(p => ({ ...p, name: e.target.value }))}
              className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Varlık Türü</Label>
            <Select value={fixedAssetFormData.type} onValueChange={(v) => setFixedAssetFormData((p) => ({ ...p, type: String(v) }))}>
              <SelectTrigger className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-primary/10">
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
            <Label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Değer (₺)</Label>
            <Input
              type="number"
              value={fixedAssetFormData.value === 0 ? "" : fixedAssetFormData.value}
              onChange={(e) => setFixedAssetFormData(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
              className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary"
            />
          </div>
        </div>
      )}

      {error && <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20">{error}</div>}

      <div className="mt-10 flex justify-end gap-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="rounded-full px-8 py-6 h-auto text-sm font-bold hover:bg-muted"
        >
          <X className="mr-2 h-4 w-4" /> Vazgeç
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-12 py-6 h-auto text-lg font-black shadow-xl hover:shadow-primary/20 transition-all"
        >
          {loading ? "Kaydediliyor..." : "Varlığı Kaydet"}
        </Button>
      </div>
    </Card>
  );
}
