export const MASTER_PROMPT = `
Sisteme Giriş:
Sen "Koç Ram Finans" isimli, analitik zekası yüksek ve finansal disiplin konusunda uzman bir yapay zeka asistanısın. 
Kullanıcının finansal durumunu analiz eder, bütçe yönetimi önerileri sunar ve proaktif finansal rehberlik yaparsın.

Bugünün Tarihi: {CURRENT_DATE}

Temel Çalışma Prensibin:
1. Sonsuz Bellek (RAG): Kullanıcının geçmiş verilerini (gelir, gider, borç, yatırım) doğrudan prompt içinde görmezsin. Eğer kullanıcı geçmişiyle ilgili bir soru sorarsa (Örn: "Geçen ay ne kadar harcadım?"), mutlaka "getFinancialHistory" aracını kullanarak veriyi çekmelisin.
2. Dinamik Analiz: Veri çekmeden varsayımda bulunma. "getFinancialHistory" aracından gelen gerçek rakamları analiz et.
3. İşlem Kaydı: Kullanıcı yeni bir veri eklemek istediğinde (Örn: "1000 TL market harcaması ekle") ilgili aracı (addExpense vb.) çağır. 
4. Piyasa Verileri: Güncel borsa, döviz veya kripto fiyatları için "googleSearchRetrieval" aracını kullan.
5. Yatırım Sınırı: Spesifik varlık adı vererek "al/sat" deme. Risk yönetimi ve sepet mantığını anlat. Mutlaka "Yatırım Tavsiyesi Değildir (YTD)" ekle.

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
      type: "object",
      properties: {
        type: { type: "string", description: "Gelir türü (Salary, Rent, Freelance, Other)" },
        amount: { type: "number", description: "Miktar (TL)" },
        description: { type: "string", description: "Açıklama veya kaynak" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addExpense",
    description: "Yeni bir gider (fatura, market, kira vb.) ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Gider türü (Rent, Bill, Groceries, Transport, Entertainment, Other)" },
        amount: { type: "number", description: "Miktar (TL)" },
        isRecurring: { type: "boolean", description: "Bu her ay tekrarlanan bir gider mi?" },
        description: { type: "string", description: "Gider detayı" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addDebt",
    description: "Yeni bir borç veya taksitli ödeme ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Borç türü (CreditCard, BankLoan, Personal, Other)" },
        amount: { type: "number", description: "Toplam borç miktarı" },
        remainingInstallments: { type: "number", description: "Kalan taksit sayısı (varsa)" },
        description: { type: "string", description: "Borç detayı" }
      },
      required: ["type", "amount"]
    }
  },
  {
    name: "addInvestment",
    description: "Yeni bir yatırım (hisse, kripto, altın, döviz vb.) ekler.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Yatırım türü (BIST, NASDAQ, CRYPTO, GOLD, CURRENCY)" },
        symbol: { type: "string", description: "Sembol (Örn: THYAO, BTC, AAPL, XAU, USD)" },
        quantity: { type: "number", description: "Adet/Miktar" },
        purchasePrice: { type: "number", description: "Birim Alış Fiyatı" },
        description: { type: "string", description: "Yatırım notu" }
      },
      required: ["type", "symbol", "quantity", "purchasePrice"]
    }
  },
  {
    name: "getFinancialHistory",
    description: "Kullanıcının geçmiş finansal verilerini (gelir, gider, borç, yatırım) detaylı olarak getirir.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Hangi kategori sorgulanacak? (incomes, expenses, debts, investments, all)" },
        period: { type: "string", description: "Hangi dönem? (last_month, last_3_months, all_time)" }
      },
      required: ["category"]
    }
  }
];

export async function getFinancialContext(user: any) {
  const totals = {
    income: user.incomes.reduce((acc: number, i: any) => acc + i.amount, 0),
    expense: user.expenses.reduce((acc: number, i: any) => acc + i.amount, 0),
    debt: user.debts.reduce((acc: number, i: any) => acc + i.amount, 0),
    investment: user.investments.reduce((acc: number, i: any) => acc + (i.amount || 0), 0),
  };

  return `[BAKİYE ÖZETİ] Toplam Gelir: ${totals.income} TL, Toplam Gider: ${totals.expense} TL, Borçlar: ${totals.debt} TL, Yatırımlar: ${totals.investment} TL.`;
}
