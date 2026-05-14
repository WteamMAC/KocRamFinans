"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Gemini API Key is missing.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function processReceiptWithAI(base64Image: string, mimeType: string) {
  if (!apiKey) {
    return { success: false, error: "API Anahtarı eksik." };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sen bir kişisel finans asistanısın. Gönderilen fiş veya fatura görüntüsünü analiz et.
Sadece aşağıdaki JSON formatında geçerli bir çıktı ver. JSON içine ASLA YORUM SATIRI (//) EKLEME, SADECE GEÇERLİ BİR JSON OLSUN:
{
  "amount": 150.50,
  "category": "Market",
  "description": "Migros Alışverişi"
}`;

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text();
    
    // Clean markdown if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedData = JSON.parse(responseText);
      return { success: true, data: parsedData };
    } catch (parseError) {
      console.error("JSON Parse Error. Raw output:", responseText);
      return { success: false, error: "Fiş formatı anlaşılamadı. Lütfen daha net bir fotoğraf yükleyin." };
    }
  } catch (error: any) {
    console.error("OCR Error:", error);
    return { success: false, error: "Hata: " + (error.message || "Bilinmeyen hata") };
  }
}
