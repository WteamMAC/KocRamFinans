"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2, Plus, Shield, Landmark,
  ChevronDown, RefreshCw, Sparkles,
  Search, CheckCircle2, X
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { deleteAsset, addAsset, fixMisclassifiedBesFaiz, addContributionToAsset } from "@/app/actions/assets";
import { searchTefasFundsAction } from "@/app/actions/market";
import { useCurrency } from "@/context/currency-context";

interface InvestmentItem {
  id: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number | null;
  amount: number;
  description?: string | null;
  createdAt: Date | string;
  status?: string;
}

interface BesFaizDetailProps {
  type: "BES" | "FAIZ";
  investments: InvestmentItem[];
  livePrices?: Record<string, number>;
}

interface ParsedMeta {
  rate: number;
  monthlyContribution: number;
  fundType?: string;
  fundSymbol?: string;
  originalDescription: string;
  maturityPeriod?: number;
}

function parseMeta(inv: InvestmentItem): ParsedMeta {
  try {
    const meta = JSON.parse(inv.description || "{}");
    return {
      rate: meta.rate || inv.purchasePrice || 0,
      monthlyContribution: meta.monthlyContribution || 0,
      fundType: meta.fundType || "STANDART",
      fundSymbol: meta.fundSymbol || undefined,
      originalDescription: meta.originalDescription || (typeof inv.description === 'string' && !inv.description.startsWith('{') ? inv.description : ""),
      maturityPeriod: meta.maturityPeriod || 32, // Esk kayıtlar için varsayılan 32 gün
    };
  } catch {
    return { rate: inv.purchasePrice || 0, monthlyContribution: 0, originalDescription: inv.description || "", maturityPeriod: 32 };
  }
}

const BES_FUND_TYPES = [
  { id: "STANDART", name: "Standart / Dengeli (Karma)", icon: "⚖️", ticker: "FIXED" },
  { id: "GOLD", name: "Altın Katılım / Altın", icon: "🟡", ticker: "XAUTRY=X" },
  { id: "STOCKS", name: "Hisse Senedi Yoğun", icon: "📈", ticker: "XU100.IS" },
  { id: "USD", name: "Dış Borçlanma (Eurobond/Döviz)", icon: "💵", ticker: "USDTRY=X" },
  { id: "CONSERVATIVE", name: "Muhafazakar (Para Piyasası)", icon: "🛡️", ticker: "FIXED_LOW" },
];

export function BesFaizDetail({ type, investments, livePrices }: BesFaizDetailProps) {
  const router = useRouter();
  const { formatAmount } = useCurrency();

  // Group by symbol
  const grouped = useMemo(() => {
    const acc: Record<string, { symbol: string; totalQuantity: number; totalCost: number; rate: number; originalDescription: string; items: InvestmentItem[] }> = {};
    for (const inv of investments) {
      const sym = inv.symbol || "Bilinmiyor";
      const meta = parseMeta(inv);
      if (!acc[sym]) {
        acc[sym] = { symbol: sym, totalQuantity: 0, totalCost: 0, rate: 0, originalDescription: meta.originalDescription, items: [] };
      }
      acc[sym].totalQuantity += inv.quantity;
      acc[sym].totalCost += inv.amount || inv.quantity;
      acc[sym].items.push(inv);
    }

    // Calculate final weighted average rate for each group
    Object.values(acc).forEach(g => {
      const totalWeight = g.totalQuantity;
      if (totalWeight > 0) {
        const weightedSum = g.items.reduce((sum, item) => {
          const meta = parseMeta(item);
          return sum + (item.quantity * meta.rate);
        }, 0);
        g.rate = weightedSum / totalWeight;
      }
    });

    return Object.values(acc);
  }, [investments]);

  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projYears, setProjYears] = useState(10);
  const [projMonthly, setProjMonthly] = useState<number | "">(""); // only for BES, supports empty/0 inputs cleanly
  const [projReturn, setProjReturn] = useState(() => {
    const val = livePrices?.BES_STANDART_RETURN ?? 0.45;
    return Math.round(val > 2 ? val : val * 100); 
  });  // only for BES

  const [besSearchQuery, setBesSearchQuery] = useState("");
  const [besSearchResults, setBesSearchResults] = useState<{ code: string; title: string; price: number; dailyReturn: number }[]>([]);
  const [showBesSearch, setShowBesSearch] = useState(false);
  const [tefasSearchLoading, setTefasSearchLoading] = useState(false);

  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; assetId: string | null }>({ isOpen: false, assetId: null });
  const [contributionModalState, setContributionModalState] = useState<{ isOpen: boolean; assetId: string | null; symbol: string }>({ isOpen: false, assetId: null, symbol: "" });
  const [contribAmount, setContribAmount] = useState<number | "">("");

  const fundReturns = useMemo(() => {
    const safeRate = (rate: number | undefined, defaultRate: number) => {
       const r = rate ?? defaultRate;
       return r > 2 ? r / 100 : r;
    };
    return {
      "STANDART": safeRate(livePrices?.BES_STANDART_RETURN, 0.45),
      "GOLD": safeRate(livePrices?.BES_GOLD_RETURN, 0.65),
      "STOCKS": safeRate(livePrices?.BES_STOCKS_RETURN, 0.80),
      "USD": safeRate(livePrices?.BES_USD_RETURN, 0.35),
      "CONSERVATIVE": safeRate(livePrices?.BES_CONSERVATIVE_RETURN, 0.40),
    };
  }, [livePrices]);

  const [formData, setFormData] = useState({
    symbol: "",
    quantity: 0,
    purchasePrice: type === "BES" ? 30 : 45,
    description: "",
    monthlyContribution: type === "BES" ? 2500 : 0,
    fundType: "STANDART",
    fundSymbol: "",
    maturityPeriod: 32,
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Sadece BES için TEFAS'tan EMK fonu ara
      if (type === "BES" && besSearchQuery.length >= 2 && !besSearchQuery.includes(" → ")) {
        setTefasSearchLoading(true);
        try {
          const results = await searchTefasFundsAction(besSearchQuery);
          setBesSearchResults(results);
          setShowBesSearch(results.length > 0);
        } catch {
          setBesSearchResults([]);
          setShowBesSearch(false);
        } finally {
          setTefasSearchLoading(false);
        }
      } else {
        setBesSearchResults([]);
        setShowBesSearch(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [besSearchQuery, type]);

  // Gerçek zamanlı saniyelik sayaç (Canlı Getiri hissi için)
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);



  const totalPrincipal = grouped.reduce((s, g) => s + g.totalQuantity, 0);

  const totalMonthlyContribution = useMemo(() => {
    if (type !== "BES") return 0;
    return grouped.reduce((s, g) => {
      const firstItemMeta = g.items.length > 0 ? parseMeta(g.items[0]) : { monthlyContribution: 0 };
      return s + firstItemMeta.monthlyContribution;
    }, 0);
  }, [grouped, type]);

  useEffect(() => {
    if (type === "BES" && totalMonthlyContribution > 0) {
      setProjMonthly(totalMonthlyContribution);
    }
  }, [totalMonthlyContribution, type]);

  // Canlı saniyelik değerleme ve toplam biriken net kazanç
  const liveTotals = useMemo(() => {
    let totalVal = 0;
    for (const g of grouped) {
      if (g.items.length === 0) continue;
      const firstCreated = new Date(Math.min(...g.items.map(i => new Date(i.createdAt).getTime())));
      const msPassed = Math.max(0, currentTime - firstCreated.getTime());
      const secondsPassed = msPassed / 1000;
      const daysPassed = secondsPassed / (60 * 60 * 24);

      if (type === "BES") {
        // BES: Sadece Fon Büyümesi canlı değere eklenir. 
        // Devlet katkısı direkt ana paraya/canlı değere yansıtılmaz (yıllık/ayrı havuzda tutulur).
        let fundType = "STANDART";
        try {
          const meta = parseMeta(g.items[0]);
          fundType = meta.fundType || "STANDART";
        } catch(e){}

        const annualFundGrowth = fundReturns[fundType as keyof typeof fundReturns] || 0.45;
        const dailyGrowth = annualFundGrowth / 365;
        const fundMultiplier = Math.pow(1 + dailyGrowth, daysPassed);
        // Devlet katkısı hesaplanıyor ama canlı bakiyeye direkt eklenip "net kazanç" gibi gösterilmiyor
        totalVal += (g.totalQuantity * fundMultiplier);
      } else {
        const secondlyRate = (g.rate / 100) / (365 * 24 * 3600);
        const multiplier = Math.pow(1 + secondlyRate, secondsPassed);
        totalVal += g.totalQuantity * multiplier;
      }
    }
    return {
      totalValuation: totalVal === 0 ? totalPrincipal : totalVal,
      totalProfit: Math.max(0, totalVal - totalPrincipal)
    };
  }, [grouped, currentTime, totalPrincipal, type]);

  // Projection calculation
  const projectionData = useMemo(() => {
    if (type === "FAIZ") {
      const totalPrin = grouped.reduce((s, g) => s + g.totalQuantity, 0);
      if (totalPrin <= 0) return [];

      const yearlyTotals: number[] = Array(projYears + 1).fill(0);
      for (const g of grouped) {
        const meta = g.items.length > 0 ? parseMeta(g.items[0]) : { maturityPeriod: 32 };
        const maturityDays = meta.maturityPeriod || 32;
        const compoundsPerYear = 365 / maturityDays;
        const annualMultiplier = Math.pow(1 + (g.rate / 100) / compoundsPerYear, compoundsPerYear);

        let bal = g.totalQuantity;
        for (let yr = 0; yr <= projYears; yr++) {
          yearlyTotals[yr] += bal;
          bal *= annualMultiplier; // Yıllık bileşik faizi uygula
        }
      }

      return yearlyTotals.map((total, i) => ({
        label: i === 0 ? "Başlangıç" : `${i}. Yıl`,
        toplam: Math.round(total),
        anaPara: Math.round(totalPrin),
        faizKazanci: Math.round(total - totalPrin),
      }));
    } else {
      const govtRate = grouped.reduce((s, g) => s + g.rate, 0) / Math.max(grouped.length, 1);
      const monthlyRate = projReturn / 12 / 100;
      const totalMonths = projYears * 12;
      let totalPrin = grouped.reduce((s, g) => s + g.totalQuantity, 0);
      let totalWithReturn = totalPrin; // Kullanıcı katkı parayı + fon getirisi

      // Devlet katkısı gerçek BES mantığı:
      // - Her ay kullanıcı ödemesinin %30'u "bekleyen devlet katkısı" havuzuna eklenir
      // - Yıl sonunda bu havuz toplu olarak fona aktarılır ve fon getirisiyle büyümeye başlar
      // - Ana paraya (kullanıcı fonuna) anında eklenmez!
      let pendingGovtContrib = 0;  // Yıl içi birikmekte olan devlet katkısı (fonda değil)
      let totalGovtInFund = 0;     // Fona girmiş ve fon getirisiyle büyüyen devlet katkısı

      const data = [];
      for (let i = 0; i <= totalMonths; i++) {
        if (i > 0) {
          const monthlyAdd = projMonthly !== "" ? Number(projMonthly) : totalMonthlyContribution;
          totalPrin += monthlyAdd;
          // Kullanıcı katkı payı anında fona girer ve fon getirisiyle büyür
          totalWithReturn = (totalWithReturn + monthlyAdd) * (1 + monthlyRate);

          // Devlet katkısı (%30 varsayılan) birikir — fona girmez, bekler
          pendingGovtContrib += monthlyAdd * (govtRate / 100);

          // Fonda olan devlet katkısı da fon getirisiyle büyür
          totalGovtInFund *= (1 + monthlyRate);

          // Yıl sonu: bekleyen devlet katkısı fona aktarılır
          if (i % 12 === 0) {
            totalGovtInFund += pendingGovtContrib;
            pendingGovtContrib = 0;
          }
        }
        if (i % 12 === 0) {
          const yr = Math.floor(i / 12);
          data.push({
            label: yr === 0 ? "Başlangıç" : `${yr}. Yıl`,
            toplam: Math.round(totalWithReturn + totalGovtInFund),
            anaPara: Math.round(totalPrin),
            faizKazanci: Math.round(totalWithReturn + totalGovtInFund - totalPrin),
          });
        }
      }
      return data;
    }
  }, [type, grouped, projYears, projMonthly, projReturn, totalMonthlyContribution]);

  const finalValue = projectionData[projectionData.length - 1]?.toplam || 0;
  const netGain = finalValue - totalPrincipal;

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      await deleteAsset(id);
      setDeleteModalState({ isOpen: false, assetId: null });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleAdd() {
    if (!isAdding) {
      setFormData({
        symbol: "",
        quantity: 0,
        purchasePrice: type === "BES" ? 30 : 45,
        description: "",
        monthlyContribution: type === "BES" ? 2500 : 0,
        fundType: "STANDART",
        fundSymbol: "",
        maturityPeriod: 32,
      });
      setBesSearchQuery("");
    }
    setIsAdding(!isAdding);
  }

  async function handleAdd() {
    if (!formData.symbol || formData.quantity <= 0) return;
    setLoading(true);
    try {
      await addAsset({
        type,
        symbol: formData.symbol,
        quantity: formData.quantity,
        purchasePrice: formData.purchasePrice,
        useCurrentPrice: false,
        description: formData.description,
        monthlyContribution: formData.monthlyContribution,
        fundType: formData.fundType,
        fundSymbol: formData.fundSymbol || undefined,
        maturityPeriod: isBES ? undefined : formData.maturityPeriod,
      });
      setIsAdding(false);
      setFormData({ symbol: "", quantity: 0, purchasePrice: 0, description: "", monthlyContribution: 0, fundType: "STANDART", fundSymbol: "", maturityPeriod: 32 });
      setBesSearchQuery("");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContribution(id: string, amount: number) {
    if (amount <= 0) return;
    setLoading(true);
    try {
      await addContributionToAsset(id, amount);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFixOldRecords() {
    setFixLoading(true);
    setFixMessage(null);
    try {
      const result = await fixMisclassifiedBesFaiz();
      setFixMessage(
        result.fixedCount > 0
          ? `✅ ${result.fixedCount} eski kayıt düzeltildi! Sayfa yenileniyor...`
          : "ℹ️ Düzeltilecek eski kayıt bulunamadı."
      );
      if (result.fixedCount > 0) {
        setTimeout(() => router.refresh(), 1500);
      }
    } catch (err) {
      setFixMessage("❌ Düzeltme sırasında hata oluştu.");
      console.error(err);
    } finally {
      setFixLoading(false);
    }
  }

  const isBES = type === "BES";
  const accentColor = isBES ? "text-teal-500" : "text-yellow-500";
  const accentBg = isBES ? "bg-teal-500/10" : "bg-yellow-500/10";
  const accentSolid = isBES ? "#14b8a6" : "#eab308";
  const Icon = isBES ? Shield : Landmark;
  const title = isBES ? "Bireysel Emeklilik (BES)" : "Vadeli Mevduat Hesapları";

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-4 rounded-2xl", accentBg)}>
            <Icon className={cn("h-8 w-8", accentColor)} />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-primary">{title}</h2>
            <p className="text-muted-foreground text-sm opacity-70">
              {isBES ? "Emeklilik birikimi ve devlet katkısı analizi" : "Vadeli mevduat ve faiz geliri analizi"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full md:w-auto">
          {!isBES && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixOldRecords}
              disabled={fixLoading}
              className="rounded-2xl h-[48px] md:h-[52px] text-xs font-bold border-yellow-500/40 text-yellow-600 hover:bg-yellow-50 transition-all shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", fixLoading && "animate-spin")} />
              {fixLoading ? "Düzeltiliyor..." : "Eski Kayıtları Düzelt"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className={cn(
              "rounded-2xl h-[48px] md:h-[52px] text-xs font-bold border-border/30 transition-all shadow-sm",
              isBES && "col-span-1"
            )}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Yenile
          </Button>
          <Button
            size="sm"
            onClick={handleToggleAdd}
            className={cn(
              "rounded-2xl h-[48px] md:h-[52px] text-xs font-bold bg-primary text-primary-foreground shadow-ambient-medium transition-all",
              !isBES ? "col-span-2 md:col-span-1" : "col-span-1"
            )}
          >
            <Plus className="h-4 w-4 mr-2" /> {isBES ? "BES Hesabı Ekle" : "Mevduat Ekle"}
          </Button>
        </div>
      </div>

      {/* Fix message toast */}
      {fixMessage && (
        <div className="px-4 py-3 rounded-xl bg-muted/60 border border-border/20 text-sm font-medium text-foreground animate-in slide-in-from-top-2 duration-300">
          {fixMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/20 shadow-ambient-low rounded-2xl p-6 relative overflow-hidden">
          <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-30", accentBg)} />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Toplam Kayıtlı Birikim</p>
          <p className="text-3xl font-heading font-bold text-primary">{formatAmount(totalPrincipal)}</p>
        </Card>
        <Card className="border-border/20 shadow-ambient-low rounded-2xl p-6 relative overflow-hidden">
          <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-30", accentBg)} />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Canlı Toplam Değer
          </p>
          <p className={cn("text-3xl font-heading font-bold", accentColor)}>{formatAmount(liveTotals.totalValuation)}</p>
        </Card>
        <Card className="border-border/20 shadow-ambient-low rounded-2xl p-6 relative overflow-hidden">
          <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-30", accentBg)} />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Canlı Biriken Net Kazanç
          </p>
          <p className="text-3xl font-heading font-bold text-emerald-500">+{formatAmount(liveTotals.totalProfit)}</p>
        </Card>
      </div>

      {/* Add Form Modal */}
      {isAdding && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto no-scrollbar">
            <Card className="border-border/20 shadow-ambient-medium rounded-2xl p-6 animate-in zoom-in-95 duration-300 bg-card">
              <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-heading text-primary">
                  {isBES ? "Yeni BES Hesabı" : "Yeni Vadeli Hesap"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAdding(false)}
                  className="h-8 w-8 rounded-full bg-muted/60 hover:bg-rose-50 hover:text-rose-500 text-muted-foreground transition-all shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {isBES ? "Şirket / Plan Adı" : "Banka / Hesap Adı"}
                  </Label>
                  <Input
                    placeholder={isBES ? "Örn: Agesa, Anadolu Hayat" : "Örn: Garanti TL Vadeli"}
                    value={formData.symbol}
                    onChange={e => setFormData(p => ({ ...p, symbol: e.target.value }))}
                    className="h-12 rounded-xl bg-muted/50 border-border/30"
                  />
                </div>
                {isBES && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Fon Sınıfı (Varsayılan Getiri Grubu)
                      </Label>
                      <select
                        value={formData.fundType}
                        onChange={e => setFormData(p => ({ ...p, fundType: e.target.value }))}
                        className="w-full h-12 rounded-xl bg-muted/50 border border-border/30 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                      >
                        {BES_FUND_TYPES.map(ft => (
                          <option key={ft.id} value={ft.id}>{ft.icon} {ft.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* TEFAS'tan Gerçek EMK Fonu Arama */}
                    <div className="space-y-2 md:col-span-2 relative">
                      <div className="flex justify-between items-center px-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          TEFAS Emeklilik Fonu Seçimi
                        </Label>
                        <span className="text-[9px] font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider border border-teal-500/20">Gerçek Veri</span>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                        <Input
                          placeholder="Fon kodu veya adı yazın: AEG, ALR, MAC, Katılım..."
                          value={besSearchQuery}
                          onChange={(e) => setBesSearchQuery(e.target.value)}
                          className="pl-12 bg-muted/50 border-border/30 h-12 rounded-xl focus:ring-primary text-sm font-semibold"
                        />
                        {tefasSearchLoading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground px-1">
                        TEFAS BEFAS platformundaki gerçek emeklilik fonlarında arama yapılıyor.
                      </p>

                      {/* TEFAS Arama Sonuçları */}
                      {showBesSearch && besSearchResults.length > 0 && (
                        <div className="absolute z-[999] w-full bg-card/95 backdrop-blur-2xl border border-teal-500/20 shadow-2xl rounded-2xl overflow-hidden mt-1 max-h-56 overflow-y-auto">
                          {besSearchResults.map((fund) => (
                            <div
                              key={fund.code}
                              className="p-3 hover:bg-teal-500/5 cursor-pointer border-b border-border/10 last:border-0 transition-colors flex items-center justify-between group text-sm"
                              onClick={() => {
                                setFormData(p => ({ ...p, fundSymbol: fund.code }));
                                setBesSearchQuery(`${fund.code} → ${fund.title}`);
                                setShowBesSearch(false);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-teal-500">{fund.code}</span>
                                  {fund.dailyReturn !== 0 && (
                                    <span className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                      fund.dailyReturn >= 0
                                        ? "text-emerald-600 bg-emerald-500/10"
                                        : "text-rose-500 bg-rose-500/10"
                                    )}>
                                      {fund.dailyReturn >= 0 ? "+" : ""}{fund.dailyReturn.toFixed(2)}%
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {fund.title}
                                </div>
                              </div>
                              <div className="text-right ml-3 shrink-0">
                                <div className="text-xs font-bold text-primary">{fund.price.toFixed(4)} ₺</div>
                                <div className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                                  TEFAS
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.fundSymbol && (
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-500 bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20 mt-2 animate-in fade-in duration-200">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500" />
                          <span>TEFAS Fonu Seçildi: <strong>{formData.fundSymbol}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(p => ({ ...p, fundSymbol: "" }));
                              setBesSearchQuery("");
                            }}
                            className="ml-auto hover:text-rose-500 font-extrabold text-[10px] uppercase tracking-wider bg-muted px-2 py-1 rounded-md transition-colors"
                          >
                            Kaldır
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {isBES ? "Güncel Birikiminiz (₺)" : "Güncel Birikiminiz (₺)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity || ""}
                    onChange={e => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))}
                    className="h-12 rounded-xl bg-muted/50 border-border/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {isBES ? "Devlet Katkı Payı (%)" : "Faiz Oranı (% Yıllık)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={isBES ? "30" : "45"}
                    value={formData.purchasePrice || ""}
                    onChange={e => setFormData(p => ({ ...p, purchasePrice: Number(e.target.value) }))}
                    className="h-12 rounded-xl bg-muted/50 border-border/30"
                  />
                </div>
                {isBES && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      Aylık Yatırılacak Düzenli Tutar (₺)
                    </Label>
                    <Input
                      type="number"
                      required
                      placeholder="Örn: 2500"
                      value={formData.monthlyContribution || ""}
                      onChange={e => setFormData(p => ({ ...p, monthlyContribution: Number(e.target.value) }))}
                      className="h-12 rounded-xl bg-muted/50 border-primary/20"
                    />
                  </div>
                )}
                {!isBES && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      Vade Süresi (Gün)
                    </Label>
                    <Input
                      type="number"
                      placeholder="32"
                      value={formData.maturityPeriod || ""}
                      onChange={e => setFormData(p => ({ ...p, maturityPeriod: Number(e.target.value) }))}
                      className="h-12 rounded-xl bg-muted/50 border-primary/20"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Açıklama (Opsiyonel)
                  </Label>
                  <Input
                    placeholder={isBES ? "Örn: Aylık katkı payı" : "Örn: 3 aylık vadeli"}
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="h-12 rounded-xl bg-muted/50 border-border/30"
                  />
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl">İptal</Button>
                  <Button onClick={handleAdd} disabled={loading} className="rounded-xl bg-primary">
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>,
        document.body
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Account List */}
        <div className="xl:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", accentBg)}>
              <Icon className={cn("h-5 w-5", accentColor)} />
            </div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Hesaplarım</h3>
          </div>
          {grouped.length === 0 ? (
            <Card className="border-dashed border-2 border-border/30 rounded-2xl p-12 text-center">
              <Icon className={cn("h-12 w-12 mx-auto mb-4 opacity-30", accentColor)} />
              <p className="text-muted-foreground text-sm">Henüz {isBES ? "BES hesabı" : "vadeli mevduat"} eklenmemiş.</p>
              <Button variant="link" onClick={handleToggleAdd} className="mt-2 text-primary font-bold">Hemen Ekle</Button>
            </Card>
          ) : (
            grouped.map(g => {
              const isExp = expandedId === g.symbol;
              return (
                <Card
                  key={g.symbol}
                  className={cn(
                    "border-border/20 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                    isExp ? "ring-2 ring-accent shadow-ambient-high" : "hover:shadow-ambient-medium"
                  )}
                  onClick={() => setExpandedId(isExp ? null : g.symbol)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm", accentBg, accentColor)}>
                          {g.symbol.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{g.symbol}</p>
                           {isBES && (
                            <p className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block mb-1">
                              {parseMeta(g.items[0]).fundSymbol 
                                ? `✨ Canlı Fon: ${parseMeta(g.items[0]).fundSymbol}`
                                : `${BES_FUND_TYPES.find(f => f.id === parseMeta(g.items[0]).fundType)?.name || "Karma Fon"}`}
                            </p>
                          )}
                          <p className={cn("text-[11px] font-bold mt-0.5", accentColor)}>
                            {isBES ? `Devlet Katkısı: %${g.rate}` : `Faiz: %${g.rate} / Yıl`}
                          </p>
                          {!isBES ? (
                            <p className="text-[10px] font-black text-emerald-500 mt-1 uppercase tracking-tighter flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Günlük Getiri: ~{formatAmount((g.totalQuantity * g.rate) / 365 / 100)}
                            </p>
                          ) : (
                            <div className="mt-1 space-y-1">
                              {(() => {
                                const meta = parseMeta(g.items[0]);
                                let fundAnnualGrowth = fundReturns[meta.fundType as keyof typeof fundReturns] || 0.45;
                                if (meta.fundSymbol && livePrices) {
                                  const customLiveChange = livePrices[meta.fundSymbol.toUpperCase()];
                                  if (customLiveChange != null) {
                                    fundAnnualGrowth = customLiveChange;
                                  }
                                }
                                return (
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Yıllık Fon Büyümesi: ~%{Math.round(fundAnnualGrowth * 100)}
                                  </p>
                                );
                              })()}
                              {parseMeta(g.items[0]).monthlyContribution > 0 && (
                                <p className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md inline-block">
                                  Aylık Ödeme: {formatAmount(parseMeta(g.items[0]).monthlyContribution)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExp && "rotate-180")} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/10 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Kayıtlı Birikim</p>
                        <p className="font-bold text-lg text-primary">{formatAmount(g.totalQuantity)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Canlı Biriken Kazanç</p>
                        {(() => {
                          const firstCreated = new Date(Math.min(...g.items.map(i => new Date(i.createdAt).getTime())));
                          const msPassed = Math.max(0, currentTime - firstCreated.getTime());
                          const secondsPassed = msPassed / 1000;
                          const daysPassed = secondsPassed / (60 * 60 * 24);
                          let currentVal = g.totalQuantity;
                          let earned = 0;
                          let stateContributionAmount = 0;
                          if (isBES) {
                            let fundType = "STANDART";
                            const meta = parseMeta(g.items[0]);
                            try { fundType = meta.fundType || "STANDART"; } catch(e){}

                            const annualFundGrowth = fundReturns[fundType as keyof typeof fundReturns] || 0.45;
                            const dailyGrowth = annualFundGrowth / 365;
                            const fundMultiplier = Math.pow(1 + dailyGrowth, daysPassed);
                            const stateMultiplier = (g.rate > 0 && g.rate <= 100 ? g.rate / 100 : 0.30);

                            currentVal = g.totalQuantity * fundMultiplier;
                            earned = currentVal - g.totalQuantity;

                            // Devlet katkısı: sadece YIL İÇİ ödenen katkı paylarının %30'u birikir.
                            // Ana para üzerine anında uygulanmaz.
                            // İmzalama tarihinden bu yana geçen yıl içindeki aylar:
                            const monthlyContrib = meta.monthlyContribution || 0;
                            const monthsInCurrentYear = daysPassed % 365 / 30.44; // yaklaşık ay sayısı
                            stateContributionAmount = monthlyContrib * Math.min(monthsInCurrentYear, 12) * stateMultiplier;
                          } else {
                            const secondlyRate = (g.rate / 100) / (365 * 24 * 3600);
                            const multiplier = Math.pow(1 + secondlyRate, secondsPassed);
                            currentVal = g.totalQuantity * multiplier;
                            earned = currentVal - g.totalQuantity;
                          }
                          return (
                            <>
                              <p className="font-bold text-lg text-emerald-500">+{formatAmount(earned)}</p>
                              <p className="text-[9px] text-muted-foreground italic">
                                {Math.round(daysPassed)} gün canlı birikim
                              </p>
                              {isBES && (
                                <p className="text-[9px] text-primary/70 font-bold mt-0.5">
                                  + {formatAmount(stateContributionAmount)} Devlet Katkısı Bekleyen
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="col-span-2 mt-2 p-3 bg-muted/50 rounded-xl border border-border/5 flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">1 Yıl Sonraki Tahmin</p>
                          {(() => {
                            const fr = fundReturns[parseMeta(g.items[0]).fundType as keyof typeof fundReturns] || 0.45;
                            const govtRate = (g.rate > 0 && g.rate <= 100 ? g.rate / 100 : 0.30);
                            const meta = parseMeta(g.items[0]);
                            const monthlyContrib = meta.monthlyContribution || 0;

                            // Kullanıcı katkıları + fon getirisi (12 ay boyunca aylık bileşik)
                            const monthlyRate = fr / 12;
                            let fundVal = g.totalQuantity;
                            let pendingGovt = 0;
                            for (let m = 1; m <= 12; m++) {
                              fundVal = (fundVal + monthlyContrib) * (1 + monthlyRate);
                              pendingGovt += monthlyContrib * govtRate;
                            }
                            // Yıl sonunda devlet katkısı tek seferlik fona girer
                            const totalOneYear = fundVal + pendingGovt;

                            return isBES ? (
                              <p className={cn("font-bold text-xl", accentColor)}>
                                {formatAmount(totalOneYear)}
                              </p>
                            ) : (
                              <p className={cn("font-bold text-xl", accentColor)}>
                                {formatAmount(g.totalQuantity * Math.pow(1 + g.rate / 12 / 100, 12))}
                              </p>
                            );
                          })()}
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-emerald-500 uppercase">Yıllık Tahmini Kazanç</p>
                          {(() => {
                            const fr = fundReturns[parseMeta(g.items[0]).fundType as keyof typeof fundReturns] || 0.45;
                            const govtRate = (g.rate > 0 && g.rate <= 100 ? g.rate / 100 : 0.30);
                            const meta = parseMeta(g.items[0]);
                            const monthlyContrib = meta.monthlyContribution || 0;

                            const monthlyRate = fr / 12;
                            let fundVal = g.totalQuantity;
                            let pendingGovt = 0;
                            for (let m = 1; m <= 12; m++) {
                              fundVal = (fundVal + monthlyContrib) * (1 + monthlyRate);
                              pendingGovt += monthlyContrib * govtRate;
                            }
                            const totalOneYear = fundVal + pendingGovt;
                            return (
                              <p className="font-bold text-emerald-500">
                                +{formatAmount(isBES
                                  ? totalOneYear - g.totalQuantity
                                  : (g.totalQuantity * (Math.pow(1 + g.rate / 12 / 100, 12) - 1)))}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  {isExp && (
                    <div className="border-t border-border/10 bg-muted/30 p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* Katkı Payı Ekleme Düğmesi */}
                      <Button
                        onClick={() => {
                          setContribAmount("");
                          setContributionModalState({ isOpen: true, assetId: g.items[0].id, symbol: g.symbol });
                        }}
                        className={cn(
                          "w-full h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-2 shadow-sm",
                          isBES 
                            ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/25" 
                            : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/25"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        {isBES ? "Aylık Katkı Payı / Ödeme Ekle" : "Vadeye Para Ekle"}
                      </Button>

                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">İşlem Geçmişi / Kayıtlar</p>
                      {g.items.map(item => {
                        const meta = parseMeta(item);
                        return (
                          <div key={item.id} className="flex justify-between items-center bg-card rounded-xl p-3 border border-border/10 group/item">
                            <div>
                              <p className="text-sm font-bold">{formatAmount(item.quantity)}</p>
                              <p className={cn("text-[10px] font-bold", accentColor)}>
                                {isBES ? `Katkı: %${meta.rate}` : `Oran: %${meta.rate}`}
                              </p>
                              {meta.originalDescription && <p className="text-[10px] text-muted-foreground">{meta.originalDescription}</p>}
                              <p className="text-[10px] text-muted-foreground opacity-60">{new Date(item.createdAt).toLocaleDateString("tr-TR")}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={e => { e.stopPropagation(); setDeleteModalState({ isOpen: true, assetId: item.id }); }}
                              className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Projection Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", accentBg)}>
              <Sparkles className={cn("h-5 w-5", accentColor)} />
            </div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Geleceğe Projeksiyon</h3>
          </div>

          {/* Projection Controls */}
          <Card className="border-border/20 shadow-ambient-low rounded-2xl p-6">
            <div className={cn("grid gap-4 items-end", isBES ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2")}>
              <div className="space-y-0">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest min-h-[32px] flex items-end mb-2">Süre (Yıl)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={projYears}
                  onChange={e => {
                    const val = Math.min(50, Number(e.target.value));
                    setProjYears(val);
                  }}
                  className="h-11 rounded-xl bg-muted/50 border-border/30 font-bold"
                />
              </div>
              {isBES ? (
                <>
                  <div className="space-y-0">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest min-h-[32px] flex items-end mb-2">Aylık Ek Ödeme</Label>
                    <Input
                      type="number"
                      value={projMonthly === "" ? "" : projMonthly}
                      onChange={e => setProjMonthly(e.target.value === "" ? "" : Number(e.target.value))}
                      className="h-11 rounded-xl bg-muted/50 border-border/30 font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-0">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest min-h-[32px] flex items-end mb-2">Tahmini Yıllık Getiri (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      value={projReturn}
                      onChange={e => {
                        const v = Math.min(200, Math.max(1, Number(e.target.value)));
                        setProjReturn(v);
                      }}
                      className="h-11 rounded-xl bg-muted/50 border-border/30 font-bold"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-0">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest min-h-[32px] flex items-end mb-2">Ağırlıklı Ortalama Faiz (%)</Label>
                  <div className="h-11 rounded-xl bg-muted/30 border border-border/20 flex items-center px-4">
                    <span className={cn("font-bold text-lg", accentColor)}>
                      %{(grouped.reduce((s, g) => s + (g.rate * g.totalQuantity), 0) / Math.max(totalPrincipal, 1)).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">(Bakiyeye Göre)</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Chart */}
          <Card className="border-border/20 shadow-ambient-medium rounded-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="font-bold text-foreground">{projYears} Yıllık Büyüme</p>
                <p className="text-xs text-muted-foreground opacity-70">
                  {formatAmount(totalPrincipal)} → {formatAmount(finalValue)}
                </p>
              </div>
              <div className={cn("px-4 py-2 rounded-full text-sm font-bold", accentBg, accentColor)}>
                +{totalPrincipal > 0 ? ((netGain / totalPrincipal) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="h-[300px]">
              {projectionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ left: -25, right: 10 }}>
                    <defs>
                      <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentSolid} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={accentSolid} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={v => new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(v)}
                      dx={0}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                      formatter={(val: any, name: any) => [
                        formatAmount(Number(val)),
                        name === "toplam"
                          ? (isBES ? "Tahmini Toplam (BES)" : "Bileşik Faiz Toplamı")
                          : name === "faizKazanci"
                            ? "Kazanılan Faiz"
                            : "Kayıtlı Birikim"
                      ]}
                    />
                    <Area type="monotone" dataKey="toplam" stroke={accentSolid} strokeWidth={3} fillOpacity={1} fill="url(#colorProj)" />
                    {!isBES && <Area type="monotone" dataKey="faizKazanci" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={0.08} fill="#10b981" />}
                    <Area type="monotone" dataKey="anaPara" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0.05} fill="#3b82f6" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-3xl border-border/30 bg-muted/5">
                  <Sparkles className={cn("h-10 w-10 mb-4 opacity-20", accentColor)} />
                  <p className="text-xs font-bold text-muted-foreground max-w-[200px]">
                    Projeksiyon oluşturmak için ilk {isBES ? "BES" : "vadeli"} hesabınızı ekleyin.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-center flex-wrap gap-5 mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: accentSolid }} />
                {isBES ? "BES Tahmini" : "Bileşik Toplam"}
              </span>
              {!isBES && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-emerald-400 border-dashed" /> Kazanılan Faiz
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-dashed" /> Kayıtlı Birikim
              </span>
            </div>
          </Card>

          {/* Year by year summary */}
          {projectionData.length > 0 && (
            <Card className="border-border/20 shadow-ambient-low rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/10">
                <p className="font-bold text-sm text-foreground">Yıllık Özet Tablo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Yıl</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {isBES ? "Kayıtlı Birikim" : "Kayıtlı Birikim"}
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {isBES ? "Tahmini Toplam" : "Bileşik Toplam"}
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Kazanılan Getiri</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {projectionData.filter((_, i) => i % 2 === 0 || i === projectionData.length - 1).map((row) => (
                      <tr key={row.label} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{row.label}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatAmount(row.anaPara)}</td>
                        <td className={cn("px-4 py-3 text-right font-bold", accentColor)}>{formatAmount(row.toplam)}</td>
                        <td className="px-4 py-3 text-right text-emerald-500 font-bold">
                          +{formatAmount(Math.max(0, row.faizKazanci ?? (row.toplam - row.anaPara)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Silme Onay Modalı (Custom Popup) */}
      {deleteModalState.isOpen && deleteModalState.assetId && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 shadow-2xl rounded-[32px] w-full max-w-md p-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-inner">
                <Trash2 className="h-6 w-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-heading font-black text-primary">
                  Yatırım Kaydını Sil
                </h3>
                <p className="text-sm text-muted-foreground font-medium px-2">
                  Bu yatırım kaydını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteModalState({ isOpen: false, assetId: null })}
                className="rounded-2xl flex-1 h-[48px] font-semibold border-border/30 hover:bg-muted"
                disabled={loading}
              >
                Vazgeç
              </Button>
              <Button
                onClick={() => {
                  if (deleteModalState.assetId) {
                    handleDelete(deleteModalState.assetId);
                  }
                }}
                className="rounded-2xl flex-1 h-[48px] font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                disabled={loading}
              >
                {loading ? "Siliniyor..." : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Katkı Payı / Para Ekleme Modalı (Custom Popup) */}
      {contributionModalState.isOpen && contributionModalState.assetId && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 shadow-2xl rounded-[32px] w-full max-w-md p-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-heading text-primary">
                  {isBES ? "Aylık Katkı Payı / Ödeme Ekle" : "Vadeli Hesaba Para Ekle"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Hesap: <span className="font-bold text-primary">{contributionModalState.symbol}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setContributionModalState({ isOpen: false, assetId: null, symbol: "" })}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-rose-50 hover:text-rose-500 text-muted-foreground transition-all shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                  {isBES ? "Ödeme Tutarı (₺)" : "Eklenecek Tutar (₺)"}
                </Label>
                <div className="relative">
                  <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm", isBES ? "text-primary/40" : "text-yellow-600/40")}>₺</span>
                  <Input
                    type="number"
                    placeholder={isBES ? "Örn: 2500" : "Eklenecek tutar"}
                    value={contribAmount}
                    onChange={e => setContribAmount(e.target.value ? Number(e.target.value) : "")}
                    className="h-12 pl-8 rounded-xl bg-muted/50 border-border/30 font-bold text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && contribAmount && contribAmount > 0) {
                        handleAddContribution(contributionModalState.assetId!, Number(contribAmount));
                        setContributionModalState({ isOpen: false, assetId: null, symbol: "" });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 justify-end">
              <Button
                variant="outline"
                onClick={() => setContributionModalState({ isOpen: false, assetId: null, symbol: "" })}
                className="rounded-2xl flex-1 h-[48px] font-semibold border-border/30 hover:bg-muted"
                disabled={loading}
              >
                Vazgeç
              </Button>
              <Button
                onClick={() => {
                  if (contribAmount && contribAmount > 0) {
                    handleAddContribution(contributionModalState.assetId!, Number(contribAmount));
                    setContributionModalState({ isOpen: false, assetId: null, symbol: "" });
                  }
                }}
                className={cn(
                  "rounded-2xl flex-1 h-[48px] font-semibold text-white shadow-lg",
                  isBES ? "bg-primary hover:bg-primary/95 shadow-primary/20" : "bg-yellow-500 hover:bg-yellow-600 text-yellow-950 shadow-yellow-500/20"
                )}
                disabled={loading || !contribAmount || contribAmount <= 0}
              >
                {loading ? "Kaydediliyor..." : "Para Ekle"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
