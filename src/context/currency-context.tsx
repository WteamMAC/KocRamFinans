"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getExchangeRatesAction } from "@/app/actions/market";
import { updateProfile } from "@/app/actions/profile";

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
  formatAmount: (valInTry: number | null | undefined, customCurrency?: string, exactOriginal?: { amount: number; currency: string }) => string;
  isLoading: boolean;
  setRates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const defaultRates: Record<string, number> = {
  TRY: 1,
  USD: 36.45,
  EUR: 38.65,
  GBP: 45.85,
  CHF: 41.20,
  JPY: 0.235,
  AED: 9.92,
  SAR: 9.72,
  RUB: 0.365,
  CAD: 26.22,
  AUD: 23.95,
  CNY: 5.03,
  SGD: 27.20,
  NOK: 3.28,
  SEK: 3.34,
  XAU: 3450,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children, initialRates, initialCurrency = "TRY" }: { children: React.ReactNode; initialRates?: Record<string, number>; initialCurrency?: string }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<string>(initialCurrency);
  const [rates, setRates] = useState<Record<string, number>>(() => initialRates ? { ...defaultRates, ...initialRates, TRY: 1 } : defaultRates);
  const [isLoading, setIsLoading] = useState<boolean>(!initialRates);

  // İlk yüklemede sunucudan gelen kullanıcı tercihini (initialCurrency) her zaman öncelikli kullan
  useEffect(() => {
    try {
      if (initialCurrency && DISPLAY_CURRENCIES_MAP[initialCurrency]) {
        setDisplayCurrencyState(initialCurrency);
        localStorage.setItem("koç_ram_display_currency", initialCurrency);
        document.cookie = `koç_ram_display_currency=${initialCurrency}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        const saved = localStorage.getItem("koç_ram_display_currency");
        if (saved && DISPLAY_CURRENCIES_MAP[saved]) {
          setDisplayCurrencyState(saved);
        }
      }
    } catch (err) {
      console.error("Error reading currency from localStorage:", err);
    }
  }, [initialCurrency]);

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
    if (!initialRates) {
      fetchRates();
    }
  }, [initialRates]);

  const setDisplayCurrency = (currency: string) => {
    if (!DISPLAY_CURRENCIES_MAP[currency]) return;
    setDisplayCurrencyState(currency);
    try {
      localStorage.setItem("koç_ram_display_currency", currency);
      document.cookie = `koç_ram_display_currency=${currency}; path=/; max-age=31536000; SameSite=Lax`;
      updateProfile({ currency }).catch(() => {});
    } catch (err) {
      console.error("Error saving currency to localStorage/cookie:", err);
    }
  };

  const formatAmount = (
    valInTry: number | null | undefined,
    customCurrency?: string,
    exactOriginal?: { amount: number; currency: string }
  ): string => {
    if (valInTry === null || valInTry === undefined || isNaN(valInTry)) return "0.00 ₺";
    
    const targetCur = customCurrency || displayCurrency;

    if (exactOriginal && (exactOriginal.currency || "TRY").toUpperCase() === targetCur.toUpperCase()) {
      const sym = DISPLAY_CURRENCIES_MAP[targetCur]?.symbol || targetCur;
      return `${exactOriginal.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: exactOriginal.amount < 1 ? 4 : 2 })} ${sym}`;
    }

    if (targetCur === "TRY") {
      return `${valInTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
    }

    const rate = rates[targetCur] || defaultRates[targetCur] || 1;
    const converted = valInTry / rate;
    const sym = DISPLAY_CURRENCIES_MAP[targetCur]?.symbol || targetCur;

    return `${converted.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: converted < 1 ? 4 : 2 })} ${sym}`;
  };

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, rates, formatAmount, isLoading, setRates }}>
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
