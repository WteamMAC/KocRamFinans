import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bot, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <Bot className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Finans Koç AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          {!userId ? (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-sm font-medium">Giriş Yap</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="text-sm font-medium">Hemen Başla</Button>
              </SignUpButton>
            </>
          ) : (
            <Link href="/dashboard">
              <Button className="text-sm font-medium">Panele Git</Button>
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-blue-50/50 to-transparent opacity-70"></div>
          <div className="container px-4 md:px-6 relative mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-4 animate-bounce">
                <Sparkles className="mr-1 h-3 w-3" />
                Yapay Zeka Destekli Finansal Özgürlük
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
                Paranızı <span className="text-primary">Akıllıca</span> Yönetin, Geleceğinizi İnşa Edin
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Gelir, gider ve yatırımlarınızı Gemini AI ile analiz edin. Size özel finansal koçunuz her adımda yanınızda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] justify-center mt-8">
                {!userId ? (
                  <SignUpButton mode="modal">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto rounded-full shadow-xl hover:shadow-primary/20 transition-all group">
                      Ücretsiz Kayıt Ol
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </SignUpButton>
                ) : (
                  <Link href="/dashboard">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto rounded-full shadow-xl hover:shadow-primary/20 transition-all group">
                      Danışmanına Sor
                      <Bot className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl hover:bg-slate-50 transition-colors">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">AI Finansal Koç</h3>
                <p className="text-gray-500">Harcamalarinizi analiz eder ve "Bu ay telefon almali miyim?" gibi sorulariniza rasyonel cevaplar verir.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl hover:bg-slate-50 transition-colors">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold">Portföy Yönetimi</h3>
                <p className="text-gray-500">Altın, kripto, döviz ve BIST yatırımlarınızı tek bir yerden takip edin ve yapay zeka ile optimize edin.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl hover:bg-slate-50 transition-colors">
                <div className="p-4 bg-green-100 rounded-2xl">
                  <ShieldCheck className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold">Borç Ödeme Planı</h3>
                <p className="text-gray-500">Kart borçlarınızı ve kredilerinizi en hızlı şekilde kapatmanız için size özel ödeme stratejileri sunar.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-slate-50">
        <p className="text-xs text-center text-gray-500">© 2026 Finans Koç AI. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
