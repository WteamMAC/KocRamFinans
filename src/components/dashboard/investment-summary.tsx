"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface InvestmentSummaryProps {
  investments: any[];
  fixedAssets?: any[];
}

const COLORS = ["var(--primary)", "#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#f43f5e"];
const FIXED_COLORS = ["#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#84cc16", "#f2e743"];

export function InvestmentSummary({ investments, fixedAssets }: InvestmentSummaryProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categoryLabels: Record<string, string> = {
    BIST: "BIST (Hisse)",
    NASDAQ: "NASDAQ (Hisse)",
    CRYPTO: "Kripto Para",
    GOLD: "Altın/Emtia",
    BES: "Bireysel Emeklilik (BES)",
    FAIZ: "Vadeli Mevduat (Faiz)",
  };

  // Yatırımları grupla
  const investmentGroups = investments.reduce((acc: any, inv: any) => {
    const type = inv.type || "Diğer";
    const value = inv.currentValue || inv.amount || 0;
    if (!acc[type]) acc[type] = 0;
    acc[type] += value;
    return acc;
  }, {});

  const investmentData = Object.entries(investmentGroups)
    .map(([name, value]) => ({ 
      name: categoryLabels[name] || name, 
      value: value as number 
    }))
    .sort((a, b) => b.value - a.value);

  const totalInvestment = investmentData.reduce((acc, curr) => acc + curr.value, 0);

  // Sabit Varlıkları grupla
  const fixedAssetGroups = (fixedAssets || []).reduce((acc: any, asset: any) => {
    const type = asset.type || "Diğer";
    if (!acc[type]) acc[type] = 0;
    acc[type] += asset.value;
    return acc;
  }, {});

  const fixedAssetData = Object.entries(fixedAssetGroups)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const totalFixedAsset = fixedAssetData.reduce((acc, curr) => acc + curr.value, 0);

  if (!isMounted) {
    return <div className="h-[350px] w-full bg-muted animate-pulse rounded-[24px]" />;
  }

  return (
    <div className={cn(
      "w-full grid gap-8",
      fixedAssets && fixedAssets.length > 0 ? "md:grid-cols-2" : "grid-cols-1"
    )}>
      {/* Yatırım Dağılımı */}
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-bold text-primary mb-6 uppercase tracking-widest">Yatırım Portföyü</h3>
        <div className="h-[300px] w-full relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Toplam</span>
            <span className="text-xl font-heading font-bold text-primary">{totalInvestment.toLocaleString('tr-TR')} ₺</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={investmentData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
                cornerRadius={6}
              >
                {investmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-card/95 backdrop-blur-md p-3 border border-border/30 rounded-xl shadow-lg">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{data.name}</p>
                        <p className="text-base font-heading font-bold text-primary">
                          {data.value?.toLocaleString('tr-TR')} ₺
                        </p>
                        <p className="text-[9px] font-bold text-emerald-500 mt-1">
                          Pay: %{((Number(data.value) / totalInvestment) * 100).toFixed(1)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={50}
                iconType="circle"
                formatter={(value) => {
                  const item = investmentData.find(d => d.name === value);
                  const percent = item ? ((item.value / totalInvestment) * 100).toFixed(1) : 0;
                  return <span className="text-[10px] font-bold text-muted-foreground">{value} (%{percent})</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sabit Varlık Dağılımı */}
      {fixedAssets && fixedAssets.length > 0 && (
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-primary mb-6 uppercase tracking-widest">Sabit Varlıklar</h3>
          <div className="h-[300px] w-full relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Toplam</span>
              <span className="text-xl font-heading font-bold text-primary">{totalFixedAsset.toLocaleString('tr-TR')} ₺</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fixedAssetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {fixedAssetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FIXED_COLORS[index % FIXED_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-card/95 backdrop-blur-md p-3 border border-border/30 rounded-xl shadow-lg">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{data.name}</p>
                          <p className="text-base font-heading font-bold text-primary">
                            {data.value?.toLocaleString('tr-TR')} ₺
                          </p>
                          <p className="text-[9px] font-bold text-primary mt-1">
                            Pay: %{((Number(data.value) / totalFixedAsset) * 100).toFixed(1)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={50}
                  iconType="circle"
                  formatter={(value) => {
                    const item = fixedAssetData.find(d => d.name === value);
                    const percent = item ? ((item.value / totalFixedAsset) * 100).toFixed(1) : 0;
                    return <span className="text-[10px] font-bold text-muted-foreground">{value} (%{percent})</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
