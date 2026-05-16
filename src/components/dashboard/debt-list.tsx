"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, X, Landmark, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { addDebt, payDebtInstallment, closeDebt } from "@/app/actions/debts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrency, DISPLAY_CURRENCIES_LIST } from "@/context/currency-context";

interface DebtListProps {
  debts: any[];
}

export function DebtList({ debts }: DebtListProps) {
    const router = useRouter();
    const { formatAmount, rates } = useCurrency();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payModal, setPayModal] = useState<{ id: string, amount: number, isClose: boolean, description: string, rawAmount: number, currency?: string, originalAmount?: number, fxRate?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        type: "Kredi Kartı",
        amount: "",
        currency: "TRY",
        remainingInstallments: "",
        description: "",
    });

    const activeDebts = debts.filter(d => d.amount > 0);
    const totalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);

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
                remainingInstallments: formData.remainingInstallments ? Number(formData.remainingInstallments) : undefined,
                description: formData.description,
                currency: formData.currency,
                originalAmount: originalAmount,
                fxRate: selectedRate,
            });
            setIsAdding(false);
            setFormData({ type: "Kredi Kartı", amount: "", currency: "TRY", remainingInstallments: "", description: "" });
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
                await closeDebt(payModal.id);
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
                <Button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl px-6 h-12 font-bold shadow-lg shadow-destructive/20 animate-in fade-in slide-in-from-right-4 duration-500"
                >
                    {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isAdding ? "Vazgeç" : "Yeni Borç Ekle"}
                </Button>
            </div>

            {/* Add Debt Form */}
            {isAdding && (
                <Card className="p-8 bg-card border-border/30 shadow-ambient-high rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Borç Türü</Label>
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
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Toplam Tutar</Label>
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
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Taksit Sayısı (Opsiyonel)</Label>
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
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Açıklama</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="bg-muted border-border/30 h-12 rounded-xl focus:ring-destructive font-bold"
                                    placeholder="Örn: Ev Kredisi"
                                />
                            <p className="text-[10px] text-muted-foreground/60 italic mt-1 px-1">
                                * Borç eklemek, gelir listenize "Alınan Borç" olarak yansıtılacaktır.
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
                                <div className="text-right">
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
                                        {formatAmount(monthlyTry)}
                                    </span>
                                </div>
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
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground opacity-50 italic">
                        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                        Aktif borç veya kredi kaydı bulunmuyor.
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
                            <button onClick={() => setPayModal(null)} className="text-muted-foreground hover:text-destructive">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <div className="p-4 bg-card rounded-2xl border border-border/30">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">İşlem Yapılan Borç</span>
                                <p className="text-lg font-bold text-foreground mt-1">{payModal.description}</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ödenecek Tutar</Label>
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
