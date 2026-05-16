"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: {
  username:      string;
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
  incomes:        { type: string; amount: number; date?: string; description?: string }[];
  expenses:       { type: string; amount: number; date?: string; isRecurring: boolean; description?: string }[];
  debts:          { type: string; amount: number; remainingInstallments?: number; description?: string }[];
  investments:    {
    type: string; symbol?: string; quantity: number;
    purchasePrice: number; currentValuation?: number; description?: string;
  }[];
  fixedAssets: { name: string; type: string; value: number }[];
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Oturum açmanız gerekiyor." };
  }

  try {
    // Sayısal alanların doğrulanması
    for (const inc of formData.incomes) if (inc.amount <= 0) throw new Error("Tüm gelir tutarları 0'dan büyük olmalıdır.");
    for (const exp of formData.expenses) if (exp.amount <= 0) throw new Error("Tüm gider tutarları 0'dan büyük olmalıdır.");
    for (const d of formData.debts) if (d.amount <= 0) throw new Error("Tüm borç tutarları 0'dan büyük olmalıdır.");
    for (const inv of formData.investments) {
      if (inv.quantity <= 0) throw new Error("Tüm yatırım miktarları 0'dan büyük olmalıdır.");
      if (inv.purchasePrice < 0) throw new Error("Yatırım alış fiyatı negatif olamaz.");
    }
    for (const fa of formData.fixedAssets) if (fa.value <= 0) throw new Error("Tüm sabit varlık değerleri 0'dan büyük olmalıdır.");

    if (!formData.username || formData.username.trim() === "") {
      return { success: false, error: "Kullanıcı adı zorunludur." };
    }

    let username = formData.username.trim();
    let email = `${username}@kocramfinans.internal`;

    try {
      const userFromClerk = await currentUser();
      if (userFromClerk?.emailAddresses?.[0]?.emailAddress) {
        email = userFromClerk.emailAddresses[0].emailAddress;
      }
    } catch (clerkErr) {
      console.error("Clerk fetch error in onboarding:", clerkErr);
    }

    // E-posta ve Kullanıcı adı çakışmalarını kontrol et
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && existingEmail.clerkUserId !== userId) {
      email = `${email.split("@")[0]}_${Math.random().toString(36).substring(2, 8)}@kocramfinans.internal`;
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername && existingUsername.clerkUserId !== userId) {
      return { success: false, error: "Bu kullanıcı adı zaten alınmış, lütfen başka bir tane deneyin." };
    }

    // Mevcut bir kullanıcı var mı kontrol et
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (user) {
      // Güncelle
      user = await prisma.user.update({
        where: { clerkUserId: userId },
        data: {
          firstName:    formData.firstName ?? user.firstName,
          lastName:     formData.lastName  ?? user.lastName,
          birthDate:    formData.birthDate ? new Date(formData.birthDate) : user.birthDate,
          gender:       formData.gender    ?? user.gender,
          currency:     formData.currency  ?? "TRY",
          country:      formData.country   ?? "TR",
          interests:    formData.interests ?? user.interests,
          familyCount:  formData.familyCount ?? 1,
          maritalStatus: formData.maritalStatus ?? "Bekar",
          hasChildren:   formData.hasChildren ?? false,
        }
      });
    } else {
      // Yeni kayıt
      user = await prisma.user.create({
        data: {
          clerkUserId:   userId,
          username,
          email,
          role:          "USER",
          firstName:     formData.firstName,
          lastName:      formData.lastName,
          birthDate:     formData.birthDate ? new Date(formData.birthDate) : null,
          gender:        formData.gender,
          currency:      formData.currency ?? "TRY",
          country:       formData.country  ?? "TR",
          interests:     formData.interests ?? [],
          familyCount:   formData.familyCount ?? 1,
          maritalStatus: formData.maritalStatus ?? "Bekar",
          hasChildren:   formData.hasChildren ?? false,
        }
      });
    }

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
    if ((formData.incomes ?? []).length > 0) {
      await prisma.income.createMany({
        data: formData.incomes.map(inc => ({
          type: inc.type, amount: Number(inc.amount) || 0,
          date: inc.date ? new Date(inc.date) : new Date(),
          description: inc.description, userId: user!.id,
        })),
      });
    }

    if ((formData.expenses ?? []).length > 0) {
      await prisma.expense.createMany({
        data: formData.expenses.map(exp => {
          const d = exp.date ? new Date(exp.date) : new Date();
          return {
            type: exp.type, amount: Number(exp.amount) || 0,
            date: d, dueDate: d.getDate(), isRecurring: exp.isRecurring ?? true,
            description: exp.description, userId: user!.id,
          };
        }),
      });
    }

    if ((formData.debts ?? []).length > 0) {
      await prisma.debt.createMany({
        data: formData.debts.map(d => ({
          type: d.type, amount: Number(d.amount) || 0,
          remainingInstallments: d.remainingInstallments,
          description: d.description, userId: user!.id,
        })),
      });
    }

    if ((formData.children ?? []).length > 0) {
      await prisma.child.createMany({
        data: (formData.children ?? []).map(c => ({
          birthDate: new Date(c.birthDate), userId: user!.id,
        })),
      });
    }

    if ((formData.investments ?? []).length > 0) {
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
            description: finalDescription, amount: finalAmount, userId: user!.id,
          };
        }),
      });
    }

    if ((formData.fixedAssets ?? []).length > 0) {
      await prisma.fixedAsset.createMany({
        data: formData.fixedAssets.map(a => ({
          name: a.name, type: a.type, value: Number(a.value) || 0, userId: user!.id,
        })),
      });
    }

    // Cache'i temizle ve Next.js router'ı tam yenile
    revalidatePath("/", "layout");
    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (err: any) {
    console.error("Complete Onboarding Database Error:", err);
    return { success: false, error: err?.message || "Veritabanı kayıt hatası." };
  }
}
