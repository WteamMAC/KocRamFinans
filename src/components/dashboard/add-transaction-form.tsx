"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addIncome, addExpense } from "@/app/actions/income-expense";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface AddTransactionFormProps {
  type: "income" | "expense";
}

export function AddTransactionForm({ type }: AddTransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    isRecurring: false,
  });

  const categories = type === "income" 
    ? ["Maaş", "Kira Geliri", "Yatırım Geliri", "Freelance", "Diğer"]
    : ["Market", "Kira", "Fatura", "Ulaşım", "Eğlence", "Sağlık", "Diğer"];

  const handleSave = async () => {
    if (!formData.amount || !formData.category) {
        setError("Lütfen tüm alanları doldurun.");
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      if (type === "income") {
        await addIncome({
          type: formData.category,
          amount: Number(formData.amount),
          description: formData.description,
        });
      } else {
        await addExpense({
          type: formData.category,
          amount: Number(formData.amount),
          isRecurring: formData.isRecurring,
          description: formData.description,
        });
      }
      router.push("/dashboard/income-expense/history");
      router.refresh();
    } catch (err) {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/income-expense/history">
            <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <h1 className="text-3xl font-heading font-bold text-[#8c5000]">
            {type === "income" ? "Yeni Gelir Ekle" : "Yeni Gider Ekle"}
        </h1>
      </div>

      <Card className="border-[#dbc2b0]/30 shadow-ambient-medium rounded-[32px] overflow-hidden">
        <CardHeader className={type === "income" ? "bg-emerald-50/50" : "bg-rose-50/50"}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                    {type === "income" ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                </div>
                <div>
                    <CardTitle className="text-lg text-[#554336]">İşlem Detayları</CardTitle>
                    <p className="text-xs text-[#554336] opacity-60">Lütfen aşağıdaki bilgileri eksiksiz doldurun.</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Kategori</Label>
            <Select onValueChange={(v: string | null) => setFormData(p => ({ ...p, category: v ?? "" }))}>
              <SelectTrigger className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-14 rounded-2xl text-base">
                <SelectValue placeholder="Kategori Seçin" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#dbc2b0]/30">
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Tutar (₺)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
              className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-14 rounded-2xl text-xl font-bold text-[#8c5000]"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-[#554336] uppercase tracking-widest px-1">Açıklama</Label>
            <Input
              placeholder="İşlem detayları (opsiyonel)..."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-14 rounded-2xl"
            />
          </div>

          {type === "expense" && (
            <div className="flex items-center space-x-3 bg-[#f8f9fa]/50 p-4 rounded-2xl border border-[#dbc2b0]/20">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, isRecurring: !!checked }))}
                className="border-[#8c5000] data-[state=checked]:bg-[#8c5000]"
              />
              <Label htmlFor="isRecurring" className="text-sm font-semibold text-[#554336] cursor-pointer">
                Düzenli (Her Ay Tekrarlanan) Gider
              </Label>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className={`w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95 ${
                type === "income" 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" 
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
              }`}
            >
              {loading ? "Kaydediliyor..." : `${type === "income" ? "Geliri" : "Gideri"} Kaydet`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
