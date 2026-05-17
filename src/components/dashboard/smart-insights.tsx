"use client";

import { useState } from "react";
import { generateSmartInsights } from "@/app/actions/insights";
import { Lightbulb, AlertTriangle, CheckCircle2, Info, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SmartInsightsProps {
  financialData: any;
}

export function SmartInsights({ financialData }: SmartInsightsProps) {
  const [insights, setInsights] = useState<{ type: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateSmartInsights(financialData);
      if (res.success && res.data) {
        setInsights(res.data);
        setHasLoaded(true);
      } else {
        setError(res.error || "Bilinmeyen bir hata oluştu.");
      }
    } catch (err) {
      setError("Bağlantı sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Yapay Zeka Analizleri</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-card/40 border border-border/20 rounded-[32px] shadow-inner min-h-[160px] backdrop-blur-xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs font-black text-primary uppercase tracking-widest animate-pulse">Yapay zeka finansal verilerinizi analiz ediyor...</span>
        </div>
      </div>
    );
  }

  // 2. Not Loaded Yet State (CTA)
  if (!hasLoaded) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Yapay Zeka Analizleri</h3>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-card/30 border border-border/10 rounded-[32px] shadow-ambient-medium backdrop-blur-xl group hover:border-primary/20 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-primary/10 rounded-2xl text-primary shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-foreground uppercase tracking-wider">Bütçenizi AI İle Güçlendirin</h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[500px]">
                Mevcut bütçe verileriniz, gelir-gider oranlarınız ve borç durumunuz analiz edilerek size özel tasarruf önerileri ve akıllı analiz kartları oluşturulur.
              </p>
            </div>
          </div>
          <Button
            onClick={fetchInsights}
            className="w-full md:w-auto h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-95 transition-all shrink-0"
          >
            Analiz Et ve Çalıştır
          </Button>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Yapay Zeka Analizleri</h3>
          </div>
          <Button
            variant="ghost"
            onClick={fetchInsights}
            className="h-8 px-3 rounded-xl font-black text-[9px] uppercase tracking-wider border border-border/20 text-muted-foreground hover:text-primary"
          >
            Tekrar Dene
          </Button>
        </div>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
          <AlertTriangle className="h-5 w-5 text-rose-500/80" />
          <span className="text-sm font-medium text-rose-500/80">{error}</span>
        </div>
      </div>
    );
  }

  // 4. Success State (Render cards and add a Refresh button in header)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Yapay Zeka Analizleri</h3>
        </div>
        <Button
          variant="outline"
          onClick={fetchInsights}
          className="h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest border border-border/20 bg-card/50 hover:bg-muted/50 text-primary transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="h-3 w-3" />
          Analizi Yenile
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-md animate-in fade-in duration-300",
              insight.type === "warning" && "bg-destructive/10 border-destructive/20",
              insight.type === "success" && "bg-emerald-500/10 border-emerald-500/20",
              insight.type === "info" && "bg-blue-500/10 border-blue-500/20"
            )}
          >
            {insight.type === "warning" && <AlertTriangle className="h-5 w-5 text-rose-500/80 shrink-0 mt-0.5" />}
            {insight.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {insight.type === "info" && <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
            <p className={cn(
              "text-sm font-medium leading-relaxed",
              insight.type === "warning" && "text-rose-500/80",
              insight.type === "success" && "text-emerald-700 dark:text-emerald-400",
              insight.type === "info" && "text-blue-700 dark:text-blue-400"
            )}>
              {insight.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
