
export const MASTER_PROMPT = `
Sen "Koç Ram Finans" platformunun resmi yapay zeka asistanısın. Kullanıcının finansal koçu ve rehberisin.

TEMEL GÖREVLERİN:
1. Kullanıcının gelir, gider, borç ve yatırımlarını analiz etmek.
2. Kullanıcının talebi üzerine (örn: "1000 TL market harcaması ekle", "Maaşıma %20 zam geldi") veri tabanını güncellemek.
3. Finansal tavsiyeler vermek (Yatırım tavsiyesi olmadığını belirterek).
4. Güncel piyasa verileri veya genel bilgiler için Google Search kullanmak.

İLKELERİN:
- Nazik, profesyonel ve güven verici bir dil kullan.
- Veri eklerken veya güncellerken mutlaka ilgili fonksiyonu (tool) çağır.
- Kullanıcının verilerini analiz ederken "getFinancialSummary" fonksiyonunu kullanarak en güncel durumu al.
- Her zaman "Yatırım Tavsiyesi Değildir (YTD)" notunu uygun yerlerde paylaş.
- Yanıtlarını kısa, öz ve kullanıcı dostu (markdown formatında) tut.

KULLANICI VERİLERİNE ERİŞİM:
- Sana doğrudan tüm veriler gelmez. Eğer kullanıcı durumuyla ilgili bir şey sorarsa önce "getFinancialSummary" fonksiyonunu çağırıp gelen veriyi analiz etmelisin.
`;

export const FUNCTION_DECLARATIONS = [
  {
    name: "getFinancialSummary",
    description: "Kullanıcının mevcut finansal durumunu (gelirler, giderler, borçlar, yatırımlar) özet olarak getirir.",
    parameters: {
      type: "OBJECT",
      properties: {},
    }
  },
  {
    name: "addIncome",
    description: "Kullanıcının veri tabanına yeni bir gelir veya maaş artışı ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Gelir türü (Maaş, Kira, Ek İş, vb.)" },
        amount: { type: "NUMBER", description: "Tutar (TL)" },
        description: { type: "STRING", description: "Kısa açıklama" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addExpense",
    description: "Kullanıcının veri tabanına yeni bir harcama veya gider ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Gider türü (Market, Kira, Fatura, Eğlence, vb.)" },
        amount: { type: "NUMBER", description: "Tutar (TL)" },
        isRecurring: { type: "BOOLEAN", description: "Bu her ay tekrarlanan bir gider mi?" },
        description: { type: "STRING", description: "Harcama detayı" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addDebt",
    description: "Kullanıcının veri tabanına yeni bir borç veya taksit ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Borç türü (Kredi Kartı, Banka Kredisi, Şahıs Borcu, vb.)" },
        amount: { type: "NUMBER", description: "Toplam borç tutarı" },
        remainingInstallments: { type: "NUMBER", description: "Kalan taksit sayısı" },
        description: { type: "STRING", description: "Borç detayı" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addInvestment",
    description: "Kullanıcının portföyüne yeni bir yatırım (hisse, altın, kripto vb.) ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Yatırım türü (BIST, NASDAQ, CRYPTO, GOLD)" },
        symbol: { type: "STRING", description: "Sembol (Örn: THYAO, BTC, AAPL)" },
        quantity: { type: "NUMBER", description: "Adet/Miktar" },
        purchasePrice: { type: "NUMBER", description: "Birim alış fiyatı" },
        description: { type: "STRING", description: "Yatırım notu" }
      },
      required: ["type", "symbol", "quantity", "purchasePrice"]
    }
  }
];
