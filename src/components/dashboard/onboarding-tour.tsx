"use client";

import { useEffect, useState } from "react";
import { Joyride, Step, EventData, STATUS, EVENTS, TooltipRenderProps } from "react-joyride";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles, Navigation, Wallet, TrendingUp, PieChart, CalendarDays, Palette, BotMessageSquare, ArrowRightLeft } from "lucide-react";
import { getTourStatus, completeTour } from "@/app/actions/profile";

function CustomTooltip({
  index,
  isLastStep,
  step,
  size,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-card text-card-foreground border border-border/50 shadow-2xl rounded-[24px] w-full p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <div className="font-heading font-bold text-xl text-primary flex items-center gap-2">
          {step.title}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all" {...closeProps}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground/90 leading-relaxed relative z-10 font-medium">
        {step.content}
      </div>

      <div className="flex items-center justify-between mt-4 relative z-10 pt-4 border-t border-border/40">
        <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
          Adım {index + 1} / {size}
        </div>
        <div className="flex items-center gap-2">
          {index > 0 ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground transition-all" {...backProps}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="rounded-xl h-9 text-muted-foreground hover:text-foreground" {...skipProps}>
              Turu Geç
            </Button>
          )}
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 shadow-md" {...primaryProps}>
            {isLastStep ? "Bitir" : "İleri"} {isLastStep ? <Sparkles className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const [run, setRun] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    setMounted(true);

    const initialSteps: Step[] = [
      {
        target: "body",
        placement: "center",
        title: (
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" /> Hoş Geldiniz!
          </div>
        ),
        content: "Koç Ram Finans ile finansal geleceğinizi kontrol altına almaya hazır mısınız? Sizin için hazırladığımız bu kısa turla sistemin tüm özelliklerini keşfedelim.",
      },
      {
        target: ".tour-step-1",
        placement: "right",
        title: (
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" /> Ana Menü
          </div>
        ),
        content: "Sol menüden tüm sayfalara hızlıca erişebilirsiniz. Şimdi menüdeki diğer ana bölümleri hızlıca tanıyalım.",
      },
      {
        target: ".tour-step-assets",
        placement: "right",
        title: (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Varlık Yönetimi
          </div>
        ),
        content: "Varlıklarım sayfasından hisse senedi, kripto para, altın ve hatta gayrimenkul/araç gibi tüm fiziksel ve dijital varlıklarınızı tek bir yerden ekleyip canlı fiyatlarla takip edebilirsiniz.",
      },
      {
        target: ".tour-step-income",
        placement: "right",
        title: (
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Gelir ve Gider
          </div>
        ),
        content: "Maaş, kira veya ek gelirlerinizi ekleyip fatura ve harcamalarınızı düştüğünüzde, sistem sizin için her ay ne kadar tasarruf ettiğinizi otomatik hesaplar.",
      },
      {
        target: ".tour-step-debts",
        placement: "right",
        title: (
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Borç ve Krediler
          </div>
        ),
        content: "Mevcut kredilerinizi veya kişisel borçlarınızı buraya kaydederek aylık ödemelerinizi düzene sokun. Sistemin size ödeme yaklaşınca haber vermesine izin verin.",
      },
      {
        target: ".tour-step-calculators",
        placement: "right",
        title: (
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5" /> Hesaplayıcılar
          </div>
        ),
        content: "Gelişmiş finansal hesaplama araçlarını kullanarak kredi taksitlerinizi, birikim hedeflerinizi ve yatırım getirilerinizi saniyeler içinde analiz edin.",
      },
      {
        target: ".tour-step-4",
        placement: "bottom",
        title: (
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Net Varlık
          </div>
        ),
        content: "Finansal özet sayfasında yer alan bu kart, finansal sağlığınızın kalbidir. Toplam gelir, gider, borç ve yatırımlarınızın güncel verileriyle hesaplanan anlık net varlığınızı buradan takip edebilirsiniz.",
      },
      {
        target: ".tour-step-5",
        placement: "bottom",
        title: (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Portföy Performansı
          </div>
        ),
        content: "Yatırımlarınızın ne durumda olduğunu merak mı ediyorsunuz? Tüm piyasa varlıklarınızın toplam kar veya zarar durumu canlı verilerle burada hesaplanır.",
      },
      {
        target: ".tour-step-6",
        placement: "top",
        title: (
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5" /> Bütçe Dengesi
          </div>
        ),
        content: "Gelir ve gider dengenizi interaktif grafiklerle inceleyin. Nereye daha fazla harcama yaptığınızı görmek, tasarruf planlarınızı şekillendirmek için harika bir yoldur.",
      },
      {
        target: ".tour-step-7",
        placement: "top",
        title: (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Ödeme Takvimi
          </div>
        ),
        content: "Yaklaşan faturalarınızı, kira veya kredi taksitlerinizi asla kaçırmayın. Ödemeleriniz tarih sırasına göre otomatik olarak sıralanır.",
      },
      {
        target: ".tour-step-3",
        placement: "right",
        title: (
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Kişiselleştirme
          </div>
        ),
        content: "Gözlerinizi yormamak için tek tıkla Aydınlık ve Karanlık tema arasında geçiş yapın. Panel sizin rahatınıza göre şekillenir.",
      },
      {
        target: ".tour-step-2",
        placement: "top-start",
        title: (
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-5 w-5" /> Yapay Zeka Asistanı
          </div>
        ),
        content: "Son olarak, aklınıza takılan her şeyi yapay zeka finansal asistanınıza sorabilirsiniz. Yeni harcama eklemesini isteyebilir veya yatırımlarınız için piyasa tavsiyeleri alabilirsiniz. Başarılar!",
      },
    ];

    // Mobil için yerleşimi (placement) ve genişliği düzelt
    const isMobile = window.innerWidth < 768;
    const adjustedSteps = initialSteps.map(step => {
      if (isMobile && step.target !== "body") {
        return { ...step, placement: "bottom" as const };
      }
      return step;
    });

    setSteps(adjustedSteps);

    // Veritabanından tur durumunu kontrol et
    const checkTourStatus = async () => {
      if (pathname === "/dashboard") {
        const hasCompleted = await getTourStatus();
        if (!hasCompleted) {
          setTimeout(() => {
            setRun(true);
          }, 2000); // Sayfanın tam yüklenmesi için 2 saniye bekle
        }
      }
    };

    checkTourStatus();
  }, [pathname]);

  useEffect(() => {
    const handleStartTour = () => {
      setTourKey(prev => prev + 1); // Turu tamamen sıfırla
      if (pathname !== "/dashboard") {
        router.push("/dashboard");
        setTimeout(() => setRun(true), 800);
      } else {
        setRun(true);
      }
    };

    window.addEventListener("start-tour", handleStartTour);
    return () => window.removeEventListener("start-tour", handleStartTour);
  }, [pathname, router]);

  const handleJoyrideCallback = async (data: EventData) => {
    const { status, type, step } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("hasCompletedTour", "true");
      await completeTour(); // Veritabanına kalıcı olarak kaydet
      window.dispatchEvent(new Event("close-mobile-menu"));
    }

    // Mobil menüyü gerekli adımlarda açıp kapatma
    if (type === EVENTS.STEP_BEFORE) {
      const isMobile = window.innerWidth < 768;
      const sidebarTargets = [
        ".tour-step-1",
        ".tour-step-assets",
        ".tour-step-income",
        ".tour-step-debts",
        ".tour-step-calculators",
        ".tour-step-3"
      ];

      if (isMobile) {
        if (sidebarTargets.includes(step.target as string)) {
          window.dispatchEvent(new Event("open-mobile-menu"));
        } else {
          window.dispatchEvent(new Event("close-mobile-menu"));
        }
      }
    }
  };

  if (!mounted || !run || steps.length === 0) return null;

  return (
    <Joyride
      key={tourKey}
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      tooltipComponent={CustomTooltip}
      options={{
        zIndex: 10000,
        primaryColor: '#10b981',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        textColor: theme === 'dark' ? '#f3f4f6' : '#111827',
        arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        showProgress: false,
        spotlightRadius: 20,
        spotlightPadding: 12,
        blockTargetInteraction: true,
        overlayClickAction: false,
        skipBeacon: true,
        closeButtonAction: "skip",
        // Genişliği mobilde ekrana sığacak şekilde dinamik yap
        width: typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth - 48 : 400,
      }}
      styles={{
        tooltipContainer: {
          textAlign: "left",
        },
        tooltip: {
          padding: 0, // CustomTooltip padding'i kendi yönetiyor
        }
      }}
    />
  );
}
