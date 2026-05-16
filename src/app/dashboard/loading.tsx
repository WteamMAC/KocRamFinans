import React from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto w-full animate-pulse">
      {/* Üst Karşılama ve Başlık Skeletonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-6">
        <div className="space-y-2.5 w-full sm:w-1/2">
          <div className="h-9 bg-primary/10 rounded-xl w-3/4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
          <div className="h-4 bg-muted/60 rounded-lg w-1/2" />
        </div>
        <div className="h-11 w-full sm:w-48 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-md" />
      </div>

      {/* Finansal Özet Grid Skeletonu (4 Kart) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative bg-card/60 backdrop-blur-2xl border border-primary/10 rounded-2xl p-6 shadow-2xl overflow-hidden min-h-[140px] flex flex-col justify-between"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            
            <div className="flex justify-between items-center">
              <div className="h-4 bg-muted/60 rounded-lg w-24" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-md bg-primary/20" />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="h-8 bg-primary/15 rounded-xl w-3/4 font-black" />
              <div className="h-3 bg-muted/40 rounded-md w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Ana Grafik ve Tablo İçerik Alanı Skeletonu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Ana Grafik Alanı */}
        <div className="lg:col-span-2 bg-card/50 backdrop-blur-2xl border border-primary/10 rounded-3xl p-6 shadow-2xl min-h-[420px] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_2s_infinite]" />
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-primary/15 rounded-xl w-48" />
            <div className="h-9 w-28 bg-primary/10 rounded-xl" />
          </div>
          <div className="w-full flex-1 bg-primary/5 rounded-2xl flex items-center justify-center my-4 border border-primary/10">
            <TrendingUp className="w-12 h-12 text-primary/20 animate-bounce" />
          </div>
          <div className="flex justify-around items-center pt-4 border-t border-primary/10">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 bg-muted/50 rounded-md w-16" />
            ))}
          </div>
        </div>

        {/* Sağ Hızlı İşlemler & Liste Alanı */}
        <div className="bg-card/50 backdrop-blur-2xl border border-primary/10 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_2s_infinite]" />
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-primary/15 rounded-xl w-36" />
            <RefreshCw className="w-5 h-5 text-primary/30 animate-spin" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-primary/20 rounded-md w-24" />
                    <div className="h-3 bg-muted/40 rounded-md w-16" />
                  </div>
                </div>
                <div className="h-5 bg-primary/10 rounded-lg w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
