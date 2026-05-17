import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Headphones,
  Wallet,
  Coins,
  History,
  Calendar,
  CheckCircle2,
  Users,
  Handshake,
  BrainCircuit,
  MessagesSquare,
  ArrowUpRight,
  TrendingDown,
  Clock,
  ChevronDown,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ClearTerms } from "@/components/auth/clear-terms";

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" 
      clipRule="evenodd" 
    />
  </svg>
);

export default async function LandingPage() {
  const { userId } = await auth();

  // Eğer kullanıcı giriş yapmışsa, önce kurulum kontrolüne (onboarding) gönderelim
  if (userId) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-accent/30">
      <ClearTerms />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-16 md:pt-24 pb-32 overflow-hidden px-6 md:px-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background pointer-events-none -z-10"></div>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 flex flex-col items-start gap-8 z-10 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border border-accent/30 shadow-ambient-low">
                <Sparkles className="h-4 w-4" />
                <span>Finansal Özgürlüğe İlk Adım</span>
              </div>
              <h1 className="font-heading text-5xl md:text-7xl text-foreground leading-[1.1] font-bold tracking-tight">
                Geleceğinizi Güvence Altına Alın, <span className="text-primary">Stresi Geride Bırakın.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed opacity-90 font-medium">
                Koç Ram Finans ile karmaşık finansal kararları basitleştiriyoruz. Dostane, şeffaf ve tamamen size özel koçluk yaklaşımımızla paranızı yönetmeyi öğrenin ve büyütün.
              </p>

            </div>
            
            <div className="md:col-span-5 relative mt-12 md:mt-0 flex justify-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[120px] opacity-40 rounded-full -z-10"></div>
              <div className="relative w-full max-w-[440px] aspect-square rounded-[40px] bg-card shadow-ambient-high flex items-center justify-center p-12 border-t-8 border-primary">
                <img 
                  alt="Koç Ram Finans mascot" 
                  className="w-full h-auto object-contain drop-shadow-2xl" 
                  src="/mascot.png" 
                />
                {/* Floating Badge */}
                <div className="absolute -bottom-4 md:-bottom-8 -left-4 md:-left-8 bg-card p-4 md:p-5 rounded-2xl shadow-ambient-high flex items-center gap-3 md:gap-4 border border-border/20 animate-bounce [animation-duration:3s]">
                  <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">500+ Mutlu Müşteri</p>
                    <p className="text-xs font-bold text-muted-foreground opacity-60">Güvenilir Rehberlik</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section (Bento Grid) */}
        <section id="hizmetler" className="py-32 bg-background px-6 md:px-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="font-heading text-4xl md:text-5xl text-foreground font-bold tracking-tight mb-6">Size Özel Finansal Çözümler</h2>
              <p className="text-lg text-muted-foreground font-medium opacity-80 italic">İhtiyaçlarınıza uygun, anlaşılır ve eyleme geçirilebilir hizmetlerimizle yanınızdayız.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Bütçe Yönetimi (Large Card) */}
              <div className="md:col-span-8 bg-card rounded-[32px] p-10 shadow-ambient-medium border-t-8 border-primary relative overflow-hidden group hover:shadow-ambient-high transition-all duration-500">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Wallet className="w-48 h-48 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                    <Wallet className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-3xl font-bold text-foreground mb-4">Bütçe Yönetimi</h3>
                  <p className="text-muted-foreground text-lg font-medium mb-8 max-w-md leading-relaxed">
                    Gelir ve giderlerinizi optimize ederek, ay sonunu düşünmeden yaşamaya başlayın. Şeffaf tablolar ve kişisel harcama analizleriyle paranızın kontrolünü elinize alın.
                  </p>
                  <a className="inline-flex items-center gap-3 font-bold text-primary hover:text-primary/80 transition-colors group/link" href="#">
                    Detayları İncele 
                    <ArrowRight className="h-5 w-5 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Yatırım Danışmanlığı (Tall Card) */}
              <div className="md:col-span-4 bg-secondary rounded-[32px] p-10 shadow-ambient-medium relative overflow-hidden text-secondary-foreground group hover:shadow-ambient-high transition-all duration-500">
                <div className="absolute -bottom-10 -right-10 opacity-10 transform group-hover:rotate-12 transition-transform duration-700">
                  <TrendingUp className="w-64 h-64" />
                </div>
                <div className="relative z-10 h-full flex flex-col">
                  <div className="bg-primary-foreground/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                    <TrendingUp className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-3xl font-bold mb-4">Yatırım Danışmanlığı</h3>
                  <p className="text-white/90 text-lg font-medium mb-8 leading-relaxed">
                    Risk profilinize uygun stratejilerle, birikimlerinizi enflasyona karşı koruyun ve güvenle büyütün.
                  </p>
                  <ul className="space-y-4 mb-auto font-bold text-white/80">
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-accent rounded-full text-accent-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      Portföy Çeşitlendirmesi
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-accent rounded-full text-accent-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      Uzun Vadeli Planlama
                    </li>
                  </ul>
                </div>
              </div>

              {/* Borç Yapılandırma */}
              <div className="md:col-span-6 bg-card border-2 border-border/20 rounded-[32px] p-10 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-500 group">
                <div className="flex items-center gap-6 mb-6">
                  <div className="bg-tertiary/10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Coins className="h-8 w-8 text-tertiary" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">Borç Yapılandırma</h3>
                </div>
                <p className="text-muted-foreground text-lg font-medium leading-relaxed opacity-80">
                  Mevcut borçlarınızı konsolide ederek faiz yükünden kurtulun ve net bir ödeme planı oluşturun.
                </p>
              </div>

              {/* Emeklilik Planlaması */}
              <div className="md:col-span-6 bg-card border-2 border-border/20 rounded-[32px] p-10 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-500 group">
                <div className="flex items-center gap-6 mb-6">
                  <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Calendar className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">Emeklilik Planlaması</h3>
                </div>
                <p className="text-muted-foreground text-lg font-medium leading-relaxed opacity-80">
                  Geleceğinizi şimdiden garantiye alın. Hayalinizdeki emeklilik için gerekli adımları birlikte atalım.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section id="neden-biz" className="py-32 bg-background px-6 md:px-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div className="animate-in fade-in slide-in-from-left-8 duration-700">
                <h2 className="font-heading text-4xl md:text-5xl text-foreground font-bold mb-8 leading-tight">Neden Koç Ram Finans?</h2>
                <p className="text-xl text-muted-foreground font-medium mb-12 opacity-80 leading-relaxed italic">
                  Finans dünyası karmaşık ve soğuk görünse de, biz onu ulaşılabilir ve dostane hale getiriyoruz. Sürecin merkezine 'sizi' koyuyoruz.
                </p>
                
                <div className="space-y-8">
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center shadow-ambient-medium group-hover:scale-110 transition-transform">
                      <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-xl mb-2">Anlaşılır Bir Dil</h4>
                      <p className="text-muted-foreground font-medium leading-relaxed opacity-80">Karmaşık finansal terimleri kullanmıyoruz. Her konuyu günlük hayattan örneklerle basitleştiriyoruz.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center shadow-ambient-medium group-hover:scale-110 transition-transform">
                      <Handshake className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-xl mb-2">Şeffaf Yaklaşım</h4>
                      <p className="text-muted-foreground font-medium leading-relaxed opacity-80">Gizli ücretler veya sürprizler yok. Tüm süreçlerimiz ve ücretlendirmemiz ilk günden bellidir.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center shadow-ambient-medium group-hover:scale-110 transition-transform">
                      <MessagesSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-xl mb-2">Sürekli Destek</h4>
                      <p className="text-muted-foreground font-medium leading-relaxed opacity-80">Sadece plan yapmakla kalmıyor, uygulama sürecinde de yanınızda yürüyoruz.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="aspect-[4/3] rounded-[40px] overflow-hidden shadow-ambient-high relative border-4 border-card">
                  <div className="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLbu8BaYKEb-2h5lpVt34DwH1nhV2GDnag14vLJjAh3E1ZDgKhRCCf_7AwDfH_A0leVyBXP9bL5NfmbGf-UF7SUCr-rjkSEvoKE0e3kfkdMMBU-NcAnhY4mdP_C3QRtn0KcuVGrI7RfKjsbp7tTyanJK7JF8fQvqEkCLou8eM3HTIS37Nlhpi0aR7HW6n6rIdaD80fmKPF3w2M5vR0XBDLdMCzBbXQXL-cLwm-_hFw6iqsTcktl2gRCgxML83tNaX-5rxoXesFIINy')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
                  </div>
                </div>
                
                {/* Stats floating card */}
                <div className="absolute -bottom-6 md:-bottom-10 -left-4 md:-left-10 bg-card p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-ambient-high border border-border/20 flex gap-8 md:gap-12 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="text-center">
                    <p className="text-4xl font-heading font-bold text-primary mb-1">10+</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Yıllık Tecrübe</p>
                  </div>
                  <div className="w-px bg-border/30"></div>
                  <div className="text-center">
                    <p className="text-4xl font-heading font-bold text-primary mb-1">%98</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Memnuniyet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="sss" className="py-32 bg-background border-t border-border/10 px-6 md:px-8 scroll-mt-20">
          <div className="max-w-[800px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border border-primary/20 mb-4">
                <HelpCircle className="h-4 w-4" />
                <span>Merak Edilenler</span>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl text-foreground font-bold tracking-tight mb-6">
                Sıkça Sorulan Sorular (SSS)
              </h2>
              <p className="text-lg text-muted-foreground font-medium opacity-80">
                Platformumuz ve sunduğumuz finansal çözümler hakkında en çok sorulan soruların yanıtlarını burada bulabilirsiniz.
              </p>
            </div>

            <div className="space-y-4">
              <details className="group bg-card border border-border/20 rounded-3xl p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:border-primary/20">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-bold text-lg text-foreground pr-4">
                    Koç Ram Finans Nedir?
                  </h3>
                  <span className="shrink-0 transition-transform duration-300 group-open:rotate-180 p-1.5 bg-primary/5 rounded-xl text-primary">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed font-medium text-sm border-t border-border/5 pt-4">
                  Koç Ram Finans; kişisel bütçe yönetiminizi basitleştiren, birikim ve yatırımlarınızı yapay zeka desteğiyle optimize eden, borçlarınızı yapılandırmanıza yardımcı olan ve aktif finans topluluğuyla tecrübe paylaşmanızı sağlayan modern bir finansal asistan ve koçluk platformudur.
                </p>
              </details>

              <details className="group bg-card border border-border/20 rounded-3xl p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:border-primary/20">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-bold text-lg text-foreground pr-4">
                    Hizmetleriniz ücretli mi? Üyelik paketleri nelerdir?
                  </h3>
                  <span className="shrink-0 transition-transform duration-300 group-open:rotate-180 p-1.5 bg-primary/5 rounded-xl text-primary">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed font-medium text-sm border-t border-border/5 pt-4">
                  Platformumuza kayıt olmak ve temel özellikleri kullanmak tamamen ücretsizdir. Ücretsiz üyelik ile bütçe kaydı, temel harcama analizleri ve sosyal topluluk özelliklerini kullanabilirsiniz. Gelişmiş yapay zeka analizleri, akıllı tavsiye kartları, detaylı gelecek tahminleri ve portföy projeksiyonları gibi Premium özellikler ise abonelik paketimiz dahilinde sunulmaktadır.
                </p>
              </details>

              <details className="group bg-card border border-border/20 rounded-3xl p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:border-primary/20">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-bold text-lg text-foreground pr-4">
                    Yapay Zeka (AI) Gelecek Tahmini nasıl çalışıyor?
                  </h3>
                  <span className="shrink-0 transition-transform duration-300 group-open:rotate-180 p-1.5 bg-primary/5 rounded-xl text-primary">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed font-medium text-sm border-t border-border/5 pt-4">
                  Eklediğiniz yatırımları, sabit varlıkları ve aylık tasarruf hedeflerinizi piyasa koşulları ve tarihsel veriler ışığında analiz ederiz. Gelişmiş Gemini AI altyapımız, portföyünüzün 6 aylık olası büyüme senaryolarını rasyonel temellere (örneğin BTC halving beklentisi, BIST faiz indirimleri vb.) dayandırarak simüle eder ve size detaylı bir büyüme oranı sunar.
                </p>
              </details>

              <details className="group bg-card border border-border/20 rounded-3xl p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:border-primary/20">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-bold text-lg text-foreground pr-4">
                    Verilerim güvende mi?
                  </h3>
                  <span className="shrink-0 transition-transform duration-300 group-open:rotate-180 p-1.5 bg-primary/5 rounded-xl text-primary">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed font-medium text-sm border-t border-border/5 pt-4">
                  Evet, güvenliğiniz bizim için en üst düzey önceliktir. Finansal verileriniz ve kişisel bilgileriniz Clerk kimlik doğrulama sistemleri ve en son teknoloji şifreleme yöntemleriyle (SSL/TLS) korunmaktadır. Veritabanlarımız yüksek güvenlikli sunucularda saklanmakta olup, verileriniz hiçbir üçüncü şahısla kesinlikle paylaşılmaz.
                </p>
              </details>

              <details className="group bg-card border border-border/20 rounded-3xl p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:border-primary/20">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-bold text-lg text-foreground pr-4">
                    Borç Yapılandırma modülü ne işe yarar?
                  </h3>
                  <span className="shrink-0 transition-transform duration-300 group-open:rotate-180 p-1.5 bg-primary/5 rounded-xl text-primary">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed font-medium text-sm border-t border-border/5 pt-4">
                  Birden fazla kredi, kredi kartı veya kişisel borcunuzu tek bir yapılandırma altında birleştirmenize imkan tanır. Kalan borç bakiyesini, ödediğiniz taksitleri ve toplam faiz yükünüzü tek bir ekrandan takip ederek borçlarınızdan çok daha hızlı ve planlı kurtullanızı sağlar.
                </p>
              </details>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
