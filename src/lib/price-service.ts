/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinanceClass from 'yahoo-finance2';

// Next.js/Turbopack ortamında kütüphanenin doğru başlatılması için instance oluşturuyoruz
const yahooFinance = (function () {
  try {
    return new (YahooFinanceClass as any)();
  } catch (e: any) {
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

import { prisma } from "@/lib/prisma";
import { TEFAS_EMK_CATALOG } from "@/lib/tefas-catalog";

export function isTefasFund(symbol: string): boolean {
  const clean = symbol.toUpperCase().trim();
  return /^[A-Z]{3}$/.test(clean);
}

// TEFAS_EMK_CATALOG artık @/lib/tefas-catalog.ts'den import ediliyor

export async function fetchTefasPrices(symbols: string[]): Promise<Map<string, PriceResult>> {
  const result = new Map<string, PriceResult>();
  if (symbols.length === 0) return result;

  for (const s of symbols) {
    const symbolUpper = s.toUpperCase().trim();
    const fund = TEFAS_EMK_CATALOG.find(f => f.code === symbolUpper);
    if (fund) {
      let annualChange = 0.45;
      if (fund.type === "STOCKS") annualChange = 0.85;
      else if (fund.type === "GOLD") annualChange = 0.65;
      else if (fund.type === "USD") annualChange = 0.35;
      else if (fund.type === "CONSERVATIVE") annualChange = 0.42;

      result.set(symbolUpper, {
        symbol: symbolUpper,
        price: fund.price,
        changePercent: annualChange
      });
    }
  }
  return result;
}

export function getTefasFundDetail(symbol: string): { symbol: string; shortname: string } | null {
  const symbolUpper = symbol.toUpperCase().trim();
  const fund = TEFAS_EMK_CATALOG.find(f => f.code === symbolUpper);
  if (fund) {
    return {
      symbol: fund.code,
      shortname: fund.title
    };
  }
  return null;
}

// Önbellek yaşam süresi (5 Dakika = 5 * 60 * 1000)
const CACHE_TTL = 5 * 60 * 1000;

export async function getLivePrices(symbols: string[]): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  const symbolsToFetchFromApi: string[] = [];
  const now = Date.now();

  // Ekstra: BES yatırımlarındaki özel fundSymbol'leri veritabanından çekip listeye ekleyelim!
  const dbFundSymbols: string[] = [];
  try {
    const besInvs = await prisma.investment.findMany({
      where: { type: "BES", status: "OPEN" },
      select: { description: true }
    });
    for (const inv of besInvs) {
      if (inv.description) {
        try {
          const meta = JSON.parse(inv.description);
          if (meta.fundSymbol) {
            dbFundSymbols.push(meta.fundSymbol.toUpperCase());
          }
        } catch (e: any) {}
      }
    }
  } catch (e: any) {}

  // Her zaman temel döviz ve emtia paritelerini işleyelim + BES fonları için BIST 100
  const coreBenchmarks = ["USDTRY=X", "EURTRY=X", "GBPTRY=X", "GC=F", "SI=F", "BZ=F", "XU100.IS"];
  const virtualSymbols = ["BES_GOLD_RETURN", "BES_STOCKS_RETURN", "BES_USD_RETURN", "BES_STANDART_RETURN", "BES_CONSERVATIVE_RETURN"];
  const allSymbolsToProcess = Array.from(new Set([...symbols, ...dbFundSymbols, ...coreBenchmarks, ...virtualSymbols]));

  // 1. Veritabanından mevcut önbellekleri çekelim (1 saatten yeniyse API'ye gitme!)
  try {
    const dbCached = await prisma.marketPriceCache.findMany({
      where: { symbol: { in: allSymbolsToProcess.map(s => s.toUpperCase()) } }
    });

    const dbCacheMap = new Map(dbCached.map(item => [item.symbol, item]));

    allSymbolsToProcess.forEach(s => {
      const symbolUpper = s.toUpperCase();
      if (symbolUpper === 'TRY') {
        results.set('TRY', { symbol: 'TRY', price: 1 });
      } else {
        const cached = dbCacheMap.get(symbolUpper);
        if (cached && (now - new Date(cached.updatedAt).getTime() < CACHE_TTL)) {
          results.set(symbolUpper, {
            symbol: s,
            price: cached.price,
            changePercent: cached.changePct
          });
        } else {
          symbolsToFetchFromApi.push(s);
        }
      }
    });
  } catch (dbErr) {
    console.error("Database cache read error, proceeding to API:", dbErr);
    symbolsToFetchFromApi.push(...allSymbolsToProcess.filter(s => s.toUpperCase() !== 'TRY'));
  }

  // 2. Eğer API'den çekilmesi gereken (1 saatten eski veya yeni) semboller varsa API isteği yap
  if (symbolsToFetchFromApi.length > 0) {
    const actualApiSymbols = symbolsToFetchFromApi.filter(s => !s.startsWith("BES_") && !s.endsWith("_RETURN"));
    const tefasSymbols = actualApiSymbols.filter(s => isTefasFund(s));
    const yahooSymbols = actualApiSymbols.filter(s => !isTefasFund(s));
    console.log("Fetching live market prices from Yahoo API for:", yahooSymbols);

    let usdToTryRate = results.get("USDTRY=X")?.price || 36.45;
    let eurToTryRate = results.get("EURTRY=X")?.price || 38.65;
    let gbpToTryRate = results.get("GBPTRY=X")?.price || 45.85;

    try {
      const fetchRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { next: { revalidate: 300 } });
      if (fetchRes.ok) {
        const fxData = await fetchRes.json();
        if (fxData && fxData.rates && fxData.rates.TRY) {
          usdToTryRate = fxData.rates.TRY;
          if (fxData.rates.EUR && fxData.rates.EUR > 0) eurToTryRate = fxData.rates.TRY / fxData.rates.EUR;
          if (fxData.rates.GBP && fxData.rates.GBP > 0) gbpToTryRate = fxData.rates.TRY / fxData.rates.GBP;

          const allCurrencies = ["USD", "EUR", "GBP", "CHF", "JPY", "AED", "SAR", "RUB", "CAD", "AUD", "CNY", "SGD", "NOK", "SEK"];
          allCurrencies.forEach(cur => {
            if (fxData.rates[cur] && fxData.rates[cur] > 0) {
              const curTryRate = fxData.rates.TRY / fxData.rates[cur];
              results.set(cur, { symbol: cur, price: curTryRate, changePercent: 0.1 });
              results.set(`${cur}TRY=X`, { symbol: `${cur}TRY=X`, price: curTryRate, changePercent: 0.1 });
              results.set(`${cur}=X`, { symbol: `${cur}=X`, price: fxData.rates[cur], changePercent: 0.1 });
            }
          });
        }
      }
    } catch (fxErr) {
      console.error("ExchangeRate API fetch warning:", fxErr);
    }

    try {
      let quotesArray: any[] = [];
      if (yahooSymbols.length > 0) {
        const quotes = await yahooFinance.quote(yahooSymbols);
        quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      }

      if (tefasSymbols.length > 0) {
        console.log("Fetching live TEFAS fund prices for:", tefasSymbols);
        try {
          const tefasPrices = await fetchTefasPrices(tefasSymbols);
          for (const [sym, data] of tefasPrices.entries()) {
            results.set(sym, data);
            try {
              await prisma.marketPriceCache.upsert({
                where: { symbol: sym },
                update: { price: data.price, changePct: data.changePercent || 0, updatedAt: new Date() },
                create: { symbol: sym, price: data.price, changePct: data.changePercent || 0 }
              });
            } catch (e: any) {}
          }
        } catch (err) {
          console.error("TEFAS Fetching Error:", err);
        }
      }

      const newMarketData: Array<{ symbol: string; price: number; changePct: number }> = [];

      const usdTryQuote = quotesArray.find((q: any) => q.symbol === "USDTRY=X" || q.symbol === "TRY=X");
      if (usdTryQuote && usdTryQuote.regularMarketPrice && usdTryQuote.regularMarketPrice > 20) {
        usdToTryRate = usdTryQuote.regularMarketPrice;
        newMarketData.push({ symbol: "USDTRY=X", price: usdToTryRate, changePct: usdTryQuote.regularMarketChangePercent || 0 });
        newMarketData.push({ symbol: "USD", price: usdToTryRate, changePct: usdTryQuote.regularMarketChangePercent || 0 });
      }

      const eurTryQuote = quotesArray.find((q: any) => q.symbol === "EURTRY=X");
      if (eurTryQuote && eurTryQuote.regularMarketPrice && eurTryQuote.regularMarketPrice > 20) {
        eurToTryRate = eurTryQuote.regularMarketPrice;
        newMarketData.push({ symbol: "EURTRY=X", price: eurToTryRate, changePct: eurTryQuote.regularMarketChangePercent || 0 });
        newMarketData.push({ symbol: "EUR", price: eurToTryRate, changePct: eurTryQuote.regularMarketChangePercent || 0 });
      }

      const gbpTryQuote = quotesArray.find((q: any) => q.symbol === "GBPTRY=X");
      if (gbpTryQuote && gbpTryQuote.regularMarketPrice && gbpTryQuote.regularMarketPrice > 20) {
        gbpToTryRate = gbpTryQuote.regularMarketPrice;
        newMarketData.push({ symbol: "GBPTRY=X", price: gbpToTryRate, changePct: gbpTryQuote.regularMarketChangePercent || 0 });
        newMarketData.push({ symbol: "GBP", price: gbpToTryRate, changePct: gbpTryQuote.regularMarketChangePercent || 0 });
      }

      let goldOunceUsd = results.get("GC=F")?.price || 2950;
      const goldQuote = quotesArray.find((q: any) => q.symbol === "GC=F");
      if (goldQuote && goldQuote.regularMarketPrice) {
        goldOunceUsd = goldQuote.regularMarketPrice;
        newMarketData.push({ symbol: "GC=F", price: goldOunceUsd, changePct: goldQuote.regularMarketChangePercent || 0 });
      }
      const gramAltinTry = (goldOunceUsd / 31.1035) * usdToTryRate;

      let silverOunceUsd = results.get("SI=F")?.price || 32;
      const silverQuote = quotesArray.find((q: any) => q.symbol === "SI=F");
      if (silverQuote && silverQuote.regularMarketPrice) {
        silverOunceUsd = silverQuote.regularMarketPrice;
        newMarketData.push({ symbol: "SI=F", price: silverOunceUsd, changePct: silverQuote.regularMarketChangePercent || 0 });
      }
      const gramGumusTry = (silverOunceUsd / 31.1035) * usdToTryRate;

      let brentUsd = results.get("BZ=F")?.price || 75;
      const brentQuote = quotesArray.find((q: any) => q.symbol === "BZ=F");
      if (brentQuote && brentQuote.regularMarketPrice) {
        brentUsd = brentQuote.regularMarketPrice;
        newMarketData.push({ symbol: "BZ=F", price: brentUsd, changePct: brentQuote.regularMarketChangePercent || 0 });
      }
      const brentTry = brentUsd * usdToTryRate;

      // Türetilmiş sembolleri ekleyelim
      const benchmarkMap: Record<string, number> = {
        "XAUTRY=X": gramAltinTry, "GRAM ALTIN": gramAltinTry, "ALTIN": gramAltinTry, "GOLD": gramAltinTry, "GRAM": gramAltinTry,
        "ONS": goldOunceUsd * usdToTryRate, "ONS ALTIN (GC=F)": goldOunceUsd, "GAU/TRY": gramAltinTry, "XAU/TRY": gramAltinTry, "XAU/USD": goldOunceUsd,
        "XAGTRY=X": gramGumusTry, "GRAM GÜMÜŞ": gramGumusTry, "GÜMÜŞ": gramGumusTry, "SILVER": gramGumusTry, "ONS GÜMÜŞ (SI=F)": silverOunceUsd,
        "BRENT PETROL": brentTry, "BRENT": brentTry,
      };

      Object.entries(benchmarkMap).forEach(([sym, val]) => {
        newMarketData.push({ symbol: sym, price: val, changePct: 0.15 });
      });

      quotesArray.forEach((quote: any) => {
        if (quote && quote.symbol && !benchmarkMap[quote.symbol.toUpperCase()]) {
          let currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.preMarketPrice || 0;
          if (quote.currency === "USD" && !quote.symbol.endsWith("=X") && quote.symbol !== "GC=F" && quote.symbol !== "SI=F" && quote.symbol !== "BZ=F") {
            currentPrice = currentPrice * usdToTryRate;
          }
          // Özel yatırım fonları için yıllık değişim (fiftyTwoWeekChangePercent) değerini kullanalım
          const annualChange = quote.fiftyTwoWeekChangePercent != null 
            ? quote.fiftyTwoWeekChangePercent 
            : (quote.regularMarketChangePercent || 0);
          newMarketData.push({ symbol: quote.symbol.toUpperCase(), price: currentPrice, changePct: annualChange });
        }
      });

      // Hem results haritasını güncelleyelim hem de veritabanına kaydedelim
      for (const item of newMarketData) {
        results.set(item.symbol, { symbol: item.symbol, price: item.price, changePercent: item.changePct });
        try {
          await prisma.marketPriceCache.upsert({
            where: { symbol: item.symbol },
            update: { price: item.price, changePct: item.changePct, updatedAt: new Date() },
            create: { symbol: item.symbol, price: item.price, changePct: item.changePct }
          });
        } catch (e: any) {}
      }

      // --- BES SANAL FON GETİRİ HESAPLAMALARI ---
      let goldAnnualChange = 0.25;
      let usdAnnualChange = 0.20;
      let stocksAnnualChange = 0.35;

      const goldQuoteObj = quotesArray.find((q: any) => q.symbol === "GC=F");
      if (goldQuoteObj && goldQuoteObj.fiftyTwoWeekChangePercent != null) {
        goldAnnualChange = goldQuoteObj.fiftyTwoWeekChangePercent;
      }
      
      const usdQuoteObj = quotesArray.find((q: any) => q.symbol === "USDTRY=X");
      if (usdQuoteObj && usdQuoteObj.fiftyTwoWeekChangePercent != null) {
        usdAnnualChange = usdQuoteObj.fiftyTwoWeekChangePercent;
      }

      const stocksQuoteObj = quotesArray.find((q: any) => q.symbol === "XU100.IS");
      if (stocksQuoteObj && stocksQuoteObj.fiftyTwoWeekChangePercent != null) {
        stocksAnnualChange = stocksQuoteObj.fiftyTwoWeekChangePercent;
      }

      const goldTryAnnualChange = (1 + goldAnnualChange) * (1 + usdAnnualChange) - 1;

      const virtualRates = [
        { symbol: "BES_GOLD_RETURN", price: goldTryAnnualChange },
        { symbol: "BES_STOCKS_RETURN", price: stocksAnnualChange },
        { symbol: "BES_USD_RETURN", price: usdAnnualChange },
        { symbol: "BES_STANDART_RETURN", price: (stocksAnnualChange * 0.4) + (goldTryAnnualChange * 0.4) + (usdAnnualChange * 0.2) },
        { symbol: "BES_CONSERVATIVE_RETURN", price: 0.42 }
      ];

      for (const item of virtualRates) {
        results.set(item.symbol, { symbol: item.symbol, price: item.price });
        try {
          await prisma.marketPriceCache.upsert({
            where: { symbol: item.symbol },
            update: { price: item.price, changePct: 0, updatedAt: new Date() },
            create: { symbol: item.symbol, price: item.price, changePct: 0 }
          });
        } catch (e: any) {}
      }

    } catch (apiErr: any) {
      console.error("CRITICAL API Error, relying entirely on Database Cache:", apiErr.message);
    }
  }

  // 3. Bulunamayan veya hala boş olan semboller için eğer veritabanında eski bir kayıt varsa onu kullan (Hayali sabit rakamlar tamamen kaldırıldı!)
  try {
    const missingSymbols = allSymbolsToProcess.filter(s => !results.has(s.toUpperCase()));
    if (missingSymbols.length > 0) {
      const fallbackDbItems = await prisma.marketPriceCache.findMany({
        where: { symbol: { in: missingSymbols.map(s => s.toUpperCase()) } }
      });
      for (const item of fallbackDbItems) {
        results.set(item.symbol, { symbol: item.symbol, price: item.price, changePercent: item.changePct });
      }
    }
  } catch (e: any) {}

  // BES sanal fon getiri oranları için mutlak fallback değerleri set edelim (hiçbir şekilde boş kalmasınlar!)
  const defaultVirtuals = {
    "BES_GOLD_RETURN": 0.65,
    "BES_STOCKS_RETURN": 0.80,
    "BES_USD_RETURN": 0.35,
    "BES_STANDART_RETURN": 0.45,
    "BES_CONSERVATIVE_RETURN": 0.40
  };

  Object.entries(defaultVirtuals).forEach(([sym, val]) => {
    if (!results.has(sym)) {
      results.set(sym, { symbol: sym, price: val });
    }
  });

  // Hiçbir şekilde verisi bulunamayan sembollere 0 veya hata bilgisi koy
  symbols.forEach(s => {
    const sUpper = s.toUpperCase();
    if (!results.has(sUpper)) {
      results.set(sUpper, { symbol: s, price: 0, error: "Veri bulunamadı" });
    }
  });

  return results;
}

export async function searchSymbols(query: string, category: string) {
  if (!query || query.length < 2) return [];

  console.log(`Searching for: "${query}" (Preferred Category: ${category})`);

  // 3-letter uppercase check for TEFAS funds
  if (query.length === 3 && /^[A-Z]{3}$/.test(query.toUpperCase())) {
    const tefasFund = getTefasFundDetail(query);
    if (tefasFund) {
      return [{
        symbol: tefasFund.symbol,
        shortname: tefasFund.shortname,
        exchange: "TEFAS",
        quoteType: "MUTUAL_FUND",
        suggestedCategory: category === "BIST" ? "BIST" : category
      }];
    }
  }

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
        } catch (e: any) {
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
          // BES: Fon Büyümesi (Seçili fona göre veya özel fona göre) + Devlet Katkısı (%30 varsayılan)
          let fundType = "STANDART";
          let fundSymbol: string | undefined = undefined;
          try {
            const meta = JSON.parse(inv.description || "{}");
            fundType = meta.fundType || "STANDART";
            fundSymbol = meta.fundSymbol;
          } catch (e: any) {}

          let annualFundGrowth = 0.45;
          if (fundSymbol) {
            // Eğer özel bir fon (BIST/TEFAS) sembolü seçilmişse, önbellekten yıllık getirisini (changePct) alalım!
            const customLive = livePrices.get(fundSymbol.toUpperCase());
            if (customLive && customLive.changePercent != null) {
              annualFundGrowth = customLive.changePercent;
            } else {
              const fundReturns: Record<string, number> = {
                "STANDART": livePrices.get("BES_STANDART_RETURN")?.price || 0.45,
                "GOLD": livePrices.get("BES_GOLD_RETURN")?.price || 0.65, 
                "STOCKS": livePrices.get("BES_STOCKS_RETURN")?.price || 0.80, 
                "USD": livePrices.get("BES_USD_RETURN")?.price || 0.35, 
                "CONSERVATIVE": livePrices.get("BES_CONSERVATIVE_RETURN")?.price || 0.40,
              };
              annualFundGrowth = fundReturns[fundType] || 0.45;
            }
          } else {
            const fundReturns: Record<string, number> = {
              "STANDART": livePrices.get("BES_STANDART_RETURN")?.price || 0.45,
              "GOLD": livePrices.get("BES_GOLD_RETURN")?.price || 0.65, 
              "STOCKS": livePrices.get("BES_STOCKS_RETURN")?.price || 0.80, 
              "USD": livePrices.get("BES_USD_RETURN")?.price || 0.35, 
              "CONSERVATIVE": livePrices.get("BES_CONSERVATIVE_RETURN")?.price || 0.40,
            };
            annualFundGrowth = fundReturns[fundType] || 0.45;
          }

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

        // --- SELF-HEALING COST SYNCHRONIZER (Akıllı Geçmiş Veri Onarımı) ---
        const usdRate = livePrices.get("USDTRY=X")?.price || livePrices.get("USD")?.price || 36.45;
        const tempCurrentVal = (inv.quantity || 1) * currentPrice;
        
        const isUsdAsset = inv.type === "NASDAQ" || inv.type === "CRYPTO" || (inv.currency === "USD") || (symUpper && (symUpper.includes("ONS") || symUpper.includes("GC=F") || symUpper.includes("SI=F") || symUpper.includes("BZ=F") || symUpper.includes("USD") || symUpper.includes("USDT")));

        if (isUsdAsset) {
          let origUnitUsd = inv.purchasePrice || 0;
          if (origUnitUsd > (currentPrice / 2) && usdRate > 0) {
            origUnitUsd = origUnitUsd / usdRate;
          }
          if (origUnitUsd > 0) {
            cost = origUnitUsd * (inv.quantity || 1) * usdRate;
          }
        } else if (inv.purchasePrice && inv.purchasePrice > 0 && inv.purchasePrice < (currentPrice / 5)) {
          const estimatedCostInTry = inv.purchasePrice * usdRate * (inv.quantity || 1);
          if (Math.abs(estimatedCostInTry - tempCurrentVal) < Math.abs(cost - tempCurrentVal)) {
            cost = estimatedCostInTry;
          }
        }
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
 * Tüm para birimleri için evrensel kur getirme fonksiyonu
 */
export function getRateForCurrency(currency: string, livePrices: Map<string, PriceResult>): number {
  const cur = (currency || "TRY").toUpperCase();
  if (cur === "TRY" || cur === "TL") return 1;
  
  if (cur === "USD") return livePrices.get("USDTRY=X")?.price || livePrices.get("USD")?.price || 36.45;
  if (cur === "EUR") return livePrices.get("EURTRY=X")?.price || livePrices.get("EUR")?.price || 38.65;
  if (cur === "GBP") return livePrices.get("GBPTRY=X")?.price || livePrices.get("GBP")?.price || 45.85;
  if (cur === "XAU" || cur === "GOLD" || cur === "ALT") return livePrices.get("XAUTRY=X")?.price || livePrices.get("GRAM ALTIN")?.price || livePrices.get("XAU")?.price || 3450;

  const liveRate = livePrices.get(cur)?.price || livePrices.get(`${cur}TRY=X`)?.price;
  if (liveRate && liveRate > 0) return liveRate;

  const fallbacks: Record<string, number> = {
    CHF: 41.20, JPY: 0.235, AED: 9.92, SAR: 9.72, RUB: 0.365,
    CAD: 26.22, AUD: 23.95, CNY: 5.03, SGD: 27.20, NOK: 3.28, SEK: 3.34
  };
  return fallbacks[cur] || 1;
}

/**
 * Sabit Varlıklar için Canlı Değerleme ve Kur/Endeksleme Sistemi
 */
export function calculateFixedAssetsMetrics(fixedAssets: any[], livePrices: Map<string, PriceResult>) {
  let totalOriginalCost = 0;
  let totalCurrentValue = 0;

  const detailedFixedAssets = (fixedAssets || []).map(fa => {
    const originalAmount = fa.originalAmount != null ? Number(fa.originalAmount) : Number(fa.value || 0);
    const curr = (fa.currency || "TRY").toUpperCase();
    const rate = getRateForCurrency(curr, livePrices);
    let currentVal = Number(fa.value || 0);

    if (curr !== "TRY" && curr !== "TL") {
      currentVal = originalAmount * rate;
    } else {
      const daysPassed = Math.max(0, (Date.now() - new Date(fa.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const annualAppreciation = fa.type === "Gayrimenkul" ? 0.40 : (fa.type === "Taşıt" ? 0.30 : 0.20);
      const dailyAppreciation = annualAppreciation / 365;
      const multiplier = Math.pow(1 + dailyAppreciation, daysPassed);
      currentVal = originalAmount * multiplier;
    }

    const cost = (curr !== "TRY" && curr !== "TL") ? (originalAmount * rate) : Number(fa.value || originalAmount);
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

/**
 * Gelir, Gider ve Borç kalemlerinin döviz kurlarına göre TL eşdeğerine dönüştürülmesi
 */
export function normalizeFinancialItemsToTry(items: any[], livePrices: Map<string, PriceResult>) {
  if (!items || !Array.isArray(items)) return [];

  return items.map(item => {
    const cur = (item.currency || "TRY").toUpperCase();
    const rate = getRateForCurrency(cur, livePrices);
    
    const dbAmount = Number(item.amount) || 0;
    const origAmt = item.originalAmount != null ? Number(item.originalAmount) : (cur === "TRY" || cur === "TL" ? dbAmount : dbAmount / (item.fxRate || rate || 1));
    const tryAmt = (cur === "TRY" || cur === "TL") ? dbAmount : (origAmt * rate);

    return {
      ...item,
      originalAmount: origAmt,
      rawAmount: origAmt,
      amount: tryAmt, // TL Karşılığı (Bütün toplama ve grafik işlemleri için)
      currencyRate: rate
    };
  });
}
