'use server';

import { searchSymbols as searchSymbolsLib, getLivePrices } from "@/lib/price-service";

/**
 * İstemci tarafı (Client Component) için güvenli arama aksiyonu.
 * Bu fonksiyon her zaman sunucuda çalışır.
 */
export async function searchSymbolsAction(query: string, category: string) {
  try {
    const results = await searchSymbolsLib(query, category);
    // Veriyi tarayıcıya göndermeden önce sadeleştiriyoruz (Sadece gerekli alanlar)
    return results.map((q: any) => ({
      symbol: q.symbol,
      shortname: q.shortname || q.longname || q.symbol,
      exchange: q.exchange,
      quoteType: q.quoteType,
      suggestedCategory: q.suggestedCategory
    }));
  } catch (error) {
    console.error("Market Action Error:", error);
    return [];
  }
}

export async function getExchangeRatesAction() {
  try {
    const symbols = [
      "USDTRY=X", "EURTRY=X", "GBPTRY=X", "EURUSD=X", "GBPUSD=X", "CHF=X", "JPY=X",
      "AED=X", "SAR=X", "RUB=X", "CAD=X", "AUD=X",
      "CNY=X", "SGD=X", "NOK=X", "SEK=X", "GC=F"
    ];
    const results = await getLivePrices(symbols);
    
    const usdRate = results.get("USDTRY=X")?.price || results.get("USD")?.price || 36.45;
    const eurUsd = results.get("EURUSD=X")?.price || 1.06;
    const gbpUsd = results.get("GBPUSD=X")?.price || 1.258;

    const eurRate = results.get("EURTRY=X")?.price || results.get("EUR")?.price || (eurUsd * usdRate);
    const gbpRate = results.get("GBPTRY=X")?.price || results.get("GBP")?.price || (gbpUsd * usdRate);

    const rawGold = results.get("GC=F")?.price || 2950;
    const xauTryPerGram = (rawGold / 31.1035) * usdRate;
    
    const getTryFromUsd = (symbol: string, defaultRate: number) => {
      const quote = results.get(symbol)?.price || defaultRate;
      return quote > 0 ? usdRate / quote : (usdRate / defaultRate);
    };

    return {
      USD: usdRate,
      EUR: eurRate,
      GBP: gbpRate,
      CHF: getTryFromUsd("CHF=X", 0.885),
      JPY: getTryFromUsd("JPY=X", 154.5),
      AED: getTryFromUsd("AED=X", 3.6725),
      SAR: getTryFromUsd("SAR=X", 3.75),
      RUB: getTryFromUsd("RUB=X", 99.5),
      CAD: getTryFromUsd("CAD=X", 1.39),
      AUD: getTryFromUsd("AUD=X", 1.52),
      CNY: getTryFromUsd("CNY=X", 7.24),
      SGD: getTryFromUsd("SGD=X", 1.34),
      NOK: getTryFromUsd("NOK=X", 11.10),
      SEK: getTryFromUsd("SEK=X", 10.90),
      XAU: xauTryPerGram || 3450,
    };
  } catch (error) {
    console.error("Exchange Rates Error:", error);
    return null;
  }
}
