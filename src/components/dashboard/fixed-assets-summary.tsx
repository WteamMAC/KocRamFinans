"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { formatAmount } from "@/lib/currency-formatter";

interface FixedAsset {
  id: string;
  name: string;
  type: string;
  value: number;
}

interface FixedAssetsSummaryProps {
  fixedAssets: FixedAsset[];
  currencyConfig?: { symbol: string; rate: number };
}

const COLORS = [
  "var(--primary)",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#6366f1",
  "#f43f5e",
];

export function FixedAssetsSummary({ fixedAssets, currencyConfig = { symbol: "₺", rate: 1 } }: FixedAssetsSummaryProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!fixedAssets || fixedAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/60 italic text-sm">
        Henüz sabit varlık eklenmemiş.
      </div>
    );
  }

  const groupedData = fixedAssets.reduce((acc: any, asset) => {
    const existing = acc.find((item: any) => item.name === asset.type);
    const val = asset.value / currencyConfig.rate;
    if (existing) {
      existing.value += val;
      existing.rawVal += asset.value;
    } else {
      acc.push({ name: asset.type, value: val, rawVal: asset.value });
    }
    return acc;
  }, []);

  const totalValue = fixedAssets.reduce((acc, asset) => acc + asset.value, 0);

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 min-h-[350px]">
      <div className="w-full lg:w-1/2 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={groupedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {groupedData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as any;
                  const percent = ((data.rawVal / totalValue) * 100).toFixed(1);
                  return (
                    <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{data.name}</p>
                      <p className="text-xl font-heading font-bold text-primary">
                        {formatAmount(data.rawVal, currencyConfig)}
                      </p>
                      <p className="text-[11px] font-bold text-emerald-500 mt-1">%{percent} Pay</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full lg:w-1/2 space-y-4">
        <div className="bg-primary/5 p-6 rounded-[24px] border border-primary/10 mb-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Toplam Sabit Varlık Değeri</span>
          <span className="text-3xl font-heading font-bold text-primary">{formatAmount(totalValue, currencyConfig)}</span>
        </div>

        <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {groupedData.map((item: any, index: number) => {
            const percent = ((item.rawVal / totalValue) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-card border border-border/10 rounded-xl hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-primary">{formatAmount(item.rawVal, currencyConfig)}</span>
                  <span className="text-[10px] font-bold text-white bg-emerald-500/80 px-2 py-0.5 rounded-full">%{percent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
