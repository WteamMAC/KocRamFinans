"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Clock, 
  RefreshCw, 
  Moon, 
  Sun 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface IncomeExpenseClientProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyData: { month: string; income: number; expense: number }[];
  maxMonthly: number;
  expenseCategoryMap: Record<string, number>;
  incomeCategoryMap: Record<string, number>;
  recentTransactions: Transaction[];
}

export function IncomeExpenseClient({
  totalIncome,
  totalExpense,
  netBalance,
  monthlyData,
  maxMonthly,
  expenseCategoryMap,
  incomeCategoryMap,
  recentTransactions,
}: IncomeExpenseClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    if (document.documentElement.classList.contains("dark")) {
      setThemeState("dark");
    } else if (localStorage.getItem("theme") === "dark") {
      setThemeState("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-[#8c5000]">Gelir & Gider Yönetimi</h2>
          <p className="text-[#554336] mt-1">Nakit akışınızı ve harcamalarınızı analiz edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-12 h-12 shrink-0 text-[#8c5000] border-[#dbc2b0]/30 hover:bg-[#8c5000]/5 bg-white shadow-ambient-low"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full px-4 py-2 h-12 text-sm font-semibold text-[#8c5000] border-[#dbc2b0]/30 hover:bg-[#8c5000]/5 bg-white shadow-ambient-low"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xs font-bold text-[#554336] uppercase tracking-widest opacity-70">Toplam Gelir</h3>
          </div>
          <div className="text-3xl font-heading font-bold text-[#8c5000] relative z-10">
            {totalIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
        </Card>

        <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/30 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-xs font-bold text-[#554336] uppercase tracking-widest opacity-70">Toplam Gider</h3>
          </div>
          <div className="text-3xl font-heading font-bold text-[#8c5000] relative z-10">
            {totalExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
        </Card>

        <Card className={cn(
          "p-6 border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] relative overflow-hidden text-white transition-colors duration-500",
          netBalance >= 0 ? "bg-[#8c5000]" : "bg-rose-600"
        )}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl text-white">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-90">Net Bakiye</h3>
          </div>
          <div className="text-3xl font-heading font-bold relative z-10">
            {netBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Monthly Cash Flow Chart */}
        <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px]">
          <h3 className="text-xl font-heading font-bold text-[#8c5000] mb-6">Aylık Nakit Akışı</h3>
          <div className="h-64 flex items-end justify-between gap-3 mt-4 pt-4 border-t border-[#dbc2b0]/10">
            {monthlyData.map((d, i) => {
              const incHeight = maxMonthly > 0 ? Math.max((d.income / maxMonthly) * 100, d.income > 0 ? 2 : 0) : 0;
              const expHeight = maxMonthly > 0 ? Math.max((d.expense / maxMonthly) * 100, d.expense > 0 ? 2 : 0) : 0;
              
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="w-full flex justify-center items-end gap-1.5 h-48">
                    <div 
                      className="w-full max-w-[16px] bg-emerald-400 rounded-t-md transition-all duration-500 group-hover:bg-emerald-500 relative" 
                      style={{ height: `${incHeight}%` }}
                    >
                      {d.income > 0 && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm z-10">
                          {d.income >= 1000 ? `${(d.income/1000).toFixed(1)}k` : d.income}
                        </span>
                      )}
                    </div>
                    <div 
                      className="w-full max-w-[16px] bg-rose-400 rounded-t-md transition-all duration-500 group-hover:bg-rose-500 relative" 
                      style={{ height: `${expHeight}%` }}
                    >
                      {d.expense > 0 && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm z-10">
                          {d.expense >= 1000 ? `${(d.expense/1000).toFixed(1)}k` : d.expense}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#554336] uppercase">{d.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-8 mt-6 pt-4 border-t border-[#dbc2b0]/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></div>
              <span className="text-xs font-bold text-[#554336]">Gelir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></div>
              <span className="text-xs font-bold text-[#554336]">Gider</span>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px]">
          <h3 className="text-xl font-heading font-bold text-[#8c5000] mb-6">Kategori Dağılımı</h3>
          <div className="space-y-8">
            <div>
              <h4 className="text-[10px] font-bold text-[#554336] mb-4 uppercase tracking-widest opacity-70">Gider Kategorileri</h4>
              <div className="space-y-4">
                {Object.entries(expenseCategoryMap).length === 0 ? (
                  <p className="text-sm text-[#554336] opacity-60">Gider kaydı bulunmuyor.</p>
                ) : (
                  Object.entries(expenseCategoryMap)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 4)
                    .map(([cat, amount]) => (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-[#8c5000] capitalize">{cat}</span>
                          <span className="text-[#554336] font-medium">{amount.toLocaleString("tr-TR")} ₺</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#f8f9fa] border border-[#dbc2b0]/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full transition-all duration-1000"
                            style={{ width: `${(amount / totalExpense) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-[#dbc2b0]/10">
              <h4 className="text-[10px] font-bold text-[#554336] mb-4 uppercase tracking-widest opacity-70">Gelir Kategorileri</h4>
              <div className="space-y-4">
                {Object.entries(incomeCategoryMap).length === 0 ? (
                  <p className="text-sm text-[#554336] opacity-60">Gelir kaydı bulunmuyor.</p>
                ) : (
                  Object.entries(incomeCategoryMap)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([cat, amount]) => (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-[#8c5000] capitalize">{cat}</span>
                          <span className="text-[#554336] font-medium">{amount.toLocaleString("tr-TR")} ₺</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#f8f9fa] border border-[#dbc2b0]/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                            style={{ width: `${(amount / totalIncome) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card className="bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-6 border-b border-[#dbc2b0]/10 flex items-center gap-3 bg-[#f8f9fa]/50">
          <div className="p-2 bg-[#8c5000]/10 rounded-lg">
            <Clock className="h-5 w-5 text-[#8c5000]" />
          </div>
          <h3 className="text-xl font-heading font-bold text-[#8c5000]">Son İşlemler</h3>
        </div>
        <div className="divide-y divide-[#dbc2b0]/10">
          {recentTransactions.length === 0 ? (
            <div className="p-12 text-center text-[#554336] opacity-60">
              Henüz bir gelir veya gider işlemi bulunmuyor. Asistan üzerinden ekleyebilirsiniz!
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-[#f8f9fa] transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                    tx.type === "expense" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {tx.type === "expense" ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#8c5000] line-clamp-1">{tx.description}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0",
                        tx.type === "expense" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {tx.category}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-[#554336] flex items-center gap-1 mt-1 opacity-70">
                      <Clock className="h-3 w-3" />
                      {new Date(tx.createdAt).toLocaleDateString("tr-TR")} {new Date(tx.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-bold text-xl sm:text-right",
                  tx.type === "expense" ? "text-rose-600" : "text-emerald-600"
                )}>
                  {tx.type === "expense" ? "-" : "+"}{tx.amount.toLocaleString("tr-TR")} ₺
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}