"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface BudgetOverviewProps {
  incomes: any[];
  expenses: any[];
}

export function BudgetOverview({ incomes, expenses }: BudgetOverviewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalIncome = incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const data = [
    { name: "Gelir", total: totalIncome, gradient: "url(#colorIncome)" },
    { name: "Gider", total: totalExpense, gradient: "url(#colorExpense)" },
  ];

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  return (
    <div className="h-[300px] w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
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
          </defs>
          <XAxis
            dataKey="name"
            stroke={theme === "dark" ? "#94a3b8" : "#554336"}
            fontSize={11}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke={theme === "dark" ? "#94a3b8" : "#554336"}
            fontSize={11}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}₺`}
          />
          <Tooltip 
            cursor={{ fill: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "#edeeef", radius: 12 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-card/95 backdrop-blur-md p-4 border border-border/30 rounded-2xl shadow-ambient-high">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.name}</p>
                    <p className="text-xl font-heading font-bold text-primary">
                      {payload[0]?.value?.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[12, 12, 0, 0]} barSize={80}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.gradient} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
