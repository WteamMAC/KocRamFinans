"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, X, Landmark, TrendingDown, Clock, AlertCircle, Calendar, Settings2, FastForward } from "lucide-react";
import { addDebt, payDebtInstallment, closeDebt, postponeDebtInstallment, updateDebtPaymentDay } from "@/app/actions/debts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrency, DISPLAY_CURRENCIES_LIST } from "@/context/currency-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie } from "recharts";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

interface DebtListProps {
    debts: any[];
    monthlyPayments?: any[];
}

export function DebtList({ debts, monthlyPayments }: DebtListProps) {
    const router = useRouter();
    const { formatAmount, rates } = useCurrency();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payModal, setPayModal] = useState<{ id: string, amount: number, isClose: boolean, description: string, rawAmount: number, currency?: string, originalAmount?: number, fxRate?: number } | null>(null);
    const [refinanceId, setRefinanceId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [postponeDebtId, setPostponeDebtId] = useState<string | null>(null);
    const [updateDayModal, setUpdateDayModal] = useState<{ id: string, paymentDay: number, description: string } | null>(null);
    const [newPaymentDay, setNewPaymentDay] = useState<string>("");

    const handlePostpone = async () => {
        if (!postponeDebtId) return;
        setLoading(true);
        try {
            await postponeDebtInstallment(postponeDebtId);
            setPostponeDebtId(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePaymentDay = async () => {
        if (!updateDayModal || !newPaymentDay) return;
        const dayNum = Number(newPaymentDay);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
            setError("Lütfen 1 ile 31 arasında geçerli bir gün giriniz.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await updateDebtPaymentDay(updateDayModal.id, dayNum);
            setUpdateDayModal(null);
            setNewPaymentDay("");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        type: "Kredi Kartı",
        amount: "",
        currency: "TRY",
        remainingInstallments: "",
        interestRate: "",
        paymentDay: "",
        dueDate: "",
        description: "",
    });

    const activeDebts = debts.filter(d => d.amount > 0);
    const totalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);
    const maxRemaining = Math.max(...activeDebts.map(d => d.remainingInstallments || 0), 1);
    const displayCount = Math.min(maxRemaining, 60); // En fazla 5 yıllık ödeme projeksiyonu

    // Bu ayki ödeme takibi
    const currentMonthExpected = activeDebts.reduce((sum, d) => {
        if (d.remainingInstallments && d.remainingInstallments > 0) {
            return sum + (d.installmentAmount || (d.amount / d.remainingInstallments));
        }
        return sum; // Tek seferlik borçlar projeksiyona girer ama taksitli takibine girmez (isteğe bağlı)
    }, 0);

    const currentMonthPaid = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remainingExpected = Math.max(0, currentMonthExpected - currentMonthPaid);

    const handleAdd = async () => {
        if (!formData.amount) return;
        setLoading(true);
        setError(null);

        const selectedRate = rates[formData.currency] || 1;
        const originalAmount = Number(formData.amount);
        const amountInTry = originalAmount * selectedRate;

        try {
            await addDebt({
                type: formData.type,
                amount: amountInTry,
                interestRate: formData.interestRate ? Number(formData.interestRate) : undefined,
                remainingInstallments: formData.remainingInstallments ? Number(formData.remainingInstallments) : undefined,
                paymentDay: formData.paymentDay ? Number(formData.paymentDay) : undefined,
                dueDate: formData.dueDate || undefined,
                description: formData.description + (refinanceId ? " (Yapılandırıldı)" : ""),
                currency: formData.currency,
                originalAmount: originalAmount,
                fxRate: selectedRate,
            });

            // Eğer bir yapılandırma işlemiyse eski borcu kapat (expense oluşturmadan)
            if (refinanceId) {
                await closeDebt(refinanceId, true);
                setRefinanceId(null);
            }

            setIsAdding(false);
            setFormData({ type: "Kredi Kartı", amount: "", currency: "TRY", remainingInstallments: "", interestRate: "", paymentDay: "", dueDate: "", description: "" });
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!payModal) return;
        setLoading(true);
        setError(null);

        try {
            if (payModal.isClose) {
                await closeDebt(payModal.id, (payModal as any).isTransfer || false);
            } else {
                // Taksit ödemesini borcun kendi para birimi ve kuru ile kaydedelim
                await payDebtInstallment(
                    payModal.id,
                    payModal.rawAmount,
                    false,
                    payModal.currency,
                    payModal.originalAmount ? payModal.originalAmount / (payModal.fxRate || 1) : undefined,
                    payModal.fxRate
                );
            }
            setPayModal(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12 max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-card px-6 py-3 rounded-2xl border border-border/30 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Toplam Yükümlülük</p>
                            <p className="text-2xl font-heading font-bold text-primary">{formatAmount(totalDebt)}</p>
                        </div>
                    </div>

                    <div className="bg-card px-6 py-3 rounded-2xl border border-border/30 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Ay Sonu Tahmini Kalan Para</p>
                            <p className="text-2xl font-heading font-bold text-primary">
                                {formatAmount(remainingExpected)}
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95",
                        isAdding 
                            ? "bg-muted text-foreground hover:bg-muted/80 shadow-none" 
                            : "bg-primary text-primary-foreground hover:brightness-110 shadow-primary/20"
                    )}
                >
                    {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isAdding ? "Vazgeç" : "Yeni Borç Ekle"}
                </Button>
            </div>

            {/* Monthly Installment Tracking Chart */}
            {activeDebts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <Card className="lg:col-span-2 p-8 bg-card border-border/30 shadow-ambient-medium rounded-[32px]">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" /> Aylık Ödeme Projeksiyonu
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(() => {
                                    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                                    const currentMonth = new Date().getMonth();
                                    const data = [];

                                    for (let i = 0; i < displayCount; i++) {
                                        const mIdx = (currentMonth + i) % 12;
                                        let total = 0;
                                        activeDebts.forEach(d => {
                                            if (d.remainingInstallments && d.remainingInstallments > i) {
                                                total += (d.installmentAmount || (d.amount / d.remainingInstallments));
                                            } else if (!d.remainingInstallments && i === 0) {
                                                total += d.amount;
                                            }
                                        });
                                        data.push({ name: months[mIdx], tutar: total });
                                    }
                                    return data;
                                })()}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.15} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--primary)', opacity: 0.05, radius: 8 }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [formatAmount(value), "Ödeme"]}
                                    />
                                    <Bar dataKey="tutar" fill="url(#barGradient)" radius={[8, 8, 4, 4]} barSize={displayCount > 12 ? 15 : 30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-8 bg-card border-border/30 shadow-ambient-medium rounded-[32px] flex flex-col">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-primary" /> Borç Dağılımı
                        </h3>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="space-y-4">
                                {Array.from(new Set(activeDebts.map(d => d.type))).map(type => {
                                    const amount = activeDebts.filter(d => d.type === type).reduce((sum, d) => sum + d.amount, 0);
                                    const percentage = (amount / totalDebt) * 100;
                                    return (
                                        <div key={type} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-muted-foreground uppercase tracking-widest opacity-60">{type}</span>
                                                <span>{formatAmount(amount)}</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", type === "Kredi Kartı" ? "bg-amber-500" : "bg-primary")}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Add Debt Form Modal */}
            {isAdding && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-2xl max-h-[96vh] overflow-y-auto no-scrollbar">
                        <Card className="p-5 sm:p-10 bg-card border-border/30 shadow-ambient-high rounded-[28px] sm:rounded-[32px] border-t-4 border-t-primary backdrop-blur-3xl animate-in zoom-in-95 duration-300 !overflow-visible">
                            <div className="flex justify-between items-center pb-3 sm:pb-6 mb-4 sm:mb-8 border-b border-border/10">
                                <div>
                                    <h3 className="text-lg sm:text-2xl font-heading font-bold text-primary flex items-center gap-2">
                                        {refinanceId ? <Landmark className="w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
                                        {refinanceId ? "Borç Yapılandırma" : "Yeni Borç Ekle"}
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">
                                        {refinanceId ? "Mevcut borç kapatılıp yenisi eklenecek." : "Yükümlülüklerinizi ekleyin ve ödeme planını oluşturun."}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setIsAdding(false); setRefinanceId(null); }}
                                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted/60 hover:bg-rose-50 hover:text-rose-500 text-muted-foreground transition-all duration-200 shrink-0"
                                >
                                    <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6">
                                <div className="space-y-1.5 sm:space-y-3">
                                    <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-0.5 sm:mb-1.5 block">Borç Türü</Label>
                                    <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v ?? "") }))}>
                                        <SelectTrigger className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl focus:ring-primary font-bold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/30 bg-card font-bold">
                                            <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                                            <SelectItem value="Banka Kredisi">Banka Kredisi</SelectItem>
                                            <SelectItem value="Şahsi Borç">Şahsi Borç</SelectItem>
                                            <SelectItem value="Elden Taksit">Elden Taksit</SelectItem>
                                            <SelectItem value="Diğer">Diğer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 sm:space-y-3">
                                    <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-0.5 sm:mb-1.5 block">Toplam Tutar</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                            className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl focus:ring-primary text-base sm:text-lg font-bold flex-1"
                                            placeholder="0.00"
                                        />
                                        <Select value={formData.currency} onValueChange={(v) => setFormData(p => ({ ...p, currency: String(v) }))}>
                                            <SelectTrigger className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl w-[95px] sm:w-[110px] font-bold text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl bg-card font-bold">
                                                {DISPLAY_CURRENCIES_LIST.map(c => (
                                                    <SelectItem key={c.code} value={c.code}>
                                                        {c.flag} {c.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:space-y-3">
                                    <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-0.5 sm:mb-1.5 block">Taksit Sayısı (Opsiyonel)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.remainingInstallments}
                                        onChange={(e) => setFormData(p => ({ ...p, remainingInstallments: e.target.value }))}
                                        className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl focus:ring-primary font-bold text-sm"
                                        placeholder="Örn: 12"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:space-y-3">
                                    <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-0.5 sm:mb-1.5 block">Aylık Faiz Oranı % (Opsiyonel)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.interestRate}
                                        onChange={(e) => setFormData(p => ({ ...p, interestRate: e.target.value }))}
                                        className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl focus:ring-primary font-bold text-sm"
                                        placeholder="Örn: 3.50"
                                    />
                                </div>
                                {formData.remainingInstallments && Number(formData.remainingInstallments) > 0 ? (
                                    <div className="space-y-1.5 sm:space-y-3">
                                        <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-0.5 sm:mb-1.5 block">Taksit Ödeme Günü (1-31)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.paymentDay}
                                            onChange={(e) => setFormData(p => ({ ...p, paymentDay: e.target.value }))}
                                            className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl focus:ring-primary font-bold text-sm"
                                            placeholder="Ayın kaçıncı günü?"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 sm:space-y-3">
                                        <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Son Ödeme Tarihi</Label>
                                        <DatePicker
                                            date={formData.dueDate ? parseISO(formData.dueDate) : undefined}
                                            setDate={(d) => setFormData(p => ({ ...p, dueDate: d ? d.toISOString().split('T')[0] : "" }))}
                                            placeholder="GG.AA.YYYY"
                                            className="h-10 sm:h-12"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5 sm:space-y-3 sm:col-span-2">
                                    <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-0.5 sm:mb-1.5 block">Açıklama</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="bg-muted border-border/30 h-10 sm:h-12 rounded-xl focus:ring-primary font-bold text-sm"
                                        placeholder="Örn: Ev Kredisi"
                                    />
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 italic mt-0.5 sm:mt-1 px-1">
                                        * Borçlar toplam yükümlülük olarak takip edilir, gelirinize dahil edilmez.
                                    </p>
                                </div>
                            </div>
                            {error && <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20">{error}</div>}
                            <div className="mt-5 pt-4 border-t border-border/5 flex justify-end">
                                <Button
                                    onClick={handleAdd}
                                    disabled={loading}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-10 py-5 sm:py-6 h-auto text-sm sm:text-base font-black shadow-xl hover:shadow-primary/20 transition-all w-full sm:w-auto"
                                >
                                    {loading ? "Kaydediliyor..." : "Borcu Kaydet"}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>,
                document.body
            )}

            {/* Debt Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeDebts.map((debt) => {
                    const monthlyTry = debt.remainingInstallments ? debt.amount / debt.remainingInstallments : debt.amount;
                    return (
                        <Card key={debt.id} className="bg-card border-border/30 shadow-ambient-low hover:shadow-ambient-medium transition-all rounded-[32px] overflow-hidden group">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                        debt.type === "Kredi Kartı" ? "bg-amber-500/10 text-amber-700" : "bg-primary/10 text-primary"
                                    )}>
                                        {debt.type === "Kredi Kartı" ? <CreditCard className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                                    </div>
                                    <div className="flex flex-col gap-1.5 ml-4 mr-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">{debt.type}</span>
                                            {(() => {
                                                const payment = monthlyPayments?.find((p: any) => p.description?.includes(debt.description || debt.type));
                                                if (payment) {
                                                    if (payment.amount === 0) return <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">ERTELENDİ</span>;
                                                    return <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">ÖDENDİ</span>;
                                                }
                                                return <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">BEKLİYOR</span>;
                                            })()}
                                        </div>
                                        <h4 className="text-[11px] font-bold text-foreground opacity-90 line-clamp-1">
                                            {debt.description || `${debt.type} Borcu`}
                                        </h4>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center -mr-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer outline-none">
                                                <Settings2 className="w-4 h-4" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl font-bold bg-card border-border/30">
                                                <DropdownMenuItem
                                                    className="text-rose-600 focus:text-rose-600 cursor-pointer"
                                                    onClick={() => setPostponeDebtId(debt.id)}
                                                >
                                                    <FastForward className="w-4 h-4 mr-2" /> Bu Ayı Atla/Ertele
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={() => {
                                                        setUpdateDayModal({
                                                            id: debt.id,
                                                            paymentDay: debt.paymentDay || 1,
                                                            description: debt.description || `${debt.type} Borcu`
                                                        });
                                                        setNewPaymentDay(String(debt.paymentDay || ""));
                                                    }}
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" /> Ödeme Gününü Değiştir
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={() => {
                                                        const safeDueDate = (() => {
                                                            if (!debt.dueDate) return "";
                                                            try {
                                                                const d = new Date(debt.dueDate);
                                                                return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
                                                            } catch {
                                                                return "";
                                                            }
                                                        })();
                                                        setRefinanceId(debt.id);
                                                        setFormData({
                                                            type: debt.type,
                                                            amount: String(debt.amount / (debt.fxRate || 1)),
                                                            currency: debt.currency,
                                                            remainingInstallments: debt.remainingInstallments ? String(debt.remainingInstallments) : "",
                                                            interestRate: debt.interestRate ? String(debt.interestRate) : "",
                                                            paymentDay: debt.paymentDay ? String(debt.paymentDay) : "",
                                                            dueDate: safeDueDate,
                                                            description: debt.description || debt.type,
                                                        });
                                                        setIsAdding(true);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <Landmark className="w-4 h-4 mr-2" /> Borcu Yapılandır
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Kalan Borç</span>
                                        <p className="text-2xl font-heading font-bold text-primary">{formatAmount(debt.amount)}</p>
                                        {debt.currency && debt.currency !== "TRY" && (
                                            <p className="text-[11px] text-muted-foreground font-semibold">
                                                (Orijinal: {debt.originalAmount?.toLocaleString()} {debt.currency})
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-1">{debt.description || debt.type}</h3>
                                <p className="text-sm text-muted-foreground opacity-70 mb-6">{debt.type}</p>

                                <div className="space-y-4 pt-4 border-t border-border/20">
                                    {debt.remainingInstallments !== null && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                <Clock className="w-4 h-4 opacity-40" /> Kalan Taksit
                                            </div>
                                            <span className="font-bold text-foreground">{debt.remainingInstallments} Ay</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                            <TrendingDown className="w-4 h-4 opacity-40" /> Aylık Ödeme (Tahmini)
                                        </div>
                                        <span className="font-bold text-primary">
                                            {formatAmount(debt.installmentAmount || monthlyTry)}
                                        </span>
                                    </div>
                                    {debt.paymentDay && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                <Calendar className="w-4 h-4 opacity-40" /> Ödeme Günü
                                            </div>
                                            <span className="font-bold text-foreground">
                                                Her ayın {debt.paymentDay}. günü
                                            </span>
                                        </div>
                                    )}
                                    {debt.interestRate && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                <Landmark className="w-4 h-4 opacity-40" /> Faiz Oranı
                                            </div>
                                            <span className="font-bold text-foreground">
                                                %{debt.interestRate} /ay
                                            </span>
                                        </div>
                                    )}
                                    {debt.dueDate && (!debt.remainingInstallments || debt.remainingInstallments === 0) && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                <Calendar className="w-4 h-4 opacity-40" /> Son Ödeme Tarihi
                                            </div>
                                            <span className="font-bold text-rose-600">
                                                {new Date(debt.dueDate).toLocaleDateString("tr-TR")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold h-11"
                                        onClick={() => setPayModal({
                                            id: debt.id,
                                            amount: monthlyTry,
                                            rawAmount: monthlyTry,
                                            isClose: false,
                                            description: debt.description || debt.type,
                                            currency: debt.currency,
                                            originalAmount: debt.remainingInstallments ? debt.originalAmount / debt.remainingInstallments : debt.originalAmount,
                                            fxRate: debt.fxRate
                                        })}
                                    >
                                        Taksit Öde
                                    </Button>
                                    <Button
                                        className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 shadow-md shadow-primary/10"
                                        onClick={() => setPayModal({
                                            id: debt.id,
                                            amount: debt.amount,
                                            rawAmount: debt.amount,
                                            isClose: true,
                                            description: debt.description || debt.type,
                                            currency: debt.currency,
                                            originalAmount: debt.originalAmount,
                                            fxRate: debt.fxRate
                                        })}
                                    >
                                        Borcu Kapat
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {activeDebts.length === 0 && !isAdding && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-muted/20 border border-dashed rounded-[40px] border-border/50 animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <CreditCard className="w-10 h-10 text-primary/40" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-primary mb-3">Borç ve Yükümlülük Takibi</h3>
                        <p className="text-sm text-muted-foreground max-w-[400px] mb-10 leading-relaxed">
                            Kredi kartı borçları, banka kredileri veya şahsi borçlarınızı ekleyerek aylık ödeme planınızı ve toplam yükümlülüğünüzü takip edin.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                            <div className="bg-card p-5 rounded-[24px] border border-border/40 text-left shadow-sm">
                                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Kredi Kartları
                                </p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">Ekstre borçlarınızı ve taksitli alışverişlerinizi kaydedin.</p>
                            </div>
                            <div className="bg-card p-5 rounded-[24px] border border-border/40 text-left shadow-sm">
                                <p className="text-xs font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                  Bankalardan Krediler
                                </p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">Konut, taşıt veya ihtiyaç kredilerinizin taksitlerini takip edin.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Simple Custom Payment Modal */}
            {payModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-card rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-border/30">
                        <div className="p-8 bg-muted border-b border-border/20 flex justify-between items-center">
                            <h3 className="text-xl font-heading font-bold text-primary">
                                {payModal.isClose ? "Borcu Kapat" : "Taksit Ödemesi"}
                            </h3>
                            <button 
                                onClick={() => setPayModal(null)} 
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <div className="p-4 bg-card rounded-2xl border border-border/30">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">İşlem Yapılan Borç</span>
                                <p className="text-lg font-bold text-foreground mt-1">{payModal.description}</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Ödenecek Tutar</Label>
                                <Input
                                    type="number"
                                    value={payModal.amount}
                                    disabled={payModal.isClose}
                                    onChange={(e) => setPayModal({ ...payModal, amount: Number(e.target.value), rawAmount: Number(e.target.value) })}
                                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary text-lg font-bold"
                                />
                                <p className="text-[10px] text-muted-foreground/80 italic mt-1">
                                    * Bu ödeme, gider listenize otomatik olarak eklenecektir.
                                </p>
                            </div>

                            {payModal.isClose && (
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setPayModal({ ...payModal, isTransfer: !(payModal as any).isTransfer } as any)}>
                                    <input
                                        type="checkbox"
                                        checked={(payModal as any).isTransfer || false}
                                        onChange={() => { }}
                                        className="w-5 h-5 rounded border-border/40 accent-primary"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Borç Transferi / Yapılandırma</p>
                                        <p className="text-[10px] text-muted-foreground">Bu ödemeyi harcama (gider) olarak kaydetme.</p>
                                    </div>
                                </div>
                            )}

                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
                        </div>
                        <div className="p-6 bg-muted border-t border-border/10 flex justify-end gap-3">
                            <Button variant="outline" className="rounded-full px-8 border-border/30 text-muted-foreground" onClick={() => setPayModal(null)}>
                                Vazgeç
                            </Button>
                            <Button onClick={handlePay} disabled={loading} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-10 font-bold shadow-lg shadow-primary/20">
                                {loading ? "İşleniyor..." : "Ödemeyi Onayla"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Postpone Installment Custom Modal */}
            {postponeDebtId && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                                <FastForward className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-foreground">Taksiti Ertele?</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Bu ayki taksit ödemesini atlamak/ertelemek istediğinize emin misiniz?
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setPostponeDebtId(null)} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                                <Button onClick={handlePostpone} disabled={loading} className="flex-1 h-12 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20">
                                    {loading ? "Erteleniyor..." : "Evet, Ertele"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Update Payment Day Custom Modal */}
            {updateDayModal && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-foreground">Ödeme Gününü Değiştir</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {updateDayModal.description} için yeni ödeme gününü giriniz (1-31).
                                </p>
                            </div>
                            <div className="space-y-3">
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={newPaymentDay}
                                    onChange={(e) => setNewPaymentDay(e.target.value)}
                                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-primary text-center font-bold text-lg"
                                    placeholder="Gün (1-31)"
                                />
                            </div>
                            {error && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-black border border-rose-500/20 uppercase tracking-wider">{error}</div>}
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => { setUpdateDayModal(null); setNewPaymentDay(""); setError(null); }} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                                <Button onClick={handleUpdatePaymentDay} disabled={loading || !newPaymentDay} className="flex-1 h-12 rounded-2xl font-bold bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20">
                                    {loading ? "Güncelleniyor..." : "Güncelle"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
