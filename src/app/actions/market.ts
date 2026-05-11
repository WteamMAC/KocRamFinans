'use server';

import { searchSymbols as searchSymbolsLib } from "@/lib/price-service";

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
