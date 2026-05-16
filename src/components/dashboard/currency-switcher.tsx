"use client";

import React from "react";
import { useCurrency, DISPLAY_CURRENCIES_LIST, DISPLAY_CURRENCIES_MAP } from "@/context/currency-context";
import { Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function CurrencySwitcher({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const current = DISPLAY_CURRENCIES_MAP[displayCurrency] || DISPLAY_CURRENCIES_LIST[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/30 bg-card/80 backdrop-blur-md text-xs font-bold text-foreground shadow-ambient-low hover:bg-muted/80 hover:border-primary/30 transition-all outline-none cursor-pointer select-none",
        className
      )}>
        <Globe className="w-3.5 h-3.5 text-primary animate-spin-slow shrink-0" />
        <span className="font-extrabold">{current?.flag} {current?.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5 opacity-70 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-2xl bg-card border border-border/40 p-1.5 shadow-ambient-medium z-[150]">
        {DISPLAY_CURRENCIES_LIST.map((c) => {
          const isActive = displayCurrency === c.code;
          return (
            <DropdownMenuItem
              key={c.code}
              onClick={() => setDisplayCurrency(c.code)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors my-0.5",
                isActive ? "bg-primary/15 text-primary font-black" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-base">{c.flag}</span>
              <span>{c.code} ({c.symbol})</span>
              {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
