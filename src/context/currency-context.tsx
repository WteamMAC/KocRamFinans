"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getExchangeRatesAction } from "@/app/actions/market";

export interface CurrencyInfo {
  code: string;
  label: string;
  symbol: string;
  flag: string;
}

export const DISPLAY_CURRENCIES_LIST: CurrencyInfo[] = [
  { code: "TRY", label: "₺ TL", symbol: "₺", flag: "🇹🇷" },
  { code: "USD", label: "$ USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "€ EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", label: "£ GBP", symbol: "£", flag: "🇬🇧" },
  { code: "CHF", label: "₣ CHF", symbol: "₣", flag: "🇨🇭" },
  { code: "JPY", label: "¥ JPY", symbol: "¥", flag: "🇯🇵" },
  { code: "AED", label: "د.إ AED", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", label: "﷼ SAR", symbol: "﷼", flag: "🇸🇦" },
  { code: "RUB", label: "₽ RUB", symbol: "₽", flag: "🇷🇺" },
  { code: "CAD", label: "CA$ CAD", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", label: "A$ AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "CNY", label: "¥ CNY", symbol: "¥", flag: "🇨🇳" },
  { code: "SGD", label: "S$ SGD", symbol: "S$", flag: "🇸🇬" },
  { code: "NOK", label: "kr NOK", symbol: "kr", flag: "🇳🇴" },
  { code: "SEK", label: "kr SEK", symbol: "kr", flag: "🇸🇪" },
  { code: "XAU", label: "🪙 ALT", symbol: "ALT", flag: "🟡" },
];

export const DISPLAY_CURRENCIES_MAP: Record<string, CurrencyInfo> = DISPLAY_CURRENCIES_LIST.reduce((acc, cur) => {
  acc[cur.code] = cur;
  return acc;
}, {} as Record<string, CurrencyInfo>);

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  rates: Record<string, number>;
  formatAmount: (valInTry: number | null | undefined, customCurrency?: string) => string;
  isLoading: boolean;
}

const defaultRates: Record<string, number> = {
  TRY: 1,
  USD: 45.50,
  EUR: 49.36,
  GBP: 58.01,
  CHF: 51.41,
  JPY: 0.294,
  AED: 12.39,
  SAR: 12.13,
  RUB: 0.457,
  CAD: 32.73,
  AUD: 29.80,
  CNY: 6.28,
  SGD: 33.95,
  NOK: 4.10,
  SEK: 4.17,
  XAU: 4315,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<string>("TRY");
  const [rates, setRates] = useState<Record<string, number>>(defaultRates);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // İlk yüklemede localStorage'dan oku
  useEffect(() => {
    try {
      const saved = localStorage.getItem("koç_ram_display_currency");
      if (saved && DISPLAY_CURRENCIES_MAP[saved]) {
        setDisplayCurrencyState(saved);
      }
    } catch (err) {
      console.error("Error reading currency from localStorage:", err);
    }
  }, []);

  // Döviz kurlarını API'den çek
  useEffect(() => {
    async function fetchRates() {
      try {
        const data = await getExchangeRatesAction();
        if (data && Object.keys(data).length > 0) {
          setRates(prev => ({ ...prev, TRY: 1, ...data }));
        }
      } catch (err) {
        console.error("Rates fetch error in provider:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
    const interval = setInterval(fetchRates, 60000 * 5); // 5 dakikada bir güncelle
    return () => clearInterval(interval);
  }, []);

  const setDisplayCurrency = (currency: string) => {
    if (!DISPLAY_CURRENCIES_MAP[currency]) return;
    setDisplayCurrencyState(currency);
    try {
      localStorage.setItem("koç_ram_display_currency", currency);
    } catch (err) {
      console.error("Error saving currency to localStorage:", err);
    }
  };

  const formatAmount = (valInTry: number | null | undefined, customCurrency?: string): string => {
    if (valInTry === null || valInTry === undefined || isNaN(valInTry)) return "0.00 ₺";
    
    const targetCur = customCurrency || displayCurrency;
    if (targetCur === "TRY") {
      return `${valInTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
    }

    const rate = rates[targetCur] || defaultRates[targetCur] || 1;
    const converted = valInTry / rate;
    const sym = DISPLAY_CURRENCIES_MAP[targetCur]?.symbol || targetCur;

    return `${converted.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: converted < 1 ? 4 : 2 })} ${sym}`;
  };

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, rates, formatAmount, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
