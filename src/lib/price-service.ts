import YahooFinance from 'yahoo-finance2';

// Yahoo Finance nesnesini oluşturuyoruz (V3+ kesin çözüm)
const yf = new YahooFinance();

/**
 * Fiyat Servisi - Yahoo Finance API Entegrasyonu
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

  console.log("Fetching prices for:", symbols);

  try {
    const quotes = await yf.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    console.log(`Received ${quotesArray.length} quotes from Yahoo`);

    quotesArray.forEach((quote: any) => {
      if (quote && quote.symbol) {
        const currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.preMarketPrice || 0;
        
        results.set(quote.symbol, {
          symbol: quote.symbol,
          price: currentPrice,
          changePercent: quote.regularMarketChangePercent
        });
      }
    });

    symbols.forEach(s => {
      if (!results.has(s)) {
        results.set(s, { symbol: s, price: 0, error: "Veri bulunamadı" });
      }
    });

  } catch (error: any) {
    console.error("CRITICAL: Yahoo Finance Quote Error:", error.message);
    symbols.forEach(s => results.set(s, { symbol: s, price: 0, error: "Bağlantı hatası" }));
  }

  return results;
}

export async function searchSymbols(query: string, category: string) {
  if (!query || query.length < 2) return [];

  console.log(`Searching for: "${query}" in category: ${category}`);

  try {
    const searchResults = await yf.search(query, {
      newsCount: 0,
      quotesCount: 15
    });

    const quotes = (searchResults && (searchResults as any).quotes) ? (searchResults as any).quotes : [];
    
    let filteredQuotes = quotes;
    
    if (category === "BIST") {
      filteredQuotes = quotes.filter((q: any) => 
        (q.symbol && q.symbol.endsWith(".IS")) || 
        q.exchange === "IST" || 
        q.exchDisp === "Istanbul"
      );
    } else if (category === "NASDAQ") {
      filteredQuotes = quotes.filter((q: any) => 
        (q.quoteType === "EQUITY" || q.quoteType === "ETF") && 
        (q.symbol && !q.symbol.endsWith(".IS"))
      );
    } else if (category === "KRİPTO") {
      filteredQuotes = quotes.filter((q: any) => 
        q.quoteType === "CRYPTOCURRENCY" || 
        (q.symbol && (q.symbol.includes("-USD") || q.symbol.includes("-BTC")))
      );
    }

    return filteredQuotes.slice(0, 5);
  } catch (error: any) {
    console.error("CRITICAL: Search API Error:", error.message);
    return [];
  }
}

/**
 * Portföy değerini ve kar/zarar durumunu hesaplar
 */
export function calculatePortfolioMetrics(investments: any[], livePrices: Map<string, PriceResult>) {
  let totalCost = 0;
  let totalCurrentValue = 0;

  const activeInvestments = (investments || []).filter(inv => !inv.status || inv.status === "OPEN");

  const detailedAssets = activeInvestments.map(inv => {
    const live = inv.symbol ? livePrices.get(inv.symbol) : null;
    
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
