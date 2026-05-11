/**
 * Fiyat Servisi
 * BIST, NASDAQ ve Kripto fiyatlarını Yahoo Finance üzerinden çeker.
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
    // Yahoo Finance Query URL - query2 daha güncel sonuçlar verebilir
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    
    const response = await fetch(url, {
      cache: 'no-store' // Fiyatların anlık gelmesi için cache'i kapatıyoruz
    });

    if (!response.ok) {
      throw new Error("Fiyat çekme hatası");
    }

    const data = await response.json();
    const quotes = data.quoteResponse?.result || [];

    quotes.forEach((quote: any) => {
      results.set(quote.symbol, {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent
      });
    });

    symbols.forEach(s => {
      if (!results.has(s)) {
        results.set(s, { symbol: s, price: 0, error: "Veri bulunamadı" });
      }
    });

  } catch (error) {
    console.error("Price Service Error:", error);
    symbols.forEach(s => results.set(s, { symbol: s, price: 0, error: "Sistem hatası" }));
  }

  return results;
}

/**
 * Sembol arama fonksiyonu - Kategoriye göre filtreleme yapar
 */
export async function searchSymbols(query: string, category: string) {
  if (query.length < 2) return [];

  try {
    // Arama için query2 kullanıyoruz
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${query}`;
    const response = await fetch(url);
    const data = await response.json();
    let results = data.quotes || [];

    // Kategoriye göre filtreleme mantığı
    if (category === "BIST") {
      results = results.filter((q: any) => 
        q.symbol.endsWith(".IS") || 
        q.exchange === "IST" || 
        q.exchDisp === "Istanbul"
      );
    } else if (category === "NASDAQ") {
      results = results.filter((q: any) => 
        q.quoteType === "EQUITY" && 
        !q.symbol.endsWith(".IS")
      );
    } else if (category === "KRİPTO") {
      results = results.filter((q: any) => 
        q.quoteType === "CRYPTOCURRENCY" || 
        q.symbol.includes("-USD")
      );
    }

    return results.slice(0, 5); // En alakalı 5 sonucu dön
  } catch (error) {
    console.error("Search Error:", error);
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
    const currentPrice = live?.price || inv.purchasePrice || (inv.amount / (inv.quantity || 1));
    const currentValue = (inv.quantity || 1) * currentPrice;
    const cost = inv.amount; // Toplam maliyet
    
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
