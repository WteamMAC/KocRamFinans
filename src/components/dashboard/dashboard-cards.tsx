"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";

interface DashboardCardsProps {
  netWorth: number;
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  totalProfit: number;
  profitPercent: number;
  totalRealizedProfit: number;
  totalUnrealizedProfit: number;
  totalDividends: number;
  savingsRate: number;
  userCurrency?: string;
}

export function DashboardCards({
  netWorth,
  totalIncome,
  totalExpense,
  totalDebt,
  totalProfit,
  profitPercent,
  totalRealizedProfit,
  totalUnrealizedProfit,
  totalDividends,
  userCurrency,
}: DashboardCardsProps) {
  const { formatAmount, setDisplayCurrency } = useCurrency();

  useEffect(() => {
    if (userCurrency && !sessionStorage.getItem("user_curr_synced_main")) {
      setDisplayCurrency(userCurrency);
      sessionStorage.setItem("user_curr_synced_main", "true");
    }
  }, [userCurrency, setDisplayCurrency]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="tour-step-4 relative overflow-hidden bg-card border-border/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
        <div className="absolute -right-4 -top-4 p-8 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Net Varlık</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-heading font-bold text-primary">{formatAmount(netWorth)}</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></div>
            <span className="text-[10px] font-bold text-muted-foreground opacity-60">GÜNCEL DURUM</span>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-card border-border/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
        <div className="absolute -right-4 -top-4 p-8 bg-emerald-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aylık Nakit Akışı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-heading font-bold text-primary">{formatAmount(totalIncome - totalExpense)}</div>
          <div className="mt-3 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Gelir: {formatAmount(totalIncome)}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-card border-border/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
        <div className="absolute -right-4 -top-4 p-8 bg-destructive/5 rounded-full group-hover:scale-110 transition-transform"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Toplam Borç</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-heading font-bold text-primary">{formatAmount(totalDebt)}</div>
          <div className="mt-3 text-[10px] font-bold text-destructive flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3" />
            Borç Yükü: %{((totalDebt / (totalIncome || 1)) * 100).toFixed(1)}
          </div>
        </CardContent>
      </Card>

      <Card className="tour-step-5 relative overflow-hidden bg-primary border-none shadow-ambient-high hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
        <div className="absolute -right-4 -top-4 p-8 bg-primary-foreground/10 rounded-full group-hover:scale-110 transition-transform"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest">Portföy Kar/Zarar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-3xl font-heading font-bold",
            totalProfit >= 0 ? "text-accent" : "text-destructive-foreground"
          )}>
            {formatAmount(totalProfit)}
          </div>
          <div className={cn(
            "mt-3 text-[10px] font-bold flex items-center gap-1",
            totalProfit >= 0 ? "text-emerald-400" : "text-destructive-foreground"
          )}>
            {totalProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            %{profitPercent.toFixed(2)} Getiri
          </div>
          <div className="mt-4 pt-3 border-t border-primary-foreground/10 space-y-1">
             <div className="flex justify-between items-center text-[10px]">
               <span className="text-primary-foreground/70">Gerçekleşen Kar:</span>
               <span className="text-emerald-400 font-bold">+{formatAmount(totalRealizedProfit)}</span>
             </div>
             <div className="flex justify-between items-center text-[10px]">
               <span className="text-primary-foreground/70">Bekleyen Kar:</span>
               <span className={totalUnrealizedProfit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                 {totalUnrealizedProfit > 0 ? "+" : ""}{formatAmount(totalUnrealizedProfit)}
               </span>
             </div>
             {totalDividends > 0 && (
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-primary-foreground/70">Temettü Geliri:</span>
                 <span className="text-accent font-bold">+{formatAmount(totalDividends)}</span>
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
