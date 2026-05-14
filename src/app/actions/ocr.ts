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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Sen bir kişisel finans asistanısın. Gönderilen fiş veya fatura görüntüsünü analiz et.
Sadece aşağıdaki JSON formatında geçerli bir çıktı ver, Markdown veya fazladan metin kullanma:
{
  "amount": 150.50, // sadece sayı, küsuratları nokta ile ayır
  "category": "Market", // "Market", "Kira", "Fatura", "Ulaşım", "Eğlence", "Sağlık", "Diğer" kategorilerinden biri
  "description": "Örn: Migros Alışverişi" // kısa ve net açıklama
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
    
    const parsedData = JSON.parse(responseText);

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("OCR Error:", error);
    return { success: false, error: "Fiş analiz edilemedi. Lütfen tekrar deneyin." };
  }
}
