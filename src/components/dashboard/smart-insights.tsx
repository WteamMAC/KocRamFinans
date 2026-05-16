"use client";

import { useEffect, useState } from "react";
import { generateSmartInsights } from "@/app/actions/insights";
import { Lightbulb, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartInsightsProps {
  financialData: any;
}

export function SmartInsights({ financialData }: SmartInsightsProps) {
  const [insights, setInsights] = useState<{ type: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      const res = await generateSmartInsights(financialData);
      if (res.success && res.data) {
        setInsights(res.data);
      } else {
        setError(res.error || "Bilinmeyen bir hata oluştu.");
      }
      setLoading(false);
    }
    fetchInsights();
  }, [financialData]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl animate-pulse">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
        <span className="text-sm font-medium text-primary">Yapay Zeka finansal verilerinizi analiz ediyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
        <AlertTriangle className="h-5 w-5 text-rose-500/80" />
        <span className="text-sm font-medium text-rose-500/80">{error}</span>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Yapay Zeka Analizleri</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-md",
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
