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
    // Yahoo Finance Query URL
    // Örn: https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,BTC-USD,THYAO.IS
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // 5 dakika önbellekle
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

    // Bulunamayan semboller için hata dön
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
