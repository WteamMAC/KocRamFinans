"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, User, Globe, Hash, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  gender:    z.enum(["male","female"], { error: "Cinsiyet seçiniz" }),
  currency:  z.string().min(1, "Para birimi seçiniz"),
  country:   z.string().min(1, "Ülke seçiniz"),
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
  { id:1, icon:User,  title:"Profil Bilgileri",    desc:"Seni yakından tanıyalım" },
  { id:2, icon:Globe, title:"Bölge & Para Birimi", desc:"Nerede, hangi parayla işlem yapıyorsun?" },
  { id:3, icon:Hash,  title:"İlgi Alanları",       desc:"Sana en uygun finansal analizler için" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [genderAnim, setGenderAnim] = useState(false);
  const [showOtherCur, setShowOtherCur] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string|null>(null);

  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { firstName:"", lastName:"", birthDate:"", gender:undefined, currency:"TRY", country:"", interests:[] },
    mode:"onChange",
  });
  const { formState:{ errors } } = form;
  const selectedGender    = form.watch("gender");
  const selectedCurrency  = form.watch("currency");
  const selectedCountry   = form.watch("country");
  const selectedInterests = form.watch("interests");

  const handleGender = (v: F["gender"]) => {
    form.setValue("gender", v, { shouldValidate:true });
    setGenderAnim(true);
    setTimeout(()=>setGenderAnim(false), 600);
  };

  const toggleTag = (tag:string) => {
    const cur = form.getValues("interests");
    form.setValue("interests", cur.includes(tag) ? cur.filter(t=>t!==tag) : [...cur,tag], { shouldValidate:true });
  };

  const nextStep = async () => {
    const fields: (keyof F)[][] = [
      ["firstName","lastName","birthDate","gender"],
      ["currency","country"],
    ];
    const ok = await form.trigger(fields[step-1] as any);
    if (ok) setStep(s=>s+1);
  };

  const onSubmit = async (data: F) => {
    setLoading(true);
    try {
      const result = await completeOnboarding({
        ...data,
        familyCount: 1,
        maritalStatus: "Bekar",
        hasChildren: false,
        children: [],
        incomes: [],
        expenses: [],
        debts: [],
        investments: [],
        fixedAssets: []
      } as any);

      if (result?.success) {
        window.location.replace("/dashboard");
      } else {
        window.location.href = "/dashboard";
      }
    } catch(e:any) {
      console.error("Onboarding error:", e);
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  const regionCountries = selectedRegion ? (REGIONS.find(r=>r.id===selectedRegion)?.countries ?? []) : [];

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="bg-white/95 backdrop-blur-md border border-[#8C5000]/15 rounded-[36px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">

        {/* Premium Amber Header (Resimsiz) */}
        <div className="relative px-8 pt-8 pb-6 bg-[#fbf9f4] border-b border-[#8C5000]/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f18d02]/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Step indicator dots */}
          <div className="relative flex items-center justify-center gap-3 mb-6 z-10">
            {STEPS.map((s,i)=>(
              <div key={s.id} className="flex items-center">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500",
                  step===s.id?"bg-[#8C5000] text-white scale-110 shadow-lg shadow-[#8C5000]/25":
                  step>s.id ?"bg-[#36684d] text-white":"bg-[#dbc2b0]/30 text-[#887364]")}>
                  {step>s.id?<Check className="w-4 h-4"/>:s.id}
                </div>
                {i<STEPS.length-1&&<div className={cn("w-10 h-0.5 mx-2 rounded-full transition-all duration-500",step>s.id?"bg-[#36684d]":"bg-[#dbc2b0]/40")}/>}
              </div>
            ))}
          </div>

          <h1 className="relative z-10 text-3xl font-heading font-black text-center text-[#5a3100] tracking-tight">
            {STEPS[step-1].title}
          </h1>
          <p className="relative z-10 text-xs text-[#887364] text-center mt-1 font-medium tracking-wide">
            {STEPS[step-1].desc}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 bg-white">
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* STEP 1 */}
            {step===1&&(
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {(["firstName","lastName"] as const).map(f=>(
                    <div key={f} className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-[#887364] uppercase tracking-widest">
                        {f==="firstName"?"Ad":"Soyad"} <span className="text-rose-600">*</span>
                      </Label>
                      <Input {...form.register(f)} placeholder={f==="firstName"?"Adınız":"Soyadınız"}
                        className={cn("h-12 rounded-2xl bg-[#faf9f6] border-[#dbc2b0]/50 focus:border-[#8C5000] focus:ring-[#8C5000]/20 font-semibold text-[#191c1d] placeholder:text-[#887364]/50",errors[f]&&"border-rose-500 bg-rose-50/50")}/>
                      {errors[f]&&<p className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors[f]?.message}</p>}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-extrabold text-[#887364] uppercase tracking-widest">
                    Doğum Tarihi <span className="text-rose-600">*</span>
                  </Label>
                  <Input type="date" {...form.register("birthDate")} max={getMaxDate()}
                    className={cn("h-12 rounded-2xl bg-[#faf9f6] border-[#dbc2b0]/50 focus:border-[#8C5000] focus:ring-[#8C5000]/20 font-semibold text-[#191c1d]",errors.birthDate&&"border-rose-500 bg-rose-50/50")}/>
                  {errors.birthDate&&<p className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.birthDate.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] uppercase tracking-widest">
                    Cinsiyet <span className="text-rose-600">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {v:"male",   label:"Erkek", emoji:"👨", activeClass:"bg-[#8C5000] text-white border-[#8C5000] shadow-lg shadow-[#8C5000]/20",  inactiveClass:"bg-[#faf9f6] border-[#dbc2b0]/50 text-[#5a3100]"},
                      {v:"female", label:"Kadın", emoji:"👩", activeClass:"bg-[#f18d02] text-white border-[#f18d02] shadow-lg shadow-[#f18d02]/20", inactiveClass:"bg-[#faf9f6] border-[#dbc2b0]/50 text-[#5a3100]"},
                    ].map(g=>{
                      const isActive = selectedGender===g.v;
                      return (
                        <button key={g.v} type="button" onClick={()=>handleGender(g.v as F["gender"])}
                          className={cn("relative p-5 rounded-3xl border transition-all duration-300 overflow-hidden font-bold flex flex-col items-center justify-center",
                            isActive?`${g.activeClass} scale-[1.03]`:`${g.inactiveClass} hover:border-[#8C5000]/40 hover:scale-[1.01]`)}>
                          {isActive&&genderAnim&&<span className="absolute inset-0 rounded-3xl bg-white/30 animate-ping"/>}
                          <span className="text-3xl block mb-2">{g.emoji}</span>
                          <span className="text-sm font-black">{g.label}</span>
                          {isActive&&<span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white"/></span>}
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender&&<p className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.gender.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step===2&&(
              <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Para Birimi */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] uppercase tracking-widest">Para Birimi <span className="text-rose-600">*</span></Label>
                  <Controller name="currency" control={form.control} render={({field})=>(
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {MAIN_CURRENCIES.map(c=>{
                          const isActive=field.value===c.code;
                          return (
                            <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);setShowOtherCur(false);}}
                              className={cn("p-4 rounded-3xl border text-center transition-all duration-200",
                                isActive?"bg-[#8C5000] text-white border-[#8C5000] shadow-xl shadow-[#8C5000]/20 scale-[1.03]":"bg-[#faf9f6] border-[#dbc2b0]/50 hover:border-[#8C5000]/40")}>
                              <div className="text-2xl mb-1">{c.flag}</div>
                              <div className={cn("text-xl font-black",isActive?"text-white":"text-[#5a3100]")}>{c.symbol}</div>
                              <div className={cn("text-[11px] font-bold",isActive?"text-white/80":"text-[#887364]")}>{c.code}</div>
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" onClick={()=>setShowOtherCur(v=>!v)}
                        className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border text-sm font-extrabold transition-all",
                          showOtherCur||OTHER_CURRENCIES.some(c=>c.code===field.value)
                            ?"bg-[#8C5000]/10 border-[#8C5000]/30 text-[#8C5000]":"bg-[#faf9f6] border-[#dbc2b0]/40 text-[#887364] hover:border-[#8C5000]/30")}>
                        <span>
                          {OTHER_CURRENCIES.find(c=>c.code===field.value)
                            ? `${OTHER_CURRENCIES.find(c=>c.code===field.value)!.flag} ${OTHER_CURRENCIES.find(c=>c.code===field.value)!.label}`
                            : "Diğer para birimi..."}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform",showOtherCur&&"rotate-180")}/>
                      </button>
                      {showOtherCur&&(
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {OTHER_CURRENCIES.map(c=>{
                            const isActive=field.value===c.code;
                            return (
                              <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);}}
                                className={cn("flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all font-bold",
                                  isActive?"bg-[#8C5000] text-white border-[#8C5000] shadow-md":"bg-[#faf9f6] border-[#dbc2b0]/40 hover:border-[#8C5000]/30")}>
                                <span className="text-xl">{c.flag}</span>
                                <div>
                                  <div className={cn("text-xs font-black",isActive?"text-white":"text-[#5a3100]")}>{c.code}</div>
                                  <div className={cn("text-[10px]",isActive?"text-white/80":"text-[#887364]")}>{c.label}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}/>
                </div>

                {/* Bölge & Kıtalar */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] uppercase tracking-widest">Kıta / Bölge <span className="text-rose-600">*</span></Label>
                  <Controller name="country" control={form.control} render={({field})=>(
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {REGIONS.map(r=>{
                          const active=selectedRegion===r.id;
                          const hasSelected=r.countries.some(c=>c.code===field.value);
                          return (
                            <button key={r.id} type="button"
                              onClick={()=>setSelectedRegion(active?null:r.id)}
                              className={cn("p-3.5 rounded-2xl border text-center text-xs font-bold transition-all duration-200",
                                active||hasSelected?"bg-[#8C5000] text-white border-[#8C5000] shadow-md scale-[1.02]":"bg-[#faf9f6] border-[#dbc2b0]/50 hover:border-[#8C5000]/30")}>
                              <div className="text-2xl mb-1">{r.emoji}</div>
                              <div className={cn("text-xs font-extrabold",active||hasSelected?"text-white":"text-[#5a3100]")}>{r.label}</div>
                            </button>
                          );
                        })}
                      </div>
                      {selectedRegion&&(
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
                          {regionCountries.map(c=>{
                            const isActive=field.value===c.code;
                            return (
                              <button key={c.code} type="button" onClick={()=>field.onChange(c.code)}
                                className={cn("flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all duration-200 font-bold",
                                  isActive?"bg-[#8C5000] text-white border-[#8C5000] shadow-md scale-[1.02]":"bg-[#faf9f6] border-[#dbc2b0]/50 hover:border-[#8C5000]/30")}>
                                <span className="text-lg">{c.flag}</span>
                                <span className={cn("text-xs font-black",isActive?"text-white":"text-[#5a3100]")}>{c.label}</span>
                                {isActive&&<Check className="w-3.5 h-3.5 ml-auto text-white"/>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {field.value&&!selectedRegion&&(
                        <p className="text-xs text-[#8C5000] font-black px-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-[#36684d]" /> {REGIONS.flatMap(r=>r.countries).find(c=>c.code===field.value)?.flag} {REGIONS.flatMap(r=>r.countries).find(c=>c.code===field.value)?.label} seçildi
                        </p>
                      )}
                    </div>
                  )}/>
                  {errors.country&&<p className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.country.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step===3&&(
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-bold text-[#887364]">Sana uygun finansal analizler, içerikler ve topluluklar önerebilmemiz için en az bir ilgi alanı seç.</p>
                <div className="flex flex-wrap gap-2.5">
                  {HASHTAGS.map(h=>{
                    const isActive=selectedInterests.includes(h.tag);
                    return (
                      <button key={h.tag} type="button" onClick={()=>toggleTag(h.tag)}
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black transition-all duration-200",
                          isActive?"bg-[#8C5000] text-white border-[#8C5000] shadow-lg shadow-[#8C5000]/25 scale-105":"bg-[#faf9f6] border-[#dbc2b0]/50 text-[#5a3100] hover:border-[#8C5000]/40 hover:scale-[1.02]")}>
                        <span className="text-base">{h.emoji}</span><span>#{h.label}</span>
                        {isActive&&<Check className="w-3.5 h-3.5"/>}
                      </button>
                    );
                  })}
                </div>
                {errors.interests&&<p className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.interests.message}</p>}
                {selectedInterests.length>0&&(
                  <div className="p-4 bg-[#f18d02]/10 border border-[#f18d02]/25 rounded-2xl animate-in fade-in duration-300">
                    <p className="text-[10px] font-black text-[#8C5000] uppercase tracking-widest mb-2">{selectedInterests.length} ilgi alanı seçildi</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInterests.map(t=>{
                        const h=HASHTAGS.find(x=>x.tag===t);
                        return <span key={t} className="text-xs font-black text-[#8C5000] bg-white px-2.5 py-1 rounded-xl border border-[#8C5000]/20 shadow-sm">{h?.emoji} #{h?.label??t}</span>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-[#fbf9f4] border-t border-[#8C5000]/10">
          <Button type="button" variant="ghost" onClick={()=>setStep(s=>Math.max(s-1,1))} disabled={step===1||loading} className="h-12 px-6 rounded-2xl font-bold text-[#5a3100] hover:bg-[#dbc2b0]/30">
            <ChevronLeft className="w-4 h-4 mr-1"/> Geri
          </Button>
          {step<3?(
            <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-2xl bg-gradient-to-r from-[#f18d02] to-[#8C5000] text-white font-extrabold shadow-lg shadow-[#8C5000]/25 hover:opacity-95 hover:scale-[1.02] transition-all">
              Devam Et <ChevronRight className="w-5 h-5 ml-1"/>
            </Button>
          ):(
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={loading} className="h-12 px-10 rounded-2xl bg-gradient-to-r from-[#36684d] to-[#1c5036] text-white font-extrabold shadow-xl shadow-[#36684d]/30 hover:scale-[1.03] transition-all">
              {loading?"Kaydediliyor...":"Kurulumu Tamamla 🚀"}{!loading&&<Check className="w-5 h-5 ml-2"/>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
