"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRightLeft, TrendingUp } from "lucide-react";
import { getExchangeRatesAction } from "@/app/actions/market";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CURRENCIES = [
  { code: "TRY", name: "TL", icon: "₺", color: "text-rose-500" },
  { code: "USD", name: "USD", icon: "$", color: "text-emerald-500" },
  { code: "EUR", name: "EUR", icon: "€", color: "text-blue-500" },
  { code: "GBP", name: "GBP", icon: "£", color: "text-purple-500" },
  { code: "XAU", name: "ALT", icon: "Gr", color: "text-amber-500" },
];

export function CompactCurrencyCalculator() {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TRY");
  const [rates, setRates] = useState<Record<string, number>>({
    TRY: 1,
    USD: 34.20,
    EUR: 37.10,
    GBP: 43.50,
    XAU: 2850,
  });
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await getExchangeRatesAction();
      if (data) {
        setRates({
          TRY: 1,
          ...data
        });
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000 * 5);
    return () => clearInterval(interval);
  }, []);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const calculateResult = () => {
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    const amountInTry = amount * fromRate;
    const result = amountInTry / toRate;
    return result;
  };

  const result = calculateResult();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden lg:flex items-center gap-0 bg-card/40 backdrop-blur-xl border border-primary/10 rounded-2xl px-2 py-1 shadow-ambient-medium hover:shadow-primary/20 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Icon/Indicator */}
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors mr-2 relative z-10">
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>

      {/* Amount Input */}
      <div className="relative group/input z-10">
        <Input
          type="number"
          value={amount === 0 ? "" : amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-14 h-8 bg-transparent border-none focus-visible:ring-0 text-sm font-black p-0 text-center placeholder:opacity-50"
          placeholder="1"
        />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-primary group-hover/input:w-6 transition-all duration-300 rounded-full" />
      </div>
      
      {/* From Currency Select */}
      <Select value={fromCurrency} onValueChange={setFromCurrency}>
        <SelectTrigger className="w-[50px] h-8 bg-transparent border-none focus:ring-0 text-[10px] font-black p-0 flex justify-center hover:text-primary transition-colors z-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border/30 bg-card/95 backdrop-blur-xl">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-[10px] font-bold">
              <span className={cn("mr-2", c.color)}>{c.icon}</span>
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Swap Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSwap}
        className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-all duration-300 mx-0.5 z-10"
      >
        <ArrowRightLeft className="h-3 w-3" />
      </Button>

      {/* To Currency Select */}
      <Select value={toCurrency} onValueChange={setToCurrency}>
        <SelectTrigger className="w-[50px] h-8 bg-transparent border-none focus:ring-0 text-[10px] font-black p-0 flex justify-center hover:text-primary transition-colors z-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border/30 bg-card/95 backdrop-blur-xl">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-[10px] font-bold">
              <span className={cn("mr-2", c.color)}>{c.icon}</span>
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-primary/10 mx-2 z-10" />

      {/* Result Display */}
      <div className="flex flex-col items-end justify-center min-w-[80px] pr-2 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${result}-${toCurrency}`}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-baseline gap-1"
          >
            <span className="text-sm font-black text-primary tracking-tight">
              {result.toLocaleString("tr-TR", { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: result < 1 ? 4 : 2 
              })}
            </span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70">
              {toCurrency}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Refresh Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={fetchRates} 
        disabled={loading}
        className="h-8 w-8 rounded-xl hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all z-10"
      >
        <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
      </Button>
    </motion.div>
  );
}
