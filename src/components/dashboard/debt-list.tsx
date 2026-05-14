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

export function DebtList({ debts }: { debts: any[] }) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payModal, setPayModal] = useState<{ id: string, amount: number, isClose: boolean, description: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        type: "Kredi Kartı",
        amount: "",
        remainingInstallments: "",
        description: "",
    });

    const activeDebts = debts.filter(d => d.amount > 0);
    const totalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);

    const handleAdd = async () => {
        if (!formData.amount) return;
        setLoading(true);
        setError(null);
        try {
            await addDebt({
                type: formData.type,
                amount: Number(formData.amount),
                remainingInstallments: formData.remainingInstallments ? Number(formData.remainingInstallments) : undefined,
                description: formData.description
            });
            setIsAdding(false);
            setFormData({ type: "Kredi Kartı", amount: "", remainingInstallments: "", description: "" });
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
                await payDebtInstallment(payModal.id, payModal.amount);
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
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <div className="bg-white px-4 py-2 rounded-2xl border border-[#dbc2b0]/30 shadow-sm flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                    <div>
                        <p className="text-[10px] font-bold text-[#554336] uppercase tracking-widest opacity-60">Toplam Yükümlülük</p>
                        <p className="text-xl font-heading font-bold text-[#8c5000]">₺{totalDebt.toLocaleString('tr-TR')}</p>
                    </div>
                </div>
                <Button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-[#ba1a1a] text-white hover:bg-[#911313] rounded-xl px-6 h-12 font-bold shadow-lg shadow-[#ba1a1a]/20"
                >
                    {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isAdding ? "Vazgeç" : "Yeni Borç Ekle"}
                </Button>
            </div>

            {/* Add Debt Form */}
            {isAdding && (
                <Card className="p-8 bg-white border-[#dbc2b0]/30 shadow-ambient-high rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Borç Türü</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: String(v ?? "") }))}>
                                <SelectTrigger className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#ba1a1a]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-[#dbc2b0]/30">
                                    <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                                    <SelectItem value="Banka Kredisi">Banka Kredisi</SelectItem>
                                    <SelectItem value="Şahsi Borç">Şahsi Borç</SelectItem>
                                    <SelectItem value="Elden Taksit">Elden Taksit</SelectItem>
                                    <SelectItem value="Diğer">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Toplam Tutar (₺)</Label>
                            <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#ba1a1a] text-lg font-bold"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Taksit Sayısı (Opsiyonel)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.remainingInstallments}
                                onChange={(e) => setFormData(p => ({ ...p, remainingInstallments: e.target.value }))}
                                className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#ba1a1a]"
                                placeholder="Örn: 12"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Açıklama</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#ba1a1a]"
                                placeholder="Örn: Ev Kredisi"
                            />
                            <p className="text-[10px] text-[#554336]/60 italic mt-1 px-1">
                                * Borç eklemek, gelir listenize "Alınan Borç" olarak yansıtılacaktır.
                            </p>
                        </div>
                    </div>
                    {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
                    <div className="mt-8 flex justify-end">
                        <Button
                            onClick={handleAdd}
                            disabled={loading}
                            className="bg-[#ba1a1a] text-white hover:bg-[#911313] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-ambient-medium"
                        >
                            {loading ? "Kaydediliyor..." : "Borcu Kaydet"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Debt Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeDebts.map((debt) => (
                    <Card key={debt.id} className="bg-white border-[#dbc2b0]/30 shadow-ambient-low hover:shadow-ambient-medium transition-all rounded-[32px] overflow-hidden group">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                    debt.type === "Kredi Kartı" ? "bg-rose-50 text-rose-600" : "bg-[#8c5000]/10 text-[#8c5000]"
                                )}>
                                    {debt.type === "Kredi Kartı" ? <CreditCard className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-[#554336] uppercase tracking-widest opacity-60">Kalan Borç</span>
                                    <p className="text-2xl font-heading font-bold text-[#8c5000]">₺{debt.amount.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-[#191c1d] mb-1">{debt.description || debt.type}</h3>
                            <p className="text-sm text-[#554336] opacity-70 mb-6">{debt.type}</p>

                            <div className="space-y-4 pt-4 border-t border-[#dbc2b0]/20">
                                {debt.remainingInstallments !== null && (
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-[#554336] font-medium">
                                            <Clock className="w-4 h-4 opacity-40" /> Kalan Taksit
                                        </div>
                                        <span className="font-bold text-[#191c1d]">{debt.remainingInstallments} Ay</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-[#554336] font-medium">
                                        <TrendingDown className="w-4 h-4 opacity-40" /> Aylık Ödeme (Tahmini)
                                    </div>
                                    <span className="font-bold text-rose-600">
                                        ₺{(debt.remainingInstallments ? debt.amount / debt.remainingInstallments : debt.amount).toLocaleString('tr-TR')}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <Button 
                                    variant="outline" 
                                    className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-11"
                                    onClick={() => setPayModal({ id: debt.id, amount: debt.remainingInstallments ? debt.amount / debt.remainingInstallments : 0, isClose: false, description: debt.description || debt.type })}
                                >
                                    Taksit Öde
                                </Button>
                                <Button 
                                    className="rounded-xl bg-[#ba1a1a] hover:bg-[#911313] text-white font-bold h-11"
                                    onClick={() => setPayModal({ id: debt.id, amount: debt.amount, isClose: true, description: debt.description || debt.type })}
                                >
                                    Borcu Kapat
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {activeDebts.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-[#554336] opacity-50 italic">
                        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                        Aktif borç veya kredi kaydı bulunmuyor.
                    </div>
                )}
            </div>

            {/* Simple Custom Payment Modal */}
            {payModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-[#f8f9fa] border-b border-[#dbc2b0]/20 flex justify-between items-center">
                            <h3 className="text-xl font-heading font-bold text-[#8c5000]">
                                {payModal.isClose ? "Borcu Kapat" : "Taksit Ödemesi"}
                            </h3>
                            <button onClick={() => setPayModal(null)} className="text-[#554336] hover:text-[#ba1a1a]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <div className="p-4 bg-white rounded-2xl border border-[#dbc2b0]/30">
                                <span className="text-[10px] font-bold text-[#554336] uppercase tracking-widest opacity-60">İşlem Yapılan Borç</span>
                                <p className="text-lg font-bold text-[#191c1d] mt-1">{payModal.description}</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Ödenecek Tutar (₺)</Label>
                                <Input
                                    type="number"
                                    value={payModal.amount}
                                    disabled={payModal.isClose}
                                    onChange={(e) => setPayModal({ ...payModal, amount: Number(e.target.value) })}
                                    className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-12 rounded-xl focus:ring-[#ba1a1a] text-lg font-bold"
                                />
                                <p className="text-[10px] text-rose-600/70 italic mt-1">
                                    * Bu ödeme, gider listenize otomatik olarak eklenecektir.
                                </p>
                            </div>
                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
                        </div>
                        <div className="p-6 bg-[#f8f9fa] border-t border-[#dbc2b0]/10 flex justify-end gap-3">
                            <Button variant="outline" className="rounded-full px-8 border-[#dbc2b0]/30 text-[#554336]" onClick={() => setPayModal(null)}>
                                Vazgeç
                            </Button>
                            <Button onClick={handlePay} disabled={loading} className="rounded-full bg-[#ba1a1a] hover:bg-[#911313] text-white px-10 font-bold shadow-lg">
                                {loading ? "İşleniyor..." : "Ödemeyi Onayla"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
