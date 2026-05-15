"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/profile";

const MIN_AGE = 13;
function getMaxDate() {
  const d = new Date(); d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  firstName: z.string().min(2, "En az 2 karakter"),
  lastName:  z.string().min(2, "En az 2 karakter"),
  birthDate: z.string().refine(v => { if (!v) return false; return new Date(v) <= new Date(getMaxDate()); }, { message:`En az ${MIN_AGE} yaşında olmalısınız` }),
  gender:    z.enum(["male","female"]),
  currency:  z.string().min(1),
  country:   z.string().min(1),
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
];

const ALL_COUNTRIES = [
  { code:"TR", label:"Türkiye",                    flag:"🇹🇷" },
  { code:"DE", label:"Almanya",                    flag:"🇩🇪" },
  { code:"FR", label:"Fransa",                     flag:"🇫🇷" },
  { code:"GB", label:"Birleşik Krallık",           flag:"🇬🇧" },
  { code:"NL", label:"Hollanda",                   flag:"🇳🇱" },
  { code:"CH", label:"İsviçre",                    flag:"🇨🇭" },
  { code:"SE", label:"İsveç",                      flag:"🇸🇪" },
  { code:"NO", label:"Norveç",                     flag:"🇳🇴" },
  { code:"BE", label:"Belçika",                    flag:"🇧🇪" },
  { code:"AT", label:"Avusturya",                  flag:"🇦🇹" },
  { code:"IT", label:"İtalya",                     flag:"🇮🇹" },
  { code:"ES", label:"İspanya",                    flag:"🇪🇸" },
  { code:"US", label:"ABD",                        flag:"🇺🇸" },
  { code:"CA", label:"Kanada",                     flag:"🇨🇦" },
  { code:"MX", label:"Meksika",                    flag:"🇲🇽" },
  { code:"BR", label:"Brezilya",                   flag:"🇧🇷" },
  { code:"AE", label:"Birleşik Arap Emirlikleri",  flag:"🇦🇪" },
  { code:"SA", label:"Suudi Arabistan",            flag:"🇸🇦" },
  { code:"QA", label:"Katar",                      flag:"🇶🇦" },
  { code:"EG", label:"Mısır",                      flag:"🇪🇬" },
  { code:"JP", label:"Japonya",                    flag:"🇯🇵" },
  { code:"CN", label:"Çin",                        flag:"🇨🇳" },
  { code:"KR", label:"Güney Kore",                 flag:"🇰🇷" },
  { code:"SG", label:"Singapur",                   flag:"🇸🇬" },
  { code:"AU", label:"Avustralya",                 flag:"🇦🇺" },
  { code:"IN", label:"Hindistan",                  flag:"🇮🇳" },
];

const HASHTAGS = [
  { tag:"borsa",         label:"Borsa",          emoji:"📈" },
  { tag:"kripto",        label:"Kripto",          emoji:"₿"  },
  { tag:"altin",         label:"Altın",           emoji:"🪙" },
  { tag:"dolar",         label:"Dolar/Kur",       emoji:"💵" },
  { tag:"bes",           label:"BES",             emoji:"🛡️" },
  { tag:"emeklilik",     label:"Emeklilik",       emoji:"🏖️" },
  { tag:"gayrimenkul",   label:"Gayrimenkul",     emoji:"🏠" },
  { tag:"faiz",          label:"Faiz/Mevduat",   emoji:"🏦" },
  { tag:"tasarruf",      label:"Tasarruf",        emoji:"💰" },
  { tag:"girisim",       label:"Girişim",         emoji:"🚀" },
  { tag:"ekonomi",       label:"Ekonomi",         emoji:"📊" },
  { tag:"teknoloji",     label:"Teknoloji",       emoji:"💻" },
  { tag:"enerji",        label:"Enerji",          emoji:"⚡" },
  { tag:"saglik",        label:"Sağlık",          emoji:"💊" },
  { tag:"fintech",       label:"FinTech",         emoji:"🔗" },
  { tag:"vergi",         label:"Vergi",           emoji:"📋" },
  { tag:"kisiselfinans", label:"Kişisel Finans",  emoji:"🎯" },
  { tag:"haber",         label:"Haberler",        emoji:"📰" },
];

interface Props {
  initialData: {
    firstName?: string; lastName?: string; birthDate?: string;
    gender?: string; currency?: string; country?: string; interests?: string[];
  };
}

export function ProfileSettingsForm({ initialData }: Props) {
  const [saving, setSaving]       = useState(false);
  const [saved,  setSaved]        = useState(false);
  const [showOtherCur, setShowOtherCur] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initialData.firstName ?? "",
      lastName:  initialData.lastName  ?? "",
      birthDate: initialData.birthDate ?? "",
      gender:    (initialData.gender as F["gender"]) ?? "male",
      currency:  initialData.currency  ?? "TRY",
      country:   initialData.country   ?? "TR",
      interests: initialData.interests ?? [],
    },
    mode: "onChange",
  });

  const { formState: { isDirty, errors } } = form;
  const interests  = form.watch("interests");
  const currency   = form.watch("currency");
  const country    = form.watch("country");
  const gender     = form.watch("gender");

  const toggleTag = (tag: string) => {
    const cur = form.getValues("interests");
    form.setValue("interests", cur.includes(tag) ? cur.filter(t=>t!==tag) : [...cur,tag], { shouldValidate:true, shouldDirty:true });
  };

  const onSubmit = async (data: F) => {
    setSaving(true);
    try {
      await updateProfile(data);
      setSaved(true);
      form.reset(data);
      setTimeout(() => setSaved(false), 3000);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const countryLabel = ALL_COUNTRIES.find(c=>c.code===country);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

      {/* Ad / Soyad */}
      <div className="bg-white/95 dark:bg-[#1c140e]/95 backdrop-blur-md border border-[#8C5000]/15 dark:border-[#ffb874]/20 rounded-[32px] p-8 shadow-sm space-y-6 animate-in fade-in duration-500 transition-colors duration-300">
        <h3 className="text-sm font-black text-[#8C5000] dark:text-[#ffb874] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f18d02] dark:bg-[#ffb874]" /> Kişisel Bilgiler
        </h3>
        <div className="grid grid-cols-2 gap-5">
          {(["firstName","lastName"] as const).map(f=>(
            <div key={f} className="space-y-2">
              <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest">{f==="firstName"?"Ad":"Soyad"}</Label>
              <Input {...form.register(f)} className={cn("h-12 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 focus:border-[#8C5000] dark:focus:border-[#ffb874] font-semibold text-[#191c1d] dark:text-[#fbf9f4]",errors[f]&&"border-rose-500 bg-rose-50/50 dark:bg-rose-950/20")}/>
              {errors[f]&&<p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{errors[f]?.message}</p>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest">Doğum Tarihi</Label>
            <Input type="date" {...form.register("birthDate")} max={getMaxDate()} className={cn("h-12 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 focus:border-[#8C5000] dark:focus:border-[#ffb874] font-semibold text-[#191c1d] dark:text-[#fbf9f4]",errors.birthDate&&"border-rose-500 bg-rose-50/50 dark:bg-rose-950/20")}/>
            {errors.birthDate&&<p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{errors.birthDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest">Cinsiyet</Label>
            <div className="grid grid-cols-2 gap-2">
              {[{v:"male",label:"👨 Erkek"},{v:"female",label:"👩 Kadın"}].map(g=>(
                <button key={g.v} type="button"
                  onClick={()=>form.setValue("gender",g.v as F["gender"],{shouldDirty:true,shouldValidate:true})}
                  className={cn("h-12 rounded-2xl border text-xs font-black transition-all duration-200",
                    gender===g.v?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-[1.02]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 text-[#5a3100] dark:text-[#dbc2b0] hover:border-[#8C5000]/40 dark:hover:border-[#ffb874]/40")}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Para Birimi */}
      <div className="bg-white/95 dark:bg-[#1c140e]/95 backdrop-blur-md border border-[#8C5000]/15 dark:border-[#ffb874]/20 rounded-[32px] p-8 shadow-sm space-y-5 animate-in fade-in duration-500 transition-colors duration-300">
        <h3 className="text-sm font-black text-[#8C5000] dark:text-[#ffb874] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f18d02] dark:bg-[#ffb874]" /> Para Birimi
        </h3>
        <Controller name="currency" control={form.control} render={({field})=>(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {MAIN_CURRENCIES.map(c=>{
                const isA=field.value===c.code;
                return (
                  <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);form.trigger("currency");setShowOtherCur(false);}}
                    className={cn("p-4 rounded-3xl border text-center transition-all duration-200",
                      isA?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-lg scale-[1.03]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 hover:border-[#8C5000]/40 dark:hover:border-[#ffb874]/40")}>
                    <div className="text-2xl mb-1">{c.flag}</div>
                    <div className={cn("text-xl font-black",isA?"text-white dark:text-[#120d0a]":"text-[#5a3100] dark:text-[#fbf9f4]")}>{c.symbol}</div>
                    <div className={cn("text-[11px] font-bold",isA?"text-white/80 dark:text-[#120d0a]/80":"text-[#887364] dark:text-[#dbc2b0]")}>{c.code}</div>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={()=>setShowOtherCur(v=>!v)}
              className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border text-sm font-extrabold transition-all",
                showOtherCur||OTHER_CURRENCIES.some(c=>c.code===field.value)?"bg-[#8C5000]/10 dark:bg-[#ffb874]/10 border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874]":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 dark:border-[#887364]/40 text-[#887364] dark:text-[#dbc2b0] hover:border-[#8C5000]/30")}>
              <span>{OTHER_CURRENCIES.find(c=>c.code===field.value)?`${OTHER_CURRENCIES.find(c=>c.code===field.value)!.flag} ${OTHER_CURRENCIES.find(c=>c.code===field.value)!.label}`:"Diğer..."}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform",showOtherCur&&"rotate-180")}/>
            </button>
            {showOtherCur&&(
              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {OTHER_CURRENCIES.map(c=>{
                  const isA=field.value===c.code;
                  return (
                    <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);form.setValue("currency",c.code,{shouldDirty:true});}}
                      className={cn("flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all font-bold",
                        isA?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 dark:border-[#887364]/40 hover:border-[#8C5000]/30 dark:hover:border-[#ffb874]/30")}>
                      <span className="text-xl">{c.flag}</span>
                      <div><div className={cn("text-xs font-black",isA?"text-white dark:text-[#120d0a]":"text-[#5a3100] dark:text-[#fbf9f4]")}>{c.code}</div><div className={cn("text-[10px]",isA?"text-white/80 dark:text-[#120d0a]/80":"text-[#887364] dark:text-[#dbc2b0]")}>{c.label}</div></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}/>
      </div>

      {/* Ülke */}
      <div className="bg-white/95 dark:bg-[#1c140e]/95 backdrop-blur-md border border-[#8C5000]/15 dark:border-[#ffb874]/20 rounded-[32px] p-8 shadow-sm space-y-4 animate-in fade-in duration-500 transition-colors duration-300">
        <h3 className="text-sm font-black text-[#8C5000] dark:text-[#ffb874] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f18d02] dark:bg-[#ffb874]" /> Ülke
        </h3>
        <Controller name="country" control={form.control} render={({field})=>(
          <div className="space-y-3">
            <button type="button" onClick={()=>setShowCountries(v=>!v)}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 hover:border-[#8C5000]/40 dark:hover:border-[#ffb874]/40 transition-all">
              <span className="text-sm font-extrabold text-[#5a3100] dark:text-[#fbf9f4]">{countryLabel?`${countryLabel.flag} ${countryLabel.label}`:"Ülke seçiniz..."}</span>
              <ChevronDown className={cn("w-4 h-4 text-[#887364] dark:text-[#dbc2b0] transition-transform",showCountries&&"rotate-180")}/>
            </button>
            {showCountries&&(
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300 pr-1">
                {ALL_COUNTRIES.map(c=>{
                  const isA=field.value===c.code;
                  return (
                    <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);form.setValue("country",c.code,{shouldDirty:true});setShowCountries(false);}}
                      className={cn("flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all font-bold",
                        isA?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 dark:border-[#887364]/40 hover:border-[#8C5000]/30 dark:hover:border-[#ffb874]/30")}>
                      <span className="text-lg">{c.flag}</span>
                      <span className={cn("text-xs font-black",isA?"text-white dark:text-[#120d0a]":"text-[#5a3100] dark:text-[#fbf9f4]")}>{c.label}</span>
                      {isA&&<Check className="w-3.5 h-3.5 ml-auto text-white dark:text-[#120d0a]"/>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}/>
      </div>

      {/* İlgi Alanları */}
      <div className="bg-white/95 dark:bg-[#1c140e]/95 backdrop-blur-md border border-[#8C5000]/15 dark:border-[#ffb874]/20 rounded-[32px] p-8 shadow-sm space-y-5 animate-in fade-in duration-500 transition-colors duration-300">
        <h3 className="text-sm font-black text-[#8C5000] dark:text-[#ffb874] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f18d02] dark:bg-[#ffb874]" /> İlgi Alanları
        </h3>
        {errors.interests&&<p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.interests.message}</p>}
        <div className="flex flex-wrap gap-2.5">
          {HASHTAGS.map(h=>{
            const isA=interests.includes(h.tag);
            return (
              <button key={h.tag} type="button" onClick={()=>toggleTag(h.tag)}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black transition-all duration-200",
                  isA?"bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-105":"bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 text-[#5a3100] dark:text-[#dbc2b0] hover:border-[#8C5000]/40 dark:hover:border-[#ffb874]/40 hover:scale-[1.02]")}>
                <span className="text-base">{h.emoji}</span><span>#{h.label}</span>{isA&&<Check className="w-3.5 h-3.5"/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Bar */}
      <div className={cn("sticky bottom-6 flex items-center justify-between px-8 py-5 rounded-3xl border backdrop-blur-xl transition-all duration-300 shadow-2xl",
        isDirty?"bg-white/95 dark:bg-[#1c140e]/95 border-[#8C5000]/30 dark:border-[#ffb874]/30 shadow-[#8C5000]/15 dark:shadow-black/50":"bg-[#fbf9f4]/95 dark:bg-[#120d0a]/95 border-[#dbc2b0]/30 dark:border-[#887364]/30 shadow-none")}>
        <div>
          {isDirty
            ? <p className="text-sm font-black text-[#8C5000] dark:text-[#ffb874] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#f18d02] dark:bg-[#ffb874] animate-ping" /> Kaydedilmemiş değişiklikler var</p>
            : saved
              ? <p className="text-sm font-black text-[#36684d] dark:text-[#b8efcc] flex items-center gap-2"><Check className="w-4 h-4"/>Değişiklikler başarıyla kaydedildi!</p>
              : <p className="text-sm font-bold text-[#887364] dark:text-[#dbc2b0]">Değişiklik yapılmadı</p>
          }
        </div>
        <Button type="submit" disabled={!isDirty||saving}
          className={cn("h-12 px-8 rounded-2xl font-extrabold transition-all duration-200 shadow-lg",
            isDirty?"bg-gradient-to-r from-[#f18d02] to-[#8C5000] dark:from-[#ffb874] dark:to-[#8C5000] text-white dark:text-[#120d0a] shadow-[#8C5000]/25 dark:shadow-black/50 hover:scale-[1.03]":"bg-[#dbc2b0]/30 dark:bg-[#887364]/20 text-[#887364] dark:text-[#887364] shadow-none cursor-not-allowed")}>
          {saving?"Kaydediliyor...":<><Save className="w-5 h-5 mr-2"/>Değişiklikleri Kaydet</>}
        </Button>
      </div>
    </form>
  );
}
