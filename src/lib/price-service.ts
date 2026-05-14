/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinanceClass from 'yahoo-finance2';

// Next.js/Turbopack ortamında kütüphanenin doğru başlatılması için instance oluşturuyoruz
const yahooFinance = (function () {
  try {
    // Eğer YahooFinanceClass bir constructor ise yeni bir instance oluştur
    return new (YahooFinanceClass as any)();
  } catch (e) {
    // Eğer zaten bir instance ise veya farklı bir yapıdaysa doğrudan döndür
    return YahooFinanceClass;
  }
})();

/**
 * Fiyat Servisi - Yahoo Finance API Entegrasyonu
 */

interface PriceResult {
  symbol: string;
  price: number;
  changePercent?: number;
  error?: string;
}

// Bellek içi fiyat önbelleği ve yaşam süresi (2 Dakika)
const priceCache = new Map<string, { data: PriceResult; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

export async function getLivePrices(symbols: string[]): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  const symbolsToFetch: string[] = [];
  const now = Date.now();

  if (symbols.length === 0) return results;

  symbols.forEach(s => {
    const symbolUpper = s.toUpperCase();
    // TRY (Türk Lirası) için özel durum. Fiyatı her zaman 1'dir.
    if (symbolUpper === 'TRY') {
      results.set('TRY', { symbol: 'TRY', price: 1 });
    } else {
      const cached = priceCache.get(symbolUpper);
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        results.set(symbolUpper, cached.data);
      } else {
        symbolsToFetch.push(s);
      }
    }
  });

  if (symbolsToFetch.length === 0) return results;

  console.log("Fetching live prices from Yahoo for:", symbolsToFetch);

  try {
    let fetchWithCurrency = [...symbolsToFetch];
    // Kurları çevirmek için USD/TRY paritesini de mutlaka çekelim
    if (!fetchWithCurrency.includes("TRY=X")) {
      fetchWithCurrency.push("TRY=X");
    }

    const quotes = await yahooFinance.quote(fetchWithCurrency);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // Güncel USD/TRY kurunu bulalım
    let usdToTryRate = 34; // Kaba varsayılan
    const usdTryQuote = quotesArray.find((q: any) => q.symbol === "TRY=X");
    if (usdTryQuote && usdTryQuote.regularMarketPrice) {
      usdToTryRate = usdTryQuote.regularMarketPrice;
    }

    quotesArray.forEach((quote: any) => {
      if (quote && quote.symbol) {
        let currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.preMarketPrice || 0;

        // Yabancı para birimi kontrolü (Eğer USD ise TL'ye çevir)
        if (quote.currency === "USD" && quote.symbol !== "TRY=X") {
          currentPrice = currentPrice * usdToTryRate;
        }

        const priceData = {
          symbol: quote.symbol,
          price: currentPrice,
          changePercent: quote.regularMarketChangePercent
        };

        if (symbolsToFetch.includes(quote.symbol.toUpperCase())) {
          results.set(quote.symbol.toUpperCase(), priceData);
          priceCache.set(quote.symbol.toUpperCase(), { data: priceData, timestamp: now });
        }
      }
    });

    symbolsToFetch.forEach(s => {
      if (!results.has(s.toUpperCase())) {
        const errData = { symbol: s, price: 0, error: "Veri bulunamadı" };
        results.set(s.toUpperCase(), errData);
        priceCache.set(s.toUpperCase(), { data: errData, timestamp: now - CACHE_TTL + 10000 }); // Hataları 10 sn tut
      }
    });

  } catch (error: any) {
    console.error("CRITICAL: Yahoo Finance Quote Error:", error.message);
    symbolsToFetch.forEach(s => results.set(s.toUpperCase(), { symbol: s, price: 0, error: "Bağlantı hatası" }));
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
    const sortedQuotes = processedQuotes.sort((a: any, b: any) => {
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

export function calculatePortfolioMetrics(investments: any[], livePrices: Map<string, PriceResult>) {
  let totalCost = 0;
  let totalCurrentValue = 0;
  let totalRealizedProfit = 0;
  let totalDividends = 0;

  const detailedAssets = (investments || []).map(inv => {
    const div = inv.dividends || 0;
    totalDividends += div;

    if (inv.status === "CLOSED") {
      const sellValue = (inv.soldPrice || 0) * (inv.quantity || 1);
      const profit = sellValue - (inv.amount || 0) + div;
      totalRealizedProfit += profit;
      return {
        ...inv,
        currentPrice: inv.soldPrice,
        currentValue: sellValue,
        profit,
        profitPercent: inv.amount > 0 ? (profit / inv.amount) * 100 : 0
      };
    } else {
      const live = inv.symbol ? livePrices.get(inv.symbol) : null;
      const currentPrice = (live && live.price > 0)
        ? live.price
        : (inv.purchasePrice || (inv.amount / (inv.quantity || 1)));

      const currentValue = (inv.quantity || 1) * currentPrice;
      const cost = inv.amount || 0;

      totalCost += cost;
      totalCurrentValue += currentValue;
      const profit = currentValue - cost + div;

      return {
        ...inv,
        currentPrice,
        currentValue,
        profit,
        profitPercent: cost > 0 ? (profit / cost) * 100 : 0
      };
    }
  });

  const totalUnrealizedProfit = totalCurrentValue - totalCost;

  return {
    totalCost,
    totalCurrentValue,
    totalRealizedProfit,
    totalUnrealizedProfit,
    totalDividends,
    totalProfit: totalUnrealizedProfit + totalRealizedProfit + totalDividends,
    profitPercent: totalCost > 0 ? (totalUnrealizedProfit / totalCost) * 100 : 0,
    assets: detailedAssets
  };
}
