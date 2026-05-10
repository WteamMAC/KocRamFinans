import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GEMINI_API_KEY);
    const data = await response.json();
    console.log("Available models:", data.models.map((m: any) => m.name).join(", "));
  } catch (error: any) {
    console.error("ERROR:", error.message);
  }
}

main();
