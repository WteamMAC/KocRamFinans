"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, User, Globe, Hash, AlertCircle, ChevronDown, Plus, Trash2, Wallet, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseISO } from "date-fns";

const MIN_AGE = 13;
function getMaxDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  firstName: z.string().min(2, "En az 2 karakter"),
  lastName:  z.string().min(2, "En az 2 karakter"),
  birthDate: z.string().refine(v => {
    if (!v) return false;
    const d = new Date(v); const max = new Date(getMaxDate());
    return d <= max;
  }, { message: `En az ${MIN_AGE} yaşında olmalısınız` }),
  gender:    z.enum(["male","female"], { error: "Cinsiyet seçiniz" }).optional(),
  currency:  z.string().min(1, "Para birimi seçiniz"),
  country:   z.string().min(1, "Ülke seçiniz"),
  incomes:   z.array(z.object({
    type: z.string().min(1, "Gelir türü seçiniz"),
    amount: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
    date: z.string().optional(),
    description: z.string().optional(),
  })),
  expenses:  z.array(z.object({
    type: z.string().min(1, "Gider türü seçiniz"),
    amount: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
    date: z.string().optional(),
    isRecurring: z.boolean().default(true),
    description: z.string().optional(),
  })),
  interests: z.array(z.string()).min(1, "En az 1 alan seçiniz"),
});
type F = z.infer<typeof schema>;

const MAIN_CURRENCIES = [
  { code:"USD", label:"Amerikan Doları", symbol:"$", flag:"🇺🇸" },
  { code:"EUR", label:"Euro",            symbol:"€", flag:"🇪🇺" },
  { code:"TRY", label:"Türk Lirası",     symbol:"₺", flag:"🇹🇷" },
];
const OTHER_CURRENCIES = [
  { code:"GBP", label:"İngiliz Sterlini", symbol:"£",   flag:"🇬🇧" },
  { code:"CHF", label:"İsviçre Frangı",   symbol:"₣",   flag:"🇨🇭" },
  { code:"JPY", label:"Japon Yeni",       symbol:"¥",   flag:"🇯🇵" },
  { code:"AED", label:"BAE Dirhemi",      symbol:"د.إ", flag:"🇦🇪" },
  { code:"SAR", label:"Suudi Riyali",     symbol:"﷼",   flag:"🇸🇦" },
  { code:"RUB", label:"Rus Rublesi",      symbol:"₽",   flag:"🇷🇺" },
  { code:"CAD", label:"Kanada Doları",    symbol:"CA$", flag:"🇨🇦" },
  { code:"AUD", label:"Avustralya Doları",symbol:"A$",  flag:"🇦🇺" },
  { code:"CNY", label:"Çin Yuanı",        symbol:"¥",   flag:"🇨🇳" },
  { code:"SGD", label:"Singapur Doları",  symbol:"S$",  flag:"🇸🇬" },
  { code:"NOK", label:"Norveç Kronu",     symbol:"kr",  flag:"🇳🇴" },
  { code:"SEK", label:"İsveç Kronu",      symbol:"kr",  flag:"🇸🇪" },
  { code:"XAU", label:"Altın (Gram)",     symbol:"ALT", flag:"🪙" },
];

const REGIONS: { id:string; label:string; emoji:string; countries:{code:string;label:string;flag:string}[] }[] = [
  { id:"eu", label:"Avrupa & Türkiye", emoji:"🌍", countries:[
    { code:"TR", label:"Türkiye", flag:"🇹🇷" },
    { code:"DE", label:"Almanya", flag:"🇩🇪" },
    { code:"FR", label:"Fransa", flag:"🇫🇷" },
    { code:"GB", label:"Birleşik Krallık", flag:"🇬🇧" },
    { code:"NL", label:"Hollanda", flag:"🇳🇱" },
    { code:"CH", label:"İsviçre", flag:"🇨🇭" },
    { code:"SE", label:"İsveç", flag:"🇸🇪" },
    { code:"NO", label:"Norveç", flag:"🇳🇴" },
    { code:"BE", label:"Belçika", flag:"🇧🇪" },
    { code:"AT", label:"Avusturya", flag:"🇦🇹" },
    { code:"IT", label:"İtalya", flag:"🇮🇹" },
    { code:"ES", label:"İspanya", flag:"🇪🇸" },
  ]},
  { id:"am", label:"Kuzey & Güney Amerika", emoji:"🌎", countries:[
    { code:"US", label:"ABD", flag:"🇺🇸" },
    { code:"CA", label:"Kanada", flag:"🇨🇦" },
    { code:"MX", label:"Meksika", flag:"🇲🇽" },
    { code:"BR", label:"Brezilya", flag:"🇧🇷" },
    { code:"AR", label:"Arjantin", flag:"🇦🇷" },
    { code:"CL", label:"Şili", flag:"🇨🇱" },
    { code:"CO", label:"Kolombiya", flag:"🇨🇴" },
  ]},
  { id:"me", label:"Orta Doğu & Afrika", emoji:"🌍", countries:[
    { code:"AE", label:"Birleşik Arap Emirlikleri", flag:"🇦🇪" },
    { code:"SA", label:"Suudi Arabistan", flag:"🇸🇦" },
    { code:"QA", label:"Katar", flag:"🇶🇦" },
    { code:"KW", label:"Kuveyt", flag:"🇰🇼" },
    { code:"EG", label:"Mısır", flag:"🇪🇬" },
    { code:"MA", label:"Fas", flag:"🇲🇦" },
    { code:"ZA", label:"Güney Afrika", flag:"🇿🇦" },
    { code:"NG", label:"Nijerya", flag:"🇳🇬" },
  ]},
  { id:"as", label:"Asya & Pasifik", emoji:"🌏", countries:[
    { code:"JP", label:"Japonya", flag:"🇯🇵" },
    { code:"CN", label:"Çin", flag:"🇨🇳" },
    { code:"KR", label:"Güney Kore", flag:"🇰🇷" },
    { code:"SG", label:"Singapur", flag:"🇸🇬" },
    { code:"AU", label:"Avustralya", flag:"🇦🇺" },
    { code:"NZ", label:"Yeni Zelanda", flag:"🇳🇿" },
    { code:"IN", label:"Hindistan", flag:"🇮🇳" },
    { code:"ID", label:"Endonezya", flag:"🇮🇩" },
  ]},
];

const INCOME_TYPES = ["Maaş", "Kira Geliri", "Ek İş / Freelance", "Yatırım Temettü", "Diğer"];
const EXPENSE_TYPES = ["Ev Kirası / İpotek", "Faturalar (Elektrik, Su, Doğalgaz)", "Mutfak & Market", "Ulaşım / Akaryakıt", "Eğitim / Sağlık", "Diğer"];

const HASHTAGS = [
  { tag:"borsa",          label:"Borsa",          emoji:"📈" },
  { tag:"kripto",         label:"Kripto",          emoji:"₿"  },
  { tag:"altin",          label:"Altın",           emoji:"🪙" },
  { tag:"dolar",          label:"Dolar/Kur",       emoji:"💵" },
  { tag:"bes",            label:"BES",             emoji:"🛡️" },
  { tag:"emeklilik",      label:"Emeklilik",       emoji:"🏖️" },
  { tag:"gayrimenkul",    label:"Gayrimenkul",     emoji:"🏠" },
  { tag:"faiz",           label:"Faiz/Mevduat",   emoji:"🏦" },
  { tag:"tasarruf",       label:"Tasarruf",        emoji:"💰" },
  { tag:"girisim",        label:"Girişim",         emoji:"🚀" },
  { tag:"ekonomi",        label:"Ekonomi",         emoji:"📊" },
  { tag:"teknoloji",      label:"Teknoloji",       emoji:"💻" },
  { tag:"enerji",         label:"Enerji",          emoji:"⚡" },
  { tag:"saglik",         label:"Sağlık",          emoji:"💊" },
  { tag:"fintech",        label:"FinTech",         emoji:"🔗" },
  { tag:"vergi",          label:"Vergi",           emoji:"📋" },
  { tag:"kisiselfinans",  label:"Kişisel Finans",  emoji:"🎯" },
  { tag:"haber",          label:"Haberler",        emoji:"📰" },
];

const STEPS = [
  { id:1, icon:User,       title:"Profil Bilgileri",    desc:"Seni yakından tanıyalım" },
  { id:2, icon:Globe,      title:"Bölge & Para Birimi", desc:"Nerede, hangi parayla işlem yapıyorsun?" },
  { id:3, icon:Wallet,     title:"Aylık Gelirler",      desc:"Düzenli kazançlarını ekle" },
  { id:4, icon:CreditCard, title:"Aylık Giderler",      desc:"Sabit harcama ve faturalarını belirle" },
  { id:5, icon:Hash,       title:"İlgi Alanları",       desc:"Sana en uygun finansal analizler için" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [dbError, setDbError]     = useState<string|null>(null);
  const [genderAnim, setGenderAnim] = useState(false);
  const [showOtherCur, setShowOtherCur] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string|null>(null);
  const [customTagInput, setCustomTagInput] = useState("");

  const form = useForm<F>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      firstName:"", lastName:"", birthDate:"", gender:undefined, currency:"TRY", country:"",
      incomes:  [{ type:"Maaş", amount:0, date:new Date().toISOString().split("T")[0], description:"" }],
      expenses: [{ type:"Ev Kirası / İpotek", amount:0, date:new Date().toISOString().split("T")[0], isRecurring:true, description:"" }],
      interests: []
    },
    mode:"onChange",
  });

  const { formState:{ errors } } = form;
  const selectedGender    = form.watch("gender");
  const selectedCurrency  = form.watch("currency");
  const selectedCountry   = form.watch("country");
  const selectedInterests = form.watch("interests");

  const incomesField = useFieldArray({ control: form.control, name: "incomes" });
  const expensesField = useFieldArray({ control: form.control, name: "expenses" });

  const handleGender = (v: F["gender"]) => {
    form.setValue("gender", v, { shouldValidate:true });
    setGenderAnim(true);
    setTimeout(()=>setGenderAnim(false), 600);
  };

  const toggleTag = (tag:string) => {
    const cleanTag = tag.replace(/^#+/, "").trim().toLowerCase();
    if (!cleanTag) return;
    const cur = form.getValues("interests");
    form.setValue("interests", cur.includes(cleanTag) ? cur.filter(t=>t!==cleanTag) : [...cur, cleanTag], { shouldValidate:true });
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const text = customTagInput.trim();
      if (!text) return;
      
      const words = text.split(/[\s,]+/);
      const cur = form.getValues("interests");
      let newTags = [...cur];
      
      words.forEach(w => {
        const clean = w.replace(/^#+/, "").trim().toLowerCase();
        if (clean && !newTags.includes(clean)) {
          newTags.push(clean);
        }
      });

      form.setValue("interests", newTags, { shouldValidate: true });
      setCustomTagInput("");
    }
  };

  const nextStep = async () => {
    const fields: (keyof F)[][] = [
      ["firstName","lastName","birthDate","gender"],
      ["currency","country"],
      ["incomes"],
      ["expenses"],
    ];
    const ok = await form.trigger(fields[step-1] as any);
    if (ok) setStep(s=>s+1);
  };

  const onSubmit = async (data: any) => {
    setLoading(true); setDbError(null);
    try {
      const result = await completeOnboarding({
        ...data,
        familyCount: 1,
        maritalStatus: "Bekar",
        hasChildren: false,
        children: [],
        debts: [],
        investments: [],
        fixedAssets: []
      } as any);

      if (result?.success) {
        router.refresh();
        router.push("/dashboard");
      } else {
        setDbError(result?.error || "Kayıt sırasında bir sorun oluştu.");
      }
    } catch(e:any) {
      console.error("Onboarding error:", e);
      setDbError(e?.message || "Sunucu bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const regionCountries = selectedRegion ? (REGIONS.find(r=>r.id===selectedRegion)?.countries ?? []) : [];

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="bg-card border border-[#8C5000]/20 dark:border-[#ffb874]/20 rounded-3xl shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-700 transition-colors duration-300">

        {/* Yumuşak Sıcak Turuncu Header */}
        <div className="relative px-8 pt-8 pb-6 bg-[#fbf9f4] dark:bg-[#120d0a]/60 border-b border-[#8C5000]/15 dark:border-[#ffb874]/15 overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f18d02]/15 dark:bg-[#ffb874]/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Step indicator dots */}
          <div className="relative flex items-center justify-center gap-2 mb-6 z-10">
            {STEPS.map((s,i)=>(
              <div key={s.id} className="flex items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500",
                  step===s.id?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] scale-110 shadow-lg shadow-[#8C5000]/30 dark:shadow-black/50":
                  step>s.id ?"bg-[#b07d4b] dark:bg-[#ffb874]/80 text-white dark:text-[#120d0a]":"bg-[#dbc2b0]/30 dark:bg-[#887364]/30 text-[#887364] dark:text-[#dbc2b0]")}>
                  {step>s.id?<Check className="w-3.5 h-3.5"/>:s.id}
                </div>
                {i<STEPS.length-1&&<div className={cn("w-6 sm:w-8 h-0.5 mx-1.5 rounded-full transition-all duration-500",step>s.id?"bg-[#b07d4b] dark:bg-[#ffb874]/80":"bg-[#dbc2b0]/40 dark:bg-[#887364]/30")}/>}
              </div>
            ))}
          </div>

          <h1 className="relative z-10 text-2xl sm:text-3xl font-heading font-black text-center text-[#5a3100] dark:text-[#ffb874] tracking-tight">
            {STEPS[step-1].title}
          </h1>
          <p className="relative z-10 text-xs text-[#887364] dark:text-[#dbc2b0] text-center mt-1 font-medium tracking-wide">
            {STEPS[step-1].desc}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 bg-card transition-colors duration-300">
          {dbError && (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-rose-500/80 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-500/80" />
              <div>
                <p className="font-extrabold">Kayıt Hatası</p>
                <p className="font-normal opacity-90">{dbError}</p>
              </div>
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* STEP 1: Profil Bilgileri */}
            {step===1&&(
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {(["firstName","lastName"] as const).map(f=>(
                    <div key={f} className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest px-2 mb-1.5 block">
                        {f==="firstName"?"Ad":"Soyad"} <span className="text-rose-500/80">*</span>
                      </Label>
                      <Input {...form.register(f)} placeholder={f==="firstName"?"Adınız":"Soyadınız"}
                        className={cn("h-12 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 focus:border-[#8C5000] dark:focus:border-[#ffb874] font-semibold text-foreground placeholder:text-muted-foreground/50",errors[f]&&"border-destructive bg-destructive/10")}/>
                      {errors[f]&&<p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1 px-2"><AlertCircle className="h-3 w-3"/>{errors[f]?.message as string}</p>}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest px-2 mb-1.5 block">
                    Doğum Tarihi <span className="text-rose-500/80">*</span>
                  </Label>
                  <Controller
                    name="birthDate"
                    control={form.control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value ? parseISO(field.value) : undefined}
                        setDate={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                        placeholder="GG.AA.YYYY"
                        className={cn(errors.birthDate && "border-destructive")}
                      />
                    )}
                  />
                  {errors.birthDate&&<p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1 px-2"><AlertCircle className="h-3 w-3"/>{errors.birthDate.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest px-2 mb-1.5 block">
                    Cinsiyet <span className="text-rose-500/80">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {v:"male",   label:"Erkek", emoji:"👨"},
                      {v:"female", label:"Kadın", emoji:"👩"},
                    ].map(g=>{
                      const isActive = selectedGender===g.v;
                      return (
                        <button key={g.v} type="button" onClick={()=>handleGender(g.v as F["gender"])}
                          className={cn("relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden font-bold flex flex-col items-center justify-center",
                            isActive?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-lg scale-[1.03]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 dark:border-[#887364]/40 text-[#5a3100] dark:text-[#dbc2b0] hover:border-[#8C5000]/40 hover:scale-[1.01] text-xs font-black")}>
                          {isActive&&genderAnim&&<span className="absolute inset-0 rounded-2xl bg-white/30 dark:bg-black/20 animate-ping"/>}
                          <span className="text-3xl block mb-2">{g.emoji}</span>
                          <span className="text-sm font-black">{g.label}</span>
                          {isActive&&<span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 dark:bg-black/20 flex items-center justify-center"><Check className="w-3.5 h-3.5"/></span>}
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender&&<p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1 px-2"><AlertCircle className="h-3 w-3"/>{errors.gender.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: Para Birimi & Ülke */}
            {step===2&&(
              <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest mb-1.5 block">Para Birimi <span className="text-rose-500/80">*</span></Label>
                  <Controller name="currency" control={form.control} render={({field})=>(
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {MAIN_CURRENCIES.map(c=>{
                          const isActive=field.value===c.code;
                          return (
                            <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);setShowOtherCur(false);}}
                              className={cn("p-4 rounded-3xl border text-center transition-all duration-200",
                                isActive?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-xl scale-[1.03]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 hover:border-[#8C5000]/40")}>
                              <div className="text-2xl mb-1">{c.flag}</div>
                              <div className={cn("text-xl font-black",isActive?"text-white dark:text-[#120d0a]":"text-[#5a3100] dark:text-[#fbf9f4]")}>{c.symbol}</div>
                              <div className={cn("text-[11px] font-bold",isActive?"text-white/80 dark:text-[#120d0a]/80":"text-[#887364] dark:text-[#dbc2b0]")}>{c.code}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <button type="button" onClick={()=>{setShowOtherCur(v=>!v); setSelectedRegion(null);}}
                          className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border text-sm font-extrabold transition-all",
                            showOtherCur||OTHER_CURRENCIES.some(c=>c.code===field.value)
                              ?"bg-[#8C5000]/10 border-[#8C5000]/30 text-[#8C5000] dark:text-[#ffb874]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 text-[#887364] dark:text-[#dbc2b0] hover:border-[#8C5000]/30")}>
                          <span>
                            {OTHER_CURRENCIES.find(c=>c.code===field.value)
                              ? `${OTHER_CURRENCIES.find(c=>c.code===field.value)!.flag} ${OTHER_CURRENCIES.find(c=>c.code===field.value)!.label}`
                              : "Diğer para birimi..."}
                          </span>
                          <ChevronDown className={cn("w-4 h-4 transition-transform",showOtherCur&&"rotate-180")}/>
                        </button>
                        {showOtherCur&&(
                          <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-card border border-border/30 rounded-2xl shadow-2xl grid grid-cols-2 gap-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            {OTHER_CURRENCIES.map(c=>{
                              const isActive=field.value===c.code;
                              return (
                                <button key={c.code} type="button" onClick={()=>{field.onChange(c.code); setShowOtherCur(false);}}
                                  className={cn("flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all font-bold",
                                    isActive?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 hover:border-[#8C5000]/30")}>
                                  <span className="text-xl">{c.flag}</span>
                                  <div>
                                    <div className={cn("text-xs font-black",isActive?"text-white dark:text-[#120d0a]":"text-[#5a3100] dark:text-[#fbf9f4]")}>{c.code}</div>
                                    <div className={cn("text-[10px]",isActive?"text-white/80 dark:text-[#120d0a]/80":"text-[#887364] dark:text-[#dbc2b0]")}>{c.label}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}/>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest mb-1.5 block">Kıta / Bölge <span className="text-rose-500/80">*</span></Label>
                  <Controller name="country" control={form.control} render={({field})=>(
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="grid grid-cols-2 gap-2">
                          {REGIONS.map(r=>{
                            const active=selectedRegion===r.id;
                            const hasSelected=r.countries.some(c=>c.code===field.value);
                            const activeCountry = r.countries.find(c=>c.code===field.value);
                            return (
                              <button key={r.id} type="button"
                                onClick={()=>{setSelectedRegion(active?null:r.id); setShowOtherCur(false);}}
                                className={cn("p-3.5 rounded-2xl border text-center text-xs font-bold transition-all duration-200",
                                  active||hasSelected?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-[1.02]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 hover:border-[#8C5000]/30")}>
                                <div className="text-2xl mb-1">{r.emoji}</div>
                                <div className={cn("text-xs font-extrabold",active||hasSelected?"text-white dark:text-[#120d0a]":"text-[#5a3100] dark:text-[#fbf9f4]")}>
                                  {hasSelected && !active ? `${activeCountry?.flag} ${activeCountry?.label}` : r.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {selectedRegion && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-background/40 backdrop-blur-md rounded-3xl" onClick={() => setSelectedRegion(null)} />
                            <div className="relative w-full max-h-[85%] bg-card border border-[#8C5000]/20 dark:border-[#ffb874]/20 rounded-3xl shadow-ambient-high overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
                              <div className="px-6 py-4 border-b border-border/10 flex justify-between items-center bg-muted/30">
                                <div>
                                  <span className="text-[10px] font-black text-[#8C5000]/60 dark:text-[#ffb874]/60 uppercase tracking-widest block">Ülke Seçimi</span>
                                  <h3 className="text-sm font-black text-primary">{REGIONS.find(r => r.id === selectedRegion)?.label}</h3>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setSelectedRegion(null)} 
                                  className="h-8 w-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="p-4 grid grid-cols-2 gap-2.5 overflow-y-auto">
                                {regionCountries.map(c => {
                                  const isActive = field.value === c.code;
                                  return (
                                    <button 
                                      key={c.code} 
                                      type="button" 
                                      onClick={() => { field.onChange(c.code); setSelectedRegion(null); }}
                                      className={cn("flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 group",
                                        isActive 
                                          ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md" 
                                          : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/30 hover:border-[#8C5000]/30 hover:shadow-sm"
                                      )}
                                    >
                                      <span className="text-2xl transition-transform group-hover:scale-110 duration-200">{c.flag}</span>
                                      <span className="text-xs font-bold leading-tight">{c.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="p-4 border-t border-border/10 bg-muted/10">
                                <p className="text-[10px] text-center text-muted-foreground font-medium">Bölgenizdeki para birimi ve yerel ayarlar otomatik olarak yapılandırılacaktır.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}/>
                  {errors.country&&<p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.country.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: Aylık Gelirler */}
            {step===3&&(
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0]">Düzenli Gelir Kaynakları</Label>
                  <Button type="button" size="sm" variant="outline" onClick={()=>incomesField.append({type:"Maaş", amount:0, date:new Date().toISOString().split("T")[0], description:""})}
                    className="rounded-xl border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874] font-bold hover:bg-[#8C5000]/10">
                    <Plus className="w-4 h-4 mr-1"/> Gelir Ekle
                  </Button>
                </div>
                <div className="space-y-4">
                  {incomesField.fields.map((item, i) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/40 dark:border-[#887364]/40 space-y-3 relative">
                      <div className="flex items-center justify-between gap-3">
                        <Controller
                          name={`incomes.${i}.type`}
                          control={form.control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="flex-1 h-11 rounded-xl bg-white dark:bg-[#1c140e]">
                                <SelectValue placeholder="Gelir türü" />
                              </SelectTrigger>
                              <SelectContent>
                                {INCOME_TYPES.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {incomesField.fields.length > 1 && (
                           <Button type="button" variant="ghost" size="icon" onClick={()=>incomesField.remove(i)} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-[10px] font-bold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Miktar ({selectedCurrency})</Label>
                          <Input type="number" {...form.register(`incomes.${i}.amount`, { valueAsNumber: true })} placeholder="0" className="h-11 rounded-xl bg-white dark:bg-[#1c140e] font-black text-foreground" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Tarih</Label>
                          <Controller
                            name={`incomes.${i}.date`}
                            control={form.control}
                            render={({ field }) => (
                              <DatePicker
                                date={field.value ? parseISO(field.value) : undefined}
                                setDate={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                                placeholder="Tarih seç"
                                className="h-11"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Açıklama</Label>
                          <Input {...form.register(`incomes.${i}.description`)} placeholder="Örn: Kurum / Şirket" className="h-11 rounded-xl bg-white dark:bg-[#1c140e] font-medium text-foreground" />
                        </div>
                      </div>
                      {errors.incomes?.[i]?.amount && (
                        <p className="text-[10px] font-bold text-rose-500/80 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3"/> {errors.incomes[i].amount.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Aylık Giderler */}
            {step===4&&(
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0]">Düzenli Giderler</Label>
                  <Button type="button" size="sm" variant="outline" onClick={()=>expensesField.append({type:"Ev Kirası / İpotek", amount:0, date:new Date().toISOString().split("T")[0], isRecurring:true, description:""})}
                    className="rounded-xl border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874] font-bold hover:bg-[#8C5000]/10">
                    <Plus className="w-4 h-4 mr-1"/> Gider Ekle
                  </Button>
                </div>
                <div className="space-y-4">
                  {expensesField.fields.map((item, i) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/40 dark:border-[#887364]/40 space-y-3 relative">
                      <div className="flex items-center justify-between gap-3">
                        <Controller
                          name={`expenses.${i}.type`}
                          control={form.control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="flex-1 h-11 rounded-xl bg-white dark:bg-[#1c140e]">
                                <SelectValue placeholder="Gider türü" />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPENSE_TYPES.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {expensesField.fields.length > 1 && (
                           <Button type="button" variant="ghost" size="icon" onClick={()=>expensesField.remove(i)} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-[10px] font-bold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Miktar ({selectedCurrency})</Label>
                          <Input type="number" {...form.register(`expenses.${i}.amount`, { valueAsNumber: true })} placeholder="0" className="h-11 rounded-xl bg-white dark:bg-[#1c140e] font-black text-foreground" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Tarih</Label>
                          <Controller
                            name={`expenses.${i}.date`}
                            control={form.control}
                            render={({ field }) => (
                              <DatePicker
                                date={field.value ? parseISO(field.value) : undefined}
                                setDate={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                                placeholder="Tarih seç"
                                className="h-11"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Açıklama</Label>
                          <Input {...form.register(`expenses.${i}.description`)} placeholder="Örn: Kira / Elektrik" className="h-11 rounded-xl bg-white dark:bg-[#1c140e] font-medium text-foreground" />
                        </div>
                      </div>
                      {errors.expenses?.[i]?.amount && (
                        <p className="text-[10px] font-bold text-rose-500/80 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3"/> {errors.expenses[i].amount.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: İlgi Alanları & Özel Hashtag */}
            {step===5&&(
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-bold text-[#887364] dark:text-[#dbc2b0]">Aşağıdaki önerilerden seçebilir veya kendi özel ilgi alanını (Örn: #COIN #BIST) yazıp Boşluk veya Enter tuşuna basabilirsin.</p>
                
                {/* Custom Hashtag Input */}
                <div className="relative">
                  <Input
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder="Özel ilgi alanı ekle ve Boşluk tuşuna bas (Örn: #Kripto #NFT)..."
                    className="h-12 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#8C5000]/40 dark:border-[#ffb874]/40 font-bold text-[#191c1d] dark:text-[#fbf9f4] placeholder:text-[#887364]/60 pr-10 focus:border-[#8C5000] dark:focus:border-[#ffb874] shadow-sm"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#8C5000] dark:text-[#ffb874]">#</span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {HASHTAGS.map(h=>{
                    const isActive=selectedInterests.includes(h.tag);
                    return (
                      <button key={h.tag} type="button" onClick={()=>toggleTag(h.tag)}
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black transition-all duration-200",
                          isActive?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-105":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 text-[#5a3100] dark:text-[#dbc2b0] hover:border-[#8C5000]/40 hover:scale-[1.02]")}>
                        <span className="text-base">{h.emoji}</span><span>#{h.label}</span>
                        {isActive&&<Check className="w-3.5 h-3.5"/>}
                      </button>
                    );
                  })}
                </div>

                {errors.interests&&<p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.interests.message}</p>}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-[#fbf9f4] dark:bg-[#120d0a]/60 border-t border-[#8C5000]/10 dark:border-[#ffb874]/15 transition-colors duration-300">
          <Button type="button" variant="ghost" onClick={()=>setStep(s=>Math.max(s-1,1))} disabled={step===1||loading} className="h-12 px-6 rounded-xl font-bold text-[#5a3100] dark:text-[#dbc2b0] hover:bg-[#dbc2b0]/30">
            <ChevronLeft className="w-4 h-4 mr-1"/> Geri
          </Button>
          {step<5?(
            <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-xl bg-gradient-to-r from-[#f18d02] to-[#8C5000] dark:from-[#ffb874] dark:to-[#8C5000] text-white dark:text-[#120d0a] font-extrabold sm:font-black shadow-lg shadow-[#8C5000]/25 hover:scale-[1.02] transition-all">
              Devam Et <ChevronRight className="w-5 h-5 ml-1"/>
            </Button>
          ):(
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={loading} className="h-12 px-8 sm:px-10 rounded-xl bg-gradient-to-r from-[#b07d4b] to-[#8C5000] dark:from-[#ffb874] dark:to-[#8C5000] text-white dark:text-[#120d0a] font-extrabold sm:font-black shadow-xl shadow-[#8C5000]/30 hover:scale-[1.03] transition-all">
              {loading?"Kaydediliyor...":"Kurulumu Tamamla"}{!loading&&<Check className="w-5 h-5 ml-2"/>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
