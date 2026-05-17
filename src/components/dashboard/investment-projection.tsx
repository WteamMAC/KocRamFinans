"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Sparkles, Loader2, Info, RefreshCw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { predictGrowthRate } from "@/app/actions/insights";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import { Button } from "@/components/ui/button";

interface InvestmentProjectionProps {
  currentValue: number;
  investments?: any[];
  fixedAssets?: any[];
  monthlySavings?: number;
}

export function InvestmentProjection({ currentValue, investments = [], fixedAssets = [], monthlySavings = 0 }: InvestmentProjectionProps) {
  const { formatAmount } = useCurrency();
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(1.04);
  const [rationale, setRationale] = useState<string | null>(null);
  const [assetProjections, setAssetProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchAIProjection = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const result = await predictGrowthRate({ investments, fixedAssets, monthlySavings });
      if (result.success && result.monthlyRate) {
        setMonthlyGrowthRate(1 + result.monthlyRate);
        setRationale(result.rationale);
        if (result.assetProjections) {
          setAssetProjections(result.assetProjections);
        }
        setHasLoaded(true);
      } else {
        setApiError(true);
        setRationale("Yapay zeka analiz servisine bağlanılamadı. Lütfen API anahtarınızı kontrol edin. Şimdilik varsayılan büyüme hızı gösteriliyor.");
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("AI Projection Error:", error);
      setApiError(true);
      setRationale("Büyüme tahmini sırasında bir hata oluştu. Varsayılan büyüme hızı kullanılıyor.");
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const hasData = currentValue > 0 || (investments && investments.length > 0) || (fixedAssets && fixedAssets.length > 0);

  // 1. If user has no data, show standard empty message
  if (!hasData) {
    return (
      <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full min-h-[400px]">
        <CardHeader className="bg-muted/30 border-b border-border/10 h-20 !flex flex-row items-center px-6 py-0">
          <CardTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> AI Gelecek Tahmini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="h-10 w-10 text-accent/50" />
          </div>
          <h3 className="text-xl font-heading font-bold text-primary mb-3">AI Portföyünüzü Bekliyor</h3>
          <p className="text-sm text-muted-foreground max-w-[340px] mb-8 leading-relaxed">
            Yapay zekanın 6 aylık servet projeksiyonu hazırlayabilmesi için en az bir yatırım veya sabit varlık eklemiş olmanız gerekir.
          </p>
          <div className="p-5 bg-primary/5 border border-primary/10 rounded-[24px] text-left w-full max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-black text-primary uppercase tracking-widest">Nasıl Çalışır?</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Yapay zekamız, eklediğiniz varlıkların geçmiş performansını ve piyasa trendlerini analiz ederek gelecek aylardaki potansiyel büyümenizi simüle eder.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Loading state when computing projection
  if (loading) {
    return (
      <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full min-h-[400px]">
        <CardHeader className="bg-muted/30 border-b border-border/10 h-20 !flex flex-row items-center px-6 py-0">
          <CardTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> AI Gelecek Tahmini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div>
            <h3 className="text-lg font-heading font-bold text-primary mb-1">Projeksiyon Simüle Ediliyor</h3>
            <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
              Yapay zeka varlık performanslarını ve piyasa trendlerini analiz edip 6 aylık servet modelini hesaplıyor...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Not Loaded Yet state (CTA to trigger calculation)
  if (!hasLoaded) {
    return (
      <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full min-h-[400px] justify-between">
        <CardHeader className="bg-muted/30 border-b border-border/10 h-20 !flex flex-row items-center px-6 py-0">
          <CardTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" /> AI Gelecek Tahmini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 md:p-12 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group hover:scale-105 transition-transform duration-300">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h3 className="text-xl font-heading font-bold text-primary mb-3">Yapay Zeka Portföy Tahmini</h3>
          <p className="text-sm text-muted-foreground max-w-[380px] mb-8 leading-relaxed">
            Yatırımlarınızın, sabit varlıklarınızın ve birikimlerinizin yapay zeka ve güncel piyasa trendleri ışığında 6 aylık büyüme projeksiyonunu simüle etmek için analizi başlatın.
          </p>
          <Button
            onClick={fetchAIProjection}
            className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-95 transition-all"
          >
            Tahmin Modelini Çalıştır
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 4. Success State (Render projection details and charts)
  let accumulatedValue = currentValue;

  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = addMonths(new Date(), i);

    if (i > 0) {
      accumulatedValue = (accumulatedValue * monthlyGrowthRate) + monthlySavings;
    }

    return {
      month: format(date, "MMM yyyy", { locale: tr }),
      deger: Math.round(accumulatedValue),
      rawVal: accumulatedValue
    };
  });

  const sixMonthValue = data[5].rawVal;
  const profit = sixMonthValue - currentValue;
  const growthPercent = ((monthlyGrowthRate - 1) * 100).toFixed(1);

  return (
    <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-muted/30 border-b border-border/10 h-20 !flex flex-row items-center px-6 py-0">
        <CardTitle className="text-xl font-heading font-bold text-primary flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Sparkles className={cn("h-5 w-5", apiError ? "text-rose-500" : "text-accent animate-pulse")} />
            <span className="text-base md:text-xl">{apiError ? "Varsayılan Büyüme" : "AI Tahmini"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={fetchAIProjection}
              className="h-8 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest border border-border/20 bg-card/50 hover:bg-muted/50 text-primary transition-all flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              Yenile
            </Button>
            <span className="hidden sm:inline-block text-[8px] md:text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase tracking-wider">
              6 Aylık Projeksiyon
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-8 flex-1 flex flex-col">
        <div className="flex flex-row items-baseline justify-between mb-6 gap-2">
          <div className="overflow-hidden">
            <h3 className="text-xl md:text-3xl font-heading font-bold text-primary truncate">
              {isMobile ? new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(sixMonthValue) + " ₺" : formatAmount(sixMonthValue)}
            </h3>
            <div className="text-[10px] md:text-sm font-bold text-emerald-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              +{isMobile ? new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(profit) + " ₺" : formatAmount(profit)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">AYLIK ORAN</div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm md:text-xl font-bold text-primary">%{growthPercent}</span>
              {rationale && (
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] p-3 rounded-xl bg-card border-border shadow-lg">
                      <p className="text-xs font-medium leading-relaxed">{rationale}</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[150px] md:min-h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDeger" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={(props: any) => {
                  const { x, y, payload } = props;
                  if (isMobile && ![0, 2, 5].includes(payload.index)) return null;
                  return (
                    <text x={x} y={y + 10} fontSize={isMobile ? 8 : 10} fill="currentColor" opacity={0.5} textAnchor="middle">
                      {payload.value}
                    </text>
                  );
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as any;
                    return (
                      <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name || "Tahmini Değer"}</p>
                        <p className="text-lg font-heading font-bold text-primary">
                          {formatAmount(item.rawVal)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{item.month}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="deger"
                stroke="#10b981"
                strokeWidth={isMobile ? 2 : 3}
                fillOpacity={1}
                fill="url(#colorDeger)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {assetProjections && assetProjections.length > 0 && (
          <div className="mt-4 md:mt-6 border-t border-border/10 pt-4">
            <h4 className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Varlık Tahminleri</h4>
            <div className="flex overflow-x-auto space-x-3 pb-2 no-scrollbar">
              {assetProjections.map((asset, idx) => {
                const isPositive = asset.projectedValue >= asset.currentValue;
                const percentChange = (((asset.projectedValue - asset.currentValue) / (asset.currentValue || 1)) * 100) || 0;

                return (
                  <div key={idx} className="flex-none flex flex-col gap-1 md:gap-1.5 bg-muted/40 p-3 md:p-4 rounded-2xl border border-border/20 w-[180px] md:w-[240px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-bold text-primary truncate">{asset.symbol || "Varlık"}</span>
                      <span className={`text-[10px] md:text-xs font-bold flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" /> : <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1 rotate-180" />}
                        {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[10px] md:text-xs font-medium text-foreground">
                      {new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(asset.projectedValue)} ₺ <span className="text-[8px] md:text-[10px] text-muted-foreground line-through ml-1">{new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(asset.currentValue)} ₺</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[9px] md:text-xs text-muted-foreground opacity-60 text-center mt-4 italic leading-relaxed">
          {apiError
            ? "⚠️ AI yapılandırması eksik, sabit %4 büyüme baz alınmıştır."
            : `* Mevcut varlık dağılımınız üzerinden AI tarafından tahmin edilmiştir.`}
        </p>
      </CardContent>
    </Card>
  );
}
