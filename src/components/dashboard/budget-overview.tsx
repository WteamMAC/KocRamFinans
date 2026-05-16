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
    return <div className="h-[250px] md:h-[300px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  return (
    <div className="h-[250px] md:h-[300px] w-full min-h-[250px] md:min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: isMobile ? -20 : 0, right: 10 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme === "dark" ? "#c084fc" : "#8c5000"} stopOpacity={1}/>
              <stop offset="95%" stopColor={theme === "dark" ? "#c084fc" : "#8c5000"} stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme === "dark" ? "#fbbf24" : "#efe440"} stopOpacity={1}/>
              <stop offset="95%" stopColor={theme === "dark" ? "#fbbf24" : "#efe440"} stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            stroke={theme === "dark" ? "#94a3b8" : "#554336"}
            fontSize={isMobile ? 10 : 11}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke={theme === "dark" ? "#94a3b8" : "#554336"}
            fontSize={isMobile ? 9 : 11}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 60 : 80}
            tickFormatter={(value) => {
              if (isMobile) {
                return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(value) + " ₺";
              }
              return formatAmount(value);
            }}
          />
          <Tooltip 
            cursor={{ fill: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "#edeeef", radius: 12 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as any;
                return (
                  <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.name}</p>
                    <p className="text-xl font-heading font-bold text-primary">
                      {formatAmount(item.rawTotal)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[12, 12, 0, 0]} barSize={isMobile ? 40 : 80}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.gradient} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
