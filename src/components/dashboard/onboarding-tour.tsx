"use client";

import { useEffect, useState } from "react";
import { Joyride, Step, EventData, STATUS, TooltipRenderProps } from "react-joyride";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles, Navigation, Wallet, TrendingUp, PieChart, CalendarDays, Palette, BotMessageSquare } from "lucide-react";

function CustomTooltip({
  index,
  isLastStep,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-card text-card-foreground border border-border/50 shadow-2xl rounded-[24px] w-[320px] md:w-[400px] p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <div className="font-heading font-bold text-xl text-primary flex items-center gap-2">
          {step.title}
        </div>
        {index !== 0 && (
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted" {...closeProps}>
             <X className="h-4 w-4" />
           </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground/90 leading-relaxed relative z-10 font-medium">
        {step.content}
      </div>

      <div className="flex items-center justify-between mt-4 relative z-10 pt-4 border-t border-border/40">
        <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
          Adım {index + 1} / 8
        </div>
        <div className="flex items-center gap-2">
          {index > 0 ? (
            <Button variant="outline" size="sm" className="rounded-xl h-9" {...backProps}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Geri
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

  useEffect(() => {
    setMounted(true);
    const hasCompletedTour = localStorage.getItem("hasCompletedTour");
    if (!hasCompletedTour && pathname === "/dashboard") {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    const handleStartTour = () => {
      if (pathname !== "/dashboard") {
        router.push("/dashboard");
        // Sayfanın yüklenmesi için biraz bekle
        setTimeout(() => setRun(true), 800);
      } else {
        setRun(true);
      }
    };

    window.addEventListener("start-tour", handleStartTour);
    return () => window.removeEventListener("start-tour", handleStartTour);
  }, [pathname, router]);

  const steps: Step[] = [
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
      content: "Sol menüden tüm sayfalara hızlıca erişebilirsiniz. Varlıklarınızı, bütçenizi, kredi ve borçlarınızı buradan detaylı olarak yönetebilirsiniz.",
    },
    {
      target: ".tour-step-4",
      placement: "bottom",
      title: (
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" /> Net Varlık
        </div>
      ),
      content: "Burası finansal sağlığınızın kalbidir. Toplam gelir, gider, borç ve yatırımlarınızın güncel verileriyle hesaplanan anlık net varlığınızı buradan takip edebilirsiniz.",
    },
    {
      target: ".tour-step-5",
      placement: "bottom",
      title: (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Portföy Performansı
        </div>
      ),
      content: "Yatırımlarınızın ne durumda olduğunu merak mı ediyorsunuz? Borsa, kripto ve altın gibi tüm piyasa varlıklarınızın toplam kar veya zarar durumu canlı verilerle burada hesaplanır.",
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
      content: "Yaklaşan faturalarınızı, kira veya kredi taksitlerinizi asla kaçırmayın. Ödemeleriniz tarih sırasına göre otomatik olarak sıralanır ve size hatırlatılır.",
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
      content: "Aklınıza takılan her şeyi finansal asistanınıza sorabilirsiniz. Yeni harcama eklemesini isteyebilir veya piyasa tavsiyeleri alabilirsiniz. Deneyiminizi iyileştirmek için her zaman yanınızda!",
    },
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("hasCompletedTour", "true");
    }
  };

  if (!mounted || !run) return null;

  return (
    <Joyride
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
      }}
    />
  );
}
