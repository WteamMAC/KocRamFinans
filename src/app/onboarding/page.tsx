import { OnboardingForm } from "@/components/onboarding-form";

export const metadata = {
  title: "Profil Kurulumu | Koç Ram Finans",
  description: "Kişisel finans yolculuğuna başlamak için birkaç bilgini paylaş.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4 py-12">
      {/* Arka plan dekorasyon */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="relative w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
