"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: {
  familyCount: number;
  maritalStatus?: string;
  marriageDate?: string;
  hasChildren?: boolean;
  children?: { birthDate: string }[];
  incomes: { type: string; amount: number; description?: string }[];
  expenses: { type: string; amount: number; dueDate?: number; isRecurring: boolean; description?: string }[];
  debts: { type: string; amount: number; remainingInstallments?: number; description?: string }[];
    investments: {
      type: string;
      symbol?: string;
      quantity: number;
      purchasePrice: number;
      currentValuation?: number;
      description?: string
    }[];
    fixedAssets: {
      name: string;
      type: string;
      value: number;
    }[];
  }) {
    const { userId } = await auth();
  
    if (!userId) {
      throw new Error("Oturum açmanız gerekiyor.");
    }
  
    // 1. Kullanıcıyı oluştur veya güncelle
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {
        familyCount: formData.familyCount,
        maritalStatus: formData.maritalStatus,
        marriageDate: formData.marriageDate ? new Date(formData.marriageDate) : null,
        hasChildren: formData.hasChildren || false,
      },
      create: {
        clerkUserId: userId,
        familyCount: formData.familyCount,
        maritalStatus: formData.maritalStatus,
        marriageDate: formData.marriageDate ? new Date(formData.marriageDate) : null,
        hasChildren: formData.hasChildren || false,
      },
    });
  
    // 2. Mevcut verileri temizle ve yeniden oluştur
    await prisma.$transaction([
      prisma.income.deleteMany({ 
        where: { 
          userId: user.id, 
          type: { notIn: ["Yatırım Satışı", "Yatırım Çekimi"] },
          NOT: {
            description: {
              contains: "satış geliri"
            }
          }
        } 
      }),
      prisma.expense.deleteMany({ where: { userId: user.id, isRecurring: true } }),
      prisma.debt.deleteMany({ where: { userId: user.id } }),
      prisma.investment.deleteMany({ where: { userId: user.id, status: "OPEN" } }),
      prisma.fixedAsset.deleteMany({ where: { userId: user.id } }),
      prisma.child.deleteMany({ where: { userId: user.id } }),
  
      prisma.income.createMany({
        data: formData.incomes.map((inc) => ({
          type: inc.type,
          amount: Number(inc.amount),
          description: inc.description,
          userId: user.id
        })),
      }),
      prisma.expense.createMany({
        data: formData.expenses.map((exp) => ({
          type: exp.type,
          amount: Number(exp.amount),
          dueDate: exp.dueDate,
          isRecurring: exp.isRecurring,
          description: exp.description,
          userId: user.id
        })),
      }),
      prisma.debt.createMany({
        data: formData.debts.map((debt) => ({
          type: debt.type,
          amount: Number(debt.amount),
          remainingInstallments: debt.remainingInstallments,
          description: debt.description,
          userId: user.id
        })),
      }),
      prisma.child.createMany({
        data: (formData.children || []).map((child) => ({
          birthDate: new Date(child.birthDate),
          userId: user.id
        })),
      }),
      prisma.investment.createMany({
        data: formData.investments.map((inv) => {
          let finalPurchasePrice = Number(inv.purchasePrice);
          let finalAmount = Number(inv.quantity) * finalPurchasePrice;
          let finalDescription = inv.description;

          if (inv.type === "BES" || inv.type === "FAIZ") {
            const originalDesc = inv.description || "";
            const rate = Number(inv.purchasePrice) || 0;
            finalDescription = JSON.stringify({ rate, originalDescription: originalDesc });
            finalPurchasePrice = 1;
            finalAmount = Number(inv.quantity);
          }

          return {
            type: inv.type,
            symbol: inv.symbol,
            quantity: Number(inv.quantity),
            purchasePrice: finalPurchasePrice,
            currentValuation: inv.currentValuation ? Number(inv.currentValuation) : null,
            description: finalDescription,
            amount: finalAmount,
            userId: user.id,
          };
        }),
      }),
      prisma.fixedAsset.createMany({
        data: formData.fixedAssets.map((asset) => ({
          name: asset.name,
          type: asset.type,
          value: Number(asset.value),
          userId: user.id,
        })),
      }),
    ]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
