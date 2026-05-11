import yahooFinance from 'yahoo-finance2';

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
    const quotes = await yahooFinance.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    console.log(`Received ${quotesArray.length} quotes from Yahoo`);

    quotesArray.forEach((quote: any) => {
      if (quote && quote.symbol) {
        const currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.preMarketPrice || 0;
        
        results.set(quote.symbol.toUpperCase(), {
          symbol: quote.symbol,
          price: currentPrice,
          changePercent: quote.regularMarketChangePercent
        });
      }
    });

    symbols.forEach(s => {
      if (!results.has(s.toUpperCase())) {
        results.set(s.toUpperCase(), { symbol: s, price: 0, error: "Veri bulunamadı" });
      }
    });

  } catch (error: any) {
    console.error("CRITICAL: Yahoo Finance Quote Error:", error.message);
    symbols.forEach(s => results.set(s.toUpperCase(), { symbol: s, price: 0, error: "Bağlantı hatası" }));
  }

  return results;
}

export async function searchSymbols(query: string, category: string) {
  if (!query || query.length < 2) return [];

  console.log(`Searching for: "${query}" (Preferred Category: ${category})`);

  try {
    const searchResults = await yahooFinance.search(query, {
      newsCount: 0,
      quotesCount: 15
    });

    const quotes = (searchResults && (searchResults as any).quotes) ? (searchResults as any).quotes : [];
    
    // Her sonuç için en uygun kategoriyi belirle
    const processedQuotes = quotes.map((q: any) => {
      let suggestedCategory = "BIST";
      
      if (q.quoteType === "CRYPTOCURRENCY" || (q.symbol && (q.symbol.includes("-USD") || q.symbol.includes("-BTC") || q.symbol.includes("USDT")))) {
        suggestedCategory = "CRYPTO";
      } else if (q.exchange === "IST" || (q.symbol && q.symbol.endsWith(".IS"))) {
        suggestedCategory = "BIST";
      } else if (q.quoteType === "EQUITY" || q.quoteType === "ETF") {
        suggestedCategory = "NASDAQ"; // Genel hisse/ETF
      } else if (q.quoteType === "COMMODITY" || q.quoteType === "FUTURE") {
        suggestedCategory = "GOLD";
      }

      return {
        ...q,
        suggestedCategory
      };
    });

    // Seçili kategoriye göre sıralama yap (Seçili olanlar en üstte)
    const sortedQuotes = processedQuotes.sort((a, b) => {
      if (a.suggestedCategory === category && b.suggestedCategory !== category) return -1;
      if (a.suggestedCategory !== category && b.suggestedCategory === category) return 1;
      return 0;
    });

    return sortedQuotes.slice(0, 8);
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
