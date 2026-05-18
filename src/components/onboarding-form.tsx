"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeOnboarding } from "@/app/actions/onboarding";
import { searchSymbolsAction, getSymbolLivePriceAction } from "@/app/actions/market";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, User, Globe, Hash, AlertCircle, ChevronDown, Plus, Trash2, Wallet, CreditCard, X, Search, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AssetForm } from "./dashboard/asset-form";


const MIN_AGE = 13;
function getMaxDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  firstName: z.string().min(2, "En az 2 karakter"),
  lastName: z.string().min(2, "En az 2 karakter"),
  birthDate: z.string().refine(v => {
    if (!v) return false;
    const d = new Date(v); const max = new Date(getMaxDate());
    return d <= max;
  }, { message: `En az ${MIN_AGE} yaşında olmalısınız` }),
  gender: z.enum(["male", "female"], { error: "Lütfen cinsiyetinizi seçiniz" }),
  currency: z.string().min(1, "Para birimi seçiniz"),
  country: z.string().min(1, "Ülke seçiniz"),
  incomes: z.array(z.object({
    type: z.string().min(1, "Gelir türü seçiniz"),
    amount: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
    date: z.string().optional(),
    description: z.string().optional(),
    currency: z.string().optional(),
  })),
  expenses: z.array(z.object({
    type: z.string().min(1, "Gider türü seçiniz"),
    amount: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
    date: z.string().optional(),
    isRecurring: z.boolean().default(true),
    description: z.string().optional(),
    currency: z.string().optional(),
  })),
  interests: z.array(z.string()).min(1, "En az 1 alan seçiniz"),
  debts: z.array(z.object({
    type: z.string().min(1, "Borç türü seçiniz"),
    amount: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
    description: z.string().optional(),
    remainingInstallments: z.coerce.number().optional(),
    interestRate: z.coerce.number().optional(),
    paymentDay: z.coerce.number().optional(),
    installmentAmount: z.coerce.number().optional(),
    principalAmount: z.coerce.number().optional(),
    dueDate: z.string().optional(),
    currency: z.string().optional(),
  })).optional(),
  investments: z.array(z.object({
    type: z.string().min(1, "Varlık türü seçiniz"),
    amount: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
    purchasePrice: z.coerce.number().optional(),
    quantity: z.coerce.number().optional(),
    symbol: z.string().optional(),
    description: z.string().optional(),
    currency: z.string().optional(),
    fundType: z.string().optional(),
    monthlyContribution: z.coerce.number().optional(),
    maturityPeriod: z.coerce.number().optional(),
  })).optional(),
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

const REGIONS: { id: string; label: string; emoji: string; countries: { code: string; label: string; flag: string }[] }[] = [
  {
    id: "eu", label: "Avrupa & Türkiye", emoji: "🌍", countries: [
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
    ]
  },
  {
    id: "am", label: "Kuzey & Güney Amerika", emoji: "🌎", countries: [
      { code: "US", label: "ABD", flag: "🇺🇸" },
      { code: "CA", label: "Kanada", flag: "🇨🇦" },
      { code: "MX", label: "Meksika", flag: "🇲🇽" },
      { code: "BR", label: "Brezilya", flag: "🇧🇷" },
      { code: "AR", label: "Arjantin", flag: "🇦🇷" },
      { code: "CL", label: "Şili", flag: "🇨🇱" },
      { code: "CO", label: "Kolombiya", flag: "🇨🇴" },
    ]
  },
  {
    id: "me", label: "Orta Doğu & Afrika", emoji: "🌍", countries: [
      { code: "AE", label: "Birleşik Arap Emirlikleri", flag: "🇦🇪" },
      { code: "SA", label: "Suudi Arabistan", flag: "🇸🇦" },
      { code: "QA", label: "Katar", flag: "🇶🇦" },
      { code: "KW", label: "Kuveyt", flag: "🇰🇼" },
      { code: "EG", label: "Mısır", flag: "🇪🇬" },
      { code: "MA", label: "Fas", flag: "🇲🇦" },
      { code: "ZA", label: "Güney Afrika", flag: "🇿🇦" },
      { code: "NG", label: "Nijerya", flag: "🇳🇬" },
    ]
  },
  {
    id: "as", label: "Asya & Pasifik", emoji: "🌏", countries: [
      { code: "JP", label: "Japonya", flag: "🇯🇵" },
      { code: "CN", label: "Çin", flag: "🇨🇳" },
      { code: "KR", label: "Güney Kore", flag: "🇰🇷" },
      { code: "SG", label: "Singapur", flag: "🇸🇬" },
      { code: "AU", label: "Avustralya", flag: "🇦🇺" },
      { code: "NZ", label: "Yeni Zelanda", flag: "🇳🇿" },
      { code: "IN", label: "Hindistan", flag: "🇮🇳" },
      { code: "ID", label: "Endonezya", flag: "🇮🇩" },
    ]
  },
];

const INCOME_TYPES = ["Maaş", "Kira Geliri", "Ek İş / Freelance", "Yatırım Temettü", "Diğer"];
const EXPENSE_TYPES = ["Ev Kirası / İpotek", "Faturalar (Elektrik, Su, Doğalgaz)", "Mutfak & Market", "Ulaşım / Akaryakıt", "Eğitim / Sağlık", "Diğer"];
const DEBT_TYPES = ["Kredi Kartı", "Banka Kredisi", "Şahsi Borç", "Elden Taksit", "Diğer"];
const INVESTMENT_TYPES = ["BIST", "NASDAQ", "CRYPTO", "GOLD", "BES", "FAIZ", "CASH", "Diğer"];

const ASSET_CATEGORIES = [
  { id: "BIST", title: "BIST Hisse Senedi", emoji: "📈", desc: "Türk borsası hisseleri (THYAO, ASELS...)", fields: ["Sembol", "Hisse Adedi", "Birim Fiyat"] },
  { id: "NASDAQ", title: "ABD & Yabancı Hisse", emoji: "🗽", desc: "NASDAQ, S&P 500 (AAPL, TSLA...)", fields: ["Sembol", "Hisse Adedi", "Birim Fiyat"] },
  { id: "CRYPTO", title: "Kripto Varlık", emoji: "₿", desc: "Bitcoin, Ethereum, Solana ve altcoinler", fields: ["Sembol", "Coin Miktarı", "Birim Fiyat"] },
  { id: "GOLD", title: "Altın & Maden", emoji: "🪙", desc: "Gram altın, çeyrek, külçe vb.", fields: ["Tür / Sembol", "Gram / Adet", "Alış Fiyatı"] },
  { id: "BES", title: "Bireysel Emeklilik", emoji: "🛡️", desc: "BES ve fon birikimleri", fields: ["Fon / Kurum", "Pay Miktarı", "Birim Fiyat"] },
  { id: "FAIZ", title: "Vadeli Mevduat", emoji: "🏦", desc: "Vadeli mevduat, faiz ve likit fonlar", fields: ["Kurum Adı", "Miktar / Adet", "Faiz/Getiri %"] },
  { id: "CASH", title: "Nakit & Döviz", emoji: "💵", desc: "Vadesiz hesap, dolar, euro, elden nakit", fields: ["Döviz Kodu", "Miktar", "Birim Fiyat"] },
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

const STEPS = [
  { id: 1, icon: User, title: "Profil Bilgileri", desc: "Seni yakından tanıyalım" },
  { id: 2, icon: Globe, title: "Bölge & Para Birimi", desc: "Nerede, hangi parayla işlem yapıyorsun?" },
  { id: 3, icon: Wallet, title: "Aylık Gelirler", desc: "Düzenli kazançlarını ekle" },
  { id: 4, icon: CreditCard, title: "Aylık Giderler", desc: "Sabit harcama ve faturalarını belirle" },
  { id: 5, icon: AlertCircle, title: "Borçlar & Ödemeler", desc: "Varsa mevcut borçlarını yönetelim" },
  { id: 6, icon: Plus, title: "Varlıklar & Yatırım", desc: "Sahip olduğun değerleri ekle" },
  { id: 7, icon: Hash, title: "İlgi Alanları", desc: "Sana en uygun finansal analizler için" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [genderAnim, setGenderAnim] = useState(false);
  const [showOtherCur, setShowOtherCur] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");

  // Pop-up (Modal) State İçin
  const [activeAssetModal, setActiveAssetModal] = useState<string | null>(null);
  const [useCurrentPrice, setUseCurrentPrice] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [modalAssetData, setModalAssetData] = useState({
    symbol: "",
    amount: "",
    quantity: "1",
    purchasePrice: "",
    currency: "TRY",
    description: "",
    fundType: "STANDART",
    monthlyContribution: "0",
    maturityPeriod: "32",
  });

  // Gelir Modalı State
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [modalIncomeError, setModalIncomeError] = useState("");
  const [modalIncomeData, setModalIncomeData] = useState({
    type: "Maaş",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    currency: "TRY"
  });

  // Gider Modalı State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [modalExpenseError, setModalExpenseError] = useState("");
  const [modalExpenseData, setModalExpenseData] = useState({
    type: "Ev Kirası / İpotek",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    isRecurring: true,
    description: "",
    currency: "TRY"
  });

  // Borç Modalı State
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [modalDebtError, setModalDebtError] = useState("");
  const [modalDebtData, setModalDebtData] = useState({
    type: "Kredi Kartı",
    amount: "",
    remainingInstallments: "",
    interestRate: "",
    paymentDay: "15",
    dueDate: "",
    description: "",
    currency: "TRY"
  });

  const form = useForm<F>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      firstName: "", lastName: "", birthDate: "", gender: undefined as any, currency: "TRY", country: "",
      incomes: [],
      expenses: [],
      interests: [],
      debts: [],
      investments: []
    },
    mode: "onChange",
  });

  const { formState: { errors } } = form;
  const selectedGender = form.watch("gender");
  const selectedCurrency = form.watch("currency");
  const selectedCountry = form.watch("country");
  const selectedInterests = form.watch("interests");
  const watchedInvestments = form.watch("investments") || [];

  const incomesField = useFieldArray({ control: form.control, name: "incomes" });
  const expensesField = useFieldArray({ control: form.control, name: "expenses" });
  const debtsField = useFieldArray({ control: form.control, name: "debts" });
  const investmentsField = useFieldArray({ control: form.control, name: "investments" });

  const handleGender = (v: F["gender"]) => {
    form.setValue("gender", v, { shouldValidate: true });
    setGenderAnim(true);
    setTimeout(() => setGenderAnim(false), 600);
  };

  // Varlık Ekleme Modalı Arama ve Fiyat Çekme State & Fonksiyonları
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2 && activeAssetModal && activeAssetModal !== "BES" && activeAssetModal !== "FAIZ") {
        const results = await searchSymbolsAction(searchQuery, activeAssetModal);
        setSearchResults(results);
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeAssetModal]);

  const handleSelectSearchResult = async (sym: string, name?: string) => {
    setShowSearch(false);
    const desc = name || modalAssetData.description;
    setModalAssetData(prev => ({ ...prev, symbol: sym, description: desc }));
    setSearchQuery(sym);
    if (useCurrentPrice) fetchCurrentPriceForSymbol(sym);
  };

  const handleQuantityChange = (val: string) => {
    const q = parseFloat(val) || 0;
    const p = parseFloat(modalAssetData.purchasePrice) || 0;
    setModalAssetData(prev => ({ ...prev, quantity: val, amount: (q > 0 && p > 0) ? (q * p).toFixed(2) : prev.amount }));
  };

  const handlePriceChange = (val: string) => {
    const p = parseFloat(val) || 0;
    const q = parseFloat(modalAssetData.quantity) || 0;
    setModalAssetData(prev => ({ ...prev, purchasePrice: val, amount: (q > 0 && p > 0) ? (q * p).toFixed(2) : prev.amount }));
  };

  const fetchCurrentPriceForSymbol = async (sym: string) => {
    if (!sym) return;
    try {
      setFetchingLive(true);
      const cleanSym = sym.split(" ")[0].trim();
      const liveData = await getSymbolLivePriceAction(cleanSym);
      if (liveData && liveData.originalPrice > 0) {
        const p = liveData.originalPrice;
        const newCur = liveData.originalCurrency === "TRY" ? (selectedCurrency || "TRY") : liveData.originalCurrency;
        setModalAssetData(prev => ({
          ...prev,
          currency: newCur,
          purchasePrice: p.toString()
        }));
      }
    } catch (e: any) {
      console.error("Live price error:", e);
    } finally {
      setFetchingLive(false);
    }
  };

  const handleToggleCurrentPrice = () => {
    const newState = !useCurrentPrice;
    setUseCurrentPrice(newState);
    if (newState && modalAssetData.symbol) {
      fetchCurrentPriceForSymbol(modalAssetData.symbol);
    }
  };

  const handleOpenAssetModal = (type: string) => {
    setActiveAssetModal(type);
    setSearchQuery("");
    setShowSearch(false);
    setUseCurrentPrice(false);
    setModalAssetData({
      symbol: "",
      amount: "",
      quantity: "1",
      purchasePrice: "",
      currency: selectedCurrency || "TRY",
      description: "",
      fundType: "STANDART",
      monthlyContribution: "0",
      maturityPeriod: "32",
    });
  };

  const handleOpenIncomeModal = () => {
    setModalIncomeError("");
    setModalIncomeData({
      type: "Maaş",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      currency: selectedCurrency || "TRY"
    });
    setShowIncomeModal(true);
  };

  const handleOpenExpenseModal = () => {
    setModalExpenseError("");
    setModalExpenseData({
      type: "Ev Kirası / İpotek",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      isRecurring: true,
      description: "",
      currency: selectedCurrency || "TRY"
    });
    setShowExpenseModal(true);
  };

  const handleOpenDebtModal = () => {
    setModalDebtError("");
    setModalDebtData({
      type: "Kredi Kartı",
      amount: "",
      remainingInstallments: "",
      interestRate: "",
      paymentDay: "15",
      dueDate: "",
      description: "",
      currency: selectedCurrency || "TRY"
    });
    setShowDebtModal(true);
  };

  const handleSaveIncomeModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(modalIncomeData.amount) || 0;
    if (amountVal <= 0) {
      setModalIncomeError("Miktar 0'dan büyük olmalıdır");
      return;
    }
    setModalIncomeError("");
    incomesField.append({
      type: modalIncomeData.type,
      amount: amountVal,
      date: modalIncomeData.date || new Date().toISOString().split("T")[0],
      description: modalIncomeData.description || undefined,
      currency: modalIncomeData.currency || selectedCurrency || "TRY",
    });
    setShowIncomeModal(false);
  };

  const handleSaveExpenseModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(modalExpenseData.amount) || 0;
    if (amountVal <= 0) {
      setModalExpenseError("Miktar 0'dan büyük olmalıdır");
      return;
    }
    setModalExpenseError("");
    expensesField.append({
      type: modalExpenseData.type,
      amount: amountVal,
      date: modalExpenseData.date || new Date().toISOString().split("T")[0],
      isRecurring: modalExpenseData.isRecurring,
      description: modalExpenseData.description || undefined,
      currency: modalExpenseData.currency || selectedCurrency || "TRY",
    });
    setShowExpenseModal(false);
  };

  const handleSaveDebtModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(modalDebtData.amount) || 0;
    if (amountVal <= 0) {
      setModalDebtError("Miktar 0'dan büyük olmalıdır");
      return;
    }
    setModalDebtError("");
    
    const isTaksitli = modalDebtData.remainingInstallments && parseInt(modalDebtData.remainingInstallments) > 0;
    
    debtsField.append({
      type: modalDebtData.type,
      amount: amountVal,
      remainingInstallments: isTaksitli ? parseInt(modalDebtData.remainingInstallments) : undefined,
      interestRate: modalDebtData.interestRate ? parseFloat(modalDebtData.interestRate) : undefined,
      paymentDay: isTaksitli && modalDebtData.paymentDay ? parseInt(modalDebtData.paymentDay) : undefined,
      dueDate: !isTaksitli && modalDebtData.dueDate ? modalDebtData.dueDate : undefined,
      description: modalDebtData.description || undefined,
      currency: modalDebtData.currency || selectedCurrency || "TRY",
    });
    setShowDebtModal(false);
  };

  const handleSaveAssetModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAssetData.symbol || modalAssetData.symbol.trim() === "") {
      alert("Lütfen bir sembol veya kod giriniz / seçiniz.");
      return;
    }
    const qVal = parseFloat(modalAssetData.quantity) || 1;
    const pVal = parseFloat(modalAssetData.purchasePrice) || 0;
    const calcAmount = activeAssetModal === "FAIZ" ? qVal : (pVal > 0 ? qVal * pVal : qVal);

    if (calcAmount <= 0) {
      alert("Lütfen geçerli bir fiyat ve miktar giriniz.");
      return;
    }
    const typeObj = ASSET_CATEGORIES.find(c => c.id === activeAssetModal);
    const typeName = typeObj?.id || activeAssetModal || "Diğer";

    investmentsField.append({
      type: typeName,
      symbol: modalAssetData.symbol ? modalAssetData.symbol.toUpperCase().trim() : undefined,
      amount: calcAmount,
      quantity: qVal,
      purchasePrice: pVal || calcAmount,
      currency: modalAssetData.currency || selectedCurrency || "TRY",
      description: modalAssetData.description || undefined,
      fundType: modalAssetData.fundType,
      monthlyContribution: parseFloat(modalAssetData.monthlyContribution) || 0,
      maturityPeriod: parseInt(modalAssetData.maturityPeriod) || 32,
    });
    setActiveAssetModal(null);
  };

  const toggleTag = (tag: string) => {
    const cleanTag = tag.replace(/^#+/, "").trim().toLowerCase();
    if (!cleanTag) return;

    const cur = form.getValues("interests");
    form.setValue("interests", cur.includes(cleanTag) ? cur.filter(t => t !== cleanTag) : [...cur, cleanTag], { shouldValidate: true });
  };

  const addCustomTag = () => {
    const text = customTagInput.trim();
    if (!text) return;

    const words = text.split(/[\s,]+/);
    const cur = form.getValues("interests");
    const newTags = [...cur];

    words.forEach(w => {
      const clean = w.replace(/^#+/, "").trim().toLowerCase();
      if (clean && !newTags.includes(clean)) {
        newTags.push(clean);
      }
    });

    form.setValue("interests", newTags, { shouldValidate: true });
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const nextStep = async () => {
    const fields: (keyof F)[][] = [
      ["firstName", "lastName", "birthDate", "gender"],
      ["currency", "country"],
      ["incomes"],
      ["expenses"],
      ["debts"],
      ["investments"],
    ];
    const ok = await form.trigger(fields[step - 1] as any);
    if (ok) setStep(s => s + 1);
  };

  const onSubmit = async (data: any) => {
    setLoading(true); setDbError(null);
    try {
      const defaultCur = data.currency || "TRY";
      const cleanData = {
        ...data,
        incomes: (data.incomes || []).map((i: any) => ({ ...i, currency: i.currency || defaultCur })),
        expenses: (data.expenses || []).map((e: any) => ({ ...e, currency: e.currency || defaultCur })),
        debts: (data.debts || []).map((d: any) => ({ ...d, currency: d.currency || defaultCur })),
        investments: (data.investments || []).map((inv: any) => ({ ...inv, currency: inv.currency || defaultCur })),
      };

      const result = await completeOnboarding({
        ...cleanData,
        familyCount: 1,
        debts: cleanData.debts || [],
        investments: cleanData.investments || [],
        fixedAssets: []
      } as any);

      if (result?.success) {
        router.refresh();
        router.push("/dashboard");
      } else {
        setDbError(result?.error || "Kayıt sırasında bir sorun oluştu.");
      }
    } catch (e: any) {
      console.error("Onboarding error:", e);
      setDbError(e?.message || "Sunucu bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const regionCountries = selectedRegion ? (REGIONS.find(r => r.id === selectedRegion)?.countries ?? []) : [];

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="bg-card border border-[#8C5000]/20 dark:border-[#ffb874]/20 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-700 transition-colors duration-300 relative">

        {/* Yumuşak Sıcak Turuncu Header */}
        <div className="relative px-3 sm:px-8 pt-8 pb-6 bg-[#fbf9f4] dark:bg-[#120d0a]/60 border-b border-[#8C5000]/15 dark:border-[#ffb874]/15 overflow-hidden transition-colors duration-300 rounded-t-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f18d02]/15 dark:bg-[#ffb874]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Step indicator dots */}
          <div className="relative flex items-center justify-center gap-2 sm:gap-3 mb-6 z-10 py-2 px-1 w-full overflow-visible">
            {(step <= 4 ? STEPS.slice(0, 4) : STEPS.slice(4, 7)).map((s, i, arr) => (
              <div key={s.id} className="flex items-center shrink-0">
                <div className={cn("w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-500 shrink-0",
                  step === s.id ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] scale-110 shadow-lg shadow-[#8C5000]/30 dark:shadow-black/50" :
                    step > s.id ? "bg-[#b07d4b] dark:bg-[#ffb874]/80 text-white dark:text-[#120d0a]" : "bg-[#dbc2b0]/30 dark:bg-[#887364]/30 text-[#887364] dark:text-[#dbc2b0]")}>
                  {step > s.id ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s.id}
                </div>
                {i < arr.length - 1 && (
                  <div className={cn("w-6 sm:w-14 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-500 shrink-0",
                    step > s.id ? "bg-[#b07d4b] dark:bg-[#ffb874]/80" : "bg-[#dbc2b0]/40 dark:bg-[#887364]/30"
                  )} />
                )}
              </div>
            ))}
          </div>

          <h1 className="relative z-10 text-2xl sm:text-3xl font-heading font-black text-center text-[#5a3100] dark:text-[#ffb874] tracking-tight">
            {STEPS[step - 1].title}
          </h1>
          <p className="relative z-10 text-xs text-[#887364] dark:text-[#dbc2b0] text-center mt-1 font-medium tracking-wide">
            {STEPS[step - 1].desc}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 bg-card transition-colors duration-300 relative">
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
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {(["firstName", "lastName"] as const).map(f => (
                    <div key={f} className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest px-2 mb-1.5 block">
                        {f === "firstName" ? "Ad" : "Soyad"} <span className="text-rose-500/80">*</span>
                      </Label>
                      <Input {...form.register(f)} placeholder={f === "firstName" ? "Adınız" : "Soyadınız"}
                        className={cn("h-12 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 focus:border-[#8C5000] dark:focus:border-[#ffb874] font-semibold text-foreground placeholder:text-muted-foreground/50", errors[f] && "border-destructive bg-destructive/10")} />
                      {errors[f] && <p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1 px-2"><AlertCircle className="h-3 w-3" />{errors[f]?.message as string}</p>}
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
                  {errors.birthDate && <p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1 px-2"><AlertCircle className="h-3 w-3" />{errors.birthDate.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest px-2 mb-1.5 block">
                    Cinsiyet <span className="text-rose-500/80">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { v: "male", label: "Erkek", emoji: "👨" },
                      { v: "female", label: "Kadın", emoji: "👩" },
                    ].map(g => {
                      const isActive = selectedGender === g.v;
                      return (
                        <button key={g.v} type="button" onClick={() => handleGender(g.v as F["gender"])}
                          className={cn("relative h-28 p-5 rounded-2xl border transition-all duration-300 overflow-hidden font-bold flex flex-col items-center justify-center",
                            isActive ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-lg scale-[1.03]" : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 dark:border-[#887364]/40 text-[#5a3100] dark:text-[#dbc2b0] hover:border-[#8C5000]/40 hover:scale-[1.01] text-xs font-black")}>
                          {isActive && genderAnim && <span className="absolute inset-0 rounded-2xl bg-white/30 dark:bg-black/20 animate-ping" />}
                          <span className="text-3xl block mb-2">{g.emoji}</span>
                          <span className="text-sm font-black">{g.label}</span>
                          {isActive && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 dark:bg-black/20 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender && <p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1 px-2"><AlertCircle className="h-3 w-3" />{errors.gender.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: Para Birimi & Ülke */}
            {step === 2 && (
              <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest mb-1.5 block">Para Birimi <span className="text-rose-500/80">*</span></Label>
                  <Controller name="currency" control={form.control} render={({ field }) => (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {MAIN_CURRENCIES.map(c => {
                          const isActive = field.value === c.code;
                          return (
                            <button key={c.code} type="button" onClick={() => { field.onChange(c.code); setShowOtherCur(false); }}
                              className={cn("h-28 flex flex-col items-center justify-center p-4 rounded-3xl border text-center transition-all duration-200 w-full",
                                isActive ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-xl scale-[1.03]" : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 hover:border-[#8C5000]/40")}>
                              <div className="text-2xl mb-1">{c.flag}</div>
                              <div className={cn("text-xl font-black", isActive ? "text-white dark:text-[#120d0a]" : "text-[#5a3100] dark:text-[#fbf9f4]")}>{c.symbol}</div>
                              <div className={cn("text-[11px] font-bold", isActive ? "text-white/80 dark:text-[#120d0a]/80" : "text-[#887364] dark:text-[#dbc2b0]")}>{c.code}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <button type="button" onClick={() => { setShowOtherCur(v => !v); setSelectedRegion(null); }}
                          className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border text-sm font-extrabold transition-all",
                            showOtherCur || OTHER_CURRENCIES.some(c => c.code === field.value)
                              ? "bg-[#8C5000]/10 border-[#8C5000]/30 text-[#8C5000] dark:text-[#ffb874]" : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 text-[#887364] dark:text-[#dbc2b0] hover:border-[#8C5000]/30")}>
                          <span>
                            {OTHER_CURRENCIES.find(c => c.code === field.value)
                              ? `${OTHER_CURRENCIES.find(c => c.code === field.value)!.flag} ${OTHER_CURRENCIES.find(c => c.code === field.value)!.label}`
                              : "Diğer para birimi..."}
                          </span>
                          <ChevronDown className={cn("w-4 h-4 transition-transform", showOtherCur && "rotate-180")} />
                        </button>
                        {showOtherCur && (
                          <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-card border border-border/30 rounded-2xl shadow-2xl grid grid-cols-2 gap-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            {OTHER_CURRENCIES.map(c => {
                              const isActive = field.value === c.code;
                              return (
                                <button key={c.code} type="button" onClick={() => { field.onChange(c.code); setShowOtherCur(false); }}
                                  className={cn("flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all font-bold",
                                    isActive ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow" : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 hover:border-[#8C5000]/30")}>
                                  <span className="text-xl">{c.flag}</span>
                                  <div>
                                    <div className={cn("text-xs font-black", isActive ? "text-white dark:text-[#120d0a]" : "text-[#5a3100] dark:text-[#fbf9f4]")}>{c.code}</div>
                                    <div className={cn("text-[10px]", isActive ? "text-white/80 dark:text-[#120d0a]/80" : "text-[#887364] dark:text-[#dbc2b0]")}>{c.label}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )} />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] uppercase tracking-widest mb-1.5 block">Kıta / Bölge <span className="text-rose-500/80">*</span></Label>
                  <Controller name="country" control={form.control} render={({ field }) => (
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="grid grid-cols-2 gap-2">
                          {REGIONS.map(r => {
                            const active = selectedRegion === r.id;
                            const hasSelected = r.countries.some(c => c.code === field.value);
                            const activeCountry = r.countries.find(c => c.code === field.value);
                            return (
                              <button key={r.id} type="button"
                                onClick={() => { setSelectedRegion(active ? null : r.id); setShowOtherCur(false); }}
                                className={cn("h-24 flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center text-xs font-bold transition-all duration-200 w-full",
                                  active || hasSelected ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-[1.02]" : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/40 hover:border-[#8C5000]/30")}>
                                <div className="text-2xl mb-1">{r.emoji}</div>
                                <div className={cn("text-xs font-extrabold", active || hasSelected ? "text-white dark:text-[#120d0a]" : "text-[#5a3100] dark:text-[#fbf9f4]")}>
                                  {hasSelected && !active ? `${activeCountry?.flag} ${activeCountry?.label}` : r.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )} />
                  {errors.country && <p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.country.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: Aylık Gelirler */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0]">Düzenli Gelir Kaynakları</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleOpenIncomeModal}
                    className="rounded-xl border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874] font-bold hover:bg-[#8C5000]/10">
                    <Plus className="w-4 h-4 mr-1" /> Gelir Ekle
                  </Button>
                </div>
                <div className="space-y-4">
                  {incomesField.fields.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-[#dbc2b0]/30 rounded-3xl bg-[#faf9f6]/50 dark:bg-[#120d0a]/30">
                      <p className="text-xs font-bold text-[#887364]/60">Henüz gelir kaynağı eklenmedi. "Gelir Ekle" butonuna tıklayarak ekleyebilirsiniz.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {incomesField.fields.map((item: any, i: number) => (
                      <div key={item.id} className="p-4 rounded-3xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/50 dark:border-[#887364]/40 flex items-center justify-between gap-3 shadow-sm hover:border-[#8C5000]/40 transition-all animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#1c140e] flex items-center justify-center text-2xl border border-[#dbc2b0]/40 dark:border-[#887364]/40 shrink-0 shadow-sm">
                            💰
                          </div>
                          <div>
                            <div className="text-sm font-black text-foreground flex items-center gap-2">
                              <span className="text-base font-extrabold">{item.type}</span>
                            </div>
                            <div className="text-xs font-extrabold text-[#8C5000] dark:text-[#ffb874] mt-1">
                              {Number(item.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {item.currency || selectedCurrency || "TRY"}
                            </div>
                            {item.description && (
                              <div className="text-[10px] text-muted-foreground font-semibold mt-1 bg-[#887364]/10 dark:bg-[#dbc2b0]/10 px-2 py-0.5 rounded border border-border/10">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => incomesField.remove(i)} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 rounded-xl transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Aylık Giderler */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0]">Düzenli Giderler</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleOpenExpenseModal}
                    className="rounded-xl border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874] font-bold hover:bg-[#8C5000]/10">
                    <Plus className="w-4 h-4 mr-1" /> Gider Ekle
                  </Button>
                </div>
                <div className="space-y-4">
                  {expensesField.fields.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-[#dbc2b0]/30 rounded-3xl bg-[#faf9f6]/50 dark:bg-[#120d0a]/30">
                      <p className="text-xs font-bold text-[#887364]/60">Henüz gider eklenmedi. "Gider Ekle" butonuna tıklayarak ekleyebilirsiniz.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {expensesField.fields.map((item: any, i: number) => (
                      <div key={item.id} className="p-4 rounded-3xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/50 dark:border-[#887364]/40 flex items-center justify-between gap-3 shadow-sm hover:border-[#8C5000]/40 transition-all animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#1c140e] flex items-center justify-center text-2xl border border-[#dbc2b0]/40 dark:border-[#887364]/40 shrink-0 shadow-sm">
                            💸
                          </div>
                          <div>
                            <div className="text-sm font-black text-foreground flex items-center gap-2">
                              <span className="text-base font-extrabold">{item.type}</span>
                            </div>
                            <div className="text-xs font-extrabold text-rose-500 mt-1">
                              {Number(item.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {item.currency || selectedCurrency || "TRY"}
                            </div>
                            {item.description && (
                              <div className="text-[10px] text-muted-foreground font-semibold mt-1 bg-[#887364]/10 dark:bg-[#dbc2b0]/10 px-2 py-0.5 rounded border border-border/10">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => expensesField.remove(i)} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 rounded-xl transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Borçlar */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0]">Mevcut Borçlar (Kredi, Kart vb.)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleOpenDebtModal}
                    className="rounded-xl border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874] font-bold hover:bg-[#8C5000]/10">
                    <Plus className="w-4 h-4 mr-1" /> Borç Ekle
                  </Button>
                </div>
                <div className="space-y-4">
                  {debtsField.fields.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-[#dbc2b0]/30 rounded-3xl bg-[#faf9f6]/50 dark:bg-[#120d0a]/30">
                      <p className="text-xs font-bold text-[#887364]/60">Henüz borç eklenmedi. Borcunuz yoksa bu adımı geçebilirsiniz.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {debtsField.fields.map((item: any, i: number) => (
                      <div key={item.id} className="p-4 rounded-3xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/50 dark:border-[#887364]/40 flex items-center justify-between gap-3 shadow-sm hover:border-[#8C5000]/40 transition-all animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#1c140e] flex items-center justify-center text-2xl border border-[#dbc2b0]/40 dark:border-[#887364]/40 shrink-0 shadow-sm">
                            💳
                          </div>
                          <div>
                            <div className="text-sm font-black text-foreground flex items-center gap-2">
                              <span className="text-base font-extrabold">{item.type}</span>
                            </div>
                            <div className="text-xs font-extrabold text-rose-500 mt-1">
                              {Number(item.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {item.currency || selectedCurrency || "TRY"}
                            </div>
                            {(() => {
                              const amt = Number(item.amount) || 0;
                              const n = item.remainingInstallments ? Number(item.remainingInstallments) : 0;
                              const interest = item.interestRate ? Number(item.interestRate) : 0;
                              let monthlyEst = 0;
                              let totalEst = amt;
                              if (interest > 0 && n > 0) {
                                const i = interest / 100;
                                monthlyEst = (amt * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
                                totalEst = monthlyEst * n;
                              } else if (n > 0) {
                                monthlyEst = amt / n;
                              }
                              return (
                                <div className="text-[10px] text-muted-foreground font-semibold mt-1 space-y-0.5">
                                  <div>
                                    {n > 0 ? `Taksit: ${n} Ay` : "Tek Seferlik"} 
                                    {interest > 0 ? ` • Faiz: %${interest}` : ""}
                                    {n > 0 && item.paymentDay ? ` • Ödeme: Ayın ${item.paymentDay}. Günü` : ""}
                                    {!n && item.dueDate ? ` • Son Ödeme: ${new Date(item.dueDate).toLocaleDateString("tr-TR")}` : ""}
                                  </div>
                                  {monthlyEst > 0 && (
                                    <div className="text-[#8C5000] dark:text-[#ffb874]">Est. Taksit Tutarı: {Number(monthlyEst).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {item.currency || selectedCurrency || "TRY"}</div>
                                  )}
                                  {interest > 0 && (
                                    <div className="text-rose-500">Faizli Toplam: {Number(totalEst).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {item.currency || selectedCurrency || "TRY"}</div>
                                  )}
                                  {item.description && <div className="italic opacity-85 mt-1">{item.description}</div>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => debtsField.remove(i)} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 rounded-xl transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Varlıklar & Yatırımlar (Premium Popup Modal Destekli) */}
            {step === 6 && (
              <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-3 block">
                    Varlık Türü Seçip Pop-up İle Ekleyin
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ASSET_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleOpenAssetModal(c.id)}
                        className="h-36 p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/50 dark:border-[#887364]/40 hover:border-[#8C5000] dark:hover:border-[#ffb874] transition-all duration-300 text-left group flex flex-col justify-between shadow-sm hover:shadow-md hover:scale-[1.02] w-full"
                      >
                        <div>
                          <span className="text-3xl block mb-2 transition-transform group-hover:scale-110 duration-200">{c.emoji}</span>
                          <span className="text-xs font-black text-[#5a3100] dark:text-[#fbf9f4] block leading-tight">{c.title}</span>
                        </div>
                        <span className="text-[10px] text-[#887364] dark:text-[#dbc2b0] mt-2 block line-clamp-2 leading-relaxed">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between pt-4 border-t border-border/20">
                    <Label className="text-xs font-extrabold text-[#887364] dark:text-[#dbc2b0]">Eklenen Varlıklarınız</Label>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#8C5000]/10 text-[#8C5000] dark:bg-[#ffb874]/10 dark:text-[#ffb874]">
                      {watchedInvestments.length} Varlık
                    </span>
                  </div>

                  {watchedInvestments.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-[#dbc2b0]/30 rounded-3xl bg-[#faf9f6]/50 dark:bg-[#120d0a]/30">
                      <p className="text-xs font-bold text-[#887364]/60">Henüz varlık eklenmedi. Yukarıdaki kategorilerden birine tıklayarak ekleyebilirsiniz.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {watchedInvestments.map((item: any, i: number) => {
                      const catObj = ASSET_CATEGORIES.find(c => c.id === item.type);
                      return (
                        <div key={i} className="p-4 rounded-3xl bg-[#faf9f6] dark:bg-[#120d0a] border border-[#dbc2b0]/50 dark:border-[#887364]/40 flex items-center justify-between gap-3 shadow-sm hover:border-[#8C5000]/40 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#1c140e] flex items-center justify-center text-2xl border border-[#dbc2b0]/40 dark:border-[#887364]/40 shrink-0 shadow-sm">
                              {catObj?.emoji || "🪙"}
                            </div>
                            <div>
                              <div className="text-sm font-black text-foreground flex items-center gap-2">
                                <span className="text-base font-extrabold">{item.symbol || catObj?.title || item.type}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8C5000]/10 text-[#8C5000] dark:bg-[#ffb874]/10 dark:text-[#ffb874] font-bold uppercase">
                                  {catObj?.title || item.type}
                                </span>
                              </div>
                              <div className="text-xs font-extrabold text-[#8C5000] dark:text-[#ffb874] mt-1">
                                {Number(item.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {item.currency || selectedCurrency || "TRY"}
                                {item.quantity && item.quantity !== item.amount && (
                                  <span className="text-[10px] text-muted-foreground font-semibold ml-1">
                                    ({item.quantity} Adet/Pay)
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground font-semibold mt-1 bg-[#887364]/10 dark:bg-[#dbc2b0]/10 px-2 py-1 rounded-lg inline-block border border-border/10">
                                  🏢 Kurum/Firma: {item.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <Button type="button" variant="ghost" size="icon" onClick={() => investmentsField.remove(i)} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 rounded-xl transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: İlgi Alanları & Özel Hashtag */}
            {step === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-bold text-[#887364] dark:text-[#dbc2b0]">Aşağıdaki önerilerden seçebilir veya kendi özel ilgi alanını (Örn: #COIN #BIST) yazıp Boşluk veya Enter tuşuna basabilirsin.</p>

                {/* Custom Hashtag Input */}
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={customTagInput}
                      onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={handleCustomTagKeyDown}
                      placeholder="Özel ilgi alanı ekle ve Boşluk veya Enter tuşuna bas (Örn: #Kripto #NFT)..."
                      className="h-12 rounded-2xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#8C5000]/40 dark:border-[#ffb874]/40 font-bold text-[#191c1d] dark:text-[#fbf9f4] placeholder:text-[#887364]/60 pr-10 focus:border-[#8C5000] dark:focus:border-[#ffb874] shadow-sm"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#8C5000] dark:text-[#ffb874]">#</span>
                  </div>
                  <Button type="button" onClick={addCustomTag} variant="outline" className="h-12 px-5 rounded-2xl border-[#8C5000]/30 dark:border-[#ffb874]/30 text-[#8C5000] dark:text-[#ffb874] hover:bg-[#8C5000]/10 font-black shadow-sm shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Ekle
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {HASHTAGS.map(h => {
                    const isActive = selectedInterests.includes(h.tag);
                    return (
                      <button key={h.tag} type="button" onClick={() => toggleTag(h.tag)}
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black transition-all duration-200",
                          isActive ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-105" : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 text-[#5a3100] dark:text-[#dbc2b0] hover:border-[#8C5000]/40 hover:scale-[1.02]")}>
                        <span className="text-base">{h.emoji}</span><span>#{h.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}

                  {/* Orijinal listede olmayan kullanıcının kendi özel etiketleri */}
                  {selectedInterests
                    .filter(tag => !HASHTAGS.some(h => h.tag === tag))
                    .map(tag => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-black bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-105 transition-all duration-200">
                        <span className="text-base">📌</span><span>#{tag.toUpperCase()}</span><Check className="w-3.5 h-3.5" />
                      </button>
                    ))
                  }
                </div>

                {errors.interests && <p className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.interests.message}</p>}
              </div>
            )}
          </form>
        </div>
        {/* Global Country Overlay */}
        {selectedRegion && (
          <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#5a3100]/20 dark:bg-black/70 backdrop-blur-md rounded-3xl" onClick={() => setSelectedRegion(null)} />
            <div className="relative w-full h-[80%] sm:h-auto sm:max-h-[85%] bg-card border-t sm:border border-[#8C5000]/20 dark:border-[#ffb874]/20 rounded-t-[2.5rem] sm:rounded-3xl shadow-ambient-high overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500">
              <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-muted/30">
                <div>
                  <span className="text-[10px] font-black text-[#8C5000]/60 dark:text-[#ffb874]/60 uppercase tracking-widest block mb-0.5">Ülke Seçimi</span>
                  <h3 className="text-lg font-black text-[#5a3100] dark:text-[#ffb874]">{REGIONS.find(r => r.id === selectedRegion)?.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto min-h-[320px]">
                {regionCountries.map(c => {
                  const isActive = form.getValues("country") === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { form.setValue("country", c.code, { shouldValidate: true }); setSelectedRegion(null); }}
                      className={cn("h-20 flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 group w-full",
                        isActive
                          ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] border-[#8C5000] dark:border-[#ffb874] shadow-md scale-[1.02]"
                          : "bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/30 hover:border-[#8C5000]/40 hover:shadow-sm"
                      )}
                    >
                      <span className="text-3xl transition-transform group-hover:scale-110 duration-200">{c.flag}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black leading-tight">{c.label}</span>
                        <span className="text-[9px] opacity-60 uppercase font-bold tracking-wider">{c.code}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
              <div className="px-8 py-5 border-t border-border/10 bg-muted/10">
                <p className="text-[10px] text-center text-muted-foreground font-bold tracking-tight">Seçiminiz doğrultusunda finansal raporlar yerelleştirilecektir.</p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Varlık Ekleme Popup Modalı (Framer Motion) */}
        <AnimatePresence>
          {activeAssetModal && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveAssetModal(null)}
                className="absolute inset-0 bg-[#5a3100]/20 dark:bg-black/70 backdrop-blur-md rounded-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md bg-card border border-[#8C5000]/30 dark:border-[#ffb874]/30 rounded-3xl shadow-2xl p-6 flex flex-col space-y-4 overflow-visible z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/20 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{ASSET_CATEGORIES.find(c => c.id === activeAssetModal)?.emoji}</span>
                    <div>
                      <h3 className="text-sm font-black text-[#5a3100] dark:text-[#ffb874]">
                        {ASSET_CATEGORIES.find(c => c.id === activeAssetModal)?.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">Varlık detaylarını doldurun</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAssetModal(null)}
                    className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {(() => {
                  const hasSymbol = Boolean(modalAssetData.symbol && modalAssetData.symbol.trim() !== "");
                  return (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-2 gap-3 relative">
                        <div className="relative">
                          <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Sembol / Kod</Label>
                          <div className="relative">
                            <Input
                              autoFocus
                              value={searchQuery || modalAssetData.symbol}
                              onChange={e => {
                                setSearchQuery(e.target.value);
                                setModalAssetData(prev => ({ ...prev, symbol: e.target.value }));
                              }}
                              placeholder="Örn: THYAO, BTC"
                              className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] uppercase font-bold pr-8 border-[#dbc2b0]/50 dark:border-[#887364]/40"
                            />
                            <Search className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground opacity-50" />
                          </div>
                          {!hasSymbol && (
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                              ⚠️ Diğer alanları doldurmak için önce sembol veya kod giriniz.
                            </p>
                          )}

                          {/* Arama Sonuçları Dropdown */}
                          {showSearch && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-[#8C5000]/20 dark:border-[#ffb874]/20 rounded-2xl shadow-xl overflow-hidden z-[120] max-h-52 overflow-y-auto">
                              {searchResults.map((res, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSelectSearchResult(res.symbol, res.shortname)}
                                  className="p-3 hover:bg-[#8C5000]/10 dark:hover:bg-[#ffb874]/10 cursor-pointer border-b border-border/10 last:border-0 flex items-center justify-between text-xs group transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-[#5a3100] dark:text-[#ffb874]">{res.symbol}</span>
                                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase">{res.suggestedCategory}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">{res.shortname}</span>
                                  </div>
                                  <ArrowUpRight className="h-4 w-4 text-[#8C5000] opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Para Birimi</Label>
                          <Select
                            disabled={!hasSymbol || useCurrentPrice}
                            value={modalAssetData.currency}
                            onValueChange={(v: any) => setModalAssetData({ ...modalAssetData, currency: String(v) })}
                          >
                            <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-extrabold text-xs border-[#dbc2b0]/50 dark:border-[#887364]/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MAIN_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                              {OTHER_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {activeAssetModal === "GOLD" && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5 animate-in fade-in duration-300">
                          {[
                            { name: "Gram Altın", symbol: "GRAM ALTIN (XAUTRY=X)" },
                            { name: "Ons Altın ($)", symbol: "ONS ALTIN (GC=F)" },
                            { name: "Gram Gümüş", symbol: "GRAM GÜMÜŞ (XAGTRY=X)" },
                            { name: "Ons Gümüş ($)", symbol: "ONS GÜMÜŞ (SI=F)" },
                          ].map((item) => (
                            <button
                              key={item.symbol}
                              type="button"
                              onClick={() => {
                                setModalAssetData(prev => ({ ...prev, symbol: item.symbol, description: item.name }));
                                setSearchQuery(item.symbol);
                                if (useCurrentPrice) fetchCurrentPriceForSymbol(item.symbol);
                              }}
                              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[#8C5000]/10 text-[#8C5000] dark:text-[#ffb874] border border-[#8C5000]/20 hover:bg-[#8C5000]/20 transition-all"
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeAssetModal === "BES" && (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
                          <div>
                            <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Fon Türü (Takip İçin)</Label>
                            <Select disabled={!hasSymbol} value={modalAssetData.fundType} onValueChange={(v: any) => setModalAssetData({ ...modalAssetData, fundType: String(v) })}>
                              <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-bold text-xs border-[#dbc2b0]/50 dark:border-[#887364]/40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STANDART">⚖️ Standart / Karma</SelectItem>
                                <SelectItem value="GOLD">🟡 Altın Katılım</SelectItem>
                                <SelectItem value="STOCKS">📈 Hisse Senedi Yoğun</SelectItem>
                                <SelectItem value="USD">💵 Döviz / Eurobond</SelectItem>
                                <SelectItem value="CONSERVATIVE">🛡️ Para Piyasası</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Aylık Düzenli Ödeme (₺)</Label>
                            <Input
                              type="number"
                              disabled={!hasSymbol}
                              value={modalAssetData.monthlyContribution}
                              onChange={e => setModalAssetData({ ...modalAssetData, monthlyContribution: e.target.value })}
                              placeholder="Örn: 2500"
                              className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] border-[#dbc2b0]/50 dark:border-[#887364]/40 font-bold"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">
                            {activeAssetModal === "FAIZ" ? "Faiz / Getiri Oranı %" : "Alış Fiyatı / Oran"}
                          </Label>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              disabled={!hasSymbol || useCurrentPrice}
                              value={modalAssetData.purchasePrice}
                              onChange={e => handlePriceChange(e.target.value)}
                              placeholder="0.00"
                              className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-bold border-[#dbc2b0]/50 dark:border-[#887364]/40"
                            />
                            {activeAssetModal !== "FAIZ" && activeAssetModal !== "BES" && (
                              <Button
                                type="button"
                                disabled={!hasSymbol || fetchingLive}
                                variant={useCurrentPrice ? "default" : "outline"}
                                onClick={handleToggleCurrentPrice}
                                className={cn("h-11 px-3 rounded-xl font-bold text-[11px] transition-all shrink-0 border-[#dbc2b0]/50 dark:border-[#887364]/40",
                                  useCurrentPrice ? "bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] shadow-md" : "bg-[#faf9f6] dark:bg-[#120d0a] text-muted-foreground")}
                              >
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {fetchingLive ? "..." : "Güncel"}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">
                            {activeAssetModal === "FAIZ" ? "Mevduat / Yatırılan Tutar" : "Birim Miktarı / Adet"}
                          </Label>
                          <Input
                            type="number"
                            disabled={!hasSymbol}
                            value={modalAssetData.quantity}
                            onChange={e => handleQuantityChange(e.target.value)}
                            placeholder="1"
                            className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-bold border-[#dbc2b0]/50 dark:border-[#887364]/40"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Açıklama (Banka/Kurum)</Label>
                        <Input
                          disabled={!hasSymbol}
                          value={modalAssetData.description}
                          onChange={e => setModalAssetData({ ...modalAssetData, description: e.target.value })}
                          placeholder="Örn: Akbank, Binance, Ziraat"
                          className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-medium text-xs border-[#dbc2b0]/50 dark:border-[#887364]/40"
                        />
                      </div>

                      {/* Footer Buttons */}
                      <div className="flex gap-3 pt-2 border-t border-border/10">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setActiveAssetModal(null)}
                          className="flex-1 h-11 rounded-xl font-bold"
                        >
                          İptal
                        </Button>
                        <Button
                          type="button"
                          disabled={!hasSymbol || fetchingLive}
                          onClick={handleSaveAssetModal}
                          className="flex-1 h-11 rounded-xl bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] font-black shadow-lg shadow-[#8C5000]/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {fetchingLive ? "Fiyat Çekiliyor..." : "Varlığı Ekle"}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}

          {/* Income Modal */}
          {showIncomeModal && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowIncomeModal(false)}
                className="absolute inset-0 bg-[#5a3100]/20 dark:bg-black/70 backdrop-blur-md rounded-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md bg-card border border-[#8C5000]/30 dark:border-[#ffb874]/30 rounded-3xl shadow-2xl p-6 flex flex-col space-y-4 overflow-visible z-10 animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between border-b border-border/20 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    <div>
                      <h3 className="text-sm font-black text-[#5a3100] dark:text-[#ffb874]">Gelir Ekle</h3>
                      <p className="text-[10px] text-muted-foreground">Düzenli gelir kaynağı detayları</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIncomeModal(false)}
                    className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveIncomeModal} className="space-y-4 pt-1">
                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Gelir Türü</Label>
                    <Select
                      value={modalIncomeData.type}
                      onValueChange={(v) => setModalIncomeData(prev => ({ ...prev, type: v as string }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-bold text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Birim</Label>
                      <Select
                        value={modalIncomeData.currency}
                        onValueChange={(v) => setModalIncomeData(prev => ({ ...prev, currency: v as string }))}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-extrabold text-xs border-[#dbc2b0]/50 dark:border-[#887364]/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                          {OTHER_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Miktar</Label>
                      <Input
                        type="number"
                        value={modalIncomeData.amount}
                        onChange={e => setModalIncomeData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                        className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-black text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Tarih</Label>
                    <DatePicker
                      date={modalIncomeData.date ? parseISO(modalIncomeData.date) : undefined}
                      setDate={(d) => setModalIncomeData(prev => ({ ...prev, date: d ? d.toISOString().split("T")[0] : "" }))}
                      placeholder="Tarih seç"
                      className="h-11 rounded-xl w-full"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Açıklama</Label>
                    <Input
                      value={modalIncomeData.description}
                      onChange={e => setModalIncomeData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Örn: Kurum / Şirket"
                      className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-medium text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                    />
                  </div>

                  {modalIncomeError && (
                    <p className="text-[10px] font-bold text-rose-500/80 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {modalIncomeError}
                    </p>
                  )}

                  <div className="pt-2">
                    <Button type="submit" className="w-full h-11 rounded-xl bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] font-black hover:bg-[#8C5000]/90">
                      Gelir Ekle
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Expense Modal */}
          {showExpenseModal && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExpenseModal(false)}
                className="absolute inset-0 bg-[#5a3100]/20 dark:bg-black/70 backdrop-blur-md rounded-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md bg-card border border-[#8C5000]/30 dark:border-[#ffb874]/30 rounded-3xl shadow-2xl p-6 flex flex-col space-y-4 overflow-visible z-10 animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between border-b border-border/20 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💸</span>
                    <div>
                      <h3 className="text-sm font-black text-[#5a3100] dark:text-[#ffb874]">Gider Ekle</h3>
                      <p className="text-[10px] text-muted-foreground">Düzenli Gider detayları</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveExpenseModal} className="space-y-4 pt-1">
                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Gider Türü</Label>
                    <Select
                      value={modalExpenseData.type}
                      onValueChange={(v) => setModalExpenseData(prev => ({ ...prev, type: v as string }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-bold text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Birim</Label>
                      <Select
                        value={modalExpenseData.currency}
                        onValueChange={(v) => setModalExpenseData(prev => ({ ...prev, currency: v as string }))}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-extrabold text-xs border-[#dbc2b0]/50 dark:border-[#887364]/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                          {OTHER_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Miktar</Label>
                      <Input
                        type="number"
                        value={modalExpenseData.amount}
                        onChange={e => setModalExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                        className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-black text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Tarih</Label>
                    <DatePicker
                      date={modalExpenseData.date ? parseISO(modalExpenseData.date) : undefined}
                      setDate={(d) => setModalExpenseData(prev => ({ ...prev, date: d ? d.toISOString().split("T")[0] : "" }))}
                      placeholder="Tarih seç"
                      className="h-11 rounded-xl w-full"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Açıklama</Label>
                    <Input
                      value={modalExpenseData.description}
                      onChange={e => setModalExpenseData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Örn: Kira / Elektrik"
                      className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-medium text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                    />
                  </div>

                  {modalExpenseError && (
                    <p className="text-[10px] font-bold text-rose-500/80 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {modalExpenseError}
                    </p>
                  )}

                  <div className="pt-2">
                    <Button type="submit" className="w-full h-11 rounded-xl bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] font-black hover:bg-[#8C5000]/90">
                      Gider Ekle
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Debt Modal */}
          {showDebtModal && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDebtModal(false)}
                className="absolute inset-0 bg-[#5a3100]/20 dark:bg-black/70 backdrop-blur-md rounded-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md bg-card border border-[#8C5000]/30 dark:border-[#ffb874]/30 rounded-3xl shadow-2xl p-6 flex flex-col space-y-4 overflow-visible z-10 animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between border-b border-border/20 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💳</span>
                    <div>
                      <h3 className="text-sm font-black text-[#5a3100] dark:text-[#ffb874]">Borç Ekle</h3>
                      <p className="text-[10px] text-muted-foreground">Mevcut borç/kredi detayları</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDebtModal(false)}
                    className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveDebtModal} className="space-y-4 pt-1">
                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Borç Türü</Label>
                    <Select
                      value={modalDebtData.type}
                      onValueChange={(v) => setModalDebtData(prev => ({ ...prev, type: v as string }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-bold text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEBT_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Birim</Label>
                      <Select
                        value={modalDebtData.currency}
                        onValueChange={(v) => setModalDebtData(prev => ({ ...prev, currency: v as string }))}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-extrabold text-xs border-[#dbc2b0]/50 dark:border-[#887364]/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                          {OTHER_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Toplam Borç</Label>
                      <Input
                        type="number"
                        value={modalDebtData.amount}
                        onChange={e => setModalDebtData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                        className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-black text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Taksit Sayısı (Opsiyonel)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={modalDebtData.remainingInstallments}
                        onChange={e => setModalDebtData(prev => ({ ...prev, remainingInstallments: e.target.value }))}
                        placeholder="Örn: 12"
                        className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-black text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Aylık Faiz Oranı % (Opsiyonel)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={modalDebtData.interestRate}
                        onChange={e => setModalDebtData(prev => ({ ...prev, interestRate: e.target.value }))}
                        placeholder="Örn: 3.50"
                        className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-black text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                      />
                    </div>
                  </div>

                  {modalDebtData.remainingInstallments && Number(modalDebtData.remainingInstallments) > 0 ? (
                    <div>
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Taksit Ödeme Günü (1-31)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={modalDebtData.paymentDay}
                        onChange={e => setModalDebtData(prev => ({ ...prev, paymentDay: e.target.value }))}
                        placeholder="Örn: 15"
                        className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-black text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Son Ödeme Tarihi</Label>
                      <DatePicker
                        date={modalDebtData.dueDate ? parseISO(modalDebtData.dueDate) : undefined}
                        setDate={(d) => setModalDebtData(prev => ({ ...prev, dueDate: d ? d.toISOString().split("T")[0] : "" }))}
                        placeholder="Seçiniz..."
                        className="h-11 rounded-xl w-full text-xs font-semibold"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-[10px] font-extrabold text-[#887364] dark:text-[#dbc2b0] mb-1.5 block">Açıklama</Label>
                    <Input
                      value={modalDebtData.description}
                      onChange={e => setModalDebtData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Örn: Ev Kredisi"
                      className="h-11 rounded-xl bg-[#faf9f6] dark:bg-[#120d0a] font-medium text-sm border-[#dbc2b0]/50 dark:border-[#887364]/40"
                    />
                  </div>

                  {modalDebtError && (
                    <p className="text-[10px] font-bold text-rose-500/80 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {modalDebtError}
                    </p>
                  )}

                  <div className="pt-2">
                    <Button type="submit" className="w-full h-11 rounded-xl bg-[#8C5000] dark:bg-[#ffb874] text-white dark:text-[#120d0a] font-black hover:bg-[#8C5000]/90">
                      Borç Ekle
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-[#fbf9f4] dark:bg-[#120d0a]/60 border-t border-[#8C5000]/10 dark:border-[#ffb874]/15 transition-colors duration-300 rounded-b-3xl">
          <Button type="button" variant="ghost" onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1 || loading} className="h-12 px-6 rounded-xl font-bold text-[#5a3100] dark:text-[#dbc2b0] hover:bg-[#dbc2b0]/30">
            <ChevronLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          {step < 7 ? (
            <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-xl bg-gradient-to-r from-[#f18d02] to-[#8C5000] dark:from-[#ffb874] dark:to-[#8C5000] text-white dark:text-[#120d0a] font-extrabold sm:font-black shadow-lg shadow-[#8C5000]/25 hover:scale-[1.02] transition-all">
              Devam Et <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={loading} className="h-12 px-8 sm:px-10 rounded-xl bg-gradient-to-r from-[#b07d4b] to-[#8C5000] dark:from-[#ffb874] dark:to-[#8C5000] text-white dark:text-[#120d0a] font-extrabold sm:font-black shadow-xl shadow-[#8C5000]/30 hover:scale-[1.03] transition-all">
              {loading ? "Kaydediliyor..." : "Kurulumu Tamamla"}{!loading && <Check className="w-5 h-5 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
