import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      incomes: true,
      expenses: true,
      debts: true,
      investments: true,
    },
  }) as any;

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  // Prisma verisini OnboardingForm'un beklediği formata dönüştür
  const initialData = {
    familyCount: user.familyCount,
    incomes: user.incomes.map((i: any) => ({ type: i.type, amount: i.amount, description: i.description || undefined })),
    expenses: user.expenses.map((e: any) => ({ 
      type: e.type, 
      amount: e.amount, 
      dueDate: e.dueDate || undefined, 
      isRecurring: e.isRecurring,
      description: e.description || undefined 
    })),
    debts: user.debts.map((d: any) => ({ 
      type: d.type, 
      amount: d.amount, 
      remainingInstallments: d.remainingInstallments || undefined,
      description: d.description || undefined 
    })),
    investments: user.investments.map((inv: any) => ({ 
      type: inv.type, 
      amount: inv.amount, 
      currentValuation: inv.currentValuation || undefined,
      description: inv.description || undefined 
    })),
  };

  return (
    <div className="p-8 pt-6 min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Bilgileri Düzenle
          </h2>
          <p className="text-muted-foreground mt-1">
            Finansal verilerinizi güncelleyerek daha doğru analizler alabilirsiniz.
          </p>
        </div>
        <OnboardingForm initialData={initialData} isSettings={true} />
      </div>
    </div>
  );
}
