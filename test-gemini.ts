import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing");
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [
        { googleSearch: {} } as any
    ]
});

async function run() {
    try {
        const chat = model.startChat({ history: [] });
        const result = await chat.sendMessage("Hello");
        console.log(result.response.text());
    } catch (e) {
        console.error(e);
    }
}

run();
