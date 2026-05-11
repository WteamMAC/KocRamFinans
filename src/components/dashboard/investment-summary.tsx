"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";

interface InvestmentSummaryProps {
  investments: any[];
}

const COLORS = ["#001b44", "#fed65b", "#735c00", "#1c1c1c", "#ba1a1a", "#434750"];

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
    return <p className="text-sm text-[#434750] text-center py-12 font-medium opacity-60">Henüz yatırım girişi yapılmamış.</p>;
  }

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-[#faf9f6] animate-pulse rounded-[24px]" />;
  }

  return (
    <div className="h-[350px] w-full min-h-[350px] relative flex flex-col items-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
        <span className="text-[10px] font-bold text-[#747781] uppercase tracking-widest mb-1">Toplam Portföy</span>
        <span className="text-2xl font-heading font-bold text-[#001b44]">{totalValue.toLocaleString('tr-TR')} ₺</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={110}
            paddingAngle={6}
            dataKey="value"
            stroke="none"
            cornerRadius={8}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/95 backdrop-blur-md p-4 border border-[#c4c6d2]/30 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-bold text-[#747781] uppercase tracking-widest mb-1">{payload[0]?.name}</p>
                    <p className="text-lg font-heading font-bold text-[#001b44]">
                      {payload[0]?.value?.toLocaleString('tr-TR')} ₺
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">
                      Pay: %{((Number(payload[0]?.value) / totalValue) * 100).toFixed(1)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={40}
            iconType="circle"
            formatter={(value) => <span className="text-xs font-bold text-[#434750] px-2">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
