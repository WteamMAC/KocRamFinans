import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import dotenv from "dotenv";

dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash") as any,
      prompt: "Merhaba, bana 1 cümlelik bir test mesajı gönder.",
    });
    console.log("SUCCESS:", text);
  } catch (error: any) {
    console.error("ERROR:", error.message);
  }
}

main();
