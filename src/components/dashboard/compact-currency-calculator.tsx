"use client";

import { useState } from "react";
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
      className="hidden lg:flex items-center gap-2.5 bg-card/80 backdrop-blur-3xl border border-primary/20 rounded-full px-4 h-[56px] shadow-2xl hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden min-w-[540px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Moving Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      {/* Icon Container */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15 group-hover:bg-primary/25 transition-all duration-300 shrink-0 relative z-10 shadow-inner border border-primary/20">
        <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
      </div>

      {/* Amount Input Section (Pill Kutusu) */}
      <div className="relative group/input z-10 flex items-center h-10 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/25 transition-all duration-300 px-4 min-w-[100px] flex-1">
        <Input
          type="number"
          value={amount === 0 ? "" : amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-full h-full bg-transparent border-none focus-visible:ring-0 text-sm font-black p-0 text-center placeholder:opacity-40 text-primary transition-all"
          placeholder="1.00"
        />
      </div>

      {/* From Currency Select (Pill Kutusu) */}
      <Select value={fromCurrency} onValueChange={(val: any) => setFromCurrency(val || "USD")}>
        <SelectTrigger className="w-[100px] h-10 bg-primary/10 hover:bg-primary/15 border border-primary/25 focus:ring-0 text-xs font-black px-4 flex justify-between items-center transition-all z-10 rounded-full shadow-inner">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-primary/20 bg-card/95 backdrop-blur-2xl shadow-2xl">
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
        className="h-9 w-9 rounded-full hover:bg-primary/20 text-primary hover:text-primary transition-all duration-500 z-10 hover:rotate-180 shrink-0"
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>

      {/* To Currency Select (Pill Kutusu) */}
      <Select value={toCurrency} onValueChange={(val: any) => setToCurrency(val || "TRY")}>
        <SelectTrigger className="w-[100px] h-10 bg-primary/10 hover:bg-primary/15 border border-primary/25 focus:ring-0 text-xs font-black px-4 flex justify-between items-center transition-all z-10 rounded-full shadow-inner">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-primary/20 bg-card/95 backdrop-blur-2xl shadow-2xl">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs font-bold focus:bg-primary/10 rounded-lg m-1">
              <span className="mr-2 text-lg">{c.icon}</span>
              <span className={cn("font-black", c.color)}>{c.code}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Decorative Separator */}
      <div className="h-7 w-[1.5px] bg-gradient-to-b from-transparent via-primary/30 to-transparent mx-1 z-10 shrink-0" />

      {/* Result Display (Pill Kutusu) */}
      <div className="flex items-center justify-center min-w-[140px] h-10 px-4 bg-primary/10 rounded-full z-10 border border-primary/25 group-hover:border-primary/40 shadow-inner transition-all shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${result}-${toCurrency}`}
            initial={{ opacity: 0, filter: "blur(4px)", x: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
            exit={{ opacity: 0, filter: "blur(4px)", x: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-sm font-black text-primary tracking-tighter drop-shadow-sm">
              {result.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: result < 1 ? 4 : 2
              })}
            </span>
            <span className="text-[10px] font-extrabold text-primary/70 uppercase tracking-widest ml-0.5">
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
        className="h-10 w-10 rounded-full hover:bg-primary/20 text-primary hover:text-primary transition-all duration-500 z-10 relative overflow-hidden group/refresh shrink-0 border border-primary/20 bg-primary/10 shadow-inner"
      >
        <RefreshCw className={cn("h-4 w-4", (loading || currencyLoading) && "animate-spin")} />
        {(loading || currencyLoading) && (
          <span className="absolute inset-0 bg-primary/10 animate-pulse" />
        )}
      </Button>
    </motion.div>
  );
}

