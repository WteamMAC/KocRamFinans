import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bot, ShieldCheck, Sparkles, TrendingUp, Shield, Headphones } from "lucide-react";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans antialiased">
      {/* TopAppBar */}
      <header className="bg-[#f8f9fa]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#dbc2b0]/30 shadow-ambient-low">
        <div className="flex justify-between items-center max-w-[1280px] mx-auto px-4 md:px-16 py-4">
          <Link className="flex items-center gap-2" href="/">
            <BarChart3 className="h-8 w-8 text-[#efe440] fill-[#efe440]" />
            <span className="text-2xl font-heading font-bold text-[#8c5000]">Koç Ram Finans</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-medium" href="#features">Özellikler</a>
            <a className="text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-medium" href="#solutions">Çözümler</a>
            <a className="text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-medium" href="#about">Hakkımızda</a>
          </nav>
          <div className="flex items-center gap-4">
            {!userId ? (
              <>
                <SignInButton mode="modal">
                  <button className="hidden md:block text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-semibold">
                    Giriş Yap
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-[#8c5000] text-white hover:bg-[#6e3f00] rounded-full transition-all px-6 py-2.5 text-sm font-semibold shadow-ambient-medium">
                    Hemen Başla
                  </button>
                </SignUpButton>
              </>
            ) : (
              <Link href="/dashboard">
                <button className="bg-[#8c5000] text-white hover:bg-[#6e3f00] rounded-full transition-all px-6 py-2.5 text-sm font-semibold shadow-ambient-medium">
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
          <div className="flex items-center justify-center gap-3 bg-[#edeeef] border border-[#dbc2b0]/30 rounded-full py-1.5 px-4 mb-8 shadow-ambient-low">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#edeeef] bg-slate-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-[#edeeef] bg-slate-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-[#edeeef] bg-slate-400"></div>
            </div>
            <div className="flex items-center gap-1 text-[#efe440]">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#554336]">4.5+ Puan / 10.000+ Kullanıcı</span>
          </div>

          {/* Headline & Sub */}
          <h1 className="font-heading text-4xl md:text-7xl text-[#8c5000] max-w-4xl mx-auto mb-6 leading-[1.1] tracking-tight">
            Finansal Geleceğinizi Yapay Zeka ile Şekillendirin
          </h1>
          <p className="text-lg md:text-xl text-[#554336] max-w-2xl mx-auto mb-10 leading-relaxed italic opacity-80">
            Koç Ram Finans ile veriye dayalı, güvenli ve akıllı yatırım kararları alın. Geleceğinizi bugünden planlayın.
          </p>

          {/* CTA */}
          {!userId ? (
            <SignUpButton mode="modal">
              <button className="bg-[#8c5000] text-white rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#6e3f00] transition-all shadow-ambient-high text-lg font-semibold">
                Hemen Başlayın
                <ArrowRight className="h-5 w-5" />
              </button>
            </SignUpButton>
          ) : (
            <Link href="/dashboard">
              <button className="bg-[#8c5000] text-white rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#6e3f00] transition-all shadow-ambient-high text-lg font-semibold">
                Panele Git
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          )}

          {/* Device Mockup placeholder */}
          <div className="mt-20 relative w-full max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-[#efe440]/10 blur-[100px] rounded-full w-3/4 h-3/4 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 -z-10"></div>
            <div className="bg-white p-4 rounded-[40px] shadow-ambient-high border-4 border-white overflow-hidden aspect-[16/9] flex items-center justify-center">
               <div className="w-full h-full bg-[#f8f9fa] rounded-[32px] flex flex-col p-8 items-center justify-center text-[#8c5000]/20">
                  <Bot className="h-24 w-24 mb-4" />
                  <p className="font-heading text-2xl font-bold italic">Koç Ram Finans Dashboard Mockup</p>
               </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 px-4 md:px-16 max-w-[1280px] mx-auto bg-[#f3f4f5] rounded-[40px] shadow-ambient-low">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl text-[#8c5000] mb-4">Neden Koç Ram Finans?</h2>
            <p className="text-[#554336] text-lg max-w-2xl mx-auto opacity-80">Güçlü algoritmalar ve profesyonel koçluk güvencesiyle finansal kararlarınızı optimize edin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-[24px] p-8 shadow-ambient-medium border border-[#dbc2b0]/20 hover:shadow-ambient-high transition-shadow relative overflow-hidden group">
              <div className="w-14 h-14 bg-[#8c5000] text-white rounded-xl flex items-center justify-center mb-6 shadow-ambient-low">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-[#8c5000] mb-3">Akıllı Analiz</h3>
              <p className="text-[#554336] leading-relaxed opacity-90">
                Makine öğrenimi modellerimiz, piyasa trendlerini gerçek zamanlı olarak analiz eder ve size en uygun yatırım stratejilerini sunar.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 shadow-ambient-medium border border-[#dbc2b0]/20 hover:shadow-ambient-high transition-shadow relative overflow-hidden group">
              <div className="w-14 h-14 bg-[#efe440] text-[#6a6500] rounded-xl flex items-center justify-center mb-6 shadow-ambient-low">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-[#8c5000] mb-3">Güvenli Altyapı</h3>
              <p className="text-[#554336] leading-relaxed opacity-90">
                Verileriniz ve varlıklarınız, bankacılık standartlarında şifreleme ve gelişmiş güvenlik protokolleri ile korunur.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 shadow-ambient-medium border border-[#dbc2b0]/20 hover:shadow-ambient-high transition-shadow relative overflow-hidden group">
              <div className="w-14 h-14 bg-[#edeeef] text-[#191c1d] rounded-xl flex items-center justify-center mb-6 shadow-ambient-low">
                <Headphones className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-[#8c5000] mb-3">7/24 Destek</h3>
              <p className="text-[#554336] leading-relaxed opacity-90">
                Uzman finansal danışmanlarımız ve yapay zeka asistanımız, ihtiyaç duyduğunuz her an yanınızda.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-24 px-4 md:px-16 text-center">
          <p className="text-xs font-bold text-[#554336] uppercase tracking-[0.2em] mb-6 opacity-60">Güvenin Adresi</p>
          <h2 className="font-heading text-4xl text-[#8c5000] mb-10">Profesyonel Finansal Koçluk</h2>
          <div className="flex items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
             <BarChart3 className="h-16 w-16 text-[#8c5000]" />
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-[#dbc2b0]/50 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 md:px-16 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-heading font-bold text-[#8c5000]">
            <BarChart3 className="h-6 w-6 text-[#efe440] fill-[#efe440]" />
            <span>Koç Ram Finans</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-8 text-sm text-[#554336]">
            <a className="hover:text-[#8c5000] underline decoration-[#dbc2b0] underline-offset-4 transition-colors" href="#">Gizlilik</a>
            <a className="hover:text-[#8c5000] underline decoration-[#dbc2b0] underline-offset-4 transition-colors" href="#">Koşullar</a>
            <a className="hover:text-[#8c5000] underline decoration-[#dbc2b0] underline-offset-4 transition-colors" href="#">KVKK</a>
          </nav>
          <p className="text-sm text-[#554336] opacity-80">
            © 2026 Koç Ram Finans. Tüm Hakları Saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
