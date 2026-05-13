"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState, useEffect } from "react";

interface Asset {
    id: string;
    symbol: string;
    type: string;
    currentValue: number;
}

interface PortfolioChartProps {
    assets: Asset[];
}

export function PortfolioChart({ assets }: PortfolioChartProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Varlıkları tiplerine göre gruplayalım (Kripto, Hisse, Altın vb.)
    const groupedData = assets.reduce((acc, asset) => {
        const existing = acc.find((a) => a.name === asset.type);
        if (existing) {
            existing.value += asset.currentValue;
        } else {
            acc.push({ name: asset.type, value: asset.currentValue });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    // Eğer veri yoksa boş bir görünüm döndür
    if (!groupedData || groupedData.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center border border-dashed rounded-xl border-slate-200">
                <p className="text-sm text-slate-500">Henüz portföyünüzde varlık bulunmuyor.</p>
            </div>
        );
    }

    // Component sadece istemcide (client) yüklendikten sonra Recharts'ı göster
    if (!isMounted) {
        return <div className="h-[300px] w-full animate-pulse bg-slate-50/50 rounded-xl" />;
    }

    // Kategorilere göre özel renkler
    const COLORS: Record<string, string> = {
        "CRYPTO": "#f59e0b", // Amber
        "BIST": "#10b981", // Emerald
        "NASDAQ": "#3b82f6", // Blue
        "GOLD": "#eab308", // Yellow
        "CASH": "#64748b", // Slate
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={groupedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {groupedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.name] || "#" + Math.floor(Math.random() * 16777215).toString(16)}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) =>
                            new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value))
                        }
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}