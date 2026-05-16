"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useCurrency } from "@/context/currency-context";

interface BudgetOverviewProps {
  incomes: any[];
  expenses: any[];
}

export function BudgetOverview({ incomes, expenses }: BudgetOverviewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totalIncome = incomes.reduce((acc, inc) => acc + (inc.amount || 0), 0);
  const totalExpense = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

  const data = [
    { name: "Gelir", total: totalIncome, rawTotal: totalIncome, gradient: "url(#colorIncome)" },
    { name: "Gider", total: totalExpense, rawTotal: totalExpense, gradient: "url(#colorExpense)" },
  ];

  if (!isMounted) {
    return <div className="h-[300px] md:h-[350px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  return (
    <div className="h-[300px] md:h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme === "dark" ? "#a855f7" : "#8c5000"} stopOpacity={1} />
              <stop offset="95%" stopColor={theme === "dark" ? "#a855f7" : "#8c5000"} stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme === "dark" ? "#eab308" : "#efe440"} stopOpacity={1} />
              <stop offset="95%" stopColor={theme === "dark" ? "#eab308" : "#efe440"} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            stroke={theme === "dark" ? "#94a3b8" : "#554336"}
            fontSize={12}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke={theme === "dark" ? "#94a3b8" : "#554336"}
            fontSize={9}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 40 : 70}
            tickFormatter={(value) => {
              if (isMobile) {
                return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 0 }).format(value) + " ₺";
              }
              return formatAmount(value);
            }}
          />
          <Tooltip
            cursor={{ fill: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f8f9fa", radius: 16 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as any;
                return (
                  <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.name}</p>
                    <p className="text-lg font-heading font-bold text-primary">
                      {formatAmount(item.rawTotal)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="total"
            radius={[16, 16, 0, 0]}
            barSize={isMobile ? 70 : 90}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.gradient} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
