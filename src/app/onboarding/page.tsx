import { OnboardingForm } from "@/components/onboarding-form";

export const metadata = {
  title: "Profil Kurulumu | Koç Ram Finans",
  description: "Kişisel finans yolculuğuna başlamak için birkaç bilgini paylaş.",
};

export default function OnboardingPage() {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-12 px-4"
      style={{ background: "#F5EDD8" }}
    >
      {/* Dot pattern — 404 ile aynı */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8C5000 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Soft amber glow corners */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #f18d02 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #8c5000 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
