"use client";

import React from "react";
import { useCurrency, DISPLAY_CURRENCIES_LIST } from "@/context/currency-context";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-card/80 backdrop-blur-md border border-primary/20 rounded-2xl shadow-ambient-low", className)}>
      <span className="text-[10px] font-black text-muted-foreground uppercase px-2 sm:px-3 flex items-center gap-1 shrink-0">
        <Globe className="w-3.5 h-3.5 text-primary animate-spin-slow" /> <span className="hidden sm:inline">Birim:</span>
      </span>
      {DISPLAY_CURRENCIES_LIST.map((c) => {
        const isActive = displayCurrency === c.code;
        return (
          <button
            key={c.code}
            onClick={() => setDisplayCurrency(c.code)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 shrink-0",
              isActive
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
            title={c.label}
          >
            <span className="text-sm">{c.flag}</span>
            <span className="hidden md:inline">{c.code}</span>
          </button>
        );
      })}
    </div>
  );
}
