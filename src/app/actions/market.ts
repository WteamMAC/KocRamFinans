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
      "TRY=X", "EURTRY=X", "GBPTRY=X", "CHFTRY=X", "JPYTRY=X",
      "AEDTRY=X", "SARTRY=X", "RUBTRY=X", "CADTRY=X", "AUDTRY=X",
      "CNYTRY=X", "SGDTRY=X", "GC=F"
    ];
    const results = await getLivePrices(symbols);
    
    const usdRate = results.get("TRY=X")?.price || 34.20;
    const rawGold = results.get("GC=F")?.price || 2850;
    const xauTryPerGram = rawGold > 10000 
      ? rawGold / 31.1035 
      : (rawGold / 31.1035) * usdRate;
    
    return {
      USD: usdRate,
      EUR: results.get("EURTRY=X")?.price || 37.10,
      GBP: results.get("GBPTRY=X")?.price || 43.50,
      CHF: results.get("CHFTRY=X")?.price || 38.60,
      JPY: results.get("JPYTRY=X")?.price || 0.23,
      AED: results.get("AEDTRY=X")?.price || 9.31,
      SAR: results.get("SARTRY=X")?.price || 9.11,
      RUB: results.get("RUBTRY=X")?.price || 0.35,
      CAD: results.get("CADTRY=X")?.price || 24.80,
      AUD: results.get("AUDTRY=X")?.price || 22.50,
      CNY: results.get("CNYTRY=X")?.price || 4.80,
      SGD: results.get("SGDTRY=X")?.price || 26.10,
      XAU: xauTryPerGram || 3150,
    };
  } catch (error) {
    console.error("Exchange Rates Error:", error);
    return null;
  }
}
