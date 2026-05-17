"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addIncome, addExpense } from "@/app/actions/income-expense";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Camera, Loader2, Sparkles } from "lucide-react";
import { processReceiptWithAI } from "@/app/actions/ocr";
import Link from "next/link";
import { useCurrency, DISPLAY_CURRENCIES_LIST } from "@/context/currency-context";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AddTransactionFormProps {
  initialType?: "income" | "expense";
}

export function AddTransactionForm({ initialType = "expense" }: AddTransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type") as "income" | "expense" | null;
  
  const [type, setType] = useState<"income" | "expense">(requestedType || initialType);
  const { rates } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    currency: "TRY",
    description: "",
    isRecurring: false,
    dueDate: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [isScanning, setIsScanning] = useState(false);

  const categories = type === "income" 
    ? ["Maaş", "Kira Geliri", "Yatırım Geliri", "Freelance", "Satış Geliri", "Hediye", "Diğer"]
    : ["Market", "Kira", "Fatura", "Ulaşım", "Eğlence", "Sağlık", "Eğitim", "Giyim", "Diğer"];

  const handleSave = async () => {
    if (!formData.amount || !formData.category) {
        setError("Lütfen tüm alanları doldurun.");
        return;
    }
    
    setLoading(true);
    setError(null);

    const selectedRate = rates[formData.currency] || 1;
    const originalAmount = Number(formData.amount);
    const amountInTry = originalAmount * selectedRate;

    try {
      if (type === "income") {
        await addIncome({
          type: formData.category,
          amount: amountInTry,
          isRecurring: formData.isRecurring,
          dueDate: formData.dueDate ? Number(formData.dueDate) : undefined,
          date: new Date(formData.date),
          description: formData.description,
          currency: formData.currency,
          originalAmount: originalAmount,
          fxRate: selectedRate,
        });
      } else {
        await addExpense({
          type: formData.category,
          amount: amountInTry,
          isRecurring: formData.isRecurring,
          dueDate: formData.dueDate ? Number(formData.dueDate) : undefined,
          date: new Date(formData.date),
          description: formData.description,
          currency: formData.currency,
          originalAmount: originalAmount,
          fxRate: selectedRate,
        });
      }
      router.push("/dashboard/income-expense/history");
      router.refresh();
    } catch (err) {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const res = await processReceiptWithAI(base64String, file.type);
        
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            amount: res.data.amount.toString(),
            category: categories.includes(res.data.category) ? res.data.category : "Diğer",
            description: res.data.description || "Fiş/Fatura Taraması"
          }));
        } else {
          setError(res.error || "Fiş okunamadı.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Dosya işlenirken hata oluştu.");
      setIsScanning(false);
    }
  };

  const isIncome = type === "income";

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/income-expense/history">
              <Button variant="ghost" size="icon" className="rounded-2xl bg-muted/50 border border-border/10 hover:bg-muted">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-black text-primary tracking-tight">Yeni İşlem</h1>
            <p className="text-xs text-muted-foreground font-bold opacity-60 uppercase tracking-widest">Gelir veya Gider Kaydet</p>
          </div>
        </div>

        {/* Premium Toggle Switch */}
        <div className="bg-muted/50 p-1.5 rounded-3xl border border-border/10 flex relative w-full md:w-auto h-[60px] md:min-w-[280px]">
          <motion.div
            className={cn(
              "absolute top-1.5 bottom-1.5 rounded-[22px] shadow-xl z-0",
              isIncome ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
            )}
            layoutId="activeTab"
            initial={false}
            animate={{
              left: isIncome ? "6px" : "50%",
              width: "calc(50% - 6px)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          
          <button
            onClick={() => setType("income")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 font-black text-sm transition-all duration-300",
              isIncome ? "text-emerald-500 scale-105" : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            <TrendingUp className={cn("h-4 w-4", isIncome && "animate-bounce")} />
            GELİR
          </button>
          
          <button
            onClick={() => setType("expense")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 font-black text-sm transition-all duration-300",
              !isIncome ? "text-rose-500 scale-105" : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            <TrendingDown className={cn("h-4 w-4", !isIncome && "animate-bounce")} />
            GİDER
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "circOut" }}
        >
          <Card className="border-border/30 shadow-ambient-high rounded-[40px] !overflow-visible bg-card/80 backdrop-blur-xl relative">
            <div className={cn(
              "absolute inset-x-0 top-0 h-2",
              isIncome ? "bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.3)]" : "bg-rose-500 shadow-[0_4px_20px_rgba(244,63,94,0.3)]"
            )} />
            
            <CardHeader className="pt-10 pb-4 px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl shadow-inner",
                          isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                            {isIncome ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
                        </div>
                        <div>
                            <CardTitle className="text-xl font-heading font-black">{isIncome ? "Gelir Kaydı" : "Gider Kaydı"}</CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Finansal Akış Detayları</p>
                        </div>
                    </div>
                    {!isIncome && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <input type="file" accept="image/*" id="receipt-upload" className="hidden" onChange={handleFileUpload} />
                        <Label htmlFor="receipt-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 text-primary px-5 py-2.5 rounded-2xl border border-primary/10 transition-all shadow-sm group">
                            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 transition-transform group-hover:scale-110" />}
                            <span className="text-xs font-black uppercase tracking-wider">{isScanning ? "Taranıyor..." : "Fiş Tara"}</span>
                          </div>
                        </Label>
                      </motion.div>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="p-8 pt-6 space-y-8">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-black border border-rose-500/20 uppercase tracking-wider"
                >
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kategori Seçimi */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 block">Kategori</Label>
                  <Select onValueChange={(v: any) => setFormData(p => ({ ...p, category: v ?? "" }))}>
                    <SelectTrigger className="bg-muted/30 border-border/20 h-14 rounded-2xl text-sm font-bold focus:ring-primary shadow-sm hover:bg-muted/50 transition-colors">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/20 bg-card font-bold shadow-2xl">
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="rounded-xl m-1">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* İşlem Tarihi */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 block">İşlem Tarihi</Label>
                  <DatePicker
                    date={formData.date ? parseISO(formData.date) : undefined}
                    setDate={(d) => setFormData(p => ({ ...p, date: d ? d.toISOString().split('T')[0] : "" }))}
                    placeholder="Tarih Seç"
                    className="h-14 rounded-2xl bg-muted/30 border-border/20 font-bold hover:bg-muted/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 block">Tutar</Label>
                  <div className="relative group">
                    <div className={cn(
                      "absolute inset-y-0 left-6 flex items-center transition-colors",
                      isIncome ? "text-emerald-500" : "text-rose-500"
                    )}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                      className={cn(
                        "pl-14 bg-muted/30 border-border/20 h-16 rounded-[24px] text-2xl font-black transition-all focus:ring-4",
                        isIncome ? "text-emerald-500 focus:ring-emerald-500/10" : "text-rose-500 focus:ring-rose-500/10"
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 block">Birim</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData(p => ({ ...p, currency: String(v) }))}>
                    <SelectTrigger className="bg-muted/30 border-border/20 h-16 rounded-[24px] font-black text-base shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-card font-bold max-h-60 shadow-2xl">
                      {DISPLAY_CURRENCIES_LIST.map(c => (
                        <SelectItem key={c.code} value={c.code} className="rounded-xl m-1">
                          {c.flag} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 block">Açıklama</Label>
                <Input
                  placeholder="Detaylı notlar (opsiyonel)..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="bg-muted/30 border-border/20 h-14 rounded-2xl font-bold shadow-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <div className="flex-1 flex items-center space-x-4 bg-muted/20 p-5 rounded-3xl border border-border/10 transition-all hover:bg-muted/40 cursor-pointer group" onClick={() => setFormData(p => ({ ...p, isRecurring: !p.isRecurring }))}>
                  <Checkbox
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData(p => ({ ...p, isRecurring: !!checked }))}
                    className={cn(
                      "h-6 w-6 border-2 transition-all",
                      isIncome ? "data-[state=checked]:bg-emerald-500 border-emerald-500/30" : "data-[state=checked]:bg-rose-500 border-rose-500/30"
                    )}
                  />
                  <Label htmlFor="isRecurring" className="text-xs font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none">
                    {isIncome ? "Düzenli Gelir (Her Ay)" : "Düzenli Gider (Her Ay)"}
                  </Label>
                </div>

                {formData.isRecurring && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 space-y-3"
                  >
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 block">Ödeme Günü (1-31)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Örn: 15"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                      className="bg-muted/30 border-border/20 h-14 rounded-2xl font-black text-center shadow-sm"
                    />
                  </motion.div>
                )}
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className={cn(
                    "w-full h-18 rounded-[28px] text-xl font-black shadow-2xl transition-all active:scale-[0.98] group relative overflow-hidden",
                    isIncome 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                  )}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>KAYDEDİLİYOR</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>{isIncome ? "GELİRİ" : "GİDERİ"} KAYDET</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <ArrowLeft className="h-6 w-6 rotate-180" />
                      </motion.div>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
