"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, PiggyBank, Coins, ArrowRight, Sparkles, ZoomOut, Zap, Percent, Info, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts";
import { cn } from "@/lib/utils";
import { useCurrency, DISPLAY_CURRENCIES_MAP } from "@/context/currency-context";
import { CompactCurrencyCalculator } from "@/components/dashboard/compact-currency-calculator";

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState("interest");
  const { displayCurrency } = useCurrency();
  const curSymbol = DISPLAY_CURRENCIES_MAP[displayCurrency]?.symbol || "₺";

  // --- Faiz Hesaplama State ---
  const [interestData, setInterestData] = useState({
    principal: 100000,
    rate: 45, // %
    term: 12, // Ay
  });

  const calculateInterest = () => {
    const { principal, rate, term } = interestData;
    const monthlyRate = rate / 12 / 100;
    
    // Bileşik faiz: A = P * (1 + r)^n
    const finalAmount = principal * Math.pow(1 + monthlyRate, term);
    const profit = finalAmount - principal;

    const chartData = Array.from({ length: term + 1 }).map((_, i) => ({
      ay: `${i}. Ay`,
      tutar: Math.round(principal * Math.pow(1 + monthlyRate, i)),
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

  // --- Kaldıraç Hesaplama State ---
  const [leverageData, setLeverageData] = useState({
    capital: 1000,
    leverage: 10,
    entryPrice: 50000,
    side: "long" as "long" | "short",
    exitPrice: 55000,
  });

  const calculateLeverage = () => {
    const { capital, leverage, entryPrice, side, exitPrice } = leverageData;
    const positionSize = capital * leverage;
    const maintenanceMarginRate = 0.005; // %0.5 likidasyon payı

    let liquidationPrice = 0;
    if (side === "long") {
      liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
    } else {
      liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
    }

    let pnl = 0;
    if (side === "long") {
      pnl = (exitPrice - entryPrice) * (positionSize / entryPrice);
    } else {
      pnl = (entryPrice - exitPrice) * (positionSize / entryPrice);
    }

    const roi = (pnl / capital) * 100;

    return { positionSize, liquidationPrice, pnl, roi };
  };

  const levRes = calculateLeverage();

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6 md:pt-10 bg-background min-h-screen pb-20 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-primary/10 text-primary rounded-xl md:rounded-2xl">
            <Calculator className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-heading font-bold text-primary">Finansal Hesaplayıcılar</h1>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground opacity-70">Gelecek yatırımlarınızı bugünden planlayın.</p>
          </div>
        </div>
        <div className="w-full md:w-auto">
          <CompactCurrencyCalculator />
        </div>
      </div>

      <div className="w-full space-y-6 md:space-y-8">
        <div className="overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          <div className="bg-muted/50 p-1 rounded-2xl border border-border/20 w-max md:w-fit h-auto flex gap-1">
            <button 
              onClick={() => setActiveTab("interest")}
              className={cn(
                "rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all flex items-center whitespace-nowrap",
                activeTab === "interest" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <TrendingUp className="h-4 w-4 mr-2" /> Mevduat (Faiz)
            </button>
            <button 
              onClick={() => setActiveTab("bes")}
              className={cn(
                "rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all flex items-center whitespace-nowrap",
                activeTab === "bes" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <PiggyBank className="h-4 w-4 mr-2" /> BES Planlama
            </button>
            <button 
              onClick={() => setActiveTab("gold")}
              className={cn(
                "rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all flex items-center whitespace-nowrap",
                activeTab === "gold" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Coins className="h-4 w-4 mr-2" /> Altın Birikimi
            </button>
            <button 
              onClick={() => setActiveTab("leverage")}
              className={cn(
                "rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all flex items-center whitespace-nowrap",
                activeTab === "leverage" ? "bg-card text-primary shadow-ambient-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Zap className="h-4 w-4 mr-2" /> Kaldıraç (Futures)
            </button>
          </div>
        </div>

        {activeTab === "interest" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden bg-card h-fit">
                <CardHeader className="bg-primary/5 border-b border-border/10">
                  <CardTitle className="text-lg">Hesaplama Parametreleri</CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-8 space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Anapara ({curSymbol})</Label>
                    <div>
                      <Input 
                        type="number" 
                        value={interestData.principal || ""} 
                        onChange={e => setInterestData(p => ({...p, principal: Number(e.target.value)}))}
                        className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl md:text-2xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <div className="text-xs md:text-sm font-bold text-emerald-600 mt-2 ml-1 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> {interestData.principal.toLocaleString("tr-TR")} {curSymbol}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Card className="bg-primary text-primary-foreground p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-ambient-high relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-10 -mt-10" />
                     <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Vade Sonu Toplam</h3>
                     <div className="text-2xl md:text-4xl font-heading font-bold">{Math.round(interestRes.finalAmount).toLocaleString("tr-TR")} {curSymbol}</div>
                  </Card>
                  <Card className="bg-card border-border/30 p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Net Faiz Kazancı</h3>
                     <div className="text-2xl md:text-4xl font-heading font-bold text-emerald-500">+{Math.round(interestRes.profit).toLocaleString("tr-TR")} {curSymbol}</div>
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
                          formatter={(val: any) => [`${Number(val).toLocaleString("tr-TR")} ${curSymbol}`, "Bakiye"]}
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
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aylık Katkı Payı ({curSymbol})</Label>
                    <div>
                      <Input 
                        type="number" 
                        value={besData.monthly || ""} 
                        onChange={e => setBesData(p => ({...p, monthly: Number(e.target.value)}))}
                        className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-2xl text-primary transition-all focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <div className="text-sm font-bold text-emerald-600 mt-2 ml-2 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> {besData.monthly.toLocaleString("tr-TR")} {curSymbol}
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
                     <div className="text-2xl font-heading font-bold">{Math.round(besRes.totalValue).toLocaleString("tr-TR")} {curSymbol}</div>
                  </Card>
                  <Card className="bg-card border-border/30 p-6 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ödediğiniz Tutar</h3>
                     <div className="text-2xl font-heading font-bold text-primary">{Math.round(besRes.totalPrincipal).toLocaleString("tr-TR")} {curSymbol}</div>
                  </Card>
                  <Card className="bg-card border-border/30 p-6 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Devlet Katkısı</h3>
                     <div className="text-2xl font-heading font-bold text-emerald-500">+{Math.round(besRes.govtContribution).toLocaleString("tr-TR")} {curSymbol}</div>
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
                           formatter={(val: any) => [`${Number(val).toLocaleString("tr-TR")} ${curSymbol}`, "Toplam"]}
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

        {activeTab === "leverage" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden bg-card h-fit">
                <CardHeader className="bg-orange-500/5 border-b border-border/10">
                  <CardTitle className="text-lg">Pozisyon Parametreleri</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex p-1 bg-muted rounded-xl gap-1">
                    <button
                      onClick={() => setLeverageData(p => ({...p, side: "long"}))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        leverageData.side === "long" ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:bg-muted-foreground/10"
                      )}
                    >
                      <TrendingUp className="h-4 w-4" /> LONG
                    </button>
                    <button
                      onClick={() => setLeverageData(p => ({...p, side: "short"}))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        leverageData.side === "short" ? "bg-red-500 text-white shadow-lg" : "text-muted-foreground hover:bg-muted-foreground/10"
                      )}
                    >
                      <TrendingDown className="h-4 w-4" /> SHORT
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Marjin / Sermaye ({curSymbol})</Label>
                    <Input 
                      type="number" 
                      value={leverageData.capital || ""} 
                      onChange={e => setLeverageData(p => ({...p, capital: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-2xl text-primary transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kaldıraç (x)</Label>
                      <span className="text-lg font-bold text-primary">{leverageData.leverage}x</span>
                    </div>
                    <input 
                      type="range"
                      value={leverageData.leverage}
                      min={1}
                      max={125}
                      step={1}
                      onChange={(e) => setLeverageData(p => ({...p, leverage: Number(e.target.value)}))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>1x</span>
                      <span>25x</span>
                      <span>50x</span>
                      <span>75x</span>
                      <span>100x</span>
                      <span>125x</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Giriş Fiyatı ({curSymbol})</Label>
                    <Input 
                      type="number" 
                      value={leverageData.entryPrice || ""} 
                      onChange={e => setLeverageData(p => ({...p, entryPrice: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl text-primary transition-all"
                    />
                  </div>

                  <div className="space-y-3 border-t border-border/10 pt-6">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hedef/Tahmini Fiyat ({curSymbol})</Label>
                    <Input 
                      type="number" 
                      value={leverageData.exitPrice || ""} 
                      onChange={e => setLeverageData(p => ({...p, exitPrice: Number(e.target.value)}))}
                      className="h-14 rounded-2xl bg-muted/30 border border-border/50 font-bold text-xl text-primary transition-all"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={cn(
                    "p-8 rounded-[32px] shadow-ambient-high relative overflow-hidden text-white",
                    leverageData.side === "long" ? "bg-emerald-600" : "bg-red-600"
                  )}>
                     <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-10 -mt-10" />
                     <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Likidasyon Fiyatı</h3>
                     <div className="text-4xl font-heading font-bold">{curSymbol}{levRes.liquidationPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                     <p className="text-[10px] mt-2 opacity-60 flex items-center gap-1 uppercase tracking-tighter">
                       <Info className="h-3 w-3" /> Fiyat bu seviyeye gelirse pozisyonunuz kapanır.
                     </p>
                  </Card>
                  <Card className="bg-card border-border/30 p-8 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Pozisyon Büyüklüğü</h3>
                     <div className="text-4xl font-heading font-bold text-primary">{curSymbol}{levRes.positionSize.toLocaleString("tr-TR")}</div>
                     <p className="text-xs font-medium text-muted-foreground mt-2">Sermaye: {curSymbol}{leverageData.capital.toLocaleString("tr-TR")} x {leverageData.leverage}x</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border-border/30 p-8 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Tahmini Kar/Zarar (PNL)</h3>
                     <div className={cn(
                       "text-4xl font-heading font-bold",
                       levRes.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                     )}>
                       {levRes.pnl >= 0 ? "+" : ""}{levRes.pnl.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curSymbol}
                     </div>
                  </Card>
                  <Card className="bg-card border-border/30 p-8 rounded-[32px] shadow-ambient-medium">
                     <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">ROI (%)</h3>
                     <div className={cn(
                       "text-4xl font-heading font-bold",
                       levRes.roi >= 0 ? "text-emerald-500" : "text-red-500"
                     )}>
                       {levRes.roi >= 0 ? "+" : ""}{levRes.roi.toFixed(2)}%
                     </div>
                  </Card>
                </div>

                <Card className="p-8 border-border/30 shadow-ambient-medium rounded-[32px] bg-card overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                      <Percent className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold">Risk Yönetimi Hatırlatması</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Kaldıraçlı işlemler yüksek risk içerir. Likidasyon fiyatı, giriş fiyatınızdan ne kadar uzaksa riskiniz o kadar düşüktür. 
                        Her zaman Stop-Loss kullanmayı ve kaybetmeyi göze alabileceğiniz tutarlarla işlem yapmayı unutmayın.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
