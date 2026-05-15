"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, User, Globe, Hash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  firstName:  z.string().min(2, "En az 2 karakter giriniz"),
  lastName:   z.string().min(2, "En az 2 karakter giriniz"),
  birthDate:  z.string().min(1, "Doğum tarihi seçiniz"),
  gender:     z.enum(["male", "female", "other", "prefer_not"], { error: "Cinsiyet seçiniz" }),
  currency:   z.string().min(1, "Para birimi seçiniz"),
  country:    z.string().min(1, "Ülke seçiniz"),
  interests:  z.array(z.string()).min(1, "En az 1 ilgi alanı seçiniz"),
});

type FormValues = z.infer<typeof schema>;

// ─── Data ──────────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "TRY", label: "Türk Lirası", symbol: "₺", flag: "🇹🇷" },
  { code: "USD", label: "Amerikan Doları", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", label: "İngiliz Sterlini", symbol: "£", flag: "🇬🇧" },
  { code: "CHF", label: "İsviçre Frangı", symbol: "₣", flag: "🇨🇭" },
  { code: "JPY", label: "Japon Yeni", symbol: "¥", flag: "🇯🇵" },
  { code: "AED", label: "BAE Dirhemi", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", label: "Suudi Riyali", symbol: "﷼", flag: "🇸🇦" },
  { code: "RUB", label: "Rus Rublesi", symbol: "₽", flag: "🇷🇺" },
  { code: "CAD", label: "Kanada Doları", symbol: "CA$", flag: "🇨🇦" },
];

const COUNTRIES = [
  { code: "TR", label: "Türkiye", flag: "🇹🇷" },
  { code: "US", label: "Amerika Birleşik Devletleri", flag: "🇺🇸" },
  { code: "DE", label: "Almanya", flag: "🇩🇪" },
  { code: "GB", label: "Birleşik Krallık", flag: "🇬🇧" },
  { code: "FR", label: "Fransa", flag: "🇫🇷" },
  { code: "NL", label: "Hollanda", flag: "🇳🇱" },
  { code: "CH", label: "İsviçre", flag: "🇨🇭" },
  { code: "AE", label: "Birleşik Arap Emirlikleri", flag: "🇦🇪" },
  { code: "SA", label: "Suudi Arabistan", flag: "🇸🇦" },
  { code: "JP", label: "Japonya", flag: "🇯🇵" },
  { code: "CA", label: "Kanada", flag: "🇨🇦" },
  { code: "AU", label: "Avustralya", flag: "🇦🇺" },
  { code: "RU", label: "Rusya", flag: "🇷🇺" },
  { code: "OTHER", label: "Diğer", flag: "🌍" },
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
  { tag: "haber", label: "Haberler", emoji: "📰" },
  { tag: "teknoloji", label: "Teknoloji", emoji: "💻" },
  { tag: "enerji", label: "Enerji", emoji: "⚡" },
  { tag: "saglik", label: "Sağlık", emoji: "💊" },
  { tag: "fintech", label: "FinTech", emoji: "🔗" },
  { tag: "vergi", label: "Vergi", emoji: "📋" },
  { tag: "kisiselfinans", label: "Kişisel Finans", emoji: "🎯" },
];

const GENDERS = [
  { value: "male",       label: "Erkek",          emoji: "👨", color: "from-blue-400/20 to-blue-600/10 border-blue-400/40",   activeColor: "from-blue-500 to-blue-700 border-blue-500" },
  { value: "female",     label: "Kadın",           emoji: "👩", color: "from-rose-400/20 to-rose-600/10 border-rose-400/40",   activeColor: "from-rose-500 to-rose-700 border-rose-500" },
  { value: "other",      label: "Diğer",           emoji: "🌈", color: "from-purple-400/20 to-purple-600/10 border-purple-400/40", activeColor: "from-purple-500 to-purple-700 border-purple-500" },
  { value: "prefer_not", label: "Belirtmek İstemiyorum", emoji: "🔒", color: "from-muted/50 to-muted/20 border-border/40", activeColor: "from-muted-foreground to-foreground border-muted-foreground" },
];

// ─── Step configs ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, icon: User,  title: "Profil Bilgileri",    desc: "Seni tanıyalım, hoş geldin!" },
  { id: 2, icon: Globe, title: "Bölge & Para Birimi", desc: "Hangi ülke ve para birimiyle çalışıyorsun?" },
  { id: 3, icon: Hash,  title: "İlgi Alanları",       desc: "Hangi konularla ilgileniyorsun?" },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export function OnboardingForm() {
  const router  = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [genderAnim, setGenderAnim] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "", lastName: "", birthDate: "", gender: undefined,
      currency: "TRY", country: "TR", interests: [],
    },
    mode: "onChange",
  });

  const { formState: { errors } } = form;

  // Cinsiyet seçince animasyon tetikle
  const handleGenderSelect = (val: FormValues["gender"]) => {
    form.setValue("gender", val, { shouldValidate: true });
    setGenderAnim(true);
    setTimeout(() => setGenderAnim(false), 600);
  };

  // HashTag toggle
  const toggleTag = (tag: string) => {
    const cur = form.getValues("interests");
    const next = cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag];
    form.setValue("interests", next, { shouldValidate: true });
  };

  const nextStep = async () => {
    let fields: (keyof FormValues)[] = [];
    if (step === 1) fields = ["firstName", "lastName", "birthDate", "gender"];
    if (step === 2) fields = ["currency", "country"];
    const ok = await form.trigger(fields);
    if (ok) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await completeOnboarding({
        firstName:  data.firstName,
        lastName:   data.lastName,
        birthDate:  data.birthDate,
        gender:     data.gender,
        currency:   data.currency,
        country:    data.country,
        interests:  data.interests,
        // Legacy alanlar (boş gönderiyoruz, mevcut action'ı bozmamak için)
        familyCount: 1,
        maritalStatus: "Bekar",
        hasChildren: false,
        children: [],
        incomes: [],
        expenses: [],
        debts: [],
        investments: [],
        fixedAssets: [],
      } as any);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT") return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedGender = form.watch("gender");
  const selectedInterests = form.watch("interests");

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* ── Card ── */}
      <div className="bg-card border border-border/20 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">

        {/* ── Header ── */}
        <div className="px-10 pt-10 pb-6 bg-muted/30 border-b border-border/10">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500",
                  step === s.id  ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" :
                  step  > s.id  ? "bg-emerald-500 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("w-12 h-0.5 mx-2 rounded-full transition-all duration-500",
                    step > s.id ? "bg-emerald-500" : "bg-border/40")} />
                )}
              </div>
            ))}
          </div>

          {/* Logo + Title */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/mascot.png" alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Koç Ram Finans</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-center text-foreground tracking-tight">
            {STEPS[step - 1].title}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {STEPS[step - 1].desc}
          </p>
        </div>

        {/* ── Content ── */}
        <div className="p-10">
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* ══ STEP 1: Profil ══ */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Ad / Soyad */}
                <div className="grid grid-cols-2 gap-5">
                  {(["firstName", "lastName"] as const).map((field) => (
                    <div key={field} className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {field === "firstName" ? "Ad" : "Soyad"} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...form.register(field)}
                        placeholder={field === "firstName" ? "Adınız" : "Soyadınız"}
                        className={cn(
                          "h-12 rounded-xl bg-muted/40 border-border/30 focus:border-primary/50 transition-colors",
                          errors[field] && "border-destructive/50"
                        )}
                      />
                      {errors[field] && (
                        <p className="text-[10px] text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors[field]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Doğum Tarihi */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Doğum Tarihi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    {...form.register("birthDate")}
                    max={new Date().toISOString().split("T")[0]}
                    className={cn(
                      "h-12 rounded-xl bg-muted/40 border-border/30 focus:border-primary/50 transition-colors",
                      errors.birthDate && "border-destructive/50"
                    )}
                  />
                  {errors.birthDate && (
                    <p className="text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.birthDate.message}
                    </p>
                  )}
                </div>

                {/* Cinsiyet — Animasyonlu */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Cinsiyet <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {GENDERS.map((g) => {
                      const isActive = selectedGender === g.value;
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => handleGenderSelect(g.value as FormValues["gender"])}
                          className={cn(
                            "relative p-4 rounded-2xl border bg-gradient-to-br transition-all duration-300 text-left group overflow-hidden",
                            isActive
                              ? `${g.activeColor} text-white shadow-lg scale-[1.02]`
                              : `${g.color} hover:scale-[1.01] hover:shadow-md`
                          )}
                        >
                          {/* Ripple animasyonu */}
                          {isActive && genderAnim && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="w-full h-full rounded-2xl bg-white/20 animate-ping absolute" />
                            </span>
                          )}
                          <span className="text-2xl mb-1 block transition-transform duration-300 group-hover:scale-110">
                            {g.emoji}
                          </span>
                          <span className={cn("text-sm font-bold block", isActive ? "text-white" : "text-foreground")}>
                            {g.label}
                          </span>
                          {isActive && (
                            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender && (
                    <p className="text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ══ STEP 2: Para Birimi & Ülke ══ */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Para Birimi */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Tercih Ettiğiniz Para Birimi <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="currency"
                    control={form.control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {CURRENCIES.map((c) => {
                          const isActive = field.value === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => field.onChange(c.code)}
                              className={cn(
                                "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left",
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                                  : "bg-muted/40 border-border/30 hover:border-primary/30 hover:bg-muted/60"
                              )}
                            >
                              <span className="text-xl">{c.flag}</span>
                              <div className="flex-1 min-w-0">
                                <div className={cn("text-xs font-bold truncate", isActive ? "text-primary-foreground" : "text-foreground")}>
                                  {c.code}
                                </div>
                                <div className={cn("text-[10px] truncate", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                  {c.label}
                                </div>
                              </div>
                              <span className={cn("text-sm font-bold", isActive ? "text-primary-foreground" : "text-muted-foreground")}>
                                {c.symbol}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                {/* Ülke */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Yaşadığınız Ülke <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="country"
                    control={form.control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {COUNTRIES.map((c) => {
                          const isActive = field.value === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => field.onChange(c.code)}
                              className={cn(
                                "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left",
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                                  : "bg-muted/40 border-border/30 hover:border-primary/30 hover:bg-muted/60"
                              )}
                            >
                              <span className="text-xl">{c.flag}</span>
                              <span className={cn("text-xs font-semibold truncate", isActive ? "text-primary-foreground" : "text-foreground")}>
                                {c.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* ══ STEP 3: Hashtag Seçimi ══ */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs text-muted-foreground">
                  İlgilendiğin konuları seç, sana uygun içerik ve topluluklar önerelim.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {HASHTAGS.map((h) => {
                    const isActive = selectedInterests.includes(h.tag);
                    return (
                      <button
                        key={h.tag}
                        type="button"
                        onClick={() => toggleTag(h.tag)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                            : "bg-muted/40 border-border/30 text-foreground hover:border-primary/40 hover:bg-muted/70 hover:scale-102"
                        )}
                      >
                        <span>{h.emoji}</span>
                        <span>#{h.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
                {errors.interests && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.interests.message}
                  </p>
                )}

                {/* Seçilen özet */}
                {selectedInterests.length > 0 && (
                  <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                      {selectedInterests.length} alan seçildi
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInterests.map(tag => {
                        const h = HASHTAGS.find(x => x.tag === tag);
                        return (
                          <span key={tag} className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                            {h?.emoji} #{h?.label ?? tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-10 py-6 bg-muted/20 border-t border-border/10">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="h-12 px-7 rounded-xl font-bold"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Geri
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/15"
            >
              Devam Et <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading}
              className="h-12 px-10 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl hover:scale-[1.02] transition-transform"
            >
              {loading ? "Kaydediliyor..." : "Başlayalım! 🚀"}
              {!loading && <Check className="w-5 h-5 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
