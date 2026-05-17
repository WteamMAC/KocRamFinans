"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Info, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  ArrowRightLeft, 
  ShieldCheck, 
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "Tümü", icon: BookOpen },
  { id: "general", label: "Genel", icon: Info },
  { id: "assets", label: "Varlıklar & Yatırım", icon: TrendingUp },
  { id: "budget", label: "Bütçe & Akış", icon: ArrowRightLeft },
  { id: "security", label: "Güvenlik", icon: ShieldCheck }
];

const faqs = [
  {
    id: "faq-1",
    category: "general",
    question: "Koç Ram Finans Nedir?",
    answer: "Koç Ram Finans; tüm varlıklarınızı (Kripto, BIST, NASDAQ, Altın, BES, Faiz vb.) tek bir merkezden izlemenizi, gelir-gider dengenizi yönetmenizi ve gelişmiş finansal hesaplayıcılar ile geleceğe yönelik planlama yapmanızı sağlayan kapsamlı bir kişisel finans yönetim platformudur."
  },
  {
    id: "faq-2",
    category: "general",
    question: "Sistem nasıl çalışır? Ücretli midir?",
    answer: "Koç Ram Finans, tamamen ücretsiz bir platformdur. Kullanıcı dostu arayüzümüz sayesinde varlıklarınızı, borçlarınızı ve gelir-giderlerinizi kolayca kaydedebilir, anlık veri akışı sayesinde finansal durumunuzu 7/24 takip edebilirsiniz."
  },
  {
    id: "faq-3",
    category: "assets",
    question: "Varlık fiyatları ne sıklıkla güncellenir?",
    answer: "Portföyündeki Kripto Para, BIST/NASDAQ hisseleri ve altın fiyatları piyasa koşullarına uygun periyotlarla otomatik olarak güncellenir. Bu sayede yatırımlarınızın güncel durumunu her an canlıya yakın oranlarla takip edebilirsiniz."
  },
  {
    id: "faq-4",
    category: "assets",
    question: "BES Projeksiyonu nasıl çalışır?",
    answer: "BES (Bireysel Emeklilik Sistemi) projeksiyon modülü, girdiğiniz aylık katkı payı, fon getiri tahmini ve devlet katkısı oranlarını birleştirerek standart finansal projeksiyon modelleri ve bileşik faiz formülleriyle gelecek tahminleri üretir ve bunu bir büyüme grafiği ile görselleştirir."
  },
  {
    id: "faq-5",
    category: "assets",
    question: "Faiz varlığı takibi nasıl yapılır?",
    answer: "Bankadaki mevduat hesaplarınızı, faiz oranlarını ve vade sürelerini girerek net getirilerinizi otomatik olarak hesaplayıp takip edebilirsiniz. Faiz oranı değişikliklerini de dilediğiniz an güncelleyebilirsiniz."
  },
  {
    id: "faq-6",
    category: "budget",
    question: "Gelir-Gider takibi nasıl yapılır?",
    answer: "Sol menüdeki 'Gelir - Gider Ekle' seçeneğini kullanarak yeni gelir ve giderlerinizi ekleyebilirsiniz. 'Gelir Gider Göster' sayfasından ise tüm nakit akışınızı tarihsel olarak filtreleyebilir, grafiklerle analiz edebilirsiniz."
  },
  {
    id: "faq-7",
    category: "budget",
    question: "Borç ve kredilerimi nasıl yönetirim?",
    answer: "Borç ve Krediler sayfasından tüm borçlarınızı, taksitlerinizi ve ödeme planlarınızı kaydederek aylık ödemelerinizi takip edebilir, bütçenizi buna göre şekillendirebilirsiniz."
  },
  {
    id: "faq-8",
    category: "security",
    question: "Verilerim güvende mi?",
    answer: "Verilerinizin gizliliği ve güvenliği birinci önceliğimizdir. Koç Ram Finans, en güncel güvenlik standartları, veri şifreleme ve güvenli kimlik doğrulama altyapısı (Clerk) kullanarak bilgilerinizi korur."
  },
  {
    id: "faq-9",
    category: "security",
    question: "Hesap bilgilerimi nasıl güncellerim?",
    answer: "Profilim sayfasındaki veya sol menüde yer alan 'Bilgileri Düzenle' sekmesinden tüm hesap ve şifre bilgilerinizi güvenli bir şekilde güncelleyebilirsiniz."
  }
];

function FaqContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setExpandedFaq(q);
      const matchedFaq = faqs.find(f => f.id === q);
      if (matchedFaq) {
        setActiveCategory(matchedFaq.category);
      }
      
      // Smoothly scroll to the question card
      setTimeout(() => {
        const element = document.getElementById(q);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [searchParams]);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 space-y-6 md:space-y-10 p-4 md:p-8 pt-6 md:pt-10 bg-background min-h-screen pb-20 overflow-x-hidden w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-primary/10 text-primary rounded-xl md:rounded-2xl">
            <HelpCircle className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-heading font-bold text-primary">Sık Sorulan Sorular</h1>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground opacity-70">Aklınıza takılan sorulara hızlı cevaplar bulun.</p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
          <Input
            type="text"
            placeholder="Sorularda arayın (örn: BES, varlık, güvenlik...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 md:h-14 rounded-2xl bg-card border-border/50 font-medium text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary shadow-sm leading-normal w-full"
          />
        </div>

        {/* Category Tabs */}
        <div className="bg-muted/50 p-1 rounded-2xl border border-border/20 w-full overflow-x-auto flex gap-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap",
                  isActive 
                    ? "bg-card text-primary shadow-ambient-medium border border-border/10" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <CatIcon className="h-4 w-4 mr-2" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {filteredFaqs.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-border/50 bg-card/50 rounded-[32px]">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Aramanızla eşleşen soru bulunamadı</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Farklı anahtar kelimeler kullanarak aramayı tekrar deneyebilir veya sol menüden kategorileri değiştirebilirsiniz.
              </p>
            </Card>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  id={faq.id}
                  className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden bg-card scroll-mt-24",
                    isOpen
                      ? "border-primary/30 bg-primary/5 shadow-ambient-medium"
                      : "border-border/30 hover:border-border/60 hover:bg-muted/10 shadow-sm"
                  )}
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between p-5 md:p-6 text-left font-bold text-sm md:text-base text-foreground focus:outline-none"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300 flex-shrink-0",
                        isOpen && "rotate-180 text-primary"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "transition-all duration-300 ease-in-out overflow-hidden",
                      isOpen ? "max-h-60 border-t border-border/10" : "max-h-0"
                    )}
                  >
                    <div className="p-5 md:p-6 text-xs md:text-sm text-muted-foreground/90 leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Info/CTA Widget */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden p-0">
            <div className="bg-primary/5 border-b border-border/10 h-16 flex items-center px-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Hızlı Destek & İpucu
              </CardTitle>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-muted/20 rounded-2xl border border-border/10">
                <p className="text-xs font-bold text-foreground">💡 Kısa Yol İpucu:</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                  Sol menüde en altta bulunan soru başlıklarına tıklayarak herhangi bir sayfadayken de sık sorulan sorulara popup olarak anında erişebilirsiniz.
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <MessageSquare className="h-4 w-4" />
                  <span>Finansal Asistan</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Merak ettiğiniz diğer konuları sağ altta bulunan yapay zeka destekli sohbet asistanımıza sorabilirsiniz. Finansal özetlerinizi analiz eder ve size akıllı öneriler sunar.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 shadow-ambient-medium rounded-[32px] p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Hala aradığınız cevabı bulamadınız mı?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Bizimle doğrudan iletişime geçmekten çekinmeyin. Destek ekibimiz sorularınızı en kısa sürede yanıtlayacaktır.
            </p>
            <Button className="w-full rounded-2xl h-11 text-xs font-bold flex items-center justify-center gap-2 group" onClick={() => window.dispatchEvent(new Event("open-chat-ai"))}>
              Asistana Sorun
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen text-muted-foreground font-bold bg-background">
        Yükleniyor...
      </div>
    }>
      <FaqContent />
    </Suspense>
  );
}
