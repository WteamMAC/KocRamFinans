"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { completeOnboarding } from "@/app/actions/onboarding";
import { searchSymbolsAction } from "@/app/actions/market";
import { 
  Plus, 
  Trash2, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Search,
  ArrowUpRight,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const onboardingSchema = z.object({
  familyCount: z.coerce.number().min(1, "En az 1 kişi olmalıdır."),
  incomes: z.array(z.object({
    type: z.string().min(1, "Tür seçiniz"),
    amount: z.coerce.number().min(1, "Miktar giriniz"),
    description: z.string().optional(),
  })),
  expenses: z.array(z.object({
    type: z.string().min(1, "Gider türü/adı giriniz"),
    amount: z.coerce.number().min(1, "Miktar giriniz"),
    dueDate: z.coerce.number().min(1, "1-31 arası gün giriniz").max(31, "1-31 arası gün giriniz"),
    isRecurring: z.boolean().default(true),
    description: z.string().optional(),
  })),
  debts: z.array(z.object({
    type: z.string().min(1, "Borç türü/adı giriniz"),
    amount: z.coerce.number().min(1, "Borç tutarı giriniz"),
    remainingInstallments: z.coerce.number().optional(),
    description: z.string().optional(),
  })),
  investments: z.array(z.object({
    type: z.string().min(1, "Tür seçiniz"),
    symbol: z.string().min(1, "Varlık sembolü seçiniz"),
    quantity: z.coerce.number().min(0.00001, "Miktar giriniz"),
    purchasePrice: z.coerce.number().min(0.00001, "Alış fiyatı giriniz"),
    currentValuation: z.coerce.number().optional(),
    description: z.string().optional(),
  })),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm({ initialData, isSettings = false }: { initialData?: OnboardingValues, isSettings?: boolean }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [searchResults, setSearchResults] = useState<Record<number, any[]>>({});
  const [showSearch, setShowSearch] = useState<Record<number, boolean>>({});
  const inputRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: initialData || {
      familyCount: 1,
      incomes: [{ type: "Maaş", amount: 0 }],
      expenses: [],
      debts: [],
      investments: [],
    },
    mode: "onChange",
  });

  const { fields: incomeFields, append: appendIncome, remove: removeIncome } = useFieldArray({
    control: form.control,
    name: "incomes",
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  const { fields: debtFields, append: appendDebt, remove: removeDebt } = useFieldArray({
    control: form.control,
    name: "debts",
  });

  const { fields: investmentFields, append: appendInvestment, remove: removeInvestment } = useFieldArray({
    control: form.control,
    name: "investments",
  });

  const handleSearch = async (index: number, query: string, type: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: query }));
    form.setValue(`investments.${index}.symbol`, query);
    
    if (query.length >= 2) {
      const results = await searchSymbolsAction(query, type);
      setSearchResults(prev => ({ ...prev, [index]: results }));
      setShowSearch(prev => ({ ...prev, [index]: true }));
    } else {
      setShowSearch(prev => ({ ...prev, [index]: false }));
    }
  };

  async function onSubmit(data: OnboardingValues) {
    setLoading(true);
    try {
      const cleanedInvestments = data.investments.map(inv => {
        let sym = inv.symbol || "";
        if (sym.includes("(")) sym = sym.split(" ")[0];
        return { ...inv, symbol: sym.toUpperCase() };
      });

      await completeOnboarding({ ...data, investments: cleanedInvestments } as any);
      router.push("/dashboard");
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT") return;
      console.error("Güncelleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["familyCount", "incomes"];
    if (step === 2) fieldsToValidate = ["expenses"];
    if (step === 3) fieldsToValidate = ["debts"];
    if (step === 4) fieldsToValidate = ["investments"];
    
    const isValid = await form.trigger(fieldsToValidate as any);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await canContinue();
    if (isValid) setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <Card className={cn(
      "w-full max-w-4xl mx-auto border-[#c4c6d2]/20 shadow-2xl bg-white rounded-[32px] overflow-hidden",
      isSettings ? "mt-4" : "animate-in fade-in zoom-in-95 duration-700"
    )}>
      <CardHeader className="text-center pt-10 pb-6 bg-[#faf9f6]/50 border-b border-[#c4c6d2]/10">
        {!isSettings && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500",
                      step === i ? "bg-[#001b44] text-white scale-110 shadow-lg" : 
                      step > i ? "bg-emerald-500 text-white" : "bg-[#e3e2e0] text-[#747781]"
                    )}
                  >
                    {step > i ? <Check className="w-5 h-5" /> : i}
                  </div>
                  {i < 4 && (
                    <div className={cn(
                      "w-8 h-1 mx-2 rounded-full transition-colors duration-500",
                      step > i ? "bg-emerald-500" : "bg-[#e3e2e0]"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mb-2">
           <BarChart3 className="h-6 w-6 text-[#fed65b] fill-[#fed65b]" />
           <span className="text-[10px] font-bold text-[#735c00] uppercase tracking-[0.2em]">Sovereign Intelligence</span>
        </div>
        <CardTitle className="text-4xl font-heading font-bold text-[#001b44] tracking-tight">
          {step === 1 && (isSettings ? "Profil Düzenleme" : "Hoş Geldiniz")}
          {step === 2 && "Giderler"}
          {step === 3 && "Borç Durumu"}
          {step === 4 && "Varlık Portföyü"}
        </CardTitle>
        <CardDescription className="text-[#434750] mt-2 font-medium">
          {step === 4 ? "Elinizdeki varlıkların adet ve alış fiyatlarını girerek maliyet takibini başlatın." : "Yıldız (*) ile işaretli alanlar zorunludur."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest px-1">
                   Aile Kişi Sayısı <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#434750] opacity-50" />
                  <Input 
                    type="number" 
                    {...form.register("familyCount")} 
                    className={cn(
                      "pl-12 bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl focus:ring-[#001b44]",
                      form.formState.errors.familyCount && "border-rose-300 ring-rose-100"
                    )}
                  />
                </div>
                {form.formState.errors.familyCount && (
                  <p className="text-[10px] font-bold text-rose-500 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {form.formState.errors.familyCount.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest">
                     Gelir Kaynakları <span className="text-rose-500">*</span>
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => appendIncome({ type: "Maaş", amount: 0 })} className="text-[#001b44] hover:bg-[#faf9f6] font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Ekle
                  </Button>
                </div>
                
                {incomeFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <div className="flex gap-4 items-end animate-in fade-in duration-300">
                      <div className="flex-1 space-y-2">
                        <Select 
                          onValueChange={(val) => form.setValue(`incomes.${index}.type`, val || "")}
                          defaultValue={field.type}
                        >
                          <SelectTrigger className="bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl">
                            <SelectValue placeholder="Tür" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Maaş">Maaş</SelectItem>
                            <SelectItem value="Eş Maaşı">Eş Maaşı</SelectItem>
                            <SelectItem value="Kira Geliri">Kira Geliri</SelectItem>
                            <SelectItem value="Sosyal Medya">Sosyal Medya</SelectItem>
                            <SelectItem value="Taksi/Ek İş">Taksi/Ek İş</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input 
                          type="number" 
                          placeholder="Miktar" 
                          {...form.register(`incomes.${index}.amount`)} 
                          className={cn(
                            "bg-[#faf9f6] border-[#c4c6d2]/30 h-12 rounded-xl",
                            form.formState.errors.incomes?.[index]?.amount && "border-rose-300"
                          )}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeIncome(index)} className="h-12 w-12 hover:bg-rose-50 text-rose-500 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest">
                   Giderler ve Faturalar <span className="text-rose-500">*</span>
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => appendExpense({ type: "", amount: 0, dueDate: 1, isRecurring: true })} className="text-[#001b44] font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
              
              <div className="grid gap-4">
                {expenseFields.map((field, index) => (
                  <div key={field.id} className="p-6 bg-[#faf9f6] border border-[#c4c6d2]/20 rounded-[24px] relative group hover:shadow-md transition-all">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Açıklama <span className="text-rose-500">*</span></Label>
                        <Input placeholder="Örn: Kira, Elektrik" {...form.register(`expenses.${index}.type`)} className="bg-white border-[#c4c6d2]/20 h-10 rounded-lg" />
                      </div>
                      <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Miktar <span className="text-rose-500">*</span></Label>
                        <Input type="number" placeholder="0 ₺" {...form.register(`expenses.${index}.amount`)} className="bg-white border-[#c4c6d2]/20 h-10 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Ödeme Günü (1-31) <span className="text-rose-500">*</span></Label>
                        <Input type="number" {...form.register(`expenses.${index}.dueDate`)} className="bg-white border-[#c4c6d2]/20 h-10 rounded-lg" />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input type="checkbox" {...form.register(`expenses.${index}.isRecurring`)} className="w-4 h-4 rounded border-[#c4c6d2] text-[#001b44] focus:ring-[#001b44]" />
                        <Label className="text-xs font-bold text-[#001b44]">Düzenli Ödeme</Label>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-4 right-4 hover:bg-rose-50 text-rose-500" onClick={() => removeExpense(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest">
                   Borçlar ve Taksitler <span className="text-rose-500">*</span>
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => appendDebt({ type: "Kredi Kartı", amount: 0 })} className="text-[#001b44] font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
              
              <div className="grid gap-4">
                {debtFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-6 bg-[#faf9f6] border border-[#c4c6d2]/20 rounded-[24px]">
                    <div className="space-y-2">
                       <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Borç Türü <span className="text-rose-500">*</span></Label>
                       <Input placeholder="Örn: Banka, Şahıs" {...form.register(`debts.${index}.type`)} className="bg-white border-[#c4c6d2]/20 h-10 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Toplam Tutar <span className="text-rose-500">*</span></Label>
                       <Input type="number" {...form.register(`debts.${index}.amount`)} className="bg-white border-[#c4c6d2]/20 h-10 rounded-lg" />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Kalan Taksit</Label>
                        <Input type="number" {...form.register(`debts.${index}.remainingInstallments`)} className="bg-white border-[#c4c6d2]/20 h-10 rounded-lg" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDebt(index)} className="h-10 w-10 hover:bg-rose-50 text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-bold text-[#747781] uppercase tracking-widest">
                   Yatırım Portföyü <span className="text-rose-500">*</span>
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => appendInvestment({ type: "BIST", symbol: "", quantity: 0, purchasePrice: 0 })} className="text-[#001b44] font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
              
              <div className="grid gap-6">
                {investmentFields.map((field, index) => (
                  <div key={field.id} className="p-8 bg-[#faf9f6] border border-[#c4c6d2]/20 rounded-[32px] relative group hover:shadow-lg transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Varlık Türü</Label>
                        <Controller
                          name={`investments.${index}.type` as any}
                          control={form.control}
                          render={({ field: selectField }) => (
                            <Select 
                              onValueChange={(val) => {
                                selectField.onChange(val);
                                form.setValue(`investments.${index}.symbol`, "");
                                setSearchQueries(p => ({ ...p, [index]: "" }));
                              }} 
                              defaultValue={selectField.value}
                            >
                              <SelectTrigger className="bg-white border-[#c4c6d2]/20 h-12 rounded-xl">
                                <SelectValue placeholder="Tür Seç" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                                <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                                <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                                <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2 relative" ref={el => { inputRefs.current[index] = el; }}>
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Sembol / İçerik <span className="text-rose-500">*</span></Label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#434750] opacity-40" />
                          <Input 
                            placeholder="Örn: THYAO, BTC" 
                            value={searchQueries[index] || form.getValues(`investments.${index}.symbol`) || ""}
                            onChange={(e) => handleSearch(index, e.target.value, form.getValues(`investments.${index}.type`))}
                            className={cn(
                              "pl-12 bg-white border-[#c4c6d2]/20 h-12 rounded-xl",
                              form.formState.errors.investments?.[index]?.symbol && "border-rose-300"
                            )}
                          />
                        </div>

                        {showSearch[index] && searchResults[index]?.length > 0 && inputRefs.current[index] && (
                          <div className="absolute z-[100] top-full mt-2 left-0 w-full bg-white border border-[#c4c6d2]/30 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                             {searchResults[index].map((result: any, ridx: number) => (
                               <div 
                                 key={ridx}
                                 className="p-3 hover:bg-[#faf9f6] cursor-pointer border-b border-[#c4c6d2]/10 last:border-0 flex items-center justify-between group"
                                 onClick={() => {
                                   const sym = `${result.symbol} (${result.shortname || result.symbol})`;
                                   form.setValue(`investments.${index}.symbol`, sym);
                                   setSearchQueries(p => ({ ...p, [index]: sym }));
                                   setShowSearch(p => ({ ...p, [index]: false }));
                                 }}
                               >
                                 <div className="flex flex-col">
                                   <span className="font-bold text-[#001b44]">{result.symbol}</span>
                                   <span className="text-[9px] text-[#434750] opacity-60">{result.shortname || result.longname}</span>
                                 </div>
                                 <ArrowUpRight className="h-3 w-3 text-[#fed65b] opacity-0 group-hover:opacity-100 transition-all" />
                               </div>
                             ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Adet / Miktar <span className="text-rose-500">*</span></Label>
                        <Input 
                          type="number" 
                          step="any"
                          {...form.register(`investments.${index}.quantity`, { valueAsNumber: true })} 
                          className="bg-white border-[#c4c6d2]/20 h-12 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-[#747781] uppercase px-1">Birim Alış Fiyatı (₺) <span className="text-rose-500">*</span></Label>
                        <Input 
                          type="number" 
                          step="any"
                          {...form.register(`investments.${index}.purchasePrice`, { valueAsNumber: true })} 
                          className="bg-white border-[#c4c6d2]/20 h-12 rounded-xl"
                        />
                      </div>
                    </div>
                    
                    {/* Özet Bilgi */}
                    {form.watch(`investments.${index}.quantity`) > 0 && form.watch(`investments.${index}.purchasePrice`) > 0 && (
                       <div className="mt-4 p-4 bg-[#001b44]/5 rounded-2xl flex items-center justify-between border border-[#001b44]/10">
                          <span className="text-[10px] font-bold text-[#001b44] uppercase tracking-wider">Toplam Yatırım Tutarı:</span>
                          <span className="text-lg font-bold text-[#001b44]">
                             {(form.watch(`investments.${index}.quantity`) * form.watch(`investments.${index}.purchasePrice`)).toLocaleString('tr-TR')} ₺
                          </span>
                       </div>
                    )}

                    <Button type="button" variant="ghost" size="icon" className="absolute top-4 right-4 hover:bg-rose-50 text-rose-500" onClick={() => removeInvestment(index)}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between p-10 bg-[#faf9f6]/30 border-t border-[#c4c6d2]/10">
        <Button
          type="button"
          variant="ghost"
          onClick={prevStep}
          disabled={step === 1 || loading}
          className="h-12 px-8 rounded-xl font-bold text-[#001b44]"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Geri
        </Button>
        {step < 4 ? (
          <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-xl bg-[#001b44] text-white hover:bg-[#002f6c] font-bold shadow-lg shadow-[#001b44]/10">
            Devam Et <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={loading}
            className="h-12 px-10 rounded-xl bg-gradient-to-r from-[#001b44] to-[#003482] text-white font-bold shadow-xl hover:scale-[1.02] transition-transform"
          >
            {loading ? "Kaydediliyor..." : isSettings ? "Değişiklikleri Kaydet" : "Kurulumu Tamamla"}
            {!loading && <Check className="w-5 h-5 ml-2" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
