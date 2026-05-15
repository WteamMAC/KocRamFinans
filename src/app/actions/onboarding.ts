"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: {
  // Yeni profil alanları
  firstName?:    string;
  lastName?:     string;
  birthDate?:    string;
  gender?:       string;
  currency?:     string;
  country?:      string;
  interests?:    string[];
  // Legacy alanlar (geriye uyumluluk)
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

  const userFromClerk = await currentUser();
  const username = userFromClerk?.username || userFromClerk?.emailAddresses[0]?.emailAddress.split("@")[0];

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
      familyCount:  formData.familyCount,
      maritalStatus: formData.maritalStatus,
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
      familyCount:  formData.familyCount,
      maritalStatus: formData.maritalStatus,
      marriageDate:  formData.marriageDate ? new Date(formData.marriageDate) : null,
      hasChildren:   formData.hasChildren ?? false,
    },
  });

  // Mevcut verileri temizle ve yeniden oluştur
  await prisma.$transaction([
    prisma.income.deleteMany({
      where: { userId: user.id, type: { notIn: ["Yatırım Satışı", "Yatırım Çekimi"] } },
    }),
    prisma.expense.deleteMany({ where: { userId: user.id, isRecurring: true } }),
    prisma.debt.deleteMany({ where: { userId: user.id } }),
    prisma.investment.deleteMany({ where: { userId: user.id, status: "OPEN" } }),
    prisma.fixedAsset.deleteMany({ where: { userId: user.id } }),
    prisma.child.deleteMany({ where: { userId: user.id } }),

    prisma.income.createMany({
      data: formData.incomes.map(inc => ({
        type: inc.type, amount: Number(inc.amount),
        description: inc.description, userId: user.id,
      })),
    }),
    prisma.expense.createMany({
      data: formData.expenses.map(exp => ({
        type: exp.type, amount: Number(exp.amount),
        dueDate: exp.dueDate, isRecurring: exp.isRecurring,
        description: exp.description, userId: user.id,
      })),
    }),
    prisma.debt.createMany({
      data: formData.debts.map(d => ({
        type: d.type, amount: Number(d.amount),
        remainingInstallments: d.remainingInstallments,
        description: d.description, userId: user.id,
      })),
    }),
    prisma.child.createMany({
      data: (formData.children ?? []).map(c => ({
        birthDate: new Date(c.birthDate), userId: user.id,
      })),
    }),
    prisma.investment.createMany({
      data: formData.investments.map(inv => {
        let finalPurchasePrice = Number(inv.purchasePrice);
        let finalAmount = Number(inv.quantity) * finalPurchasePrice;
        let finalDescription = inv.description;
        if (inv.type === "BES" || inv.type === "FAIZ") {
          const rate = Number(inv.purchasePrice) || 0;
          finalDescription = JSON.stringify({ rate, originalDescription: inv.description || "" });
          finalPurchasePrice = 1;
          finalAmount = Number(inv.quantity);
        }
        return {
          type: inv.type, symbol: inv.symbol,
          quantity: Number(inv.quantity), purchasePrice: finalPurchasePrice,
          currentValuation: inv.currentValuation ? Number(inv.currentValuation) : null,
          description: finalDescription, amount: finalAmount, userId: user.id,
        };
      }),
    }),
    prisma.fixedAsset.createMany({
      data: formData.fixedAssets.map(a => ({
        name: a.name, type: a.type, value: Number(a.value), userId: user.id,
      })),
    }),
  ]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
