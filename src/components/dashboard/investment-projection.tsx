"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";

interface InvestmentProjectionProps {
  currentValue: number;
}

export function InvestmentProjection({ currentValue }: InvestmentProjectionProps) {
  // Basit bir aylık %4 büyüme varsayımı ile projeksiyon (Örn: BES, Hisse, Fon ortalaması)
  const monthlyGrowthRate = 1.04; 
  
  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = addMonths(new Date(), i);
    const projectedValue = currentValue * Math.pow(monthlyGrowthRate, i);
    
    return {
      month: format(date, "MMM yyyy", { locale: tr }),
      deger: Math.round(projectedValue),
    };
  });

  const sixMonthValue = data[5].deger;
  const profit = sixMonthValue - currentValue;

  return (
    <Card className="bg-card border-border/20 shadow-ambient-medium rounded-[32px] overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-muted/30 border-b border-border/10 py-6">
        <CardTitle className="text-xl font-heading font-bold text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> Tahmini Büyüme
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase tracking-wider">
            6 Aylık Projeksiyon
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 flex-1 flex flex-col">
        <div className="flex items-baseline gap-2 mb-6">
           <h3 className="text-3xl font-heading font-bold text-primary">
              {sixMonthValue.toLocaleString("tr-TR")} ₺
           </h3>
           <div className="text-sm font-bold text-emerald-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +{profit.toLocaleString("tr-TR")} ₺
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
        <p className="text-xs text-muted-foreground opacity-60 text-center mt-4">
           * Ortalama aylık %4 getiri varsayımı ile hesaplanmıştır. Kesinlik ifade etmez.
        </p>
      </CardContent>
    </Card>
  );
}
