import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/profile-settings-form";

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
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-primary">Profil Ayarları</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Bilgilerini düzenle — değişiklik yaptığında Kaydet butonu aktif olur.
          </p>
        </div>
        <ProfileSettingsForm initialData={initialData} />
      </div>
    </div>
  );
}
