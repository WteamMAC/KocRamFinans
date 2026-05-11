"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useEffect, useState } from "react";

interface BudgetOverviewProps {
  incomes: any[];
  expenses: any[];
}

export function BudgetOverview({ incomes, expenses }: BudgetOverviewProps) {
  const [isMounted, setIsMounted] = useState(false);

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
    return <div className="h-[300px] w-full bg-slate-50/50 animate-pulse rounded-xl" />;
  }

  return (
    <div className="h-[300px] w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}₺`}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-100 rounded-xl shadow-xl">
                    <p className="text-xs font-medium text-slate-500 mb-1">{item.name}</p>
                    <p className="text-lg font-bold text-slate-900">
                      {payload[0]?.value?.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={60}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.gradient} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
