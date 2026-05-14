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
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface PerformanceChartProps {
  incomes: any[];
  expenses: any[];
  investments: any[];
}

export function PerformanceChart({ incomes, expenses, investments }: PerformanceChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const chartData = useMemo(() => {
    const days = 30;
    const data = [];
    const now = new Date();

    // Son 30 günü oluştur
    for (let i = days; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      
      // Bu tarihe kadar olan toplam gelir
      const cumulativeIncome = incomes
        .filter(inc => !inc.createdAt || isAfter(date, startOfDay(new Date(inc.createdAt))) || date.getTime() === startOfDay(new Date(inc.createdAt)).getTime())
        .reduce((sum, inc) => sum + inc.amount, 0);

      // Bu tarihe kadar olan toplam gider
      const cumulativeExpense = expenses
        .filter(exp => !exp.createdAt || isAfter(date, startOfDay(new Date(exp.createdAt))) || date.getTime() === startOfDay(new Date(exp.createdAt)).getTime())
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Bu tarihe kadar olan toplam yatırım (maliyet bazlı)
      const cumulativeInvestment = investments
        .filter(inv => !inv.createdAt || isAfter(date, startOfDay(new Date(inv.createdAt))) || date.getTime() === startOfDay(new Date(inv.createdAt)).getTime())
        .reduce((sum, inv) => sum + (inv.amount || (inv.quantity * (inv.purchasePrice || 0))), 0);

      data.push({
        name: format(date, "d MMM", { locale: tr }),
        Bakiye: cumulativeIncome - cumulativeExpense,
        Yatırım: cumulativeInvestment,
      });
    }
    return data;
  }, [incomes, expenses, investments]);

  if (!mounted) return <div className="h-[300px] w-full" />;

  const isDark = theme === "dark";
  const primaryColor = isDark ? "#c084fc" : "#8c5000";
  const accentColor = isDark ? "#fbbf24" : "#efe440";
  const textColor = isDark ? "#94a3b8" : "#554336";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(140, 80, 0, 0.05)";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(140, 80, 0, 0.1)";

  return (
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
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
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
  );
}
