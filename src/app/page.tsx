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
  Clock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-accent/30">
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
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/sign-up" className="bg-primary text-primary-foreground font-bold px-8 py-5 rounded-2xl hover:bg-primary/90 transition-all shadow-ambient-high flex items-center justify-center gap-3 text-lg group">
                  Ücretsiz Görüşme Ayarla
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="bg-card border-2 border-border/30 text-muted-foreground font-bold px-8 py-5 rounded-2xl hover:bg-muted transition-all flex items-center justify-center gap-3 shadow-ambient-low text-lg">
                  Nasıl Çalışır?
                </button>
              </div>
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
                <div className="absolute -bottom-8 -left-8 bg-card p-5 rounded-2xl shadow-ambient-high flex items-center gap-4 border border-border/20 animate-bounce [animation-duration:3s]">
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
                <div className="absolute -bottom-10 -left-10 bg-card p-8 rounded-3xl shadow-ambient-high border border-border/20 flex gap-12 animate-in slide-in-from-bottom-8 duration-700">
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

        {/* CTA Section */}
        <section className="py-32 px-6 md:px-8 bg-background">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-primary text-primary-foreground rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden shadow-ambient-high group">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-black/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
              
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-heading text-4xl md:text-5xl font-bold mb-8 tracking-tight">Finansal Stresi Geride Bırakmaya Hazır mısınız?</h2>
                <p className="text-xl mb-12 text-primary-foreground/90 leading-relaxed font-medium italic opacity-90">
                  İlk görüşmemiz tamamen ücretsizdir. Hedeflerinizi konuşalım ve size nasıl yardımcı olabileceğimizi birlikte keşfedelim.
                </p>
                <Link href="/sign-up" className="bg-accent text-accent-foreground font-bold px-10 py-5 rounded-2xl hover:bg-card hover:text-foreground transition-all shadow-ambient-medium hover:shadow-ambient-high scale-100 active:scale-95 flex items-center justify-center gap-3 mx-auto text-lg">
                  Hemen Randevu Oluştur
                  <Calendar className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
