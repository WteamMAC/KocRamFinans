"use client";

import { useEffect, useState } from "react";
import { Joyride, Step, EventData, STATUS } from "react-joyride";
import { useTheme } from "next-themes";

export function OnboardingTour() {
  const [run, setRun] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasCompletedTour = localStorage.getItem("hasCompletedTour");
    if (!hasCompletedTour) {
      // Delay starting the tour slightly to let the UI render completely
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: ".tour-step-1",
      content: "Buradan tüm sayfalarımıza ve araçlarımıza erişebilirsiniz. Menüyü kullanarak gezinmeye başlayın.",
      placement: "right",
      title: "Ana Menü",
    },
    {
      target: ".tour-step-4",
      content: "Toplam varlığınız ve özet bilgilerinizi buradan takip edebilirsiniz.",
      placement: "bottom",
      title: "Finansal Özet",
    },
    {
      target: ".tour-step-3",
      content: "Aydınlık ve karanlık tema arasında geçiş yaparak deneyiminizi kişiselleştirebilirsiniz.",
      placement: "bottom",
      title: "Tema Seçenekleri",
    },
    {
      target: ".tour-step-2",
      content: "Koç Ram Finans AI ile aklınıza takılan tüm finansal konuları anında sorabilir ve destek alabilirsiniz.",
      placement: "top-start",
      title: "Yapay Zeka Asistanı",
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
      options={{
        zIndex: 10000,
        primaryColor: '#10b981', // Tailwind Emerald 500 for primary elements
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        textColor: theme === 'dark' ? '#f3f4f6' : '#111827',
        arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
      styles={{
        buttonClose: {
            display: "none",
        },
        buttonSkip: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      }}
      locale={{
        back: 'Geri',
        close: 'Kapat',
        last: 'Bitir',
        next: 'İleri',
        skip: 'Geç',
      }}
    />
  );
}
