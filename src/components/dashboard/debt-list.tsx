"use client";

import { useState } from "react";
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
            <div className="flex justify-between items-center">
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
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95",
                        isAdding 
                            ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 shadow-rose-500/10" 
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
                                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--primary)/0.05)', radius: 8 }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border)/0.3)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [formatAmount(value), "Ödeme"]}
                                    />
                                    <Bar dataKey="tutar" fill="url(#barGradient)" radius={[8, 8, 4, 4]} barSize={displayCount > 12 ? 15 : 30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-8 bg-card border-border/30 shadow-ambient-medium rounded-[32px] flex flex-col">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-500" /> Borç Dağılımı
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
                                                    className={cn("h-full rounded-full", type === "Kredi Kartı" ? "bg-rose-500" : "bg-primary")}
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

            {/* Add Debt Form */}
            {isAdding && (
                <Card className="p-8 bg-card border-border/30 shadow-ambient-high rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500 mb-8 border-t-4 border-t-primary">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                            {refinanceId ? <Landmark className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                            {refinanceId ? "Borç Yapılandırma" : "Yeni Borç Ekle"}
                        </h3>
                        {refinanceId && (
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-tighter">
                                Mevcut borç kapatılıp yenisi eklenecek
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Borç Türü</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v ?? "") }))}>
                                <SelectTrigger className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive font-bold">
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
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Toplam Tutar</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive text-lg font-bold flex-1"
                                    placeholder="0.00"
                                />
                                <Select value={formData.currency} onValueChange={(v) => setFormData(p => ({ ...p, currency: String(v) }))}>
                                    <SelectTrigger className="bg-muted border-border/30 h-12 rounded-xl w-[110px] font-bold">
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
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Taksit Sayısı (Opsiyonel)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.remainingInstallments}
                                onChange={(e) => setFormData(p => ({ ...p, remainingInstallments: e.target.value }))}
                                className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive font-bold"
                                placeholder="Örn: 12"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Aylık Faiz Oranı % (Opsiyonel)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.interestRate}
                                onChange={(e) => setFormData(p => ({ ...p, interestRate: e.target.value }))}
                                className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive font-bold"
                                placeholder="Örn: 3.50"
                            />
                        </div>
                        {formData.remainingInstallments && Number(formData.remainingInstallments) > 0 ? (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Taksit Ödeme Günü (1-31)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formData.paymentDay}
                                    onChange={(e) => setFormData(p => ({ ...p, paymentDay: e.target.value }))}
                                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive font-bold"
                                    placeholder="Ayın kaçıncı günü?"
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Son Ödeme Tarihi</Label>
                                <DatePicker
                                    date={formData.dueDate ? parseISO(formData.dueDate) : undefined}
                                    setDate={(d) => setFormData(p => ({ ...p, dueDate: d ? d.toISOString().split('T')[0] : "" }))}
                                    placeholder="GG.AA.YYYY"
                                    className="h-12"
                                />
                            </div>
                        )}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">Açıklama</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive font-bold"
                                placeholder="Örn: Ev Kredisi"
                            />
                            <p className="text-[10px] text-muted-foreground/60 italic mt-1 px-1">
                                * Borçlar toplam yükümlülük olarak takip edilir, gelirinize dahil edilmez.
                            </p>
                        </div>
                    </div>
                    {error && <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20">{error}</div>}
                    <div className="mt-8 flex justify-end">
                        <Button
                            onClick={handleAdd}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full px-10 py-6 h-auto text-lg font-bold shadow-ambient-medium"
                        >
                            {loading ? "Kaydediliyor..." : "Borcu Kaydet"}
                        </Button>
                    </div>
                </Card>
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
                                        debt.type === "Kredi Kartı" ? "bg-rose-500/10 text-rose-600" : "bg-primary/10 text-primary"
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
                                                    onClick={async () => {
                                                        if (confirm("Bu ayki taksit ödemesini atlamak/ertelemek istediğinize emin misiniz?")) {
                                                            await postponeDebtInstallment(debt.id);
                                                            router.refresh();
                                                        }
                                                    }}
                                                >
                                                    <FastForward className="w-4 h-4 mr-2" /> Bu Ayı Atla/Ertele
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        const day = prompt("Yeni ödeme gününü girin (1-31):", debt.paymentDay || "1");
                                                        if (day) {
                                                            updateDebtPaymentDay(debt.id, Number(day));
                                                            router.refresh();
                                                        }
                                                    }}
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" /> Ödeme Gününü Değiştir
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={(e) => {
                                                        e.preventDefault(); // Menü kapanırken state kaybını önlemek için
                                                        setRefinanceId(debt.id);
                                                        setFormData({
                                                            type: debt.type,
                                                            amount: String(debt.amount / (debt.fxRate || 1)),
                                                            currency: debt.currency,
                                                            remainingInstallments: debt.remainingInstallments ? String(debt.remainingInstallments) : "",
                                                            interestRate: debt.interestRate ? String(debt.interestRate) : "",
                                                            paymentDay: debt.paymentDay ? String(debt.paymentDay) : "",
                                                            dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : "",
                                                            description: debt.description || debt.type,
                                                        });
                                                        setIsAdding(false); // Önce kapatıp
                                                        setTimeout(() => {
                                                            setIsAdding(true); // Hemen geri açıyoruz (Fresh state)
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }, 50);
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
                                        <span className="font-bold text-rose-600">
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
                                        className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold h-11"
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
                                        className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold h-11"
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
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                            <CreditCard className="w-10 h-10 text-rose-500/40" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-primary mb-3">Borç ve Yükümlülük Takibi</h3>
                        <p className="text-sm text-muted-foreground max-w-[400px] mb-10 leading-relaxed">
                            Kredi kartı borçları, banka kredileri veya şahsi borçlarınızı ekleyerek aylık ödeme planınızı ve toplam yükümlülüğünüzü takip edin.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                            <div className="bg-card p-5 rounded-[24px] border border-border/40 text-left shadow-sm">
                                <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
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
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground transition-all"
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
                                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-red-600 text-lg font-bold"
                                />
                                <p className="text-[10px] text-rose-600/70 italic mt-1">
                                    * Bu ödeme, gider listenize otomatik olarak eklenecektir.
                                </p>
                            </div>

                            {payModal.isClose && (
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setPayModal({ ...payModal, isTransfer: !(payModal as any).isTransfer } as any)}>
                                    <input
                                        type="checkbox"
                                        checked={(payModal as any).isTransfer || false}
                                        onChange={() => { }}
                                        className="w-5 h-5 rounded border-border/40 accent-destructive"
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
                            <Button onClick={handlePay} disabled={loading} className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground px-10 font-bold shadow-lg shadow-destructive/20">
                                {loading ? "İşleniyor..." : "Ödemeyi Onayla"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
