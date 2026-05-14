"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function generateSmartInsights(financialData: any) {
  if (!apiKey) {
    return { success: false, error: "API Anahtarı eksik." };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sen uzman bir finansal danışmansın. Aşağıdaki kullanıcı verilerini analiz et ve 3 adet kısa, öz ve vurucu "Proaktif Uyarı / Tavsiye" üret. 
Kullanıcının adı yok, doğrudan "Siz" veya "Harcamalarınız" diye hitap et.
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

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sen uzman bir finansal analistsin. Aşağıdaki portföy verilerini (yatırımlar ve sabit varlıklar) analiz et ve önümüzdeki 6 ay için gerçekçi bir "Aylık Birleşik Büyüme Oranı" tahmin et.
    
Varlıklar:
${JSON.stringify(portfolioData)}

Lütfen şu kurallara uy:
1. Mevcut piyasa koşullarını (BIST, Altın, Döviz, Kripto, Emlak) göz önüne al.
2. Tahminini rasyonel bir temele oturt.
3. Yanıtını SADECE aşağıdaki JSON formatında ver:
{
  "monthlyRate": 0.042, // %4.2 ise 0.042
  "rationale": "Kısa ve öz açıklama",
  "confidence": 0.85 // 0-1 arası
}

Not: Türkiye piyasası verilerini ve enflasyonist ortamı da değerlendir.
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
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
