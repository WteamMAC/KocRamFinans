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
      <div className="bg-card border border-border/20 rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Kişisel Bilgiler</h3>
        <div className="grid grid-cols-2 gap-4">
          {(["firstName","lastName"] as const).map(f=>(
            <div key={f} className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{f==="firstName"?"Ad":"Soyad"}</Label>
              <Input {...form.register(f)} className={cn("h-11 rounded-xl bg-muted/40 border-border/30",errors[f]&&"border-destructive/50")}/>
              {errors[f]&&<p className="text-[10px] text-destructive">{errors[f]?.message}</p>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Doğum Tarihi</Label>
            <Input type="date" {...form.register("birthDate")} max={getMaxDate()} className={cn("h-11 rounded-xl bg-muted/40 border-border/30",errors.birthDate&&"border-destructive/50")}/>
            {errors.birthDate&&<p className="text-[10px] text-destructive">{errors.birthDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cinsiyet</Label>
            <div className="grid grid-cols-2 gap-2">
              {[{v:"male",label:"👨 Erkek"},{v:"female",label:"👩 Kadın"}].map(g=>(
                <button key={g.v} type="button"
                  onClick={()=>form.setValue("gender",g.v as F["gender"],{shouldDirty:true,shouldValidate:true})}
                  className={cn("h-11 rounded-xl border text-xs font-bold transition-all",
                    gender===g.v?"bg-primary text-primary-foreground border-primary shadow":"bg-muted/40 border-border/30 hover:border-primary/30")}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Para Birimi */}
      <div className="bg-card border border-border/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Para Birimi</h3>
        <Controller name="currency" control={form.control} render={({field})=>(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {MAIN_CURRENCIES.map(c=>{
                const isA=field.value===c.code;
                return (
                  <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);form.trigger("currency");setShowOtherCur(false);}}
                    className={cn("p-3 rounded-xl border text-center transition-all",
                      isA?"bg-primary text-primary-foreground border-primary shadow scale-[1.03]":"bg-muted/40 border-border/30 hover:border-primary/30")}>
                    <div className="text-xl">{c.flag}</div>
                    <div className={cn("text-base font-bold",isA?"text-primary-foreground":"text-foreground")}>{c.symbol}</div>
                    <div className={cn("text-[10px]",isA?"text-primary-foreground/80":"text-muted-foreground")}>{c.code}</div>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={()=>setShowOtherCur(v=>!v)}
              className={cn("w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                showOtherCur||OTHER_CURRENCIES.some(c=>c.code===field.value)?"border-primary/30 text-primary":"border-border/20 text-muted-foreground hover:border-primary/20")}>
              <span>{OTHER_CURRENCIES.find(c=>c.code===field.value)?`${OTHER_CURRENCIES.find(c=>c.code===field.value)!.flag} ${OTHER_CURRENCIES.find(c=>c.code===field.value)!.label}`:"Diğer…"}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform",showOtherCur&&"rotate-180")}/>
            </button>
            {showOtherCur&&(
              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {OTHER_CURRENCIES.map(c=>{
                  const isA=field.value===c.code;
                  return (
                    <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);form.setValue("currency",c.code,{shouldDirty:true});}}
                      className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
                        isA?"bg-primary text-primary-foreground border-primary":"bg-muted/30 border-border/20 hover:border-primary/20")}>
                      <span className="text-base">{c.flag}</span>
                      <div><div className={cn("text-xs font-bold",isA?"text-primary-foreground":"text-foreground")}>{c.code}</div><div className={cn("text-[10px]",isA?"text-primary-foreground/80":"text-muted-foreground")}>{c.label}</div></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}/>
      </div>

      {/* Ülke */}
      <div className="bg-card border border-border/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Ülke</h3>
        <Controller name="country" control={form.control} render={({field})=>(
          <div className="space-y-3">
            <button type="button" onClick={()=>setShowCountries(v=>!v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-muted/40 border-border/30 hover:border-primary/30 transition-all">
              <span className="text-sm font-semibold">{countryLabel?`${countryLabel.flag} ${countryLabel.label}`:"Ülke seçiniz…"}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform",showCountries&&"rotate-180")}/>
            </button>
            {showCountries&&(
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300 pr-1">
                {ALL_COUNTRIES.map(c=>{
                  const isA=field.value===c.code;
                  return (
                    <button key={c.code} type="button" onClick={()=>{field.onChange(c.code);form.setValue("country",c.code,{shouldDirty:true});setShowCountries(false);}}
                      className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
                        isA?"bg-primary text-primary-foreground border-primary":"bg-muted/30 border-border/20 hover:border-primary/20")}>
                      <span className="text-base">{c.flag}</span>
                      <span className={cn("text-xs font-semibold",isA?"text-primary-foreground":"text-foreground")}>{c.label}</span>
                      {isA&&<Check className="w-3 h-3 ml-auto text-primary-foreground"/>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}/>
      </div>

      {/* İlgi Alanları */}
      <div className="bg-card border border-border/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">İlgi Alanları</h3>
        {errors.interests&&<p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.interests.message}</p>}
        <div className="flex flex-wrap gap-2">
          {HASHTAGS.map(h=>{
            const isA=interests.includes(h.tag);
            return (
              <button key={h.tag} type="button" onClick={()=>toggleTag(h.tag)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200",
                  isA?"bg-primary text-primary-foreground border-primary shadow scale-105":"bg-muted/40 border-border/30 hover:border-primary/30")}>
                <span>{h.emoji}</span><span>#{h.label}</span>{isA&&<Check className="w-3 h-3"/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Bar */}
      <div className={cn("sticky bottom-4 flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300 shadow-lg",
        isDirty?"bg-card border-primary/30 shadow-primary/10":"bg-muted/50 border-border/10")}>
        <div>
          {isDirty
            ? <p className="text-sm font-semibold text-primary">Kaydedilmemiş değişiklikler var</p>
            : saved
              ? <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5"><Check className="w-4 h-4"/>Kaydedildi!</p>
              : <p className="text-sm text-muted-foreground">Değişiklik yapılmadı</p>
          }
        </div>
        <Button type="submit" disabled={!isDirty||saving}
          className={cn("h-10 px-6 rounded-xl font-bold transition-all",
            isDirty?"bg-primary text-primary-foreground shadow-md hover:scale-[1.02]":"bg-muted text-muted-foreground cursor-not-allowed")}>
          {saving?"Kaydediliyor…":<><Save className="w-4 h-4 mr-2"/>Kaydet</>}
        </Button>
      </div>
    </form>
  );
}
