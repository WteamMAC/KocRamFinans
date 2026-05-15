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
  });

  if (!user) {
    redirect("/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12">
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary font-heading">
          Profil Bilgilerini Güncelle
        </h2>
        <p className="text-muted-foreground mt-1">
          Tercihlerini ve ilgi alanlarını istediğin zaman değiştirebilirsin.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
