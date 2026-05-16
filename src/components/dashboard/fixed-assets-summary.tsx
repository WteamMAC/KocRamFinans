"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { useCurrency } from "@/context/currency-context";

import { cn } from "@/lib/utils";

interface FixedAsset {
  id: string;
  name: string;
  type: string;
  value: number;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
  originalValuation?: number;
  currentValuation?: number;
  liveProfit?: number;
  liveProfitPercent?: number;
}

interface FixedAssetsSummaryProps {
  fixedAssets: FixedAsset[];
}

const COLORS = [
  "var(--primary)",
  "var(--tertiary)",
  "#64748b",
  "#d97706",
  "#0ea5e9",
  "#14b8a6",
];

export function FixedAssetsSummary({ fixedAssets }: FixedAssetsSummaryProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { formatAmount, displayCurrency } = useCurrency();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!fixedAssets || fixedAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 border border-dashed rounded-[32px] border-border/50 h-[350px]">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <PieChart className="h-8 w-8 text-primary/40" />
        </div>
        <h3 className="text-lg font-heading font-bold text-primary mb-2">Sabit Varlık Dağılımı Henüz Yok</h3>
        <p className="text-sm text-muted-foreground max-w-[320px] mb-8 leading-relaxed">
          Ev, araba veya diğer fiziksel varlıklarınızı ekleyerek toplam net değerinizin nasıl dağıldığını görselleştirin.
        </p>
        <div className="p-4 bg-card border border-border/40 rounded-2xl flex items-center gap-4 text-left w-full max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="text-xs font-black">?</span>
          </div>
          <div>
            <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-0.5">Nasıl Eklenir?</p>
            <p className="text-[10px] text-muted-foreground">"Sabit Varlıklar" sekmesine geçip "Varlık Ekle" butonunu kullanabilirsiniz.</p>
          </div>
        </div>
      </div>
    );
  }

  const groupedData = fixedAssets.reduce((acc: any, asset) => {
    const existing = acc.find((item: any) => item.name === asset.type);
    const val = asset.currentValuation || asset.value;
    if (existing) {
      existing.value += val;
      existing.rawVal += val;
    } else {
      acc.push({ name: asset.type, value: val, rawVal: val });
    }
    return acc;
  }, []);

  const totalOriginalCost = fixedAssets.reduce((acc, a) => acc + (a.originalValuation || a.value), 0);
  const totalValue = fixedAssets.reduce((acc, a) => acc + (a.currentValuation || a.value), 0);
  const totalProfit = totalValue - totalOriginalCost;
  const totalProfitPercent = totalOriginalCost > 0 ? (totalProfit / totalOriginalCost) * 100 : 0;

  const isAllSameCur = fixedAssets.length > 0 && fixedAssets.every(a => (a.currency || "TRY").toUpperCase() === (displayCurrency || "TRY").toUpperCase());
  const exactTotalFixedOrig = isAllSameCur ? fixedAssets.reduce((acc, a) => acc + (a.originalAmount || (a.fxRate ? a.value / a.fxRate : a.value)), 0) : undefined;

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
                  const exactItemOrig = isAllSameCur ? exactTotalFixedOrig! * (data.rawVal / totalValue) : undefined;
                  return (
                    <div className="bg-card/95 backdrop-blur-md p-4 border border-border/40 rounded-2xl shadow-ambient-high">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{data.name}</p>
                      <p className="text-xl font-heading font-bold text-primary">
                        {formatAmount(data.rawVal, undefined, exactItemOrig ? { amount: exactItemOrig, currency: displayCurrency } : undefined)}
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
        <div className="bg-primary/5 p-6 rounded-[24px] border border-primary/10 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Canlı Sabit Varlık Değeri</span>
            <span className="text-3xl font-heading font-bold text-primary">
              {formatAmount(totalValue, undefined, exactTotalFixedOrig ? { amount: exactTotalFixedOrig, currency: displayCurrency } : undefined)}
            </span>
          </div>
          {Math.abs(totalProfit) > 0.01 && (
            <div className={cn("px-3 py-2 rounded-xl text-xs font-bold border w-fit text-right shadow-sm", totalProfit >= 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
              <span className="text-[9px] block text-muted-foreground uppercase font-semibold">Kur / Endeks Değer Artışı</span>
              {totalProfit >= 0 ? "+" : ""}{formatAmount(totalProfit)} ({totalProfit >= 0 ? "+" : ""}{totalProfitPercent.toFixed(1)}%)
            </div>
          )}
        </div>

        <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {groupedData.map((item: any, index: number) => {
            const percent = ((item.rawVal / totalValue) * 100).toFixed(1);
            const exactItemOrig = isAllSameCur ? exactTotalFixedOrig! * (item.rawVal / totalValue) : undefined;
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-card border border-border/15 rounded-2xl hover:shadow-ambient-low transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-primary">
                    {formatAmount(item.rawVal, undefined, exactItemOrig ? { amount: exactItemOrig, currency: displayCurrency } : undefined)}
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-xl border border-primary/15">%{percent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
