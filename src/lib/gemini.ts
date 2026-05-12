
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

/**
 * KOÇ RAM FİNANS - AGENTIC GEMINI MASTER PROMPT
 * Bu prompt, modelin cümleleri anlamasını, gereksiz konuşmamasını ve 
 * sadece finansal verilere odaklanmasını sağlar.
 */
export const MASTER_PROMPT = `
Sisteme Giriş:
Sen "Koç Ram Finans" isimli, analitik zekası yüksek ve finansal disiplin konusunda uzman bir Yapay Zeka Ajanısın. 

GÖREVLERİN VE KURALLARIN:
1. CÜMLE ANLAMA (Natural Language Understanding): Anahtar kelime eşleştirmesi yapma. Kullanıcının niyetini anla. Eğer kullanıcı bir veri eklemek, sorgulamak veya analiz istiyorsa ilgili "Function Tool"u çağır.
2. NET VE KISA CEVAPLAR: Basit sorulara uzun cevaplar verme. Finansal analizleri madde işaretli ve okunabilir yap. Gereksiz selamlaşma ve dolaylı ifadelerden kaçın.
3. SADECE SORULAN SORU: Kullanıcı ne sorduysa sadece ona cevap ver. Konu dışına çıkma.
4. VERİ ÇEKME: Kullanıcının finansal durumuyla ilgili her türlü soruda (Örn: "Param ne durumda?", "Geçen ay ne harcadım?") mutlaka 'getFinancialHistory' aracını kullan. Ezbere cevap verme.
5. AKSİYON ALMA (Danışmanlık): Mevcut finansal durumu analiz et ve kullanıcının tasarruf oranını artıracak, borçlarını azaltacak somut öneriler ver.
6. İNTERNET ARAMASI: Güncel borsa, döviz, kripto fiyatları veya ekonomik haberler sorulduğunda Google Search (google_search_retrieval) aracını kullan. Bilgiyi çok kısa ve net ilet.
7. BÖLGESEL UYUMLULUK: Tüm para birimi işlemlerini aksi belirtilmedikçe TL üzerinden yap. Tarih formatı olarak TR formatını kullan.

Bugünün Tarihi: {CURRENT_DATE}
Kullanıcı Özeti: {USER_DATA}

UYARI: Yatırım tavsiyesi verirken mutlaka "Yatırım Tavsiyesi Değildir (YTD)" notunu ekle.
`;

export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getFinancialHistory",
    description: "Kullanıcının gelir, gider, borç ve yatırım verilerini veritabanından çeker. Kullanıcının finansal durumu sorulduğunda ilk buraya başvurulmalıdır.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description: "Sorgulanacak kategori: 'all', 'incomes', 'expenses', 'debts', 'investments'",
        },
        period: {
          type: SchemaType.STRING,
          description: "Dönem: 'last_month', 'last_3_months', 'all_time'",
        }
      },
      required: ["category"]
    }
  },
  {
    name: "addFinancialRecord",
    description: "Yeni bir finansal işlem (gelir, gider, borç) ekler. Kullanıcı '1000 TL kira ödedim' gibi cümleler kurduğunda kullanılır.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          description: "İşlem tipi: 'income', 'expense', 'debt'",
        },
        amount: {
          type: SchemaType.NUMBER,
          description: "Miktar (TL)",
        },
        category: {
          type: SchemaType.STRING,
          description: "Kategori (Kira, Market, Maaş vb.)",
        },
        description: {
          type: SchemaType.STRING,
          description: "Kısa açıklama",
        }
      },
      required: ["type", "amount", "category"]
    }
  }
];

export async function getFinancialContext(user: any) {
  const totals = {
    income: user.incomes?.reduce((acc: number, i: any) => acc + i.amount, 0) || 0,
    expense: user.expenses?.reduce((acc: number, i: any) => acc + i.amount, 0) || 0,
    debt: user.debts?.reduce((acc: number, i: any) => acc + i.amount, 0) || 0,
    investment: user.investments?.reduce((acc: number, i: any) => acc + (i.amount || 0), 0) || 0,
  };

  const savingsRate = totals.income > 0 ? (((totals.income - totals.expense) / totals.income) * 100).toFixed(1) : 0;

  return `[FİNANSAL ÖZET] 
  - Toplam Gelir: ${totals.income} TL
  - Toplam Gider: ${totals.expense} TL
  - Tasarruf Oranı: %${savingsRate}
  - Mevcut Borçlar: ${totals.debt} TL
  - Yatırımlar: ${totals.investment} TL
  Kullanıcıya bu verilere dayanarak proaktif tavsiyeler ver.`;
}
