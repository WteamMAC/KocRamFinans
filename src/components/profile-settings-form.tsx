"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Save, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/profile";
import { useCurrency } from "@/context/currency-context";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

const MIN_AGE = 13;
function getMaxDate() {
  const d = new Date(); d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  firstName: z.string().min(2, "En az 2 karakter"),
  lastName: z.string().min(2, "En az 2 karakter"),
  birthDate: z.string().refine(v => { if (!v) return false; return new Date(v) <= new Date(getMaxDate()); }, { message: `En az ${MIN_AGE} yaşında olmalısınız` }),
  gender: z.enum(["male", "female"]),
  currency: z.string().min(1),
  country: z.string().min(1),
  interests: z.array(z.string()).min(1, "En az 1 alan seçiniz"),
});
type F = z.infer<typeof schema>;

const MAIN_CURRENCIES = [
  { code: "USD", label: "Amerikan Doları", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "TRY", label: "Türk Lirası", symbol: "₺", flag: "🇹🇷" },
];
const OTHER_CURRENCIES = [
  { code: "GBP", label: "İngiliz Sterlini", symbol: "£", flag: "🇬🇧" },
  { code: "CHF", label: "İsviçre Frangı", symbol: "₣", flag: "🇨🇭" },
  { code: "JPY", label: "Japon Yeni", symbol: "¥", flag: "🇯🇵" },
  { code: "AED", label: "BAE Dirhemi", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", label: "Suudi Riyali", symbol: "﷼", flag: "🇸🇦" },
  { code: "RUB", label: "Rus Rublesi", symbol: "₽", flag: "🇷🇺" },
  { code: "CAD", label: "Kanada Doları", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", label: "Avustralya Doları", symbol: "A$", flag: "🇦🇺" },
  { code: "CNY", label: "Çin Yuanı", symbol: "¥", flag: "🇨🇳" },
  { code: "SGD", label: "Singapur Doları", symbol: "S$", flag: "🇸🇬" },
  { code: "NOK", label: "Norveç Kronu", symbol: "kr", flag: "🇳🇴" },
  { code: "SEK", label: "İsveç Kronu", symbol: "kr", flag: "🇸🇪" },
  { code: "XAU", label: "Altın (Gram)", symbol: "ALT", flag: "🪙" },
];

const ALL_COUNTRIES = [
  { code: "TR", label: "Türkiye", flag: "🇹🇷" },
  { code: "DE", label: "Almanya", flag: "🇩🇪" },
  { code: "FR", label: "Fransa", flag: "🇫🇷" },
  { code: "GB", label: "Birleşik Krallık", flag: "🇬🇧" },
  { code: "NL", label: "Hollanda", flag: "🇳🇱" },
  { code: "CH", label: "İsviçre", flag: "🇨🇭" },
  { code: "SE", label: "İsveç", flag: "🇸🇪" },
  { code: "NO", label: "Norveç", flag: "🇳🇴" },
  { code: "BE", label: "Belçika", flag: "🇧🇪" },
  { code: "AT", label: "Avusturya", flag: "🇦🇹" },
  { code: "IT", label: "İtalya", flag: "🇮🇹" },
  { code: "ES", label: "İspanya", flag: "🇪🇸" },
  { code: "US", label: "ABD", flag: "🇺🇸" },
  { code: "CA", label: "Kanada", flag: "🇨🇦" },
  { code: "MX", label: "Meksika", flag: "🇲🇽" },
  { code: "BR", label: "Brezilya", flag: "🇧🇷" },
  { code: "AE", label: "Birleşik Arap Emirlikleri", flag: "🇦🇪" },
  { code: "SA", label: "Suudi Arabistan", flag: "🇸🇦" },
  { code: "QA", label: "Katar", flag: "🇶🇦" },
  { code: "EG", label: "Mısır", flag: "🇪🇬" },
  { code: "JP", label: "Japonya", flag: "🇯🇵" },
  { code: "CN", label: "Çin", flag: "🇨🇳" },
  { code: "KR", label: "Güney Kore", flag: "🇰🇷" },
  { code: "SG", label: "Singapur", flag: "🇸🇬" },
  { code: "AU", label: "Avustralya", flag: "🇦🇺" },
  { code: "IN", label: "Hindistan", flag: "🇮🇳" },
];

const HASHTAGS = [
  { tag: "borsa", label: "Borsa", emoji: "📈" },
  { tag: "kripto", label: "Kripto", emoji: "₿" },
  { tag: "altin", label: "Altın", emoji: "🪙" },
  { tag: "dolar", label: "Dolar/Kur", emoji: "💵" },
  { tag: "bes", label: "BES", emoji: "🛡️" },
  { tag: "emeklilik", label: "Emeklilik", emoji: "🏖️" },
  { tag: "gayrimenkul", label: "Gayrimenkul", emoji: "🏠" },
  { tag: "faiz", label: "Faiz/Mevduat", emoji: "🏦" },
  { tag: "tasarruf", label: "Tasarruf", emoji: "💰" },
  { tag: "girisim", label: "Girişim", emoji: "🚀" },
  { tag: "ekonomi", label: "Ekonomi", emoji: "📊" },
  { tag: "teknoloji", label: "Teknoloji", emoji: "💻" },
  { tag: "enerji", label: "Enerji", emoji: "⚡" },
  { tag: "saglik", label: "Sağlık", emoji: "💊" },
  { tag: "fintech", label: "FinTech", emoji: "🔗" },
  { tag: "vergi", label: "Vergi", emoji: "📋" },
  { tag: "kisiselfinans", label: "Kişisel Finans", emoji: "🎯" },
  { tag: "haber", label: "Haberler", emoji: "📰" },
];

interface Props {
  initialData: {
    firstName?: string; lastName?: string; birthDate?: string;
    gender?: string; currency?: string; country?: string; interests?: string[];
  };
}

export function ProfileSettingsForm({ initialData }: Props) {
  const { setDisplayCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOtherCur, setShowOtherCur] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");

  useEffect(() => {
    if (initialData.currency && !sessionStorage.getItem("user_profile_cur_synced")) {
      setDisplayCurrency(initialData.currency);
      sessionStorage.setItem("user_profile_cur_synced", "true");
    }
  }, [initialData.currency, setDisplayCurrency]);

  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initialData.firstName ?? "",
      lastName: initialData.lastName ?? "",
      birthDate: initialData.birthDate ?? "",
      gender: (initialData.gender as F["gender"]) ?? "male",
      currency: initialData.currency ?? "TRY",
      country: initialData.country ?? "TR",
      interests: initialData.interests ?? [],
    },
    mode: "onChange",
  });

  const { formState: { isDirty, errors } } = form;
  const interests = form.watch("interests") || [];
  const currency = form.watch("currency");
  const country = form.watch("country");
  const gender = form.watch("gender");

  const toggleTag = (tag: string) => {
    const clean = tag.replace(/^#+/, "").trim().toLowerCase();
    const cur = form.getValues("interests") || [];
    const next = cur.includes(clean) ? cur.filter(t => t !== clean) : [...cur, clean];
    form.setValue("interests", next, { shouldValidate: true, shouldDirty: true });
  };

  const addCustomTag = () => {
    const text = customTagInput.trim();
    if (!text) return;

    const words = text.split(/[\s,]+/);
    const cur = form.getValues("interests") || [];
    const newTags = [...cur];

    words.forEach(w => {
      const clean = w.replace(/^#+/, "").trim().toLowerCase();
      if (clean && !newTags.includes(clean)) {
        newTags.push(clean);
      }
    });

    form.setValue("interests", newTags, { shouldValidate: true, shouldDirty: true });
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const onSubmit = async (data: F) => {
    setSaving(true);
    try {
      await updateProfile(data);
      setDisplayCurrency(data.currency);
      sessionStorage.setItem("user_curr_synced_main", "true");
      sessionStorage.setItem("user_curr_synced", "true");
      setSaved(true);
      form.reset(data);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { console.error(e); }
    finally { setSaving(false); }
  };

  const countryLabel = ALL_COUNTRIES.find(c => c.code === country);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

      {/* Ad / Soyad */}
      <div className="bg-card border border-border/40 rounded-[32px] p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" /> Kişisel Bilgiler
        </h3>
        <div className="grid grid-cols-2 gap-5">
          {(["firstName", "lastName"] as const).map(f => (
            <div key={f} className="space-y-2">
              <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5 block">{f === "firstName" ? "Ad" : "Soyad"}</Label>
              <Input {...form.register(f)} className={cn("h-12 rounded-2xl bg-muted/40 border-border/50 focus:border-primary font-semibold", errors[f] && "border-destructive bg-destructive/10")} />
              {errors[f] && <p className="text-[10px] font-bold text-destructive">{errors[f]?.message}</p>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5 block">Doğum Tarihi</Label>
            <Controller
              name="birthDate"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  date={field.value ? parseISO(field.value) : undefined}
                  setDate={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                  placeholder="GG.AA.YYYY"
                  className={cn("h-12", errors.birthDate && "border-destructive")}
                />
              )}
            />
            {errors.birthDate && <p className="text-[10px] font-bold text-destructive">{errors.birthDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5 block">Cinsiyet</Label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "male", label: "👨 Erkek" }, { v: "female", label: "👩 Kadın" }].map(g => (
                <button key={g.v} type="button"
                  onClick={() => form.setValue("gender", g.v as F["gender"], { shouldDirty: true, shouldValidate: true })}
                  className={cn("h-12 rounded-2xl border text-xs font-black transition-all duration-200",
                    gender === g.v ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]" : "bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40")}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Para Birimi */}
      <div className="bg-card border border-border/40 rounded-[32px] p-8 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" /> Para Birimi
        </h3>
        <Controller name="currency" control={form.control} render={({ field }) => (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {MAIN_CURRENCIES.map(c => {
                const isA = field.value === c.code;
                return (
                  <button key={c.code} type="button" onClick={() => { field.onChange(c.code); form.trigger("currency"); setShowOtherCur(false); }}
                    className={cn("p-4 rounded-3xl border text-center transition-all duration-200",
                      isA ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.03]" : "bg-muted/30 border-border/40 hover:border-primary/40")}>
                    <div className="text-2xl mb-1">{c.flag}</div>
                    <div className={cn("text-xl font-black", isA ? "text-primary-foreground" : "text-foreground")}>{c.symbol}</div>
                    <div className={cn("text-[11px] font-bold", isA ? "text-primary-foreground/80" : "text-muted-foreground")}>{c.code}</div>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowOtherCur(v => !v)}
                className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border text-sm font-extrabold transition-all",
                  showOtherCur || OTHER_CURRENCIES.some(c => c.code === field.value) ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/30")}>
                <span>{OTHER_CURRENCIES.find(c => c.code === field.value) ? `${OTHER_CURRENCIES.find(c => c.code === field.value)!.flag} ${OTHER_CURRENCIES.find(c => c.code === field.value)!.label}` : "Diğer..."}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showOtherCur && "rotate-180")} />
              </button>
              {showOtherCur && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-card border border-border/30 rounded-2xl shadow-2xl grid grid-cols-2 gap-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {OTHER_CURRENCIES.map(c => {
                    const isA = field.value === c.code;
                    return (
                      <button key={c.code} type="button" onClick={() => { field.onChange(c.code); form.setValue("currency", c.code, { shouldDirty: true }); setShowOtherCur(false); }}
                        className={cn("flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all font-bold",
                          isA ? "bg-primary text-primary-foreground border-primary shadow" : "bg-muted/30 border-border/40 hover:border-primary/30")}>
                        <span className="text-xl">{c.flag}</span>
                        <div><div className={cn("text-xs font-black", isA ? "text-primary-foreground" : "text-foreground")}>{c.code}</div><div className={cn("text-[10px]", isA ? "text-primary-foreground/80" : "text-muted-foreground")}>{c.label}</div></div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )} />
      </div>

      {/* Ülke */}
      <div className="bg-card border border-border/40 rounded-[32px] p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" /> Ülke
        </h3>
        <Controller name="country" control={form.control} render={({ field }) => (
          <div className="space-y-3">
            <div className="relative">
              <button type="button" onClick={() => setShowCountries(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border bg-muted/30 border-border/40 hover:border-primary/40 transition-all">
                <span className="text-sm font-extrabold text-foreground">{countryLabel ? `${countryLabel.flag} ${countryLabel.label}` : "Ülke seçiniz..."}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showCountries && "rotate-180")} />
              </button>
              {showCountries && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-card border border-border/30 rounded-2xl shadow-2xl grid grid-cols-2 gap-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {ALL_COUNTRIES.map(c => {
                    const isA = field.value === c.code;
                    return (
                      <button key={c.code} type="button" onClick={() => { field.onChange(c.code); form.setValue("country", c.code, { shouldDirty: true }); setShowCountries(false); }}
                        className={cn("flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all font-bold",
                          isA ? "bg-primary text-primary-foreground border-primary shadow" : "bg-muted/30 border-border/40 hover:border-primary/30")}>
                        <span className="text-lg">{c.flag}</span>
                        <span className={cn("text-xs font-black", isA ? "text-primary-foreground" : "text-foreground")}>{c.label}</span>
                        {isA && <Check className="w-3.5 h-3.5 ml-auto text-primary-foreground" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )} />
      </div>

      {/* İlgi Alanları */}
      <div className="bg-card border border-border/40 rounded-[32px] p-8 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" /> İlgi Alanları
        </h3>
        <p className="text-xs font-bold text-muted-foreground">
          Aşağıdaki önerilerden seçebilir veya kendi özel etiketini (Örn: #TR #COIN #BIST) yazıp Boşluk veya Enter tuşuna basabilirsin. Orijinal listede olmayan özel etiketler seçimden çıkarıldığında otomatik silinir.
        </p>

        {/* Custom Hashtag Input */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={customTagInput}
              onChange={e => setCustomTagInput(e.target.value)}
              onKeyDown={handleCustomTagKeyDown}
              placeholder="Özel etiket ekle ve Boşluk veya Enter tuşuna bas (Örn: #TR #Kripto #NFT)..."
              className="h-12 rounded-2xl bg-muted/40 font-bold text-foreground placeholder:text-muted-foreground pr-10 border-border/50 focus:border-primary shadow-sm"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-primary">#</span>
          </div>
          <Button type="button" onClick={addCustomTag} variant="outline" className="h-12 px-5 rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-black shadow-sm shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Ekle
          </Button>
        </div>

        {errors.interests && <p className="text-[10px] font-bold text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.interests.message}</p>}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {HASHTAGS.map(h => {
            const isA = interests.includes(h.tag);
            return (
              <button key={h.tag} type="button" onClick={() => toggleTag(h.tag)}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black transition-all duration-200",
                  isA ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/40 hover:scale-[1.02]")}>
                <span className="text-base">{h.emoji}</span><span>#{h.label}</span>{isA && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}

          {/* Orijinal listede olmayan kullanıcının kendi özel etiketleri */}
          {interests
            .filter(tag => !HASHTAGS.some(h => h.tag === tag))
            .map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black bg-primary text-primary-foreground border-primary shadow-md scale-105 transition-all duration-200">
                <span className="text-base">📌</span><span>#{tag.toUpperCase()}</span><Check className="w-3.5 h-3.5" />
              </button>
            ))
          }
        </div>
      </div>

      {/* Save Bar */}
      <div className={cn("sticky bottom-6 flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 py-4 md:py-5 rounded-3xl border backdrop-blur-xl transition-all duration-300 shadow-2xl z-50",
        isDirty ? "bg-card border-primary/40 shadow-primary/10" : "bg-muted/80 border-border/30 shadow-none")}>
        <div className="text-center md:text-left">
          {isDirty
            ? <p className="text-xs md:text-sm font-black text-primary flex items-center justify-center md:justify-start gap-2"><span className="w-2 h-2 rounded-full bg-accent animate-ping" /> Kaydedilmemiş değişiklikler var</p>
            : saved
              ? <p className="text-xs md:text-sm font-black text-primary flex items-center justify-center md:justify-start gap-2"><Check className="w-4 h-4" />Değişiklikler başarıyla kaydedildi!</p>
              : <p className="text-xs md:text-sm font-bold text-muted-foreground">Değişiklik yapılmadı</p>
          }
        </div>
        <Button type="submit" disabled={!isDirty || saving}
          className={cn("h-12 w-full md:w-auto px-8 rounded-2xl font-extrabold transition-all duration-200 shadow-lg",
            isDirty ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.03]" : "bg-muted-foreground/20 text-muted-foreground shadow-none cursor-not-allowed")}>
          {saving ? "Kaydediliyor..." : <><Save className="w-5 h-5 mr-2" />Değişiklikleri Kaydet</>}
        </Button>
      </div>
    </form>
  );
}
