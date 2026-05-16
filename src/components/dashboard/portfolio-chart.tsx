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
    const [activeIndexCategory, setActiveIndexCategory] = useState(0);
    const [activeIndexSymbol, setActiveIndexSymbol] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const uniqueTypes = new Set(assets.map(a => a.type));
    const isSingleType = uniqueTypes.size === 1;

    const categoryData = assets.reduce((acc, asset) => {
        const key = asset.type;
        const existing = acc.find((a) => a.name === key);
        if (existing) {
            existing.value += asset.currentValue;
        } else {
            acc.push({ name: key, value: asset.currentValue });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    categoryData.sort((a, b) => b.value - a.value);

    // İlk kategoriyi seçili yap
    useEffect(() => {
        if (categoryData.length > 0 && !selectedCategory) {
            setSelectedCategory(categoryData[0].name);
        }
    }, [categoryData, selectedCategory]);

    const activeCategory = selectedCategory || (categoryData.length > 0 ? categoryData[0].name : null);

    const symbolData = assets
        .filter(a => isSingleType ? true : a.type === activeCategory)
        .reduce((acc, asset) => {
            const key = asset.symbol;
            const existing = acc.find((a) => a.name === key);
            if (existing) {
                existing.value += asset.currentValue;
            } else {
                acc.push({ name: key, value: asset.currentValue });
            }
            return acc;
        }, [] as { name: string; value: number }[]);

    symbolData.sort((a, b) => b.value - a.value);

    if (!assets || assets.length === 0) {
        return (
            <div className="h-[350px] w-full flex items-center justify-center border border-dashed rounded-xl border-border">
                <p className="text-sm text-muted-foreground">Henüz portföyünüzde varlık bulunmuyor.</p>
            </div>
        );
    }

    if (!isMounted) {
        return <div className="h-[350px] w-full animate-pulse bg-muted rounded-xl" />;
    }

    const TYPE_COLORS: Record<string, string> = {
        "CRYPTO": "#f59e0b",
        "BIST": "#10b981",
        "NASDAQ": "#3b82f6",
        "GOLD": "#eab308",
        "CASH": "#64748b",
    };

    const SYMBOL_COLORS = [
        "#f18d02", "#36684d", "#efe440", "#7cb191", "#ba1a1a", "#666000", "#8c5000",
        "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"
    ];

    const onCategoryEnter = (data: any, index: number) => {
        setActiveIndexCategory(index);
        if (data && data.name) {
            setSelectedCategory(data.name);
            setActiveIndexSymbol(0); // Reset symbol index when category changes
        }
    };

    const onSymbolEnter = (_: any, index: number) => {
        setActiveIndexSymbol(index);
    };

    const tooltipStyle = {
        borderRadius: '16px',
        border: theme === "dark" ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        color: theme === "dark" ? "#f1f5f9" : "#1e293b"
    };

    const formatter = (value: any) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value));

    // Ekranı ikiye bölecek miyiz?
    const showTwoCharts = !isSingleType && categoryData.length > 1;

    const categoryPieProps: any = {
        activeIndex: activeIndexCategory,
        activeShape: renderActiveShape,
        data: categoryData,
        cx: "50%",
        cy: "50%",
        innerRadius: 50,
        outerRadius: 70,
        paddingAngle: 5,
        dataKey: "value",
        onMouseEnter: onCategoryEnter,
        onClick: onCategoryEnter,
        style: { cursor: 'pointer' }
    };

    const symbolPieProps: any = {
        activeIndex: activeIndexSymbol,
        activeShape: renderActiveShape,
        data: symbolData,
        cx: "50%",
        cy: "50%",
        innerRadius: 50,
        outerRadius: 70,
        paddingAngle: 5,
        dataKey: "value",
        onMouseEnter: onSymbolEnter,
        onClick: onSymbolEnter,
        style: { cursor: 'pointer' }
    };

    return (
        <div className="h-[380px] w-full flex flex-col md:flex-row gap-4 pt-4">
            {showTwoCharts && (
                <div className="flex-1 min-w-0 flex flex-col items-center">
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Kategori Dağılımı</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie {...categoryPieProps}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.name] || SYMBOL_COLORS[index % SYMBOL_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</p>
                                                <p className="text-lg font-heading font-bold text-primary">
                                                    {formatter(payload[0].value)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            <div className="flex-1 min-w-0 flex flex-col items-center">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    {showTwoCharts ? `${activeCategory} Varlıkları` : 'Varlık Dağılımı'}
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie {...symbolPieProps}>
                            {symbolData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SYMBOL_COLORS[index % SYMBOL_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</p>
                                            <p className="text-lg font-heading font-bold text-primary">
                                                {formatter(payload[0].value)}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}