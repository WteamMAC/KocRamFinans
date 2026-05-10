"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface BudgetOverviewProps {
  incomes: any[];
  expenses: any[];
}

export function BudgetOverview({ incomes, expenses }: BudgetOverviewProps) {
  const totalIncome = incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const data = [
    { name: "Gelir", total: totalIncome, color: "#10b981" },
    { name: "Gider", total: totalExpense, color: "#ef4444" },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}₺`}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded-lg shadow-sm">
                    <p className="text-sm font-bold">{`${payload[0]?.value?.toLocaleString() || 0} ₺`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
