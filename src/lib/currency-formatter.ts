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
    USD: 45.50, EUR: 49.36, GBP: 58.01, CHF: 51.41, JPY: 0.294,
    AED: 12.39, SAR: 12.13, RUB: 0.457, CAD: 32.73, AUD: 29.80,
    CNY: 6.28, SGD: 33.95, NOK: 4.10, SEK: 4.17, XAU: 4315
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
