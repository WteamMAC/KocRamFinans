import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bot, ShieldCheck, Sparkles, TrendingUp, Shield, Headphones } from "lucide-react";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans antialiased">
      {/* TopAppBar */}
      <header className="bg-[#faf9f6]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#c4c6d2]/30">
        <div className="flex justify-between items-center max-w-[1280px] mx-auto px-4 md:px-16 py-4">
          <Link className="flex items-center gap-2" href="/">
            <BarChart3 className="h-8 w-8 text-[#fed65b] fill-[#fed65b]" />
            <span className="text-2xl font-heading font-bold text-[#001b44]">Koç Ai</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-[#434750] hover:text-[#001b44] transition-colors text-sm font-medium" href="#features">Özellikler</a>
            <a className="text-[#434750] hover:text-[#001b44] transition-colors text-sm font-medium" href="#solutions">Çözümler</a>
            <a className="text-[#434750] hover:text-[#001b44] transition-colors text-sm font-medium" href="#about">Hakkımızda</a>
          </nav>
          <div className="flex items-center gap-4">
            {!userId ? (
              <>
                <SignInButton mode="modal">
                  <button className="hidden md:block text-[#434750] hover:text-[#001b44] transition-colors text-sm font-semibold">
                    Giriş Yap
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-[#001b44] text-white hover:bg-[#002f6c] rounded-full transition-all px-6 py-2.5 text-sm font-semibold">
                    Hemen Başla
                  </button>
                </SignUpButton>
              </>
            ) : (
              <Link href="/dashboard">
                <button className="bg-[#001b44] text-white hover:bg-[#002f6c] rounded-full transition-all px-6 py-2.5 text-sm font-semibold">
                  Panele Git
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-4 md:px-16 text-center max-w-[1280px] mx-auto flex flex-col items-center">
          {/* Social Proof Badge */}
          <div className="flex items-center justify-center gap-3 bg-[#f4f3f1] border border-[#c4c6d2]/30 rounded-full py-1.5 px-4 mb-8">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#f4f3f1] bg-slate-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-[#f4f3f1] bg-slate-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-[#f4f3f1] bg-slate-400"></div>
            </div>
            <div className="flex items-center gap-1 text-[#fed65b]">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#434750]">4.5+ Puan / 10.000+ Kullanıcı</span>
          </div>

          {/* Headline & Sub */}
          <h1 className="font-heading text-4xl md:text-7xl text-[#001b44] max-w-4xl mx-auto mb-6 leading-[1.1] tracking-tight">
            Finansal Geleceğinizi Yapay Zeka ile Şekillendirin
          </h1>
          <p className="text-lg md:text-xl text-[#434750] max-w-2xl mx-auto mb-10 leading-relaxed">
            Koç Ai ile veriye dayalı, güvenli ve akıllı yatırım kararları alın. Geleceğinizi bugünden planlayın.
          </p>

          {/* CTA */}
          {!userId ? (
            <SignUpButton mode="modal">
              <button className="bg-[#001b44] text-white rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#001b44]/90 transition-all shadow-lg text-lg font-semibold">
                Hemen Başlayın
                <ArrowRight className="h-5 w-5" />
              </button>
            </SignUpButton>
          ) : (
            <Link href="/dashboard">
              <button className="bg-[#001b44] text-white rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#001b44]/90 transition-all shadow-lg text-lg font-semibold">
                Panele Git
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          )}

          {/* Device Mockup placeholder */}
          <div className="mt-20 relative w-full max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-[#fed65b]/10 blur-[100px] rounded-full w-3/4 h-3/4 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 -z-10"></div>
            <div className="bg-white p-4 rounded-[40px] shadow-2xl border-4 border-white overflow-hidden aspect-[16/9] flex items-center justify-center">
               <div className="w-full h-full bg-slate-100 rounded-[32px] flex flex-col p-8 items-center justify-center text-[#001b44]/20">
                  <Bot className="h-24 w-24 mb-4" />
                  <p className="font-heading text-2xl font-bold italic">Koç Ai Dashboard Mockup</p>
               </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 px-4 md:px-16 max-w-[1280px] mx-auto bg-[#f4f3f1] rounded-[40px]">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl text-[#001b44] mb-4">Neden Koç Ai?</h2>
            <p className="text-[#434750] text-lg max-w-2xl mx-auto">Güçlü algoritmalar ve Koç Topluluğu güvencesiyle finansal kararlarınızı optimize edin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[#c4c6d2]/20 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-14 h-14 bg-[#002f6c] text-white rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-[#001b44] mb-3">Akıllı Analiz</h3>
              <p className="text-[#434750] leading-relaxed">
                Makine öğrenimi modellerimiz, piyasa trendlerini gerçek zamanlı olarak analiz eder ve size en uygun yatırım stratejilerini sunar.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[#c4c6d2]/20 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-14 h-14 bg-[#fed65b] text-[#745c00] rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-[#001b44] mb-3">Güvenli Altyapı</h3>
              <p className="text-[#434750] leading-relaxed">
                Verileriniz ve varlıklarınız, bankacılık standartlarında şifreleme ve gelişmiş güvenlik protokolleri ile korunur.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[#c4c6d2]/20 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-14 h-14 bg-[#e3e2e0] text-[#1a1c1a] rounded-xl flex items-center justify-center mb-6">
                <Headphones className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-[#001b44] mb-3">7/24 Destek</h3>
              <p className="text-[#434750] leading-relaxed">
                Uzman finansal danışmanlarımız ve yapay zeka asistanımız, ihtiyaç duyduğunuz her an yanınızda.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-24 px-4 md:px-16 text-center">
          <p className="text-xs font-bold text-[#747781] uppercase tracking-[0.2em] mb-6">Güvenin Adresi</p>
          <h2 className="font-heading text-4xl text-[#001b44] mb-10">Bir Koç Topluluğu Kuruluşudur</h2>
          <div className="flex items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
             <BarChart3 className="h-16 w-16" />
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-[#c4c6d2]/50 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 md:px-16 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-heading font-bold text-[#001b44]">
            <BarChart3 className="h-6 w-6 text-[#fed65b] fill-[#fed65b]" />
            <span>Koç Ai</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-8 text-sm text-[#434750]">
            <a className="hover:text-[#001b44] underline decoration-[#c4c6d2] underline-offset-4" href="#">Gizlilik</a>
            <a className="hover:text-[#001b44] underline decoration-[#c4c6d2] underline-offset-4" href="#">Koşullar</a>
            <a className="hover:text-[#001b44] underline decoration-[#c4c6d2] underline-offset-4" href="#">KVKK</a>
          </nav>
          <p className="text-sm text-[#434750]">
            © 2026 Koç Ai. Koç Topluluğu Kuruluşudur.
          </p>
        </div>
      </footer>
    </div>
  );
}
