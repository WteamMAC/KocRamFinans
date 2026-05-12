import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, getFinancialContext, FUNCTION_DECLARATIONS } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

async function executeTool(name: string, args: any, userId: string) {
  if (name === "getFinancialHistory") {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: {
          incomes: { orderBy: { createdAt: 'desc' }, take: 50 },
          expenses: { orderBy: { createdAt: 'desc' }, take: 50 },
          debts: { orderBy: { createdAt: 'desc' }, take: 20 },
          investments: { orderBy: { createdAt: 'desc' }, take: 30 }
        }
      });

      if (!user) return { error: "Kullanıcı bulunamadı." };

      const { category } = args;
      let result: any = {};
      if (category === "all" || category === "incomes") result.incomes = user.incomes;
      if (category === "all" || category === "expenses") result.expenses = user.expenses;
      if (category === "all" || category === "debts") result.debts = user.debts;
      if (category === "all" || category === "investments") result.investments = user.investments;

      return { success: true, data: result };
    } catch (e) {
      console.error("Tool execution error:", e);
      return { error: "Veri çekilirken bir hata oluştu." };
    }
  }
  return null;
}

export async function POST(req: Request) {
  const traceId = Math.random().toString(36).substring(7);

  try {
    const { userId } = await auth();
    if (!userId) return new Response("Yetkisiz erişim.", { status: 401 });

    const rateLimit = await checkRateLimit(req as any, userId);
    if (!rateLimit.success) {
      return new Response(JSON.stringify({
        error: "Hız limitine takıldınız. Lütfen bir süre sonra tekrar deneyin.",
        reset: rateLimit.reset
      }), { status: 429, headers: { "Content-Type": "application/json" } });
    }

    const { messages } = await req.json();
    if (!messages || messages.length === 0) return new Response("Mesaj bulunamadı.", { status: 400 });

    const lastMessage = messages[messages.length - 1];

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { incomes: { take: 1 }, expenses: { take: 1 }, debts: { take: 1 }, investments: { take: 1 } }
    });

    if (!user) return new Response("Kullanıcı bulunamadı.", { status: 404 });

    const financialContext = await getFinancialContext(user);
    const systemPrompt = MASTER_PROMPT
      .replace("{CURRENT_DATE}", new Date().toLocaleDateString("tr-TR"))
      .replace("{USER_DATA}", financialContext);

    for (let keyAttempt = 0; keyAttempt < API_KEYS.length; keyAttempt++) {
      const keyIndex = (currentKeyIndex + keyAttempt) % API_KEYS.length;
      const apiKey = API_KEYS[keyIndex];

      for (let modelIndex = 0; modelIndex < FALLBACK_MODELS.length; modelIndex++) {
        const modelId = FALLBACK_MODELS[modelIndex];

        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          
          // Google Search ve ileri düzey araçlar için v1beta kullanılması gerekir
          const model = genAI.getGenerativeModel(
            {
              model: modelId,
              systemInstruction: systemPrompt,
              tools: [
                { functionDeclarations: FUNCTION_DECLARATIONS },
                { 
                  // @ts-ignore: Google Search Retrieval tool might not be in the current SDK types but is supported at runtime
                  googleSearchRetrieval: { 
                    dynamicRetrievalConfig: { 
                      mode: "MODE_DYNAMIC", 
                      dynamicThreshold: 0.3 
                    } 
                  } 
                }
              ] as any
            },
            { apiVersion: "v1beta" }
          );

          const history = messages.slice(0, -1).map((m: any) => {
            const role = m.role === "assistant" || m.role === "model" ? "model" : 
                         (m.role === "function" || m.role === "tool") ? "function" : "user";
            
            const parts: Part[] = [];
            
            if (role === "function") {
              parts.push({ 
                functionResponse: m.functionResponse || { 
                  name: m.name || "unknown_tool", 
                  response: typeof m.content === 'string' ? { result: m.content } : (m.content || {}) 
                } 
              });
            } 
            else if (role === "model" && (m.tool_calls || m.toolCalls)) {
              const calls = m.tool_calls || m.toolCalls;
              calls.forEach((tc: any) => {
                parts.push({ 
                  functionCall: {
                    name: tc.function?.name || tc.functionCall?.name || tc.name,
                    args: typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function?.arguments || tc.functionCall?.args || tc.args || {})
                  } 
                });
              });
              if (m.content) parts.push({ text: m.content });
            } 
            else {
              parts.push({ text: m.content || "" });
            }

            return { role, parts };
          });

          let request: string | Part[];
          if (lastMessage.role === "function" || lastMessage.role === "tool" || lastMessage.functionResponse) {
            request = [{ 
              functionResponse: lastMessage.functionResponse || { 
                name: lastMessage.name || "unknown_tool", 
                response: typeof lastMessage.content === 'string' ? { result: lastMessage.content } : (lastMessage.content || {}) 
              } 
            }];
          } else {
            request = lastMessage.content || "";
          }

          const chat = model.startChat({ history });
          const result = await chat.sendMessageStream(request);

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                let hasSentAnything = false;
                for await (const chunk of result.stream) {
                  const parts = chunk.candidates?.[0]?.content?.parts;
                  if (!parts) continue;

                  for (const part of parts) {
                    if (part.text) {
                      controller.enqueue(encoder.encode(part.text));
                      hasSentAnything = true;
                    }
                    if (part.functionCall) {
                      const call = part.functionCall;
                      const serverResult = await executeTool(call.name, call.args, userId);
                      
                      const payload = JSON.stringify({ 
                        type: serverResult ? "tool_result" : "tool_call",
                        name: call.name, 
                        args: call.args, 
                        result: serverResult 
                      });
                      controller.enqueue(encoder.encode(`\n\n__JSON__:${payload}__END__\n`));
                      hasSentAnything = true;
                    }
                  }
                }
                if (!hasSentAnything) controller.enqueue(encoder.encode("Yanıt oluşturulamadı."));
                controller.close();
              } catch (e: any) {
                console.error("[STREAM ERROR]", e);
                if (e.message?.includes("quota") || e.status === 429) {
                  controller.enqueue(encoder.encode("\n\n[HATA]: API Kotası doldu, lütfen bekleyin."));
                }
                controller.close();
              }
            }
          });

          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

        } catch (err: any) {
          const status = err.status || 0;
          const msg = err.message || "";
          
          if (status === 429 || msg.includes("quota")) {
            currentKeyIndex = (keyIndex + 1) % API_KEYS.length;
            break; 
          }
          
          if (status === 500 || status === 503) {
            await sleep(500 * (modelIndex + 1));
            continue;
          }
          continue;
        }
      }
    }
    throw new Error("Tüm denemeler başarısız oldu.");

  } catch (error: any) {
    console.error(`[${traceId}] Final failure:`, error.message);
    return new Response(JSON.stringify({ error: "Sistem hatası.", details: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
