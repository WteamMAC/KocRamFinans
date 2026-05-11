const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

async function test() {
  console.log("--- YAHOO FINANCE TEST (FINAL) ---");
  try {
    console.log("1. THYAO.IS (BIST) Deneniyor...");
    const quote = await yf.quote('THYAO.IS');
    console.log("BAŞARILI! Fiyat:", quote.regularMarketPrice);

    console.log("\n2. Arama Testi ('thy')...");
    const search = await yf.search('thy');
    console.log("ARAMA BAŞARILI! İlk Sonuç:", search.quotes[0].symbol);

  } catch (error) {
    console.error("HATA:", error.message);
  }
}

test();
