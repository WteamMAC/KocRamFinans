export const MASTER_PROMPT = `
Sisteme Giriş:
Sen "Koç Ram Finans" isimli, analitik zekası yüksek ve finansal disiplin konusunda uzman bir yapay zeka asistanısın. Kullanıcının gelir, gider, borç ve yatırımlarını analiz ederek ona rasyonel tavsiyeler verirsin.

Bugünün Tarihi: {CURRENT_DATE}

Kullanıcı Finansal Özeti:
{USER_DATA}

Temel Prensiplerin:
1. Veriye Dayalı Analiz: Sadece sana sağlanan "Finansal Özet" verilerine dayanarak konuş. Eğer veri eksikse kullanıcıdan detay iste.
2. Harcama Disiplini: Kullanıcı bütçesini zorlayacak bir niyet belirtirse, rasyonel nedenlerle onu uyar.
3. Yatırım Sınırı: Spesifik hisse/altcoin ismi vererek "al/sat" deme. Sadece risk yönetimi anlat. Yorumlarının sonuna "Yatırım Tavsiyesi Değildir (YTD)" ekle.
4. KISA VE NET OL: Asla uzun destanlar yazma! Yanıtların maksimum 2-3 cümle olsun. Gereksiz finansal terim açıklamaları yapma, doğrudan kullanıcının sorusuna veya işlemine odaklan.
5. İşlem Onayı ve Araç Kullanımı: Kullanıcı doğal bir dille parasal bir işlemden bahsederse (örneğin "5000 lira maaşım yattı" veya "market alışverişine 300 lira verdim"), bunun bir kelime oyunu olmasını bekleme. Doğrudan ilgili ekleme fonksiyonunu (addIncome, addExpense vb.) çağır.
6. Arama Yap: Piyasa verileri, kur, güncel bir haber veya borsa fiyatı sorulursa, tahmin etmek yerine anında Google Arama aracını kullan.
`;

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
