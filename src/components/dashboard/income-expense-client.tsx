"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  RefreshCw, 
  Moon,
  Sun,
  Download,
  Plus,
  ShoppingCart,
  Utensils,
  Receipt,
  Car,
  Home,
  ArrowRight,
  X,
  CreditCard,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { ChatAI } from "./chat-ai";
import { addIncome, addExpense } from "@/app/actions/income-expense";
import { payDebtInstallment, addDebt } from "@/app/actions/debts";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface IncomeExpenseClientProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyData: { month: string; income: number; expense: number }[];
  maxMonthly: number;
  expenseCategoryMap: Record<string, number>;
  incomeCategoryMap: Record<string, number>;
  recentTransactions: Transaction[];
  debts: any[];
}

export function IncomeExpenseClient({
  totalIncome,
  totalExpense,
  netBalance,
  monthlyData,
  maxMonthly,
  expenseCategoryMap,
  incomeCategoryMap,
  recentTransactions,
  debts,
}: IncomeExpenseClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "debt_payment" | "new_debt">("income");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    debtId: "",
    remainingInstallments: "",
    isRecurring: false,
  });
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSave = async () => {
    if (!formData.amount) return;
    setLoading(true);
    try {
        if (transactionType === "income") {
            await addIncome({
                type: formData.type || "Diğer",
                amount: Number(formData.amount),
                description: formData.description
            });
        } else if (transactionType === "expense") {
            await addExpense({
                type: formData.type || "Diğer",
                amount: Number(formData.amount),
                isRecurring: formData.isRecurring,
                description: formData.description
            });
        } else if (transactionType === "debt_payment") {
            await payDebtInstallment(formData.debtId, Number(formData.amount));
        } else if (transactionType === "new_debt") {
            await addDebt({
                type: formData.type || "Diğer",
                amount: Number(formData.amount),
                remainingInstallments: formData.remainingInstallments ? Number(formData.remainingInstallments) : undefined,
                description: formData.description
            });
        }
        setIsModalOpen(false);
        setFormData({ type: "", amount: "", description: "", debtId: "", remainingInstallments: "", isRecurring: false });
        router.refresh();
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1440px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">Gelir - Gider Analizi</h1>
          <p className="text-muted-foreground text-base">Nakit akışınızı ve harcama alışkanlıklarınızı takip edin.</p>
        </div>
        <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl w-10 h-10 shrink-0 text-muted-foreground border-border/30 hover:bg-muted bg-card"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-xl px-4 py-2 h-10 text-sm font-semibold text-muted-foreground border-border/30 hover:bg-muted bg-card"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Yenile
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger
              render={
                <Button className="px-5 py-2 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> İşlem Ekle
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[500px] rounded-[32px] border-border/30 shadow-2xl bg-card">
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading font-bold text-primary">Yeni İşlem Ekle</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="flex p-1 bg-muted rounded-2xl border border-border/20">
                    <button 
                        onClick={() => setTransactionType("income")}
                        className={cn("flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all", transactionType === "income" ? "bg-card text-emerald-600 shadow-sm" : "text-muted-foreground opacity-60")}
                    >
                        Gelir
                    </button>
                    <button 
                        onClick={() => setTransactionType("expense")}
                        className={cn("flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all", transactionType === "expense" ? "bg-card text-primary shadow-sm" : "text-muted-foreground opacity-60")}
                    >
                        Gider
                    </button>
                    <button 
                        onClick={() => setTransactionType("debt_payment")}
                        className={cn("flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all", transactionType === "debt_payment" ? "bg-card text-rose-600 shadow-sm" : "text-muted-foreground opacity-60")}
                    >
                        Borç Öde
                    </button>
                    <button 
                        onClick={() => setTransactionType("new_debt")}
                        className={cn("flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all", transactionType === "new_debt" ? "bg-card text-rose-600 shadow-sm" : "text-muted-foreground opacity-60")}
                    >
                        Borç Al
                    </button>
                </div>

                <div className="grid gap-4">
                    {transactionType === "debt_payment" ? (
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ödenecek Borç</Label>
                            <Select onValueChange={(v) => setFormData(p => ({ ...p, debtId: String(v ?? "") }))}>
                                <SelectTrigger className="bg-muted border-border/30 h-12 rounded-xl">
                                    <SelectValue placeholder="Borç Seçin" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-card">
                                    {debts.map(debt => (
                                        <SelectItem key={debt.id} value={debt.id}>
                                            {debt.description || debt.type} (Kalan: ₺{debt.amount.toLocaleString()})
                                        </SelectItem>
                                    ))}
                                    {debts.length === 0 && <SelectItem value="none" disabled>Aktif borç bulunamadı</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Kategori</Label>
                            <Select onValueChange={(v) => setFormData(p => ({ ...p, type: String(v ?? "") }))}>
                                <SelectTrigger className="bg-muted border-border/30 h-12 rounded-xl">
                                    <SelectValue placeholder="Kategori Seçin" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-card">
                                    {transactionType === "income" ? (
                                        <>
                                            <SelectItem value="Maaş">Maaş</SelectItem>
                                            <SelectItem value="Kira Geliri">Kira Geliri</SelectItem>
                                            <SelectItem value="Yatırım Geliri">Yatırım Geliri</SelectItem>
                                            <SelectItem value="Freelance">Freelance</SelectItem>
                                            <SelectItem value="Diğer">Diğer</SelectItem>
                                        </>
                                    ) : transactionType === "new_debt" ? (
                                        <>
                                            <SelectItem value="Banka Kredisi">Banka Kredisi</SelectItem>
                                            <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                                            <SelectItem value="Şahsi Borç">Şahsi Borç</SelectItem>
                                            <SelectItem value="Diğer">Diğer</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="Market">Market</SelectItem>
                                            <SelectItem value="Kira">Kira</SelectItem>
                                            <SelectItem value="Fatura">Fatura</SelectItem>
                                            <SelectItem value="Ulaşım">Ulaşım</SelectItem>
                                            <SelectItem value="Eğlence">Eğlence</SelectItem>
                                            <SelectItem value="Diğer">Diğer</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {transactionType === "new_debt" && (
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Taksit Sayısı (Opsiyonel)</Label>
                            <Input 
                                type="number" 
                                placeholder="Örn: 12" 
                                value={formData.remainingInstallments}
                                onChange={(e) => setFormData(p => ({ ...p, remainingInstallments: e.target.value }))}
                                className="bg-muted border-border/30 h-12 rounded-xl"
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tutar (₺)</Label>
                        <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={formData.amount}
                            onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                            className="bg-muted border-border/30 h-12 rounded-xl font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Açıklama</Label>
                        <Input 
                            placeholder="İşlem detayları..." 
                            value={formData.description}
                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                            className="bg-muted border-border/30 h-12 rounded-xl"
                        />
                    </div>

                    {transactionType === "expense" && (
                        <div className="flex items-center space-x-3 bg-muted/50 p-4 rounded-2xl border border-border/20 transition-all hover:bg-muted">
                            <Checkbox 
                                id="isRecurring" 
                                checked={formData.isRecurring} 
                                onCheckedChange={(checked) => setFormData(p => ({ ...p, isRecurring: !!checked }))}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="isRecurring" className="text-sm font-semibold text-muted-foreground cursor-pointer select-none">
                                Düzenli (Her Ay Tekrarlanan) Gider
                            </Label>
                        </div>
                    )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl font-bold shadow-lg"
                >
                    {loading ? "Kaydediliyor..." : "İşlemi Kaydet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-card p-8 rounded-2xl shadow-ambient-low border border-border/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Toplam Gelir</span>
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-foreground">₺{totalIncome.toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-emerald-600 text-[13px] font-semibold mt-4 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> Pozitif nakit akışı
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-ambient-low border border-border/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Toplam Gider</span>
            <div className="bg-rose-500/10 p-2 rounded-xl">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-foreground">₺{totalExpense.toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-rose-600 text-[13px] font-semibold mt-4 flex items-center gap-1">
            <ArrowDownRight className="w-4 h-4" /> Bütçe takibi
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-ambient-low border border-border/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Net Durum</span>
            <div className="bg-primary/10 p-2 rounded-xl">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-foreground">₺{netBalance.toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-primary text-[13px] font-semibold mt-4">Genel finansal denge</p>
        </div>
      </section>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
        <div className="xl:col-span-8 space-y-8">
          {/* Comparison Chart */}
          <div className="bg-card p-8 rounded-2xl shadow-ambient-low border border-border/20 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-10 gap-4">
              <h3 className="text-xl font-heading font-bold text-foreground">Gelir & Gider Karşılaştırması</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Gelir
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <span className="w-3 h-3 rounded-full bg-primary"></span> Gider
                </span>
              </div>
            </div>
            <div className="h-72 flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-4 border-b border-border/20 pb-4">
              {monthlyData.slice().reverse().map((d, i) => {
                const incHeight = maxMonthly > 0 ? Math.max((d.income / maxMonthly) * 100, d.income > 0 ? 5 : 0) : 0;
                const expHeight = maxMonthly > 0 ? Math.max((d.expense / maxMonthly) * 100, d.expense > 0 ? 5 : 0) : 0;
                const isCurrentMonth = i === monthlyData.length - 1;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                    <div className="w-full flex gap-1 sm:gap-1.5 items-end h-48 relative">
                      <div className={cn("flex-1 rounded-t-md transition-all duration-500", isCurrentMonth ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-emerald-500/40 group-hover:bg-emerald-500/60")} style={{ height: `${incHeight}%` }}></div>
                      <div className={cn("flex-1 rounded-t-md transition-all duration-500", isCurrentMonth ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/40 group-hover:bg-primary/60")} style={{ height: `${expHeight}%` }}></div>
                      
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap text-xs font-bold flex flex-col gap-1 border border-border/30">
                        <span className="text-emerald-500">Gelir: ₺{d.income.toLocaleString('tr-TR')}</span>
                        <span className="text-primary">Gider: ₺{d.expense.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                    <span className={cn("text-xs", isCurrentMonth ? "font-bold text-foreground" : "font-semibold text-muted-foreground")}>{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-card p-8 rounded-2xl shadow-ambient-low border border-border/20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h3 className="text-xl font-heading font-bold text-foreground mb-8">Zaman Çizelgesi</h3>
            <div className="space-y-6">
              {recentTransactions.slice(0, 3).map((tx, idx) => (
                <div key={tx.id} className="flex gap-6 items-start group">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-4 h-4 rounded-full border-4 border-card ring-1 transition-transform group-hover:scale-125", tx.type === 'income' ? "bg-emerald-500 ring-emerald-500/20" : "bg-primary ring-primary/20")}></div>
                    {idx !== Math.min(recentTransactions.length, 3) - 1 && (
                      <div className="w-0.5 h-16 bg-border/30 mt-1"></div>
                    )}
                  </div>
                  <div className={cn("flex-1 bg-muted p-5 rounded-2xl border border-border/20 transition-colors cursor-default", tx.type === 'income' ? "hover:border-emerald-500/30" : "hover:border-primary/30")}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{tx.description || tx.category}</p>
                        <p className="text-[13px] text-muted-foreground mt-1">{tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold text-lg", tx.type === 'income' ? "text-emerald-500" : "text-primary")}>
                          {tx.type === 'income' ? '+' : '-'}₺{tx.amount.toLocaleString('tr-TR')}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">
                          {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="text-muted-foreground opacity-70 italic">Henüz işlem bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          <div className="bg-card p-8 rounded-2xl shadow-ambient-low border border-border/20 h-full animate-in fade-in slide-in-from-right-6 duration-700">
            <h3 className="text-xl font-heading font-bold text-foreground mb-10">Harcama Kategorileri</h3>
            
            <div className="relative w-56 h-56 mx-auto mb-12 flex items-center justify-center group">
              <svg className="w-full h-full transform -rotate-90 transition-transform duration-1000 group-hover:scale-105" viewBox="0 0 36 36">
                {(() => {
                  const entries = Object.entries(expenseCategoryMap).sort(([,a], [,b]) => (b as number) - (a as number));
                  const total = totalExpense || 1;
                  let offset = 0;
                  const colors = ["var(--primary)", "#10b981", "#f59e0b", "#6366f1", "#f43f5e"];
                  
                  if (entries.length === 0) {
                    return <path className="text-[#dbc2b0]/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="4" />
                  }

                  return entries.slice(0, 4).map(([cat, amt], idx) => {
                    const pct = (amt / total) * 100;
                    const dasharray = `${pct}, 100`;
                    const currentOffset = offset;
                    offset -= pct;
                    return (
                      <path key={cat} stroke={colors[idx % colors.length]} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={dasharray} strokeDashoffset={currentOffset} strokeWidth="4" className="transition-all duration-1000 ease-out" />
                    );
                  });
                })()}
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-heading font-bold text-foreground">₺{totalExpense >= 1000 ? (totalExpense/1000).toFixed(1) + 'K' : totalExpense}</p>
                <p className="text-[12px] text-muted-foreground uppercase tracking-widest mt-1">Toplam</p>
              </div>
            </div>

            <ul className="space-y-6">
              {Object.entries(expenseCategoryMap).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 4).map(([cat, amt], idx) => {
                const colors = ["bg-primary", "bg-emerald-500", "bg-accent", "bg-border"];
                const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                return (
                  <li key={cat} className="flex justify-between items-center group cursor-default">
                    <div className="flex items-center gap-4">
                      <span className={cn("w-3 h-3 rounded-full", colors[idx % colors.length])}></span>
                      <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{cat}</span>
                    </div>
                    <span className="font-bold text-foreground">%{pct}</span>
                  </li>
                );
              })}
              {Object.keys(expenseCategoryMap).length === 0 && (
                <li className="text-sm text-muted-foreground text-center opacity-70">Henüz harcama yok.</li>
              )}
            </ul>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 relative overflow-hidden group mt-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative z-10">
              <p className="font-bold text-foreground text-lg mb-2">Merhaba!</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {netBalance >= 0 ? "Bu ay gelirlerin giderlerinden fazla. Harikasın! Finansal koçun seninle gurur duyuyor." : "Bu ay giderlerin biraz artmış gibi görünüyor. Bütçeni tekrar gözden geçirelim mi?"}
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-30 group-hover:scale-105 group-hover:opacity-50 transition-all duration-700">
              <img alt="Ram Mascot" className="w-32 h-32 object-contain" src="/mascot.png" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <section className="bg-card rounded-2xl shadow-ambient-low border border-border/20 overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-8 border-b border-border/20 flex justify-between items-center">
          <h3 className="text-xl font-heading font-bold text-foreground">Tüm İşlemler</h3>
          <button className="text-primary font-bold text-[13px] hover:underline flex items-center gap-1">
            Filtrele <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted">
                <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">İşlem</th>
                <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Kategori</th>
                <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tarih</th>
                <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                let Icon = isIncome ? Wallet : Receipt;
                
                if (!isIncome) {
                  const cat = tx.category.toLowerCase();
                  if (cat.includes('market') || cat.includes('alışveriş')) Icon = ShoppingCart;
                  else if (cat.includes('yemek') || cat.includes('restoran') || cat.includes('gıda')) Icon = Utensils;
                  else if (cat.includes('ulaşım') || cat.includes('benzin') || cat.includes('araba')) Icon = Car;
                  else if (cat.includes('kira') || cat.includes('konut') || cat.includes('ev')) Icon = Home;
                }

                return (
                  <tr key={tx.id} className="hover:bg-muted/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm", isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary")}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-foreground">{tx.description || tx.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn("px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm", isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-border/30 text-muted-foreground")}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[13px] text-muted-foreground font-semibold">
                      {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className={cn("px-8 py-6 text-right font-bold text-lg", isIncome ? "text-emerald-500" : "text-primary")}>
                      {isIncome ? '+' : '-'}₺{tx.amount.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                );
              })}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground opacity-70">
                    Henüz işlem kaydınız bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ChatAI />
    </div>
  );
}