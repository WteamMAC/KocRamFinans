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
    <div 
      className="relative min-h-screen py-10 overflow-hidden"
      style={{ background: "#F5EDD8" }}
    >
      {/* Dot pattern — 404 ile aynı */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8C5000 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-8">
        <div className="bg-[#fbf9f4] border border-[#8C5000]/15 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-black font-heading tracking-tight text-[#5a3100] drop-shadow-sm">
            Profil Ayarları
          </h1>
          <p className="text-[#887364] mt-1 text-sm font-bold">
            Bilgilerini tek bir ekranda kolayca yönet — değişiklik yaptığında Kaydet butonu aktif olur.
          </p>
        </div>
        <ProfileSettingsForm initialData={initialData} />
      </div>
    </div>
  );
}
