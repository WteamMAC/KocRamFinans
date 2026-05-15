"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: {
  firstName?:    string;
  lastName?:     string;
  birthDate?:    string;
  gender?:       string;
  currency?:     string;
  country?:      string;
  interests?:    string[];
  familyCount:   number;
  maritalStatus?: string;
  marriageDate?:  string;
  hasChildren?:   boolean;
  children?:      { birthDate: string }[];
  incomes:        { type: string; amount: number; description?: string }[];
  expenses:       { type: string; amount: number; dueDate?: number; isRecurring: boolean; description?: string }[];
  debts:          { type: string; amount: number; remainingInstallments?: number; description?: string }[];
  investments:    {
    type: string; symbol?: string; quantity: number;
    purchasePrice: number; currentValuation?: number; description?: string;
  }[];
  fixedAssets: { name: string; type: string; value: number }[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Oturum açmanız gerekiyor.");

  let username = "user_" + Math.random().toString(36).substring(2, 8);
  try {
    const userFromClerk = await currentUser();
    if (userFromClerk?.username) {
      username = userFromClerk.username;
    } else if (userFromClerk?.emailAddresses?.[0]?.emailAddress) {
      username = userFromClerk.emailAddresses[0].emailAddress.split("@")[0];
    }
  } catch (err) {
    console.error("Clerk fetch error:", err);
  }

  // Kullanıcıyı oluştur veya güncelle
  const user = await prisma.user.upsert({
    where:  { clerkUserId: userId },
    update: {
      username,
      firstName:    formData.firstName,
      lastName:     formData.lastName,
      birthDate:    formData.birthDate ? new Date(formData.birthDate) : null,
      gender:       formData.gender,
      currency:     formData.currency ?? "TRY",
      country:      formData.country  ?? "TR",
      interests:    formData.interests ?? [],
      familyCount:  formData.familyCount ?? 1,
      maritalStatus: formData.maritalStatus ?? "Bekar",
      marriageDate:  formData.marriageDate ? new Date(formData.marriageDate) : null,
      hasChildren:   formData.hasChildren ?? false,
    },
    create: {
      clerkUserId: userId,
      username,
      firstName:    formData.firstName,
      lastName:     formData.lastName,
      birthDate:    formData.birthDate ? new Date(formData.birthDate) : null,
      gender:       formData.gender,
      currency:     formData.currency ?? "TRY",
      country:      formData.country  ?? "TR",
      interests:    formData.interests ?? [],
      familyCount:  formData.familyCount ?? 1,
      maritalStatus: formData.maritalStatus ?? "Bekar",
      marriageDate:  formData.marriageDate ? new Date(formData.marriageDate) : null,
      hasChildren:   formData.hasChildren ?? false,
    },
  });

  // Mevcut ilişkili verileri temizle
  await prisma.income.deleteMany({
    where: { userId: user.id, type: { notIn: ["Yatırım Satışı", "Yatırım Çekimi"] } },
  });
  await prisma.expense.deleteMany({ where: { userId: user.id, isRecurring: true } });
  await prisma.debt.deleteMany({ where: { userId: user.id } });
  await prisma.investment.deleteMany({ where: { userId: user.id, status: "OPEN" } });
  await prisma.fixedAsset.deleteMany({ where: { userId: user.id } });
  await prisma.child.deleteMany({ where: { userId: user.id } });

  // Yeni ilişkili verileri ekle
  if (formData.incomes?.length > 0) {
    await prisma.income.createMany({
      data: formData.incomes.map(inc => ({
        type: inc.type, amount: Number(inc.amount) || 0,
        description: inc.description, userId: user.id,
      })),
    });
  }

  if (formData.expenses?.length > 0) {
    await prisma.expense.createMany({
      data: formData.expenses.map(exp => ({
        type: exp.type, amount: Number(exp.amount) || 0,
        dueDate: exp.dueDate, isRecurring: exp.isRecurring,
        description: exp.description, userId: user.id,
      })),
    });
  }

  if (formData.debts?.length > 0) {
    await prisma.debt.createMany({
      data: formData.debts.map(d => ({
        type: d.type, amount: Number(d.amount) || 0,
        remainingInstallments: d.remainingInstallments,
        description: d.description, userId: user.id,
      })),
    });
  }

  if ((formData.children ?? []).length > 0) {
    await prisma.child.createMany({
      data: (formData.children ?? []).map(c => ({
        birthDate: new Date(c.birthDate), userId: user.id,
      })),
    });
  }

  if (formData.investments?.length > 0) {
    await prisma.investment.createMany({
      data: formData.investments.map(inv => {
        let finalPurchasePrice = Number(inv.purchasePrice) || 0;
        let finalAmount = Number(inv.quantity || 0) * finalPurchasePrice;
        let finalDescription = inv.description;
        if (inv.type === "BES" || inv.type === "FAIZ") {
          const rate = Number(inv.purchasePrice) || 0;
          finalDescription = JSON.stringify({ rate, originalDescription: inv.description || "" });
          finalPurchasePrice = 1;
          finalAmount = Number(inv.quantity || 0);
        }
        return {
          type: inv.type, symbol: inv.symbol,
          quantity: Number(inv.quantity || 0), purchasePrice: finalPurchasePrice,
          currentValuation: inv.currentValuation ? Number(inv.currentValuation) : null,
          description: finalDescription, amount: finalAmount, userId: user.id,
        };
      }),
    });
  }

  if (formData.fixedAssets?.length > 0) {
    await prisma.fixedAsset.createMany({
      data: formData.fixedAssets.map(a => ({
        name: a.name, type: a.type, value: Number(a.value) || 0, userId: user.id,
      })),
    });
  }

  // Cache'i temizle
  revalidatePath("/dashboard", "layout");
  revalidatePath("/", "layout");

  return { success: true };
}
