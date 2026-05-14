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
    const symbols = ["TRY=X", "EURTRY=X", "GBPTRY=X", "GC=F"]; // USD, EUR, GBP, Gold
    const results = await getLivePrices(symbols);
    
    return {
      USD: results.get("TRY=X")?.price || 0,
      EUR: results.get("EURTRY=X")?.price || 0,
      GBP: results.get("GBPTRY=X")?.price || 0,
      XAU: (results.get("GC=F")?.price || 0) / 31.1035, // Convert Ounce to Gram
    };
  } catch (error) {
    console.error("Exchange Rates Error:", error);
    return null;
  }
}
