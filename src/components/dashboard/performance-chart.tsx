"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y' | '10y';

interface PerformanceChartProps {
  incomes: any[];
  expenses: any[];
  investments: any[];
}

export function PerformanceChart({ incomes, expenses, investments }: PerformanceChartProps) {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    let steps: number;
    let stepFn: (date: Date, amount: number) => Date;
    let formatStr: string;

    switch (timeRange) {
      case '1w': steps = 7; stepFn = subDays; formatStr = "d MMM"; break;
      case '1m': steps = 30; stepFn = subDays; formatStr = "d MMM"; break;
      case '3m': steps = 90; stepFn = subDays; formatStr = "d MMM"; break;
      case '6m': steps = 26; stepFn = subWeeks; formatStr = "d MMM"; break;
      case '1y': steps = 12; stepFn = subMonths; formatStr = "MMM yy"; break;
      case '10y': steps = 10; stepFn = subYears; formatStr = "yyyy"; break;
      default: steps = 30; stepFn = subDays; formatStr = "d MMM";
    }

    const data = [];
    const now = new Date();

    for (let i = steps; i >= 0; i--) {
      const date = startOfDay(stepFn(now, i));
      
      const cumulativeIncome = incomes
        .filter(inc => !inc.createdAt || isAfter(date, startOfDay(new Date(inc.createdAt))) || date.getTime() === startOfDay(new Date(inc.createdAt)).getTime())
        .reduce((sum, inc) => sum + inc.amount, 0);

      const cumulativeExpense = expenses
        .filter(exp => !exp.createdAt || isAfter(date, startOfDay(new Date(exp.createdAt))) || date.getTime() === startOfDay(new Date(exp.createdAt)).getTime())
        .reduce((sum, exp) => sum + exp.amount, 0);

      const cumulativeInvestment = investments
        .filter(inv => !inv.createdAt || isAfter(date, startOfDay(new Date(inv.createdAt))) || date.getTime() === startOfDay(new Date(inv.createdAt)).getTime())
        .reduce((sum, inv) => sum + (inv.amount || (inv.quantity * (inv.purchasePrice || 0))), 0);

      data.push({
        name: format(date, formatStr, { locale: tr }),
        Bakiye: Math.round(cumulativeIncome - cumulativeExpense),
        Yatırım: Math.round(cumulativeInvestment),
        rawBakiye: cumulativeIncome - cumulativeExpense,
        rawYatirim: cumulativeInvestment
      });
    }
    return data;
  }, [incomes, expenses, investments, timeRange]);

  if (!mounted) return <div className="h-[300px] w-full" />;

  const isDark = theme === "dark";
  const primaryColor = isDark ? "#c084fc" : "#8c5000";
  const accentColor = isDark ? "#fbbf24" : "#efe440";
  const textColor = isDark ? "#94a3b8" : "#554336";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(140, 80, 0, 0.05)";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(140, 80, 0, 0.1)";

  const ranges = [
    { value: '1w', label: '1H' },
    { value: '1m', label: '1A' },
    { value: '3m', label: '3A' },
    { value: '6m', label: '6A' },
    { value: '1y', label: '1Y' },
    { value: '10y', label: '10Y' },
  ];

  return (
    <>
      <CardHeader className="bg-muted/30 border-b border-border/10 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" /> Gelişim Grafiği
        </CardTitle>
        <div className="flex bg-muted/50 p-1 rounded-xl shadow-inner">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value as TimeRange)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                timeRange === r.value 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorBakiye" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorYatirim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: textColor, fontWeight: "bold" }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: textColor, fontWeight: "bold" }}
                tickFormatter={(value) => `${formatAmount(value)}`}
              />
              <Tooltip 
                formatter={(value: any, name: any, props: any) => [
                  formatAmount(name === "Nakit Bakiyesi" ? props.payload.rawBakiye : props.payload.rawYatirim),
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: tooltipBg, 
                  borderRadius: "16px", 
                  border: `1px solid ${tooltipBorder}`,
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  padding: "12px",
                  color: textColor
                }}
                itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                labelStyle={{ color: primaryColor, fontWeight: "bold", marginBottom: "4px" }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: "20px", fontSize: "12px", fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="Bakiye"
                stroke={primaryColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBakiye)"
                name="Nakit Bakiyesi"
              />
              <Area
                type="monotone"
                dataKey="Yatırım"
                stroke={accentColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorYatirim)"
                name="Toplam Yatırım"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </>
  );
}
