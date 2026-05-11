"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";

interface InvestmentSummaryProps {
  investments: any[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function InvestmentSummary({ investments }: InvestmentSummaryProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categoryLabels: Record<string, string> = {
    BIST: "BIST (Hisse)",
    NASDAQ: "NASDAQ (Hisse)",
    CRYPTO: "Kripto Para",
    GOLD: "Altın/Emtia",
  };

  // Verileri kategoriye göre gruplayıp toplam değerleri hesaplayalım
  const groupedData = investments.reduce((acc: any, inv: any) => {
    const type = inv.type || "Diğer";
    const value = inv.currentValue || inv.amount || 0;
    
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += value;
    return acc;
  }, {});

  const data = Object.entries(groupedData)
    .map(([name, value]) => ({ 
      name: categoryLabels[name] || name, 
      value: value as number 
    }))
    .sort((a, b) => b.value - a.value);

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8 font-medium">Henüz yatırım girişi yapılmamış.</p>;
  }

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-slate-50/50 animate-pulse rounded-xl" />;
  }

  return (
    <div className="h-[300px] w-full min-h-[300px] relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-xs font-medium text-slate-500">Toplam Değer</span>
        <span className="text-xl font-bold text-slate-900">{totalValue.toLocaleString('tr-TR')} ₺</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
            cornerRadius={4}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-100 rounded-xl shadow-xl">
                    <p className="text-xs font-medium text-slate-500 mb-1">{payload[0]?.name}</p>
                    <p className="text-sm font-bold text-slate-900">
                      {payload[0]?.value?.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
