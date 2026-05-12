export const MASTER_PROMPT = `
Sisteme Giriş:
Sen "Koç Ram Finans" isimli, analitik zekası yüksek ve finansal disiplin konusunda uzman bir yapay zeka asistanısın. 
Kullanıcının gelir, gider, borç ve yatırımlarını analiz ederek ona rasyonel, veriye dayalı ve proaktif finansal tavsiyeler verirsin.

Bugünün Tarihi: {CURRENT_DATE}

Kullanıcı Finansal Özeti:
{USER_DATA}

Temel Prensiplerin:
1. Veriye Dayalı Analiz: Sadece sağlanan verilere dayan. Veri eksikse araçları (tools) kullanarak sorgula veya kullanıcıdan iste.
2. Harcama Disiplini: Bütçeyi sarsacak harcamalarda (örn: lüks tüketim) rasyonel uyarılar yap.
3. Yatırım Sınırı: Spesifik varlık adı vererek "al/sat" deme. Risk yönetimi ve sepet mantığını anlat. Mutlaka "Yatırım Tavsiyesi Değildir (YTD)" ekle.
4. Piyasa Verileri: Güncel fiyatlar için "googleSearchRetrieval" aracını kullan.
5. İşlem Kaydı: Kullanıcı bir veri eklemek istediğinde ilgili fonksiyonu çağır. Kayıt sonrası doğal bir onay mesajı ver.
6. Proaktif Yaklaşım: Kullanıcının harcama alışkanlıklarındaki anormallikleri fark et ve öneriler sun.

İletişim Tarzı:
- Profesyonel, güven verici ve net Türkçe.
- Kısa, öz ve madde işaretli yanıtlar.
- Karmaşık finansal terimleri basitleştirerek açıkla.
`;

export const FUNCTION_DECLARATIONS = [
  {
    name: "addIncome",
    description: "Yeni bir gelir kaynağı (maaş, kira, ek gelir vb.) ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Gelir türü (Salary, Rent, Freelance, Other)" },
        amount: { type: "NUMBER", description: "Miktar (TL)" },
        description: { type: "STRING", description: "Açıklama veya kaynak" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addExpense",
    description: "Yeni bir gider (fatura, market, kira vb.) ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Gider türü (Rent, Bill, Groceries, Transport, Entertainment, Other)" },
        amount: { type: "NUMBER", description: "Miktar (TL)" },
        isRecurring: { type: "BOOLEAN", description: "Bu her ay tekrarlanan bir gider mi?" },
        description: { type: "STRING", description: "Gider detayı" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addDebt",
    description: "Yeni bir borç veya taksitli ödeme ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Borç türü (CreditCard, BankLoan, Personal, Other)" },
        amount: { type: "NUMBER", description: "Toplam borç miktarı" },
        remainingInstallments: { type: "NUMBER", description: "Kalan taksit sayısı (varsa)" },
        description: { type: "STRING", description: "Borç detayı" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addInvestment",
    description: "Yeni bir yatırım (hisse, kripto, altın, döviz vb.) ekler.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Yatırım türü (BIST, NASDAQ, CRYPTO, GOLD, CURRENCY)" },
        symbol: { type: "STRING", description: "Sembol (Örn: THYAO, BTC, AAPL, XAU, USD)" },
        quantity: { type: "NUMBER", description: "Adet/Miktar" },
        purchasePrice: { type: "NUMBER", description: "Birim Alış Fiyatı" },
        description: { type: "STRING", description: "Yatırım notu" }
      },
      required: ["type", "symbol", "quantity", "purchasePrice"]
    }
  },
  {
    name: "getFinancialHistory",
    description: "Kullanıcının geçmiş finansal verilerini (gelir, gider, borç, yatırım) detaylı olarak getirir.",
    parameters: {
      type: "OBJECT",
      properties: {
        category: { type: "STRING", description: "Hangi kategori sorgulanacak? (incomes, expenses, debts, investments, all)" },
        period: { type: "STRING", description: "Hangi dönem? (last_month, last_3_months, all_time)" }
      },
      required: ["category"]
    }
  }
];

export async function getFinancialContext(user: any) {
  // Veriyi özetleyerek gönderiyoruz (Token tasarrufu ve daha iyi analiz için)
  const summary = {
    ozet: {
      aile_uyesi: user.familyCount,
      toplam_gelir: user.incomes.reduce((acc: number, i: any) => acc + i.amount, 0),
      toplam_gider: user.expenses.reduce((acc: number, i: any) => acc + i.amount, 0),
      toplam_borc: user.debts.reduce((acc: number, i: any) => acc + i.amount, 0),
      toplam_yatirim: user.investments.reduce((acc: number, i: any) => acc + (i.currentValuation || i.amount), 0),
    },
    son_islemler: {
      gelirler: user.incomes.slice(-3).map((i: any) => `${i.type}: ${i.amount}TL`),
      giderler: user.expenses.slice(-3).map((e: any) => `${e.type}: ${e.amount}TL`),
      borclar: user.debts.slice(-3).map((d: any) => `${d.type}: ${d.amount}TL`),
      yatirimlar: user.investments.slice(-3).map((i: any) => `${i.type}: ${i.amount}TL`),
    }
  };

  return `
[DURUM] Gelir:${summary.ozet.toplam_gelir} TL | Gider:${summary.ozet.toplam_gider} TL | Net:${summary.ozet.toplam_gelir - summary.ozet.toplam_gider} TL
[BORÇ/YATIRIM] Borç:${summary.ozet.toplam_borc} TL | Yatırım:${summary.ozet.toplam_yatirim} TL
[SON ISLEMLER] Gelir:${summary.son_islemler.gelirler.join(", ") || "-"} | Gider:${summary.son_islemler.giderler.join(", ") || "-"}
`;
}
