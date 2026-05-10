import { OnboardingForm } from "@/components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="relative w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
