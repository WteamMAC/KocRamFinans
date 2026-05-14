"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Sparkles, Loader2, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { predictGrowthRate } from "@/app/actions/insights";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvestmentProjectionProps {
  currentValue: number;
  investments?: any[];
  fixedAssets?: any[];
}

export function InvestmentProjection({ currentValue, investments = [], fixedAssets = [] }: InvestmentProjectionProps) {
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(1.04);
  const [rationale, setRationale] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAIProjection() {
      try {
        const result = await predictGrowthRate({ investments, fixedAssets });
        if (result.success && result.monthlyRate) {
          // Gelen oran 0.042 formatında, biz 1.042 formatına çeviriyoruz
          setMonthlyGrowthRate(1 + result.monthlyRate);
          setRationale(result.rationale);
        }
      } catch (error) {
        console.error("AI Projection Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAIProjection();
  }, [investments, fixedAssets]);

  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = addMonths(new Date(), i);
    // Compound interest: P * (1+r)^n
    const projectedValue = currentValue * Math.pow(monthlyGrowthRate, i);
    
    return {
      month: format(date, "MMM yyyy", { locale: tr }),
      deger: Math.round(projectedValue),
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
            <Sparkles className="h-5 w-5 text-accent animate-pulse" /> AI Tahmini Büyüme
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
        <p className="text-xs text-muted-foreground opacity-60 text-center mt-4 italic">
           {loading ? "Yapay zeka portföyünüzü analiz ediyor..." : `* Mevcut varlık dağılımınız üzerinden AI tarafından tahmin edilmiştir.`}
        </p>
      </CardContent>
    </Card>
  );
}
