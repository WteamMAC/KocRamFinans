"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, PiggyBank, Coins, ArrowRight, Sparkles, ZoomOut } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts";
import { cn } from "@/lib/utils";

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState("interest");

  // --- Faiz Hesaplama State ---
  const [interestData, setInterestData] = useState({
    principal: 100000,
    rate: 45, // %
    term: 12, // Ay
  });

  const calculateInterest = () => {
    const { principal, rate, term } = interestData;
    const monthlyRate = rate / 12 / 100;
    const finalAmount = principal * (1 + monthlyRate * term);
    const profit = finalAmount - principal;

    const chartData = Array.from({ length: term + 1 }).map((_, i) => ({
      ay: `${i}. Ay`,
      tutar: Math.round(principal * (1 + monthlyRate * i)),
    }));

    return { finalAmount, profit, chartData };
  };

  const interestRes = calculateInterest();

  // --- Zoom States Interest ---
  const [intRefLeft, setIntRefLeft] = useState<string | null>(null);
  const [intRefRight, setIntRefRight] = useState<string | null>(null);
  const [intZoomData, setIntZoomData] = useState<any[] | null>(null);

  useEffect(() => {
    setIntZoomData(null);
  }, [interestData]);

  const intDataToShow = intZoomData || interestRes.chartData;

  // --- BES Hesaplama State ---
  const [besData, setBesData] = useState({
    monthly: 2000,
    contribution: 30, // % Devlet Katkısı
    annualReturn: 25, // % Tahmini Fon Getirisi
    years: 10,
  });

  const calculateBes = () => {
    const { monthly, contribution, annualReturn, years } = besData;
    const monthlyRate = annualReturn / 12 / 100;
    const totalMonths = years * 12;
    
    let totalPrincipal = 0;
    let totalWithReturn = 0;
    let govtContribution = 0;

    const chartData = [];

    for (let i = 0; i <= totalMonths; i++) {
      if (i > 0) {
        totalPrincipal += monthly;
        // Basit bileşik faiz formülü
        totalWithReturn = (totalWithReturn + monthly) * (1 + monthlyRate);
        govtContribution = totalPrincipal * (contribution / 100);
      }
      
      if (i % 12 === 0 || i === totalMonths) {
        chartData.push({
          yil: `${Math.floor(i / 12)}. Yıl`,
          birikim: Math.round(totalWithReturn + govtContribution),
          anaPara: totalPrincipal,
        });
      }
    }

    return { totalValue: totalWithReturn + govtContribution, totalPrincipal, govtContribution, chartData };
  };

  const besRes = calculateBes();

  // --- Zoom States BES ---
  const [besRefLeft, setBesRefLeft] = useState<string | null>(null);
  const [besRefRight, setBesRefRight] = useState<string | null>(null);
  const [besZoomData, setBesZoomData] = useState<any[] | null>(null);

  useEffect(() => {
    setBesZoomData(null);
  }, [besData]);

  const besDataToShow = besZoomData || besRes.chartData;

  return (
    <div className="flex-1 space-y-8 p-8 pt-10 bg-background min-h-screen pb-20">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <Calculator className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary">Finansal Hesaplayıcılar</h1>
          <p className="text-muted-foreground font-medium opacity-70">Gelecek yatırımlarınızı bugünden planlayın.</p>
        </div>
      </div>

      <div className="w-full space-y-8">
        <div className="bg-muted/50 p-1 rounded-2xl border border-border/20 w-fit h-auto flex gap-1">
          <button 
            onClick={() => setActiveTab("interest")}
            className={cn(
              "rounded-xl px-6 py-3 text-sm font-bold transition-all flex items-center",
              activeTab === "interest" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <TrendingUp className="h-4 w-4 mr-2" /> Mevduat (Faiz)
          </button>
          <button 
            onClick={() => setActiveTab("bes")}
            className={cn(
              "rounded-xl px-6 py-3 text-sm font-bold transition-all flex items-center",
              activeTab === "bes" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <PiggyBank className="h-4 w-4 mr-2" /> BES Planlama
          </button>
          <button 
            onClick={() => setActiveTab("gold")}
            className={cn(
              "rounded-xl px-6 py-3 text-sm font-bold transition-all flex items-center",
              activeTab === "gold" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Coins className="h-4 w-4 mr-2" /> Altın Birikimi
          </button>
        </div>

        {activeTab === "interest" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden bg-card h-fit">
                <CardHeader className="bg-primary/5 border-b border-border/10">
                  <CardTitle className="text-lg">Hesaplama Parametreleri</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Anapara (₺)</Label>
                    <div>
                      <Input 
                        type="number" 
                        value={interestData.principal || ""} 
                        onChange={e => setInterestData(p => ({...p, principal: Number(e.target.value)}))}
                        className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-2xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <div className="text-sm font-bold text-emerald-600 mt-2 ml-2 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> {interestData.principal.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Yıllık Faiz Oranı (%)</Label>
                    <Input 
                      type="number" 
                      value={interestData.rate || ""} 
                      onChange={e => setInterestData(p => ({...p, rate: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vade (Ay)</Label>
                    <Input 
                      type="number" 
                      value={interestData.term || ""} 
                      onChange={e => setInterestData(p => ({...p, term: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-primary text-primary-foreground p-8 rounded-[32px] shadow-ambient-high relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-10 -mt-10" />
                     <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Vade Sonu Toplam</h3>
                     <div className="text-4xl font-heading font-bold">{interestRes.finalAmount.toLocaleString("tr-TR")} ₺</div>
                  </Card>
                  <Card className="bg-card border-border/30 p-8 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Net Faiz Kazancı</h3>
                     <div className="text-4xl font-heading font-bold text-emerald-500">+{interestRes.profit.toLocaleString("tr-TR")} ₺</div>
                  </Card>
                </div>

                <Card className="p-8 border-border/30 shadow-ambient-medium rounded-[32px] bg-card overflow-hidden">
                  <CardTitle className="text-lg mb-8 flex items-center justify-between">
                     <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Birikim Gelişimi</div>
                     {intZoomData && (
                        <Button variant="outline" size="sm" onClick={() => setIntZoomData(null)} className="h-8 rounded-full text-xs">
                          <ZoomOut className="h-3 w-3 mr-1" /> Yakınlaştırmayı Sıfırla
                        </Button>
                     )}
                  </CardTitle>
                  <div className="h-[300px] w-full pr-4 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={intDataToShow}
                        onMouseDown={e => e?.activeLabel && setIntRefLeft(String(e.activeLabel))}
                        onMouseMove={e => e?.activeLabel && intRefLeft && setIntRefRight(String(e.activeLabel))}
                        onMouseUp={() => {
                          if (intRefLeft && intRefRight && intRefLeft !== intRefRight) {
                             const idx1 = intDataToShow.findIndex(d => d.ay === intRefLeft);
                             const idx2 = intDataToShow.findIndex(d => d.ay === intRefRight);
                             if (idx1 !== -1 && idx2 !== -1) {
                               const [min, max] = [idx1, idx2].sort((a,b) => a - b);
                               setIntZoomData(intDataToShow.slice(min, max + 1));
                             }
                          }
                          setIntRefLeft(null);
                          setIntRefRight(null);
                        }}
                      >
                        <defs>
                          <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="ay" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val: any) => new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(val)} dx={-10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                          formatter={(val: any) => [`${Number(val).toLocaleString("tr-TR")} ₺`, "Bakiye"]}
                        />
                        <Area type="monotone" dataKey="tutar" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInt)" />
                        {intRefLeft && intRefRight ? (
                          <ReferenceArea x1={intRefLeft} x2={intRefRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.2} />
                        ) : null}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bes" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden bg-card h-fit">
                <CardHeader className="bg-emerald-500/5 border-b border-border/10">
                  <CardTitle className="text-lg">BES Planı Parametreleri</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aylık Katkı Payı (₺)</Label>
                    <div>
                      <Input 
                        type="number" 
                        value={besData.monthly || ""} 
                        onChange={e => setBesData(p => ({...p, monthly: Number(e.target.value)}))}
                        className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-2xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <div className="text-sm font-bold text-emerald-600 mt-2 ml-2 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> {besData.monthly.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Devlet Katkısı Oranı (%)</Label>
                    <Input 
                      type="number" 
                      value={besData.contribution || ""} 
                      className="h-14 rounded-2xl bg-muted border-none font-bold text-xl text-primary opacity-60"
                      disabled
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tahmini Yıllık Fon Getirisi (%)</Label>
                    <Input 
                      type="number" 
                      value={besData.annualReturn || ""} 
                      onChange={e => setBesData(p => ({...p, annualReturn: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Süre (Yıl)</Label>
                    <Input 
                      type="number" 
                      value={besData.years || ""} 
                      onChange={e => setBesData(p => ({...p, years: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-emerald-600 text-white p-6 rounded-[32px] shadow-ambient-high">
                     <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Toplam Birikim</h3>
                     <div className="text-2xl font-heading font-bold">{besRes.totalValue.toLocaleString("tr-TR")} ₺</div>
                  </Card>
                  <Card className="bg-card border-border/30 p-6 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ödediğiniz Tutar</h3>
                     <div className="text-2xl font-heading font-bold text-primary">{besRes.totalPrincipal.toLocaleString("tr-TR")} ₺</div>
                  </Card>
                  <Card className="bg-card border-border/30 p-6 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Devlet Katkısı</h3>
                     <div className="text-2xl font-heading font-bold text-emerald-500">+{besRes.govtContribution.toLocaleString("tr-TR")} ₺</div>
                  </Card>
                </div>

                <Card className="p-8 border-border/30 shadow-ambient-medium rounded-[32px] bg-card overflow-hidden">
                  <CardTitle className="text-lg mb-8 flex items-center justify-between">
                     Uzun Vadeli BES Gelişimi
                     {besZoomData && (
                        <Button variant="outline" size="sm" onClick={() => setBesZoomData(null)} className="h-8 rounded-full text-xs">
                          <ZoomOut className="h-3 w-3 mr-1" /> Yakınlaştırmayı Sıfırla
                        </Button>
                     )}
                  </CardTitle>
                  <div className="h-[300px] w-full pr-4 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={besDataToShow}
                        onMouseDown={e => e?.activeLabel && setBesRefLeft(String(e.activeLabel))}
                        onMouseMove={e => e?.activeLabel && besRefLeft && setBesRefRight(String(e.activeLabel))}
                        onMouseUp={() => {
                          if (besRefLeft && besRefRight && besRefLeft !== besRefRight) {
                             const idx1 = besDataToShow.findIndex(d => d.yil === besRefLeft);
                             const idx2 = besDataToShow.findIndex(d => d.yil === besRefRight);
                             if (idx1 !== -1 && idx2 !== -1) {
                               const [min, max] = [idx1, idx2].sort((a,b) => a - b);
                               setBesZoomData(besDataToShow.slice(min, max + 1));
                             }
                          }
                          setBesRefLeft(null);
                          setBesRefRight(null);
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="yil" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val: any) => new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(val)} dx={-10} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                           formatter={(val: any) => [`${Number(val).toLocaleString("tr-TR")} ₺`, "Toplam"]}
                        />
                        <Area type="monotone" dataKey="birikim" stroke="#10b981" strokeWidth={3} fillOpacity={0.2} fill="#10b981" />
                        <Area type="monotone" dataKey="anaPara" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.1} fill="#3b82f6" strokeDasharray="5 5" />
                        {besRefLeft && besRefRight ? (
                          <ReferenceArea x1={besRefLeft} x2={besRefRight} strokeOpacity={0.3} fill="#10b981" fillOpacity={0.2} />
                        ) : null}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Toplam Birikim
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-dashed border-blue-500 rounded-full" /> Ana Para
                     </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gold" && (
           <div className="p-20 text-center space-y-4">
              <Coins className="h-16 w-16 text-amber-500 mx-auto animate-bounce" />
              <h2 className="text-2xl font-bold text-primary">Altın Birikim Hesaplayıcı Yakında!</h2>
              <p className="text-muted-foreground">Şu an Mevduat ve BES hesaplayıcılarını kullanabilirsiniz.</p>
           </div>
        )}
      </div>
    </div>
  );
}
