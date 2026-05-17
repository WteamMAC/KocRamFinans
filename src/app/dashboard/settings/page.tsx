import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeleteAccountSection } from "@/components/dashboard/delete-account-section";

export const metadata = {
  title: "Profil Ayarları | Koç Ram Finans",
};

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) { redirect("/"); return null; }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) { redirect("/onboarding"); return null; }

  const initialData = {
    firstName: user.firstName ?? "",
    lastName:  user.lastName  ?? "",
    birthDate: user.birthDate ? user.birthDate.toISOString().split("T")[0] : "",
    gender:    user.gender    ?? "male",
    currency:  user.currency  ?? "TRY",
    country:   user.country   ?? "TR",
    interests: user.interests ?? [],
  };

  return (
    <div className="relative min-h-screen py-10 overflow-hidden bg-background transition-colors duration-300">
      {/* Sağ üstte Karanlık Mod Butonu */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8C5000 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-8">
        <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-sm transition-colors duration-300">
          <h1 className="text-3xl font-black font-heading tracking-tight text-primary drop-shadow-sm">
            Profil Ayarları
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold">
            Bilgilerini tek bir ekranda kolayca yönet — değişiklik yaptığında Kaydet butonu aktif olur.
          </p>
        </div>
        <ProfileSettingsForm initialData={initialData} />
        <DeleteAccountSection />
      </div>
    </div>
  );
}
