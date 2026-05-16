/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinanceClass from 'yahoo-finance2';

// Next.js/Turbopack ortamında kütüphanenin doğru başlatılması için instance oluşturuyoruz
const yahooFinance = (function () {
  try {
    return new (YahooFinanceClass as any)();
  } catch (e) {
    return YahooFinanceClass;
  }
})();

/**
 * Fiyat Servisi - Yahoo Finance API & Canlı Değerleme Entegrasyonu
 * Altın, Emtia, BES, Faiz ve Sabit Varlıklar için genişletilmiş kur sistemi
 */

export interface PriceResult {
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

  // Her zaman temel döviz ve emtia paritelerini çekelim (Altın, Emtia, Döviz kurları için)
  const coreBenchmarks = ["USDTRY=X", "EURTRY=X", "GBPTRY=X", "GC=F", "SI=F", "BZ=F"];
  const allSymbolsToProcess = Array.from(new Set([...symbols, ...coreBenchmarks]));

  allSymbolsToProcess.forEach(s => {
    const symbolUpper = s.toUpperCase();
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

  if (symbolsToFetch.length > 0) {
    console.log("Fetching live market prices from Yahoo for:", symbolsToFetch);
    try {
      const quotes = await yahooFinance.quote(symbolsToFetch);
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

      // Güncel kurları belirleyelim
      let usdToTryRate = 35.50;
      let eurToTryRate = 38.50;
      let gbpToTryRate = 45.00;

      const usdTryQuote = quotesArray.find((q: any) => q.symbol === "USDTRY=X" || q.symbol === "TRY=X");
      if (usdTryQuote && usdTryQuote.regularMarketPrice) usdToTryRate = usdTryQuote.regularMarketPrice;

      const eurTryQuote = quotesArray.find((q: any) => q.symbol === "EURTRY=X");
      if (eurTryQuote && eurTryQuote.regularMarketPrice) eurToTryRate = eurTryQuote.regularMarketPrice;

      const gbpTryQuote = quotesArray.find((q: any) => q.symbol === "GBPTRY=X");
      if (gbpTryQuote && gbpTryQuote.regularMarketPrice) gbpToTryRate = gbpTryQuote.regularMarketPrice;

      // Altın ve Emtia Canlı Fiyatları (Gram bazına çevirme)
      let goldOunceUsd = 2950;
      const goldQuote = quotesArray.find((q: any) => q.symbol === "GC=F");
      if (goldQuote && goldQuote.regularMarketPrice) goldOunceUsd = goldQuote.regularMarketPrice;
      const gramAltinTry = (goldOunceUsd / 31.1035) * usdToTryRate;

      let silverOunceUsd = 32;
      const silverQuote = quotesArray.find((q: any) => q.symbol === "SI=F");
      if (silverQuote && silverQuote.regularMarketPrice) silverOunceUsd = silverQuote.regularMarketPrice;
      const gramGumusTry = (silverOunceUsd / 31.1035) * usdToTryRate;

      let brentUsd = 75;
      const brentQuote = quotesArray.find((q: any) => q.symbol === "BZ=F");
      if (brentQuote && brentQuote.regularMarketPrice) brentUsd = brentQuote.regularMarketPrice;
      const brentTry = brentUsd * usdToTryRate;

      // Temel pariteleri ve türetilmiş emtiaları cache'e yazalım
      const benchmarkData: Record<string, number> = {
        "USDTRY=X": usdToTryRate,
        "USD": usdToTryRate,
        "EURTRY=X": eurToTryRate,
        "EUR": eurToTryRate,
        "GBPTRY=X": gbpToTryRate,
        "GBP": gbpToTryRate,
        "GC=F": goldOunceUsd,
        "XAUTRY=X": gramAltinTry,
        "GRAM ALTIN": gramAltinTry,
        "GRAM ALTIN (XAUTRY=X)": gramAltinTry,
        "ALTIN": gramAltinTry,
        "GOLD": gramAltinTry,
        "ONS ALTIN (GC=F)": goldOunceUsd,
        "SI=F": silverOunceUsd,
        "XAGTRY=X": gramGumusTry,
        "GRAM GÜMÜŞ": gramGumusTry,
        "GRAM GÜMÜŞ (XAGTRY=X)": gramGumusTry,
        "GÜMÜŞ": gramGumusTry,
        "SILVER": gramGumusTry,
        "ONS GÜMÜŞ (SI=F)": silverOunceUsd,
        "BZ=F": brentUsd,
        "BRENT PETROL": brentTry,
        "BRENT PETROL (BZ=F)": brentTry,
        "BRENT": brentTry,
      };

      Object.entries(benchmarkData).forEach(([sym, val]) => {
        const pd = { symbol: sym, price: val, changePercent: 0.15 };
        results.set(sym, pd);
        priceCache.set(sym, { data: pd, timestamp: now });
      });

      // Diğer hisse ve sembolleri işleyelim
      quotesArray.forEach((quote: any) => {
        if (quote && quote.symbol && !benchmarkData[quote.symbol.toUpperCase()]) {
          let currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.preMarketPrice || 0;

          // Yabancı hisse / enstrümanları TRY'ye çevir
          if (quote.currency === "USD" && !quote.symbol.endsWith("=X") && quote.symbol !== "GC=F" && quote.symbol !== "SI=F" && quote.symbol !== "BZ=F") {
            currentPrice = currentPrice * usdToTryRate;
          }

          const priceData = {
            symbol: quote.symbol,
            price: currentPrice,
            changePercent: quote.regularMarketChangePercent || 0
          };

          const symUpper = quote.symbol.toUpperCase();
          results.set(symUpper, priceData);
          priceCache.set(symUpper, { data: priceData, timestamp: now });
        }
      });
    } catch (error: any) {
      console.error("CRITICAL: Yahoo Finance Quote Error:", error.message);
    }
  }

  // İstek yapılan ama bulunamayan semboller için varsayılan kontrol
  symbols.forEach(s => {
    const sUpper = s.toUpperCase();
    if (!results.has(sUpper)) {
      // Eğer kullanıcı Gram Altın, Gümüş vb. özel terimler aratmışsa ve yukarıdaki benchmark'ta yoksa eşleştir
      if (sUpper.includes("ALTIN") || sUpper.includes("GOLD") || sUpper.includes("XAU")) {
        const gaPrice = results.get("XAUTRY=X")?.price || 3350;
        results.set(sUpper, { symbol: s, price: gaPrice, changePercent: 0.2 });
      } else if (sUpper.includes("GÜMÜŞ") || sUpper.includes("GUMUS") || sUpper.includes("SILVER") || sUpper.includes("XAG")) {
        const ggPrice = results.get("XAGTRY=X")?.price || 38;
        results.set(sUpper, { symbol: s, price: ggPrice, changePercent: 0.4 });
      } else if (sUpper.includes("BRENT") || sUpper.includes("PETROL")) {
        const bpPrice = results.get("BRENT PETROL")?.price || 2600;
        results.set(sUpper, { symbol: s, price: bpPrice, changePercent: -0.1 });
      } else {
        const errData = { symbol: s, price: 0, error: "Veri bulunamadı" };
        results.set(sUpper, errData);
      }
    }
  });

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

    const processedQuotes = quotes.map((q: any) => {
      let suggestedCategory = "BIST";

      if (q.quoteType === "CRYPTOCURRENCY" || (q.symbol && (q.symbol.includes("-USD") || q.symbol.includes("-BTC") || q.symbol.includes("USDT")))) {
        suggestedCategory = "CRYPTO";
      } else if (q.exchange === "IST" || (q.symbol && q.symbol.endsWith(".IS"))) {
        suggestedCategory = "BIST";
      } else if (q.quoteType === "EQUITY" || q.quoteType === "ETF") {
        suggestedCategory = "NASDAQ";
      } else if (q.quoteType === "COMMODITY" || q.quoteType === "FUTURE" || (q.symbol && (q.symbol.includes("GC=F") || q.symbol.includes("SI=F")))) {
        suggestedCategory = "GOLD";
      }

      return {
        ...q,
        suggestedCategory
      };
    });

    const filteredQuotes = processedQuotes.filter((q: any) => q.suggestedCategory === category);
    return filteredQuotes.slice(0, 8);
  } catch (error: any) {
    console.error("CRITICAL: Search API Error:", error.message);
    return [];
  }
}

export function calculatePortfolioMetrics(investments: any[], livePrices: Map<string, PriceResult>, incomes?: any[]) {
  let totalCost = 0;
  let totalCurrentValue = 0;
  let totalRealizedProfit = 0;
  let totalDividends = 0;

  if (incomes && incomes.length > 0) {
    totalDividends = incomes
      .filter((inc: any) => inc.type === "Yatırım Geliri")
      .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
  }

  const detailedAssets = (investments || []).map(inv => {
    if (inv.status === "CLOSED") {
      const sellValue = (inv.soldPrice || 0) * (inv.quantity || 1);
      const profit = sellValue - (inv.amount || 0);
      totalRealizedProfit += profit;
      return {
        ...inv,
        currentPrice: inv.soldPrice,
        currentValue: sellValue,
        profit,
        profitPercent: inv.amount > 0 ? (profit / inv.amount) * 100 : 0
      };
    } else {
      const isBes = inv.type === "BES";
      const isFaiz = inv.type === "FAIZ";
      let currentPrice = 0;
      let cost = inv.amount || 0;
      let rate = 0;

      if (isBes || isFaiz) {
        try {
          const meta = JSON.parse(inv.description || "{}");
          rate = meta.rate || inv.purchasePrice || 0;
        } catch {
          rate = inv.purchasePrice || 0;
        }

        if (inv.purchasePrice === rate && rate > 1) {
          cost = inv.quantity;
        }

        const principal = inv.quantity || cost;
        const daysPassed = Math.max(0, (Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        if (isFaiz) {
          // Vadeli Mevduat (Faiz) Canlı Bileşik Getiri Hesaplaması
          const dailyRate = rate / 365 / 100;
          const multiplier = Math.pow(1 + dailyRate, daysPassed);
          const liveVal = principal * multiplier;
          currentPrice = liveVal / principal; // Birim pay değeri
        } else if (isBes) {
          // BES: Fon Büyümesi (%45 yıllık varsayılan) + Devlet Katkısı (%30)
          const annualFundGrowth = 0.45;
          const dailyGrowthRate = annualFundGrowth / 365;
          const fundMultiplier = Math.pow(1 + dailyGrowthRate, daysPassed);
          const stateContributionMultiplier = 1 + (rate > 0 && rate <= 100 ? rate / 100 : 0.30);
          const liveVal = (principal * fundMultiplier) * stateContributionMultiplier;
          currentPrice = liveVal / principal;
        }
      } else {
        const symUpper = (inv.symbol || "").toUpperCase();
        const live = livePrices.get(symUpper);
        currentPrice = (live && live.price > 0)
          ? live.price
          : (inv.purchasePrice || (inv.amount / (inv.quantity || 1)));
      }

      const currentValue = (inv.quantity || 1) * currentPrice;

      totalCost += cost;
      totalCurrentValue += currentValue;
      const profit = currentValue - cost;

      return {
        ...inv,
        currentPrice,
        currentValue,
        cost,
        rate,
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

/**
 * Sabit Varlıklar için Canlı Değerleme ve Kur/Endeksleme Sistemi
 */
export function calculateFixedAssetsMetrics(fixedAssets: any[], livePrices: Map<string, PriceResult>) {
  let totalOriginalCost = 0;
  let totalCurrentValue = 0;

  const usdRate = livePrices.get("USDTRY=X")?.price || livePrices.get("USD")?.price || 35.50;
  const eurRate = livePrices.get("EURTRY=X")?.price || livePrices.get("EUR")?.price || 38.50;
  const gbpRate = livePrices.get("GBPTRY=X")?.price || livePrices.get("GBP")?.price || 45.00;
  const xauRate = livePrices.get("XAUTRY=X")?.price || livePrices.get("GRAM ALTIN")?.price || 3350;

  const detailedFixedAssets = (fixedAssets || []).map(fa => {
    const originalAmount = fa.originalAmount || fa.value || 0;
    const curr = (fa.currency || "TRY").toUpperCase();
    let currentVal = fa.value || 0;

    if (curr === "USD") {
      currentVal = originalAmount * usdRate;
    } else if (curr === "EUR") {
      currentVal = originalAmount * eurRate;
    } else if (curr === "GBP") {
      currentVal = originalAmount * gbpRate;
    } else if (curr === "XAU" || curr === "GOLD") {
      currentVal = originalAmount * xauRate;
    } else {
      const daysPassed = Math.max(0, (Date.now() - new Date(fa.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      // Türkiye piyasası ortalama yıllık değer artışı endeksi (Gayrimenkul %40, Taşıt %30, Diğer %20)
      const annualAppreciation = fa.type === "Gayrimenkul" ? 0.40 : (fa.type === "Taşıt" ? 0.30 : 0.20);
      const dailyAppreciation = annualAppreciation / 365;
      const multiplier = Math.pow(1 + dailyAppreciation, daysPassed);
      currentVal = originalAmount * multiplier;
    }

    const cost = fa.value || originalAmount;
    const profit = currentVal - cost;

    totalOriginalCost += cost;
    totalCurrentValue += currentVal;

    return {
      ...fa,
      originalValuation: cost,
      currentValuation: currentVal,
      liveProfit: profit,
      liveProfitPercent: cost > 0 ? (profit / cost) * 100 : 0,
    };
  });

  const totalProfit = totalCurrentValue - totalOriginalCost;
  const totalProfitPercent = totalOriginalCost > 0 ? (totalProfit / totalOriginalCost) * 100 : 0;

  return {
    totalOriginalCost,
    totalCurrentValue,
    totalProfit,
    totalProfitPercent,
    assets: detailedFixedAssets,
  };
}
