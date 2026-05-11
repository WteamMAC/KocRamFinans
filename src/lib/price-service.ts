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

// Yahoo Finance ayarlarını yapalım (Hata loglarını azaltmak için)
yahooFinance.setGlobalConfig({
  queue: { concurrency: 5 },
  validation: { logErrors: false }
});

export async function getLivePrices(symbols: string[]): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  
  if (symbols.length === 0) return results;

  try {
    // yahoo-finance2.quote() metodu çoklu sembolü tek seferde çeker
    // Hatalı sembol olsa bile diğerlerini çekmeye devam eder
    const quotes = await yahooFinance.quote(symbols, { return: 'array' });

    quotes.forEach((quote: any) => {
      results.set(quote.symbol, {
        symbol: quote.symbol,
        price: quote.regularMarketPrice || 0,
        changePercent: quote.regularMarketChangePercent
      });
    });

    // Bulunamayan semboller için kontrol
    symbols.forEach(s => {
      if (!results.has(s)) {
        results.set(s, { symbol: s, price: 0, error: "Veri bulunamadı" });
      }
    });

  } catch (error) {
    console.error("Yahoo Finance Library Error:", error);
    // Hata durumunda boş dönmek yerine mevcut sembolleri 0 fiyatla doldur
    symbols.forEach(s => results.set(s, { symbol: s, price: 0, error: "Bağlantı hatası" }));
  }

  return results;
}

/**
 * Sembol arama fonksiyonu - yahoo-finance2.search() kullanır
 */
export async function searchSymbols(query: string, category: string) {
  if (query.length < 2) return [];

  try {
    const searchResults = await yahooFinance.search(query, {
      newsCount: 0,
      quotesCount: 10
    });

    let quotes = searchResults.quotes || [];

    // Kategoriye göre filtreleme
    if (category === "BIST") {
      quotes = quotes.filter((q: any) => 
        q.symbol.endsWith(".IS") || 
        q.exchange === "IST" || 
        q.exchDisp === "Istanbul"
      );
    } else if (category === "NASDAQ") {
      quotes = quotes.filter((q: any) => 
        q.quoteType === "EQUITY" && 
        !q.symbol.endsWith(".IS")
      );
    } else if (category === "KRİPTO") {
      quotes = quotes.filter((q: any) => 
        q.quoteType === "CRYPTOCURRENCY" || 
        q.symbol.includes("-USD")
      );
    }

    return quotes.slice(0, 5);
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

  const detailedAssets = investments.map(inv => {
    const live = inv.symbol ? livePrices.get(inv.symbol) : null;
    
    // Eğer canlı fiyat 0 gelirse (hata durumu), alış fiyatını veya maliyetini baz al
    const currentPrice = (live && live.price > 0) 
      ? live.price 
      : (inv.purchasePrice || (inv.amount / (inv.quantity || 1)));
      
    const currentValue = (inv.quantity || 1) * currentPrice;
    const cost = inv.amount; 
    
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
