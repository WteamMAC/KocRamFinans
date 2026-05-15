import { OnboardingForm } from "@/components/onboarding-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Profil Kurulumu | Koç Ram Finans",
  description: "Kişisel finans yolculuğuna başlamak için birkaç bilgini paylaş.",
};

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-12 px-4 bg-background transition-colors duration-300">
      {/* Sağ üstte Karanlık Mod Butonu */}
      <div className="absolute top-6 right-6 z-50 animate-in fade-in duration-500">
        <ThemeToggle />
      </div>

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8C5000 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 w-full max-w-xl mx-auto">
        <OnboardingForm />
      </div>
    </div>
  );
}
