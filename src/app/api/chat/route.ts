import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext, FUNCTION_DECLARATIONS } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// API Key Management
const getApiKeys = () => {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys.length > 0 ? keys : ["missing_api_key"];
};

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

// Helper to execute read-only tools on the server
async function executeTool(name: string, args: any, userId: string) {
  if (name === "getFinancialHistory") {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        incomes: true,
        expenses: true,
        debts: true,
        investments: true
      }
    });

    if (!user) return { error: "User not found" };

    const { category, period } = args;
    let data: any = {};
    
    if (category === "all" || category === "incomes") data.incomes = user.incomes;
    if (category === "all" || category === "expenses") data.expenses = user.expenses;
    if (category === "all" || category === "debts") data.debts = user.debts;
    if (category === "all" || category === "investments") data.investments = user.investments;

    return { success: true, data };
  }
  
  return null; // For write tools that need UI confirmation
}

export async function POST(req: Request) {
  const traceId = Math.random().toString(36).substring(7);
  
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    // Rate Limit Check
    const rateLimit = await checkRateLimit(req as any, userId);
    if (!rateLimit.success) {
      return new Response(JSON.stringify({ 
        error: "Çok fazla istek gönderdiniz. Lütfen 15 saniye bekleyin.",
        reset: rateLimit.reset 
      }), { status: 429, headers: { "Content-Type": "application/json" } });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // Fetch User & Context
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        incomes: { take: 20 },
        expenses: { take: 20 },
        debts: { take: 10 },
        investments: { take: 20 }
      },
    });

    if (!user) return new Response("User not found", { status: 404 });

    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{USER_DATA}", financialContext)
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"));

    // Tool Configuration
    const tools: any[] = [
      { functionDeclarations: FUNCTION_DECLARATIONS },
      { googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.3 } } }
    ];

    // AI Execution Loop (Key + Model Rotation)
    for (let attempt = 0; attempt < API_KEYS.length * 2; attempt++) {
      const keyIndex = (currentKeyIndex + Math.floor(attempt / 2)) % API_KEYS.length;
      const modelIndex = attempt % 2 === 0 ? 0 : 1; 
      
      const apiKey = API_KEYS[keyIndex];
      const modelId = FALLBACK_MODELS[modelIndex] || FALLBACK_MODELS[0];
      
      console.log(`[${traceId}] Attempt ${attempt}: Key ${keyIndex}, Model ${modelId}`);

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: modelId,
          systemInstruction: systemPrompt,
          tools
        });

        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              let hasContent = false;
              for await (const chunk of result.stream) {
                const parts = chunk.candidates?.[0]?.content?.parts;
                if (!parts) continue;

                for (const part of parts) {
                  if (part.text) {
                    controller.enqueue(encoder.encode(part.text));
                    hasContent = true;
                  }
                  if (part.functionCall) {
                    const call = part.functionCall;
                    const toolResult = await executeTool(call.name, call.args, userId);
                    
                    if (toolResult) {
                      controller.enqueue(encoder.encode(`\n\n[SİSTEM]: ${JSON.stringify(toolResult.data)}`));
                    } else {
                      const payload = JSON.stringify({ name: call.name, args: call.args });
                      controller.enqueue(encoder.encode(`\n\n__TOOL_CALL__:${payload}__END_TOOL_CALL__\n`));
                    }
                    hasContent = true;
                  }
                }
              }

              if (!hasContent) {
                controller.enqueue(encoder.encode("Üzgünüm, şu an yanıt veremiyorum."));
              }
              controller.close();
            } catch (e) {
              console.error("[STREAM ERROR]", e);
              controller.error(e);
            }
          }
        });

        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

      } catch (err: any) {
        const status = err.status || 0;
        console.warn(`[${traceId}] Failed: ${modelId} (${status}) - ${err.message}`);
        
        if (status === 429 || status === 401) {
          if (status === 429) currentKeyIndex = (keyIndex + 1) % API_KEYS.length;
          continue;
        }
        continue;
      }
    }

    throw new Error("All attempts failed.");

  } catch (error: any) {
    console.error(`[${traceId}] Final Error:`, error.message);
    return new Response(JSON.stringify({ error: "Sistem şu an yoğun, lütfen birazdan tekrar deneyin." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
