"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface InvestmentSummaryProps {
  investments: any[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

export function InvestmentSummary({ investments }: InvestmentSummaryProps) {
  const data = investments.map((inv) => ({
    name: inv.type,
    value: inv.currentValuation || inv.amount,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">Henüz yatırım girişi yapılmamış.</p>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded-lg shadow-sm">
                    <p className="text-sm font-bold">{`${payload[0].name}: ${payload[0].value.toLocaleString()} ₺`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
