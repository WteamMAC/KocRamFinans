import yahooFinance from 'yahoo-finance2';

/**
 * Fiyat Servisi - yahoo-finance2 kullanılarak güçlendirildi
 */

interface PriceResult {
  symbol: string;
  price: number;
  changePercent?: number;
  error?: string;
}

export async function getLivePrices(symbols: string[]): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  
  if (symbols.length === 0) return results;

  try {
    // Yahoo Finance'den verileri çek
    const quotes = await yahooFinance.quote(symbols);
    
    // Gelen veri tekil veya dizi olabilir, diziye çevirip işleyelim
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    quotesArray.forEach((quote: any) => {
      if (quote && quote.symbol) {
        results.set(quote.symbol, {
          symbol: quote.symbol,
          price: quote.regularMarketPrice || 0,
          changePercent: quote.regularMarketChangePercent
        });
      }
    });

    // Bulunamayan sembolleri 0 ile doldur
    symbols.forEach(s => {
      if (!results.has(s)) {
        results.set(s, { symbol: s, price: 0, error: "Veri bulunamadı" });
      }
    });

  } catch (error) {
    console.error("Yahoo Finance Library Error:", error);
    symbols.forEach(s => results.set(s, { symbol: s, price: 0, error: "Bağlantı hatası" }));
  }

  return results;
}

/**
 * Sembol arama fonksiyonu - yahoo-finance2.search() kullanır
 */
export async function searchSymbols(query: string, category: string) {
  if (!query || query.length < 2) return [];

  try {
    const searchResults = await yahooFinance.search(query, {
      newsCount: 0,
      quotesCount: 10
    });

    // quotes dizisinin varlığını kontrol et
    const quotes = (searchResults && (searchResults as any).quotes) ? (searchResults as any).quotes : [];

    // Kategoriye göre filtreleme
    let filteredQuotes = quotes;
    
    if (category === "BIST") {
      filteredQuotes = quotes.filter((q: any) => 
        (q.symbol && q.symbol.endsWith(".IS")) || 
        q.exchange === "IST" || 
        q.exchDisp === "Istanbul"
      );
    } else if (category === "NASDAQ") {
      filteredQuotes = quotes.filter((q: any) => 
        q.quoteType === "EQUITY" && 
        (q.symbol && !q.symbol.endsWith(".IS"))
      );
    } else if (category === "KRİPTO") {
      filteredQuotes = quotes.filter((q: any) => 
        q.quoteType === "CRYPTOCURRENCY" || 
        (q.symbol && q.symbol.includes("-USD"))
      );
    }

    return filteredQuotes.slice(0, 5);
  } catch (error) {
    console.error("Search API Error:", error);
    return [];
  }
}

/**
 * Portföy değerini ve kar/zarar durumunu hesaplar
 */
export function calculatePortfolioMetrics(investments: any[], livePrices: Map<string, PriceResult>) {
  let totalCost = 0;
  let totalCurrentValue = 0;

  const detailedAssets = (investments || []).map(inv => {
    const live = inv.symbol ? livePrices.get(inv.symbol) : null;
    
    // Eğer canlı fiyat 0 gelirse (hata durumu), alış fiyatını baz al
    const currentPrice = (live && live.price > 0) 
      ? live.price 
      : (inv.purchasePrice || (inv.amount / (inv.quantity || 1)));
      
    const currentValue = (inv.quantity || 1) * currentPrice;
    const cost = inv.amount || 0; 
    
    totalCost += cost;
    totalCurrentValue += currentValue;

    return {
      ...inv,
      currentPrice,
      currentValue,
      profit: currentValue - cost,
      profitPercent: cost > 0 ? ((currentValue - cost) / cost) * 100 : 0
    };
  });

  return {
    totalCost,
    totalCurrentValue,
    totalProfit: totalCurrentValue - totalCost,
    profitPercent: totalCost > 0 ? ((totalCurrentValue - totalCost) / totalCost) * 100 : 0,
    assets: detailedAssets
  };
}
