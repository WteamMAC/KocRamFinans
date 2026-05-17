"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

const FALLBACK_MODELS = [
  "gemini-3.1-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash"
];

// Ortak yardımcı: Model fallback döngüsü
async function runWithFallback(prompt: string): Promise<string> {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      console.warn(`[insights] Model failed (${modelName}):`, err);
    }
  }
  throw lastError || new Error("Tüm yapay zeka modelleri başarısız oldu.");
}

export async function generateSmartInsights(financialData: any) {
  if (!apiKey) {
    return { success: false, error: "API Anahtarı eksik." };
  }

  try {
    const userCurrency = financialData?.userCurrency || financialData?.currency || "TRY";
    const userCountry = financialData?.userCountry || financialData?.country || "TR";

    const prompt = `Sen uzman bir finansal danışmansın. Aşağıdaki kullanıcı verilerini analiz et ve 3 adet kısa, öz ve vurucu "Proaktif Uyarı / Tavsiye" üret. 
Kullanıcının adı yok, doğrudan "Siz" veya "Harcamalarınız" diye hitap et.
Kullanıcının tercih para birimi: ${userCurrency} | Ülke: ${userCountry}
Veritabanındaki tüm tutarlar TRY cinsindendir.

Sadece JSON formatında geçerli bir çıktı ver, Markdown kullanma. JSON şeması:
[
  { "type": "warning" | "success" | "info", "message": "Kısa ve net mesaj" }
]

Örnek çıktı:
[
  { "type": "warning", "message": "Geçen aya göre Dışarıda Yemek harcamalarınız %20 arttı. Dikkat etmelisiniz." },
  { "type": "success", "message": "Tasarruf oranınız %25 ile oldukça sağlıklı bir seviyede." },
  { "type": "info", "message": "Kredi kartı borcunuz gelirinizin %40'ını oluşturuyor. Borç kapatmaya odaklanın." }
]

Kullanıcı Verisi (JSON):
${JSON.stringify(financialData)}
`;

    let responseText = await runWithFallback(prompt);
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(responseText);
      return { success: true, data: parsedData };
    } catch (parseError) {
      console.error("Insights JSON Parse Error. Raw output:", responseText);
      return { success: false, error: "Yapay zeka yanıtı anlaşılamadı. Lütfen sayfayı yenileyin." };
    }
  } catch (error: any) {
    console.error("Insights Error:", error);
    return { success: false, error: "Tavsiyeler yüklenemedi: " + (error.message || "Bilinmeyen hata") };
  }
}

export async function predictGrowthRate(portfolioData: any) {
  if (!apiKey) {
    return { success: false, error: "API Anahtarı eksik.", rate: 0.04 };
  }

  try {
    const baseCurrency = portfolioData?.baseCurrency || "TRY";

    const prompt = `Sen uzman bir finansal analistsin. Aşağıdaki portföy verilerini (yatırımlar, sabit varlıklar ve aylık düzenli tasarruf miktarı) analiz et. 
Portföydeki spesifik varlıkların (örneğin BTC, AAPL, Altın vs.) gelecek 6 ay içindeki beklenen değer artışlarını tek tek hesapla ve genel portföy büyüme projeksiyonunu buna göre belirle.

Kullanıcının temel para birimi: ${baseCurrency}
NOT: Tüm tutarlar TRY cinsindendir; yorumlarını da bu bağlamda yap.
    
Varlıklar ve Nakit Akışı:
${JSON.stringify(portfolioData)}

Lütfen şu kurallara uy:
1. Her bir ana varlığın (kripto, hisse, altın vs.) 6 ay sonraki beklenen değerini rasyonel bir temelde (örnek: "BTC halving etkisi", "BIST faiz indirimi beklentisi") tahmin et.
2. Bu spesifik varlık tahminlerini harmanlayarak tüm portföy için gerçekçi bir "Aylık Ortalama Büyüme Oranı (monthlyRate)" bul. (Aylık düzenli nakit girişini de hesaba kat).
3. Yanıtını SADECE aşağıdaki JSON formatında ver:
{
  "monthlyRate": 0.042,
  "rationale": "Kısa genel açıklama.",
  "confidence": 0.85,
  "assetProjections": [
    {
      "symbol": "BTC",
      "currentValue": 80000,
      "projectedValue": 115000,
      "rationale": "Küresel likidite artışı ve arz kısıtından dolayı güçlü yükseliş bekleniyor."
    }
  ]
}

Not: Türkiye piyasası verilerini, küresel piyasaları ve enflasyonist ortamı da değerlendir.
`;

    let responseText = await runWithFallback(prompt);
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(responseText);
      return { success: true, ...parsedData };
    } catch (parseError) {
      console.error("Growth Prediction JSON Parse Error:", responseText);
      return { success: false, rate: 0.04, rationale: "AI yanıtı işlenemedi." };
    }
  } catch (error: any) {
    console.error("Growth Prediction Error:", error);
    return { success: false, rate: 0.04, error: error.message };
  }
}
