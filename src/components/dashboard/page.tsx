// Gelir ve Gider Detay Sayfası
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Wallet, Clock, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IncomeExpensePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: {
            incomes: { orderBy: { createdAt: 'desc' } },
            expenses: { orderBy: { createdAt: 'desc' } }
        }
    });

    if (!user) redirect("/onboarding");

    const totalIncome = user.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = user.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalIncome - totalExpense;

    return (
        <div className="space-y-8 p-6 md:p-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-[#8c5000]">Gelir ve Giderler</h2>
                    <p className="text-[#554336] mt-1">Nakit akışınızı ve harcama detaylarınızı buradan takip edin.</p>
                </div>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
                    <h3 className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-2 opacity-70 relative z-10">Toplam Gelir</h3>
                    <div className="text-3xl font-heading font-bold text-emerald-600 mb-2 relative z-10">
                        +{totalIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </div>
                </Card>

                <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
                    <h3 className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-2 opacity-70 relative z-10">Toplam Gider</h3>
                    <div className="text-3xl font-heading font-bold text-rose-600 mb-2 relative z-10">
                        -{totalExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </div>
                </Card>

                <Card className="p-6 bg-white border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] flex flex-col justify-center relative overflow-hidden">
                    <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 pointer-events-none", netBalance >= 0 ? "bg-[#8c5000]/10" : "bg-rose-500/10")} />
                    <h3 className="text-[10px] font-bold text-[#554336] uppercase tracking-widest mb-2 opacity-70 relative z-10">Net Durum</h3>
                    <div className={cn("text-3xl font-heading font-bold mb-2 relative z-10", netBalance >= 0 ? "text-[#8c5000]" : "text-rose-600")}>
                        {netBalance >= 0 ? "+" : ""}{netBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </div>
                    <div className={cn("inline-flex items-center px-3 py-1.5 rounded-xl w-fit font-bold relative z-10 text-xs", netBalance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                        {netBalance >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                        {netBalance >= 0 ? "Pozitif Nakit Akışı" : "Negatif Nakit Akışı"}
                    </div>
                </Card>
            </div>

            {/* Listeler */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Gelirler Listesi */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-emerald-700">Gelir Detayları</h3>
                    </div>
                    <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
                        <div className="divide-y divide-[#dbc2b0]/10">
                            {user.incomes.length === 0 ? (
                                <div className="p-12 text-center text-[#434750] opacity-60">Kayıtlı gelir bulunamadı.</div>
                            ) : (
                                user.incomes.map((inc) => (
                                    <div key={inc.id} className="p-6 hover:bg-[#f8f9fa] transition-colors flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                                                <Wallet className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#191c1d]">{inc.type}</span>
                                                </div>
                                                <p className="text-[10px] font-medium text-[#554336] flex items-center gap-1 mt-1 opacity-80">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(inc.createdAt).toLocaleDateString("tr-TR")}
                                                </p>
                                                {inc.description && <p className="text-xs text-[#554336] mt-1 line-clamp-1">{inc.description}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-emerald-600 text-lg">+{inc.amount.toLocaleString("tr-TR")} ₺</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Giderler Listesi */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <ArrowUpRight className="h-5 w-5 text-rose-600" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-rose-700">Gider Detayları</h3>
                    </div>
                    <Card className="bg-white border-[#dbc2b0]/20 shadow-ambient-medium rounded-[32px] overflow-hidden">
                        <div className="divide-y divide-[#dbc2b0]/10">
                            {user.expenses.length === 0 ? (
                                <div className="p-12 text-center text-[#434750] opacity-60">Kayıtlı gider bulunamadı.</div>
                            ) : (
                                user.expenses.map((exp) => (
                                    <div key={exp.id} className="p-6 hover:bg-[#f8f9fa] transition-colors flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
                                                <Receipt className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#191c1d]">{exp.type}</span>
                                                    {exp.isRecurring && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">DÜZENLİ</span>}
                                                </div>
                                                <p className="text-[10px] font-medium text-[#554336] flex items-center gap-1 mt-1 opacity-80">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(exp.createdAt).toLocaleDateString("tr-TR")}
                                                    {exp.dueDate && ` (Ayın ${exp.dueDate}. günü)`}
                                                </p>
                                                {exp.description && <p className="text-xs text-[#554336] mt-1 line-clamp-1">{exp.description}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-rose-600 text-lg">-{exp.amount.toLocaleString("tr-TR")} ₺</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}