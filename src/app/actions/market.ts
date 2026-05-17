'use server';

import { searchSymbols as searchSymbolsLib, getLivePrices } from "@/lib/price-service";

/**
 * İstemci tarafı (Client Component) için güvenli arama aksiyonu.
 * Bu fonksiyon her zaman sunucuda çalışır.
 */
export async function searchSymbolsAction(query: string, category: string) {
  try {
    const results = await searchSymbolsLib(query, category);
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

export async function getSymbolLivePriceAction(symbol: string) {
  try {
    const liveMap = await getLivePrices([symbol]);
    const res = liveMap.get(symbol.toUpperCase());
    return res?.price || 0;
  } catch (error) {
    console.error("Live Price Action Error:", error);
    return 0;
  }
}

export async function getExchangeRatesAction() {
  try {
    const symbols = [
      "USDTRY=X", "EURTRY=X", "GBPTRY=X", "EURUSD=X", "GBPUSD=X", "CHF=X", "JPY=X",
      "AED=X", "SAR=X", "RUB=X", "CAD=X", "AUD=X",
      "CNY=X", "SGD=X", "NOK=X", "SEK=X", "GC=F"
    ];
    const results = await getLivePrices(symbols);
    
    const usdRate = results.get("USDTRY=X")?.price || results.get("USD")?.price || 36.45;
    const eurUsd = results.get("EURUSD=X")?.price || 1.06;
    const gbpUsd = results.get("GBPUSD=X")?.price || 1.258;

    const eurRate = results.get("EURTRY=X")?.price || results.get("EUR")?.price || (eurUsd * usdRate);
    const gbpRate = results.get("GBPTRY=X")?.price || results.get("GBP")?.price || (gbpUsd * usdRate);

    const rawGold = results.get("GC=F")?.price || 2950;
    const xauTryPerGram = (rawGold / 31.1035) * usdRate;
    
    const getTryFromUsd = (symbol: string, defaultRate: number) => {
      const quote = results.get(symbol)?.price || defaultRate;
      return quote > 0 ? usdRate / quote : (usdRate / defaultRate);
    };

    return {
      USD: usdRate,
      EUR: eurRate,
      GBP: gbpRate,
      CHF: getTryFromUsd("CHF=X", 0.885),
      JPY: getTryFromUsd("JPY=X", 154.5),
      AED: getTryFromUsd("AED=X", 3.6725),
      SAR: getTryFromUsd("SAR=X", 3.75),
      RUB: getTryFromUsd("RUB=X", 99.5),
      CAD: getTryFromUsd("CAD=X", 1.39),
      AUD: getTryFromUsd("AUD=X", 1.52),
      CNY: getTryFromUsd("CNY=X", 7.24),
      SGD: getTryFromUsd("SGD=X", 1.34),
      NOK: getTryFromUsd("NOK=X", 11.10),
      SEK: getTryFromUsd("SEK=X", 10.90),
      XAU: xauTryPerGram || 3450,
    };
  } catch (error) {
    console.error("Exchange Rates Error:", error);
    return null;
  }
}

const TEFAS_EMK_FUNDS = [
  // STANDART / KARMA
  { code: "AEG", title: "Agesa Hayat ve Emeklilik Standart EYF", price: 42.15, type: "STANDART" },
  { code: "ALR", title: "Allianz Hayat ve Emeklilik Standart EYF", price: 38.45, type: "STANDART" },
  { code: "ATE", title: "Anadolu Hayat Emeklilik Standart EYF", price: 51.20, type: "STANDART" },
  { code: "GH1", title: "Garanti Emeklilik ve Hayat Standart EYF", price: 48.90, type: "STANDART" },
  { code: "VE1", title: "Vakıf Emeklilik ve Hayat Standart EYF", price: 35.60, type: "STANDART" },
  { code: "ZHE", title: "Ziraat Emeklilik ve Hayat Standart EYF", price: 44.80, type: "STANDART" },
  { code: "HEH", title: "Halk Emeklilik ve Hayat Standart EYF", price: 39.30, type: "STANDART" },

  // ALTIN / EMTIA
  { code: "AGB", title: "Agesa Hayat ve Emeklilik Altın EYF", price: 215.40, type: "GOLD" },
  { code: "AMZ", title: "Allianz Hayat ve Emeklilik Altın Katılım EYF", price: 232.15, type: "GOLD" },
  { code: "AH5", title: "Anadolu Hayat Emeklilik Altın EYF", price: 208.90, type: "GOLD" },
  { code: "GH2", title: "Garanti Emeklilik ve Hayat Altın EYF", price: 224.50, type: "GOLD" },
  { code: "VGA", title: "Vakıf Emeklilik ve Hayat Altın Katılım EYF", price: 198.60, type: "GOLD" },
  { code: "ZEA", title: "Ziraat Emeklilik ve Hayat Altın Katılım EYF", price: 212.80, type: "GOLD" },
  { code: "HKA", title: "Halk Emeklilik ve Hayat Altın Katılım EYF", price: 201.30, type: "GOLD" },
  { code: "FIB", title: "Fiba Emeklilik ve Hayat Altın EYF", price: 187.50, type: "GOLD" },

  // HİSSE YOĞUN
  { code: "AEH", title: "Agesa Hayat ve Emeklilik Hisse Senedi EYF", price: 785.40, type: "STOCKS" },
  { code: "AL3", title: "Allianz Hayat ve Emeklilik Hisse Senedi EYF", price: 812.15, type: "STOCKS" },
  { code: "AH3", title: "Anadolu Hayat Emeklilik Hisse Senedi EYF", price: 854.90, type: "STOCKS" },
  { code: "GEH", title: "Garanti Emeklilik ve Hayat Hisse Senedi EYF", price: 792.50, type: "STOCKS" },
  { code: "VHE", title: "Vakıf Emeklilik ve Hayat Hisse Senedi EYF", price: 735.60, type: "STOCKS" },
  { code: "ZHE", title: "Ziraat Emeklilik ve Hayat Hisse Senedi EYF", price: 768.80, type: "STOCKS" },
  { code: "HES", title: "Halk Emeklilik ve Hayat Hisse Senedi EYF", price: 721.30, type: "STOCKS" },
  { code: "FIE", title: "Fiba Emeklilik ve Hayat Hisse Senedi EYF", price: 687.50, type: "STOCKS" },

  // DOVIZ / EUROBOND / DIŞ BORÇLANMA
  { code: "AGE", title: "Agesa Hayat ve Emeklilik Kamu Dış Borçlanma (Eurobond) EYF", price: 125.40, type: "USD" },
  { code: "ALS", title: "Allianz Hayat ve Emeklilik Kamu Dış Borçlanma (Eurobond) EYF", price: 132.15, type: "USD" },
  { code: "AH4", title: "Anadolu Hayat Emeklilik Kamu Dış Borçlanma (Eurobond) EYF", price: 138.90, type: "USD" },
  { code: "GGB", title: "Garanti Emeklilik ve Hayat Kamu Dış Borçlanma (Eurobond) EYF", price: 129.50, type: "USD" },
  { code: "VUB", title: "Vakıf Emeklilik ve Hayat Kamu Dış Borçlanma (Eurobond) EYF", price: 118.60, type: "USD" },
  { code: "ZEB", title: "Ziraat Emeklilik ve Hayat Kamu Dış Borçlanma (Eurobond) EYF", price: 124.80, type: "USD" },

  // MUHAFAZAKAR / PARA PİYASASI
  { code: "AEL", title: "Agesa Hayat ve Emeklilik Para Piyasası EYF", price: 12.40, type: "CONSERVATIVE" },
  { code: "AL1", title: "Allianz Hayat ve Emeklilik Para Piyasası EYF", price: 13.15, type: "CONSERVATIVE" },
  { code: "AH1", title: "Anadolu Hayat Emeklilik Para Piyasası EYF", price: 13.90, type: "CONSERVATIVE" },
  { code: "GPP", title: "Garanti Emeklilik ve Hayat Para Piyasası EYF", price: 12.95, type: "CONSERVATIVE" },
  { code: "VPP", title: "Vakıf Emeklilik ve Hayat Para Piyasası EYF", price: 11.86, type: "CONSERVATIVE" },
  { code: "ZEP", title: "Ziraat Emeklilik ve Hayat Para Piyasası EYF", price: 12.48, type: "CONSERVATIVE" }
];

/**
 * TEFAS EMK (Bireysel Emeklilik) fonlarını arar.
 * @param query - Fon kodu veya adı (örn: "AEG", "Altın", "Hisse")
 * @returns Eşleşen TEFAS emeklilik fonlarının listesi
 */
export async function searchTefasFundsAction(query: string) {
  try {
    if (!query || query.trim().length < 2) return [];
    
    const cleanQuery = query.trim().toUpperCase();
    
    // Filtreleme yap
    const matches = TEFAS_EMK_FUNDS.filter(fund => {
      const matchCode = fund.code.includes(cleanQuery);
      const matchTitle = fund.title.toUpperCase().includes(cleanQuery);
      return matchCode || matchTitle;
    }).slice(0, 15);

    if (matches.length === 0) return [];

    // Fiyat servisimizi çağırarak canlı kurları alalım
    const matchedCodes = matches.map(m => m.code);
    const livePricesMap = await getLivePrices(matchedCodes);

    return matches.map(fund => {
      const livePrice = livePricesMap.get(fund.code);
      return {
        code: fund.code,
        title: fund.title,
        price: (livePrice && livePrice.price > 0) ? livePrice.price : fund.price,
        dailyReturn: (livePrice && livePrice.changePercent) ? livePrice.changePercent * 100 : 0.45
      };
    });
  } catch (error) {
    console.error("TEFAS Fund Search Error:", error);
    return [];
  }
}
