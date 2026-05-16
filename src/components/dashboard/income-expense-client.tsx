"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  RefreshCw, 
  Receipt,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowRightLeft,
  ShoppingCart,
  Utensils,
  Car,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { useCurrency, DISPLAY_CURRENCIES_MAP } from "@/context/currency-context";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  createdAt: string;
  currency?: string;
  originalAmount?: number;
  fxRate?: number;
  tryAmount?: number;
}

interface IncomeExpenseClientProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  projectedBalance: number;
  monthlyData: { month: string; income: number; expense: number }[];
  maxMonthly: number;
  expenseCategoryMap: Record<string, number>;
  incomeCategoryMap: Record<string, number>;
  recentTransactions: Transaction[];
  debts: any[];
}

export function IncomeExpenseClient({
  totalIncome,
  totalExpense,
  netBalance,
  projectedBalance,
  monthlyData,
  maxMonthly,
  expenseCategoryMap,
  recentTransactions,
  debts,
}: IncomeExpenseClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Tümü");

  const { formatAmount, displayCurrency } = useCurrency();
<<<<<<< HEAD
=======

  const formatTransactionAmount = (tx: Transaction) => {
    const cur = (tx.currency || "TRY").toUpperCase();
    const sym = DISPLAY_CURRENCIES_MAP[cur]?.symbol || cur;
    return `${(tx.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: tx.amount < 1 ? 4 : 2 })} ${sym}`;
  };
>>>>>>> 4783a1d623e3c885b4afa4aa69e1d99755ff73cc

  const formatTransactionAmount = (tx: Transaction) => {
    const cur = (tx.currency || "TRY").toUpperCase();
    const sym = DISPLAY_CURRENCIES_MAP[cur]?.symbol || cur;
    return `${(tx.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: tx.amount < 1 ? 4 : 2 })} ${sym}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 md:space-y-10 pb-20 max-w-[1440px] mx-auto p-4 md:py-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2 w-full md:w-auto"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-2xl shadow-inner border border-primary/10 shrink-0">
              <ArrowRightLeft className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-4xl font-heading font-black text-primary tracking-tight truncate">Gelir - Gider Analizi</h1>
          </div>
          <p className="text-muted-foreground font-bold opacity-60 text-[10px] md:text-sm uppercase tracking-[0.2em] px-1">Finansal Akış ve Nakit Yönetimi</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 w-full md:w-auto"
        >
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-2xl h-12 flex-1 md:flex-none px-6 border-border/20 bg-card/50 backdrop-blur-xl hover:bg-muted/50 transition-all font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </Button>
        </motion.div>
      </div>

      {/* Hero Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {[
          { 
            label: "Toplam Gelir", 
            val: totalIncome, 
            icon: TrendingUp, 
            color: "text-emerald-500", 
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            msg: "Pozitif Akış"
          },
          { 
            label: "Toplam Gider", 
            val: totalExpense, 
            icon: TrendingDown, 
            color: "text-rose-500", 
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            msg: "Bütçe Kontrolü"
          },
          { 
            label: "Net Bakiye", 
            val: netBalance, 
            icon: Wallet, 
            color: "text-primary", 
            bg: "bg-primary/10",
            border: "border-primary/20",
            msg: projectedBalance >= 0 ? "Kârlı Durum" : "Bütçe Aşımı"
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn(
              "border-border/20 shadow-ambient-medium rounded-[24px] md:rounded-[32px] p-5 md:p-8 relative overflow-hidden bg-card/60 backdrop-blur-xl group hover:shadow-ambient-high transition-all duration-500",
              stat.border
            )}>
              <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 opacity-40 transition-transform group-hover:scale-110", stat.bg)} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                <div className={cn("p-2.5 rounded-2xl shadow-inner", stat.bg, stat.color)}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <p className={cn("text-2xl md:text-3xl font-heading font-black tracking-tight", stat.color)}>{formatAmount(stat.val)}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", stat.bg, stat.color)}>
                  {stat.msg}
                </span>
                {stat.label === "Net Bakiye" && (
                  <p className="text-[10px] font-bold text-muted-foreground opacity-60">
                    Beklenen: <span className={cn("font-black", projectedBalance >= 0 ? "text-emerald-500" : "text-rose-500")}>{formatAmount(projectedBalance)}</span>
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Comparison & Category Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="xl:col-span-8"
        >
          <Card className="border-border/20 shadow-ambient-high rounded-[32px] md:rounded-[40px] p-6 md:p-10 bg-card/40 backdrop-blur-3xl relative overflow-hidden h-full min-h-[400px] md:min-h-[500px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 md:mb-12 gap-6 relative z-10">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-heading font-black text-foreground flex items-center gap-3">
                  <Layers className="h-5 w-5 md:h-6 md:w-6 text-primary" /> Analitik Görünüm
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold opacity-60 uppercase tracking-widest">Son 6 Aylık Finansal Karşılaştırma</p>
              </div>
              <div className="flex gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gelir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary border border-primary" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gider</span>
                </div>
              </div>
            </div>

            <div className="h-64 md:h-80 flex items-end justify-between gap-2 md:gap-8 px-2 md:px-4 border-b border-border/10 pb-6 relative z-10">
              {monthlyData.every(d => d.income === 0 && d.expense === 0) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="p-4 bg-muted/30 rounded-full mb-4">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Henüz Veri Yok</p>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-2 max-w-[200px]">
                    İşlem eklediğinizde son 6 aya ait gelir-gider karşılaştırmanız burada görünecek.
                  </p>
                </div>
              ) : (
                monthlyData.slice().reverse().map((d, i) => {
                  const incHeight = maxMonthly > 0 ? Math.max((d.income / maxMonthly) * 100, d.income > 0 ? 8 : 0) : 0;
                  const expHeight = maxMonthly > 0 ? Math.max((d.expense / maxMonthly) * 100, d.expense > 0 ? 8 : 0) : 0;
                  const isCurrent = i === monthlyData.length - 1;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 md:gap-6 group relative">
                      <div className="w-full flex gap-1 items-end h-48 md:h-64 relative">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${incHeight}%` }}
                          transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                          className={cn(
                            "flex-1 rounded-t-lg md:rounded-t-2xl transition-all duration-500 relative overflow-hidden group/bar",
                            isCurrent ? "bg-emerald-500 shadow-[0_-4px_20px_rgba(16,185,129,0.3)]" : "bg-emerald-500/30 group-hover:bg-emerald-500/50"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </motion.div>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${expHeight}%` }}
                          transition={{ duration: 1, delay: i * 0.1 + 0.2, ease: "circOut" }}
                          className={cn(
                            "flex-1 rounded-t-lg md:rounded-t-2xl transition-all duration-500 relative overflow-hidden group/bar",
                            isCurrent ? "bg-primary shadow-[0_-4px_20px_rgba(189,194,176,0.3)]" : "bg-primary/40 group-hover:bg-primary/60"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </motion.div>
                        
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-ambient-high opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap border border-border/20 scale-90 group-hover:scale-100 hidden md:block">
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 border-b border-border/10 pb-1">{d.month}</p>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-bold text-emerald-500">GELİR</span>
                              <span className="text-sm font-black text-emerald-500">{formatAmount(d.income)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-bold text-primary">GİDER</span>
                              <span className="text-sm font-black text-primary">{formatAmount(d.expense)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors mt-2",
                        isCurrent ? "text-primary" : "text-muted-foreground/60"
                      )}>{d.month}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Categories Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="xl:col-span-4"
        >
          <Card className="border-border/20 shadow-ambient-high rounded-[32px] md:rounded-[40px] p-6 md:p-10 bg-card/60 backdrop-blur-2xl h-full flex flex-col items-center">
            <h3 className="text-xl font-heading font-black text-foreground mb-8 md:mb-12 self-start flex items-center gap-3">
              <Filter className="h-5 w-5 text-primary" /> Dağılım Analizi
            </h3>
            
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-8 md:mb-12 group">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {(() => {
                  const entries = Object.entries(expenseCategoryMap).sort(([,a], [,b]) => (b as number) - (a as number));
                  const total = totalExpense || 1;
                  let offset = 0;
                  const colors = ["#bdc2b0", "#10b981", "#3b82f6", "#f59e0b", "#f43f5e"];
                  
                  if (entries.length === 0) {
                    return <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/10" strokeDasharray="100, 100" />
                  }

                  return entries.slice(0, 5).map(([cat, amt], idx) => {
                    const pct = (amt / total) * 100;
                    const dasharray = `${pct}, 100`;
                    const currentOffset = offset;
                    offset -= pct;
                    return (
                      <motion.path 
                        key={cat} 
                        initial={{ strokeDasharray: "0, 100" }}
                        animate={{ strokeDasharray: dasharray }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                        stroke={colors[idx % colors.length]} 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        strokeDashoffset={currentOffset} 
                        strokeWidth="4" 
                        className="transition-all duration-500 hover:stroke-width-6 cursor-pointer"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute text-center px-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">Toplam Gider</p>
                <p className="text-xl md:text-2xl font-heading font-black text-primary tracking-tight">{formatAmount(totalExpense)}</p>
              </div>
            </div>

            <div className="w-full space-y-3 md:space-y-4">
              {Object.entries(expenseCategoryMap).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 5).map(([cat, amt], idx) => {
                const colors = ["bg-primary", "bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-rose-500"];
                const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                return (
                  <div key={cat} className="flex justify-between items-center p-2.5 md:p-3 rounded-2xl border border-border/5 bg-muted/20 group hover:bg-muted/40 transition-all">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className={cn("w-2 md:w-2.5 h-2 md:h-2.5 rounded-full shadow-lg", colors[idx % colors.length])} />
                      <span className="text-[10px] md:text-xs font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider truncate max-w-[80px] md:max-w-none">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">%{pct}</span>
                      <span className="text-[11px] md:text-xs font-black text-foreground">{formatAmount(amt)}</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(expenseCategoryMap).length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center opacity-30">
                  <Sparkles className="h-8 w-8 mb-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Kayıtlı Veri Yok</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Transactions Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-heading font-black text-primary tracking-tight flex items-center gap-3">
              <Calendar className="h-5 w-5 md:h-6 md:w-6" /> İşlem Geçmişi
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground font-bold opacity-60 uppercase tracking-widest px-1">Tüm Finansal Hareketler</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input 
                placeholder="İşlemlerde ara..." 
                className="h-12 pl-11 pr-4 rounded-[18px] bg-card/60 border-border/20 w-full text-xs font-bold"
              />
            </div>
            <Select value={filterCategory} onValueChange={(val: any) => setFilterCategory(val || "Tümü")}>
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-card/60 border-border/20 rounded-[18px] font-black text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Kategori Filtresi" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-card/95 backdrop-blur-xl font-bold border-border/20 shadow-ambient-high">
                {["Tümü", ...Array.from(new Set(recentTransactions.map(t => t.category)))].map(cat => (
                  <SelectItem key={cat} value={cat} className="rounded-xl m-1">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Responsive Transaction View */}
        <div className="space-y-4">
          {/* Desktop Table View */}
          <Card className="hidden md:block border-border/20 shadow-ambient-high rounded-[40px] overflow-hidden bg-card/30 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/10">
                    <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Detay</th>
                    <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Kategori</th>
                    <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Zamanlama</th>
                    <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Miktar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {recentTransactions.filter(t => filterCategory === "Tümü" || t.category === filterCategory).map((tx, idx) => {
                    const isInc = tx.type === 'income';
                    let Icon = isInc ? Wallet : Receipt;
                    const cat = tx.category.toLowerCase();
                    if (cat.includes('market')) Icon = ShoppingCart;
                    else if (cat.includes('yemek')) Icon = Utensils;
                    else if (cat.includes('ulaşım')) Icon = Car;
                    else if (cat.includes('kira')) Icon = Home;

                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-all group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                              isInc ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-foreground">{tx.description || tx.category}</p>
                              <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest mt-1">ID: {tx.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black shadow-sm border uppercase tracking-widest",
                            isInc ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted/50 text-muted-foreground border-border/20"
                          )}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-foreground uppercase">
                              {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest mt-0.5">
                              {new Date(tx.createdAt).getFullYear()}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <p className={cn("text-xl font-black tracking-tight", isInc ? "text-emerald-500" : "text-rose-500")}>
                            {isInc ? '+' : '-'} {formatTransactionAmount(tx)}
                          </p>
                          {(!tx.currency || tx.currency.toUpperCase() !== displayCurrency.toUpperCase()) && (
                            <p className="text-[11px] font-bold text-muted-foreground opacity-70 mt-1">
                              ≈ {isInc ? '+' : '-'} {formatAmount(tx.tryAmount != null ? tx.tryAmount : (tx.amount * (tx.fxRate || 1)))}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {recentTransactions.filter(t => filterCategory === "Tümü" || t.category === filterCategory).map((tx, idx) => {
              const isInc = tx.type === 'income';
              let Icon = isInc ? Wallet : Receipt;
              const cat = tx.category.toLowerCase();
              if (cat.includes('market')) Icon = ShoppingCart;
              else if (cat.includes('yemek')) Icon = Utensils;
              else if (cat.includes('ulaşım')) Icon = Car;
              else if (cat.includes('kira')) Icon = Home;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card/40 backdrop-blur-xl border border-border/20 rounded-3xl p-5 shadow-ambient-low flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                      isInc ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm md:text-base text-foreground truncate">{tx.description || tx.category}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                          isInc ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-muted/50 text-muted-foreground border-border/10"
                        )}>
                          {tx.category}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground opacity-70">
                          {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-base md:text-lg font-black tracking-tight", isInc ? "text-emerald-500" : "text-rose-500")}>
                      {isInc ? '+' : '-'} {formatTransactionAmount(tx)}
                    </p>
                    {(!tx.currency || tx.currency.toUpperCase() !== displayCurrency.toUpperCase()) && (
                      <p className="text-[10px] font-bold text-muted-foreground opacity-70 mt-0.5">
                        ≈ {isInc ? '+' : '-'} {formatAmount(tx.tryAmount != null ? tx.tryAmount : (tx.amount * (tx.fxRate || 1)))}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {recentTransactions.filter(t => filterCategory === "Tümü" || t.category === filterCategory).length === 0 && (
            <div className="py-12 md:py-24 flex flex-col items-center justify-center text-center opacity-20">
              <Layers className="h-10 w-10 md:h-12 md:w-12 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Veri bulunamadı</p>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}