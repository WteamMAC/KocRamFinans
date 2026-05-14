"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface Asset {
    id: string;
    symbol: string;
    type: string;
    currentValue: number;
}

interface PortfolioChartProps {
    assets: Asset[];
}

const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    const formattedValue = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 14}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="currentColor" fontSize={14} fontWeight="bold" className="fill-foreground">
                {`${(percent * 100).toFixed(1)}%`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12} className="fill-muted-foreground">
                {formattedValue}
            </text>
        </g>
    );
};

export function PortfolioChart({ assets }: PortfolioChartProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const { theme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Benzersiz tip sayısına bak. Eğer sadece 1 tip varsa (örneğin sadece Kripto sayfasındaysak),
    // o zaman grafiği kendi içinde (sembol bazında) grupla.
    const uniqueTypes = new Set(assets.map(a => a.type));
    const groupBySymbol = uniqueTypes.size === 1;

    const groupedData = assets.reduce((acc, asset) => {
        const key = groupBySymbol ? asset.symbol : asset.type;
        const existing = acc.find((a) => a.name === key);
        if (existing) {
            existing.value += asset.currentValue;
        } else {
            acc.push({ name: key, value: asset.currentValue });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    // Değerine göre büyükten küçüğe sıralayalım (grafik daha güzel görünür)
    groupedData.sort((a, b) => b.value - a.value);

    // Eğer veri yoksa boş bir görünüm döndür
    if (!groupedData || groupedData.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center border border-dashed rounded-xl border-border">
                <p className="text-sm text-muted-foreground">Henüz portföyünüzde varlık bulunmuyor.</p>
            </div>
        );
    }

    // Component sadece istemcide (client) yüklendikten sonra Recharts'ı göster
    if (!isMounted) {
        return <div className="h-[300px] w-full animate-pulse bg-muted rounded-xl" />;
    }

    // Kategorilere göre özel renkler
    const TYPE_COLORS: Record<string, string> = {
        "CRYPTO": "#f59e0b", // Amber
        "BIST": "#10b981", // Emerald
        "NASDAQ": "#3b82f6", // Blue
        "GOLD": "#eab308", // Yellow
        "CASH": "#64748b", // Slate
    };

    // Semboller için kullanılacak şık renk paleti (random yerine)
    const SYMBOL_COLORS = [
        "#f18d02", "#36684d", "#efe440", "#7cb191", "#ba1a1a", "#666000", "#8c5000",
        "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"
    ];

    const onPieClick = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const pieProps: any = {
        activeIndex,
        activeShape: renderActiveShape,
        data: groupedData,
        cx: "50%",
        cy: "50%",
        innerRadius: 60,
        outerRadius: 80,
        paddingAngle: 5,
        dataKey: "value",
        onClick: onPieClick,
        onMouseEnter: onPieClick,
        style: { cursor: 'pointer' }
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie {...pieProps}>
                        {groupedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={groupBySymbol ? SYMBOL_COLORS[index % SYMBOL_COLORS.length] : (TYPE_COLORS[entry.name] || SYMBOL_COLORS[index % SYMBOL_COLORS.length])}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) =>
                            new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value))
                        }
                        contentStyle={{ 
                            borderRadius: '16px', 
                            border: theme === "dark" ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                            color: theme === "dark" ? "#f1f5f9" : "#1e293b"
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}