"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
import { Search, Clock, ArrowUpRight, X, Wallet, Coins, LayoutGrid, Info, CheckCircle2 } from "lucide-react";
import { searchSymbolsAction } from "@/app/actions/market";
import { cn } from "@/lib/utils";

interface AssetFormProps {
  activeTab: "financial" | "fixed";
  onAdd: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  defaultAssetType?: string;
}

export function AssetForm({ activeTab, onAdd, onCancel, loading, error, defaultAssetType }: AssetFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const [formData, setFormData] = useState({
    type: defaultAssetType || "BIST",
    symbol: "",
    quantity: 0,
    purchasePrice: 0,
    useCurrentPrice: false,
    description: "",
  });

  const [fixedAssetFormData, setFixedAssetFormData] = useState({
    name: "",
    type: "Gayrimenkul",
    originalAmount: 0,
    currency: "TRY"
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
    <div className="w-full max-w-2xl mx-auto bg-card/95 backdrop-blur-xl border border-border/20 shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="p-6 sm:p-10 flex flex-col justify-between bg-card">
        <div>
          {/* Üst Başlık & Kapatma Butonu */}
          <div className="flex justify-between items-center pb-6 mb-8 border-b border-border/10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary">
                {activeTab === "financial" ? "Yeni Yatırım Ekle" : "Yeni Sabit Varlık Ekle"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {activeTab === "financial"
                  ? "Portföyünüze yeni bir hisse senedi, fon veya emtia ekleyin."
                  : "Sahip olduğunuz somut varlıkları detaylandırın."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-10 w-10 rounded-full bg-muted/60 hover:bg-rose-50 hover:text-rose-500 text-muted-foreground transition-all duration-200 shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Alanları */}
          {activeTab === "financial" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Varlık Türü */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Varlık Türü</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v), symbol: "" }))}
                  disabled={!!defaultAssetType}
                >
                  <SelectTrigger className={cn(
                    "bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold transition-all px-4",
                    !!defaultAssetType && "opacity-80 cursor-not-allowed bg-muted"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl font-medium">
                    <SelectItem value="BIST">BIST (Hisse Senedi)</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ (Yabancı Hisse)</SelectItem>
                    <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                    <SelectItem value="GOLD">Altın & Emtia</SelectItem>
                    <SelectItem value="BES">BES (Bireysel Emeklilik)</SelectItem>
                    <SelectItem value="FAIZ">Vadeli Mevduat (Faiz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "BES" || formData.type === "FAIZ" ? (
                <>
                  <div className="space-y-2 sm:col-span-2 relative" ref={inputRef}>
                    <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">
                      {formData.type === "BES" ? "Firma / Plan Adı" : "Banka / Hesap Adı"}
                    </Label>
                    <Input
                      placeholder={formData.type === "BES" ? "Örn: Agesa Bireysel Emeklilik..." : "Örn: Garanti Vadeli Hesap..."}
                      value={formData.symbol}
                      onChange={(e) => setFormData(p => ({ ...p, symbol: e.target.value }))}
                      className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">
                      {formData.type === "BES" ? "Güncel Birikiminiz (₺)" : "Güncel Birikiminiz (₺)"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.quantity === 0 ? "" : formData.quantity}
                      onChange={(e) => handleNumberChange("quantity", e.target.value)}
                      className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                      placeholder="Örn: 50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">
                      {formData.type === "BES" ? "Devlet Katkı Payı Oranı (%)" : "Yıllık Faiz Oranı (%)"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                      onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                      className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 sm:col-span-2 relative" ref={inputRef}>
                    <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Sembol Arama</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                      <Input
                        placeholder="Örn: THYAO, BTC, AAPL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
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

                    {formData.type === "GOLD" && (
                      <div className="flex flex-wrap gap-2 pt-3 animate-in fade-in duration-300">
                        {[
                          { name: "Gram Altın", symbol: "GRAM ALTIN (XAUTRY=X)" },
                          { name: "Ons Altın ($)", symbol: "ONS ALTIN (GC=F)" },
                          { name: "Gram Gümüş", symbol: "GRAM GÜMÜŞ (XAGTRY=X)" },
                          { name: "Ons Gümüş ($)", symbol: "ONS GÜMÜŞ (SI=F)" },
                          { name: "Brent Petrol", symbol: "BRENT PETROL (BZ=F)" },
                        ].map((item) => (
                          <button
                            key={item.symbol}
                            type="button"
                            onClick={() => {
                              setFormData(p => ({ ...p, symbol: item.symbol }));
                              setSearchQuery(item.symbol);
                            }}
                            className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Miktar</Label>
                    <Input
                      type="number"
                      value={formData.quantity === 0 ? "" : formData.quantity}
                      onChange={(e) => handleNumberChange("quantity", e.target.value)}
                      className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Alış Fiyatı</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        disabled={formData.useCurrentPrice}
                        value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                        onChange={(e) => handleNumberChange("purchasePrice", e.target.value)}
                        className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                        placeholder="0.00"
                      />
                      <Button
                        type="button"
                        variant={formData.useCurrentPrice ? "default" : "outline"}
                        onClick={() => setFormData(p => ({ ...p, useCurrentPrice: !p.useCurrentPrice }))}
                        className={cn(
                          "h-12 rounded-2xl border-primary/10 font-bold transition-all px-4",
                          formData.useCurrentPrice ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground"
                        )}
                      >
                        <Clock className="mr-1.5 h-4 w-4" />
                        Güncel
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Açıklama / Notlar (Opsiyonel)</Label>
                <Input
                  placeholder="Varlıkla ilgili hatırlatıcı notlar..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Varlık Adı</Label>
                <Input
                  placeholder="Örn: 2022 Model BMW 320i, Kadıköy Daire..."
                  value={fixedAssetFormData.name}
                  onChange={(e) => setFixedAssetFormData(p => ({ ...p, name: e.target.value }))}
                  className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Varlık Türü</Label>
                <Select value={fixedAssetFormData.type} onValueChange={(v) => setFixedAssetFormData((p) => ({ ...p, type: String(v) }))}>
                  <SelectTrigger className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 font-medium">
                    <SelectItem value="Gayrimenkul">Gayrimenkul</SelectItem>
                    <SelectItem value="Taşıt">Taşıt</SelectItem>
                    <SelectItem value="Elektronik">Elektronik</SelectItem>
                    <SelectItem value="Eşya/Mobilya">Eşya / Mobilya</SelectItem>
                    <SelectItem value="Kıymetli Eşya">Kıymetli Eşya</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Para Birimi</Label>
                <Select value={fixedAssetFormData.currency} onValueChange={(v) => setFixedAssetFormData((p) => ({ ...p, currency: String(v) }))}>
                  <SelectTrigger className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 font-medium">
                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="XAU">Altın (XAU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[11px] font-bold text-primary/80 uppercase tracking-wider px-1">Değer / Bedel</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fixedAssetFormData.originalAmount === 0 ? "" : fixedAssetFormData.originalAmount}
                  onChange={(e) => setFixedAssetFormData(p => ({ ...p, originalAmount: parseFloat(e.target.value) || 0 }))}
                  className="bg-muted/50 border-primary/10 h-12 rounded-2xl focus:ring-primary text-sm font-semibold px-4"
                />
              </div>
            </div>
          )}

          {error && <div className="mt-6 p-4 bg-destructive/10 text-rose-500/80 rounded-2xl text-sm font-bold border border-destructive/20">{error}</div>}

          {/* Sticky Save Button Container */}
          <div className="pt-8 mt-8 border-t border-border/10 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-10 py-6 h-auto text-base font-black shadow-xl hover:shadow-primary/20 transition-all w-full sm:w-auto"
            >
              {loading ? "Kaydediliyor..." : (activeTab === "financial" ? "Yatırımı Kaydet" : "Varlığı Kaydet")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
