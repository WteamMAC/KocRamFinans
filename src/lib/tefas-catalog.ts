/**
 * TEFAS EMK (Bireysel Emeklilik) Fon Kataloğu
 * Tek merkezi kaynak — hem price-service hem de market action buradan import eder.
 * Fiyatlar gösterge amaçlıdır; gerçek zamanlı TEFAS API entegrasyonu ücretli olduğundan
 * bu katalog statik referans fiyatları içermektedir.
 */
export interface TefasFund {
  code: string;
  title: string;
  price: number;
  type: "STANDART" | "GOLD" | "STOCKS" | "USD" | "CONSERVATIVE";
}

export const TEFAS_EMK_CATALOG: TefasFund[] = [
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
  { code: "HES", title: "Halk Emeklilik ve Hayat Hisse Senedi EYF", price: 721.30, type: "STOCKS" },
  { code: "FIE", title: "Fiba Emeklilik ve Hayat Hisse Senedi EYF", price: 687.50, type: "STOCKS" },

  // DÖVİZ / EUROBOND
  { code: "AGE", title: "Agesa Hayat ve Emeklilik Kamu Dış Borçlanma (Eurobond) EYF", price: 125.40, type: "USD" },
  { code: "ALS", title: "Allianz Hayat ve Emeklilik Kamu Dış Borçlanma (Eurobond) EYF", price: 132.15, type: "USD" },
  { code: "AH4", title: "Anadolu Hayat Emeklilik Kamu Dış Borçlanma (Eurobond) EYF", price: 138.90, type: "USD" },
  { code: "GGB", title: "Garanti Emeklilik ve Hayat Kamu Dış Borçlanma (Eurobond) EYF", price: 129.50, type: "USD" },
  { code: "VUB", title: "Vakıf Emeklilik ve Hayat Kamu Dış Borçlanma (Eurobond) EYF", price: 118.60, type: "USD" },
  { code: "ZEB", title: "Ziraat Emeklilik ve Hayat Kamu Dış Borçlanma (Eurobond) EYF", price: 124.80, type: "USD" },

  // MUHAFAZAKÂR / PARA PİYASASI
  { code: "AEL", title: "Agesa Hayat ve Emeklilik Para Piyasası EYF", price: 12.40, type: "CONSERVATIVE" },
  { code: "AL1", title: "Allianz Hayat ve Emeklilik Para Piyasası EYF", price: 13.15, type: "CONSERVATIVE" },
  { code: "AH1", title: "Anadolu Hayat Emeklilik Para Piyasası EYF", price: 13.90, type: "CONSERVATIVE" },
  { code: "GPP", title: "Garanti Emeklilik ve Hayat Para Piyasası EYF", price: 12.95, type: "CONSERVATIVE" },
  { code: "VPP", title: "Vakıf Emeklilik ve Hayat Para Piyasası EYF", price: 11.86, type: "CONSERVATIVE" },
  { code: "ZEP", title: "Ziraat Emeklilik ve Hayat Para Piyasası EYF", price: 12.48, type: "CONSERVATIVE" },
];
