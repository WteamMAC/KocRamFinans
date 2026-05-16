import { getExchangeRatesAction } from "@/app/actions/market";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
}

export const DISPLAY_CURRENCIES: Record<string, { symbol: string }> = {
  TRY: { symbol: "₺" },
  USD: { symbol: "$" },
  EUR: { symbol: "€" },
  GBP: { symbol: "£" },
  CHF: { symbol: "₣" },
  JPY: { symbol: "¥" },
  AED: { symbol: "د.إ" },
  SAR: { symbol: "﷼" },
  RUB: { symbol: "₽" },
  CAD: { symbol: "CA$" },
  AUD: { symbol: "A$" },
  CNY: { symbol: "¥" },
  SGD: { symbol: "S$" },
  NOK: { symbol: "kr" },
  SEK: { symbol: "kr" },
  XAU: { symbol: "ALT" },
};

export async function getUserCurrencyConfig(userCurrency?: string | null): Promise<CurrencyConfig> {
  const code = userCurrency || "TRY";
  const symbol = DISPLAY_CURRENCIES[code]?.symbol || "₺";

  if (code === "TRY") {
    return { code, symbol, rate: 1 };
  }

  const fallbackRates: Record<string, number> = {
    USD: 36.45, EUR: 38.65, GBP: 45.85, CHF: 41.20, JPY: 0.235,
    AED: 9.92, SAR: 9.72, RUB: 0.365, CAD: 26.22, AUD: 23.95,
    CNY: 5.03, SGD: 27.20, NOK: 3.28, SEK: 3.34, XAU: 3450
  };

  try {
    const marketRates = await getExchangeRatesAction();
    const rate = (marketRates && (marketRates as Record<string, number>)[code]) || fallbackRates[code] || 1;
    return { code, symbol, rate };
  } catch (error) {
    console.error("Döviz kurları alınamadı, varsayılan kurlar kullanılıyor:", error);
    const rate = fallbackRates[code] || 1;
    return { code, symbol, rate };
  }
}

export function formatAmount(valInTry: number, config: { symbol: string; rate: number }): string {
  if (isNaN(valInTry)) return `0.00 ${config.symbol}`;

  const converted = valInTry / config.rate;
  
  if (config.symbol === "₺") {
    return `${converted.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  }

  return `${converted.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: converted < 1 ? 4 : 2 })} ${config.symbol}`;
}
