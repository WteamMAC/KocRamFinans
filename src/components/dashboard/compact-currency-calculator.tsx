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
import { useCurrency } from "@/context/currency-context";

const CURRENCIES = [
  { code: "TRY", name: "TL", icon: "🇹🇷", color: "text-rose-500" },
  { code: "USD", name: "USD", icon: "🇺🇸", color: "text-emerald-500" },
  { code: "EUR", name: "EUR", icon: "🇪🇺", color: "text-blue-500" },
  { code: "GBP", name: "GBP", icon: "🇬🇧", color: "text-purple-500" },
  { code: "CHF", name: "CHF", icon: "🇨🇭", color: "text-red-400" },
  { code: "JPY", name: "JPY", icon: "🇯🇵", color: "text-red-500" },
  { code: "AED", name: "AED", icon: "🇦🇪", color: "text-emerald-600" },
  { code: "SAR", name: "SAR", icon: "🇸🇦", color: "text-green-600" },
  { code: "RUB", name: "RUB", icon: "🇷🇺", color: "text-blue-400" },
  { code: "CAD", name: "CAD", icon: "🇨🇦", color: "text-red-600" },
  { code: "AUD", name: "AUD", icon: "🇦🇺", color: "text-blue-600" },
  { code: "CNY", name: "CNY", icon: "🇨🇳", color: "text-rose-600" },
  { code: "SGD", name: "SGD", icon: "🇸🇬", color: "text-amber-600" },
  { code: "NOK", name: "NOK", icon: "🇳🇴", color: "text-blue-500" },
  { code: "SEK", name: "SEK", icon: "🇸🇪", color: "text-amber-500" },
  { code: "XAU", name: "ALT", icon: "🪙", color: "text-amber-500" },
];

export function CompactCurrencyCalculator() {
  const { rates, isLoading: currencyLoading } = useCurrency();
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TRY");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await getExchangeRatesAction();
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh rates:", error);
    } finally {
      setLoading(false);
    }
  };

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
      className="hidden lg:flex items-center gap-3 bg-card/60 backdrop-blur-2xl border border-primary/20 rounded-2xl px-4 h-[52px] shadow-2xl hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden min-w-[500px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Moving Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      {/* Icon Container */}
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 mr-2 relative z-10 shadow-inner">
        <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
      </div>

      {/* Amount Input Section */}
      <div className="relative group/input z-10 flex flex-col justify-center min-w-[100px]">
        <Input
          type="number"
          value={amount === 0 ? "" : amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-full h-8 bg-transparent border-none focus-visible:ring-0 text-base font-black p-0 text-center placeholder:opacity-40 transition-all group-hover/input:scale-105"
          placeholder="1.00"
        />
        <div className="h-[2px] w-0 bg-primary group-hover/input:w-full transition-all duration-500 mx-auto rounded-full opacity-50" />
      </div>

      {/* From Currency Select */}
      <Select value={fromCurrency} onValueChange={(val: any) => setFromCurrency(val || "USD")}>
        <SelectTrigger className="w-[90px] h-9 bg-primary/5 border-none focus:ring-0 text-xs font-black px-3 flex justify-between items-center hover:bg-primary/10 transition-all z-10 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-primary/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs font-bold focus:bg-primary/10 rounded-lg m-1">
              <span className="mr-2 text-lg">{c.icon}</span>
              <span className={cn("font-black", c.color)}>{c.code}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Swap Button with Rotation */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSwap}
        className="h-8 w-8 rounded-full hover:bg-primary/15 text-primary/70 hover:text-primary transition-all duration-500 mx-1 z-10 hover:rotate-180"
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
      </Button>

      {/* To Currency Select */}
      <Select value={toCurrency} onValueChange={(val: any) => setToCurrency(val || "TRY")}>
        <SelectTrigger className="w-[90px] h-9 bg-primary/5 border-none focus:ring-0 text-xs font-black px-3 flex justify-between items-center hover:bg-primary/10 transition-all z-10 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-primary/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs font-bold focus:bg-primary/10 rounded-lg m-1">
              <span className="mr-2 text-lg">{c.icon}</span>
              <span className={cn("font-black", c.color)}>{c.code}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Decorative Separator */}
      <div className="h-6 w-[1.5px] bg-gradient-to-b from-transparent via-primary/20 to-transparent mx-3 z-10" />

      {/* Result Display with Sparkle */}
      <div className="flex flex-col items-center justify-center min-w-[140px] px-4 py-1.5 bg-primary/5 rounded-2xl z-10 border border-primary/10 group-hover:border-primary/30 transition-all">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${result}-${toCurrency}`}
            initial={{ opacity: 0, filter: "blur(4px)", x: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
            exit={{ opacity: 0, filter: "blur(4px)", x: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-base font-black text-primary tracking-tighter drop-shadow-sm">
              {result.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: result < 1 ? 4 : 2
              })}
            </span>
            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
              {toCurrency}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Advanced Refresh Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={loading || currencyLoading}
        className="h-9 w-9 rounded-xl hover:bg-primary/15 text-primary/40 hover:text-primary transition-all duration-500 z-10 relative overflow-hidden group/refresh"
      >
        <RefreshCw className={cn("h-4 w-4", (loading || currencyLoading) && "animate-spin")} />
        {(loading || currencyLoading) && (
          <span className="absolute inset-0 bg-primary/5 animate-pulse" />
        )}
      </Button>
    </motion.div>
  );
}
