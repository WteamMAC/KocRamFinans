import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { name, args } = await req.json();

    if (!name || !args) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    switch (name) {
      case "addIncome":
        await prisma.income.create({
          data: {
            userId: user.id,
            type: args.type || "Other",
            amount: parseFloat(args.amount) || 0,
            description: args.description || "Yapay Zeka tarafından eklendi",
          }
        });
        break;

      case "addExpense":
        await prisma.expense.create({
          data: {
            userId: user.id,
            type: args.type || "Other",
            amount: parseFloat(args.amount) || 0,
            isRecurring: args.isRecurring ?? false,
            description: args.description || "Yapay Zeka tarafından eklendi",
          }
        });
        break;

      case "addDebt":
        await prisma.debt.create({
          data: {
            userId: user.id,
            type: args.type || "Other",
            amount: parseFloat(args.amount) || 0,
            description: args.description || "Yapay Zeka tarafından eklendi",
          }
        });
        break;

      case "addInvestment":
        await prisma.investment.create({
          data: {
            userId: user.id,
            type: args.type || "Other",
            amount: parseFloat(args.amount) || 0,
            description: args.description || "Yapay Zeka tarafından eklendi",
          }
        });
        break;

      default:
        return NextResponse.json({ error: "Geçersiz işlem adı" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "İşlem başarıyla tamamlandı." });

  } catch (error: any) {
    console.error("[FINANCE_ACTION_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatası", details: error.message }, { status: 500 });
  }
}
