"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FixedAsset {
  id: string;
  name: string;
  type: string;
  value: number;
}

interface FixedAssetsSummaryProps {
  fixedAssets: FixedAsset[];
}

const COLORS = [
  "#8c5000", // Koyu Kahve
  "#efe440", // Sarı
  "#554336", // Açık Kahve
  "#fed65b", // Altın
  "#c4a484", // Ten Rengi/Bej
  "#3d2b1f", // Bistre
];

export function FixedAssetsSummary({ fixedAssets }: FixedAssetsSummaryProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!fixedAssets || fixedAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-[#554336]/60 italic text-sm">
        Henüz sabit varlık eklenmemiş.
      </div>
    );
  }

  // Kategorilere göre grupla
  const groupedData = fixedAssets.reduce((acc: any, asset) => {
    const existing = acc.find((item: any) => item.name === asset.type);
    if (existing) {
      existing.value += asset.value;
    } else {
      acc.push({ name: asset.type, value: asset.value });
    }
    return acc;
  }, []);

  const totalValue = fixedAssets.reduce((acc, asset) => acc + asset.value, 0);

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-[#f8f9fa] animate-pulse rounded-3xl" />;
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
                  const data = payload[0].payload;
                  const percent = ((data.value / totalValue) * 100).toFixed(1);
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-4 border border-[#dbc2b0]/30 rounded-2xl shadow-ambient-high">
                      <p className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-1">{data.name}</p>
                      <p className="text-xl font-heading font-bold text-[#8c5000]">
                        {data.value.toLocaleString('tr-TR')} ₺
                      </p>
                      <p className="text-[11px] font-bold text-emerald-600 mt-1">%{percent} Pay</p>
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
        <div className="bg-[#8c5000]/5 p-6 rounded-[24px] border border-[#8c5000]/10 mb-4">
          <span className="text-[10px] font-bold text-[#554336] uppercase tracking-widest block mb-1">Toplam Sabit Varlık Değeri</span>
          <span className="text-3xl font-heading font-bold text-[#8c5000]">{totalValue.toLocaleString('tr-TR')} ₺</span>
        </div>

        <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {groupedData.map((item: any, index: number) => {
            const percent = ((item.value / totalValue) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-[#dbc2b0]/10 rounded-xl hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-[#554336]">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#8c5000]">{item.value.toLocaleString('tr-TR')} ₺</span>
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
