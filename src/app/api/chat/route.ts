
import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MASTER_PROMPT, FUNCTION_DECLARATIONS } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// API Key yönetimi
const getApiKey = () => {
  return process.env.GEMINI_API_KEY || "";
};

async function executeTool(name: string, args: any, userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { incomes: true, expenses: true, debts: true, investments: true }
  });

  if (!user) return { error: "Kullanıcı bulunamadı." };

  try {
    switch (name) {
      case "getFinancialSummary":
        return {
          totalIncome: user.incomes.reduce((acc, i) => acc + i.amount, 0),
          totalExpense: user.expenses.reduce((acc, i) => acc + i.amount, 0),
          totalDebt: user.debts.reduce((acc, i) => acc + i.amount, 0),
          totalInvestment: user.investments.reduce((acc, i) => acc + i.amount, 0),
          recentIncomes: user.incomes.slice(-5),
          recentExpenses: user.expenses.slice(-5),
          investments: user.investments.map(i => ({ symbol: i.symbol, qty: i.quantity, avgPrice: i.purchasePrice }))
        };

      case "addIncome":
        await prisma.income.create({
          data: { userId: user.id, type: args.type, amount: Number(args.amount), description: args.description }
        });
        revalidatePath("/dashboard");
        return { success: true, message: "Gelir başarıyla eklendi." };

      case "addExpense":
        await prisma.expense.create({
          data: { 
            userId: user.id, 
            type: args.type, 
            amount: Number(args.amount), 
            isRecurring: args.isRecurring || false, 
            description: args.description 
          }
        });
        revalidatePath("/dashboard");
        return { success: true, message: "Gider başarıyla eklendi." };

      case "addDebt":
        await prisma.debt.create({
          data: { 
            userId: user.id, 
            type: args.type, 
            amount: Number(args.amount), 
            remainingInstallments: args.remainingInstallments, 
            description: args.description 
          }
        });
        revalidatePath("/dashboard");
        return { success: true, message: "Borç başarıyla eklendi." };

      case "addInvestment":
        await prisma.investment.create({
          data: { 
            userId: user.id, 
            type: args.type, 
            symbol: args.symbol.toUpperCase(), 
            quantity: Number(args.quantity), 
            purchasePrice: Number(args.purchasePrice),
            amount: Number(args.quantity) * Number(args.purchasePrice),
            description: args.description,
            status: "OPEN",
            transactionType: "BUY"
          }
        });
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/assets");
        return { success: true, message: "Yatırım başarıyla eklendi." };

      default:
        return { error: "Bilinmeyen araç." };
    }
  } catch (error: any) {
    console.error("Tool Execution Error:", error);
    return { error: "İşlem sırasında bir hata oluştu: " + error.message };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const apiKey = getApiKey();
    if (!apiKey) return new Response("API Key missing", { status: 500 });

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: MASTER_PROMPT,
      tools: [
        { functionDeclarations: FUNCTION_DECLARATIONS as any },
        { 
          // @ts-ignore
          googleSearchRetrieval: { 
            dynamicRetrievalConfig: { 
              mode: DynamicRetrievalMode.MODE_DYNAMIC, 
              dynamicThreshold: 0.3 
            } 
          } 
        }
      ]
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })),
    });

    const result = await chat.sendMessageStream(lastMessage.content);
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (!parts) continue;

            for (const part of parts) {
              if (part.text) {
                controller.enqueue(encoder.encode(part.text));
              }
              
              if (part.functionCall) {
                const { name, args } = part.functionCall;
                const toolResult = await executeTool(name, args, userId);
                
                // Araca cevabı gönderip devam ediyoruz
                const followUp = await chat.sendMessage([{
                  functionResponse: {
                    name,
                    response: toolResult
                  }
                }]);
                
                const responseText = followUp.response.text();
                controller.enqueue(encoder.encode(responseText));
              }
            }
          }
          controller.close();
        } catch (e) {
          console.error("Stream Error:", e);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
