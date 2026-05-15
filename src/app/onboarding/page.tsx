import { OnboardingForm } from "@/components/onboarding-form";

export const metadata = {
  title: "Profil Kurulumu | Koç Ram Finans",
  description: "Kişisel finans yolculuğuna başlamak için birkaç bilgini paylaş.",
};

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-12 px-4 bg-[#F5EDD8] dark:bg-[#120d0a] transition-colors duration-300">
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8C5000 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Soft amber glow corners */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none bg-[radial-gradient(circle,#f18d02_0%,transparent_70%)] dark:opacity-30" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 pointer-events-none bg-[radial-gradient(circle,#8c5000_0%,transparent_70%)] dark:opacity-25" />

      <div className="relative z-10 w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
