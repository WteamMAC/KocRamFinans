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
    return <div className="h-[300px] w-full bg-[#f8f9fa] animate-pulse rounded-3xl" />;
  }

  return (
    <div className="h-[300px] w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8c5000" stopOpacity={1}/>
              <stop offset="95%" stopColor="#8c5000" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#efe440" stopOpacity={1}/>
              <stop offset="95%" stopColor="#efe440" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            stroke="#554336"
            fontSize={11}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#554336"
            fontSize={11}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}₺`}
          />
          <Tooltip 
            cursor={{ fill: '#edeeef', radius: 12 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-md p-4 border border-[#dbc2b0]/30 rounded-2xl shadow-ambient-high">
                    <p className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-1">{item.name}</p>
                    <p className="text-xl font-heading font-bold text-[#8c5000]">
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
