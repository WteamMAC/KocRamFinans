export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DebtList } from "@/components/dashboard/debt-list";
import { getUserCurrencyConfig } from "@/lib/currency-formatter";

export default async function DebtsPage() {
  await cookies();
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    include: {
      debts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  const currencyConfig = await getUserCurrencyConfig(user.currency);

  return (
    <div className="flex-1 space-y-10 p-8 pt-10 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-heading font-bold text-primary tracking-tight">
            Borç ve Krediler
          </h2>
          <p className="text-muted-foreground mt-1 font-medium italic opacity-80">Yükümlülüklerinizi yönetin ve ödeme planınızı takip edin.</p>
        </div>
      </div>

      <DebtList debts={user.debts} />
    </div>
  );
}
