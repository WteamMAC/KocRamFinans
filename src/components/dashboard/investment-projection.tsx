"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Sparkles, Loader2, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { predictGrowthRate } from "@/app/actions/insights";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InvestmentProjectionProps {
  currentValue: number;
  investments?: any[];
  fixedAssets?: any[];
  monthlySavings?: number;
}

export function InvestmentProjection({ currentValue, investments = [], fixedAssets = [], monthlySavings = 0 }: InvestmentProjectionProps) {
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(1.04);
  const [rationale, setRationale] = useState<string | null>(null);
  const [assetProjections, setAssetProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    async function fetchAIProjection() {
      try {
        const result = await predictGrowthRate({ investments, fixedAssets, monthlySavings });
        if (result.success && result.monthlyRate) {
          // Gelen oran 0.042 formatında, biz 1.042 formatına çeviriyoruz
          setMonthlyGrowthRate(1 + result.monthlyRate);
          setRationale(result.rationale);
          if (result.assetProjections) {
            setAssetProjections(result.assetProjections);
          }
        } else {
          setApiError(true);
          setRationale("Yapay zeka analiz servisine bağlanılamadı. Lütfen API anahtarınızı kontrol edin. Şimdilik varsayılan büyüme hızı gösteriliyor.");
        }
      } catch (error) {
        console.error("AI Projection Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAIProjection();
  }, [investments, fixedAssets]);

  let accumulatedValue = currentValue;
  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = addMonths(new Date(), i);
    
    if (i > 0) {
      // Önceki ayın değerinin üzerine faiz/getiri ekle ve o ayki düzenli tasarrufu ekle
      accumulatedValue = (accumulatedValue * monthlyGrowthRate) + monthlySavings;
    }
    
    return {
      month: format(date, "MMM yyyy", { locale: tr }),
      deger: Math.round(accumulatedValue),
    };
  });

  const sixMonthValue = data[5].deger;
  const profit = sixMonthValue - currentValue;
  const growthPercent = ((monthlyGrowthRate - 1) * 100).toFixed(1);

  return (
    <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-muted/30 border-b border-border/10 py-6">
        <CardTitle className="text-xl font-heading font-bold text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn("h-5 w-5", apiError ? "text-rose-500" : "text-accent animate-pulse")} /> 
            {apiError ? "Varsayılan Büyüme" : "AI Tahmini Büyüme"}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase tracking-wider">
            6 Aylık Projeksiyon
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h3 className="text-3xl font-heading font-bold text-primary">
               {sixMonthValue.toLocaleString("tr-TR")} ₺
            </h3>
            <div className="text-sm font-bold text-emerald-500 flex items-center mt-1">
               <TrendingUp className="h-4 w-4 mr-1" />
               +{profit.toLocaleString("tr-TR")} ₺
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">AYLIK ORAN</div>
             <div className="flex items-center gap-2 justify-end">
                {loading ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <>
                    <span className="text-xl font-bold text-primary">%{growthPercent}</span>
                    {rationale && (
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px] p-3 rounded-xl bg-card border-border shadow-lg">
                            <p className="text-xs font-medium leading-relaxed">{rationale}</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}
             </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-[180px] w-full">
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
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                dy={10}
              />
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toLocaleString("tr-TR")} ₺`, "Tahmini Değer"]}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="deger" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDeger)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {assetProjections && assetProjections.length > 0 && (
          <div className="mt-6 border-t border-border/10 pt-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Spesifik Varlık Tahminleri (6 Ay)</h4>
            <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {assetProjections.map((asset, idx) => {
                const isPositive = asset.projectedValue >= asset.currentValue;
                const percentChange = (((asset.projectedValue - asset.currentValue) / asset.currentValue) * 100) || 0;
                
                return (
                  <div key={idx} className="flex-none flex flex-col gap-1.5 bg-muted/40 p-4 rounded-2xl border border-border/20 w-[240px]">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{asset.symbol || "Varlık"}</span>
                        <span className={`text-xs font-bold flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
                          {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
                        </span>
                     </div>
                     <div className="text-xs font-medium text-foreground">
                       {asset.projectedValue.toLocaleString("tr-TR")} ₺ <span className="text-[10px] text-muted-foreground line-through ml-1">{asset.currentValue.toLocaleString("tr-TR")} ₺</span>
                     </div>
                     <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                        {asset.rationale}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground opacity-60 text-center mt-4 italic">
           {loading 
             ? "Yapay zeka portföyünüzü analiz ediyor..." 
             : apiError 
               ? "⚠️ Yapay zeka yapılandırması eksik olduğu için sabit %4 büyüme baz alınmıştır."
               : `* Mevcut varlık dağılımınız${monthlySavings > 0 ? ' ve aylık ' + monthlySavings.toLocaleString("tr-TR") + ' ₺ düzenli tasarrufunuz ' : ' '}üzerinden AI tarafından tahmin edilmiştir.`}
        </p>
      </CardContent>
    </Card>
  );
}
