"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Plus, Trash2, Wallet, CreditCard, TrendingUp, Users } from "lucide-react";

const onboardingSchema = z.object({
  familyCount: z.coerce.number().min(1, "En az 1 kişi olmalıdır."),
  incomes: z.array(z.object({
    type: z.string().min(1, "Tür seçiniz"),
    amount: z.coerce.number().min(0),
    description: z.string().optional(),
  })),
  expenses: z.array(z.object({
    type: z.string().min(1, "Tür seçiniz"),
    amount: z.coerce.number().min(0),
    dueDate: z.coerce.number().min(1).max(31).optional(),
    isRecurring: z.boolean().default(true),
    description: z.string().optional(),
  })),
  debts: z.array(z.object({
    type: z.string().min(1, "Tür seçiniz"),
    amount: z.coerce.number().min(0),
    remainingInstallments: z.coerce.number().optional(),
    description: z.string().optional(),
  })),
  investments: z.array(z.object({
    type: z.string().min(1, "Tür seçiniz"),
    amount: z.coerce.number().min(0),
    currentValuation: z.coerce.number().optional(),
    description: z.string().optional(),
  })),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm({ initialData, isSettings = false }: { initialData?: OnboardingValues, isSettings?: boolean }) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: initialData || {
      familyCount: 1,
      incomes: [{ type: "Maaş", amount: 0 }],
      expenses: [],
      debts: [],
      investments: [],
    },
  });

  const { fields: incomeFields, append: appendIncome, remove: removeIncome } = useFieldArray({
    control: form.control,
    name: "incomes",
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  const { fields: debtFields, append: appendDebt, remove: removeDebt } = useFieldArray({
    control: form.control,
    name: "debts",
  });

  const { fields: investmentFields, append: appendInvestment, remove: removeInvestment } = useFieldArray({
    control: form.control,
    name: "investments",
  });

  async function onSubmit(data: OnboardingValues) {
    try {
      await completeOnboarding(data);
      if (isSettings) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <Card className={`w-full max-w-2xl mx-auto border-none shadow-2xl bg-white/80 backdrop-blur-md ${isSettings ? "mt-4" : ""}`}>
      <CardHeader className="text-center">
        {!isSettings && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    step >= i ? "bg-primary scale-125" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {step === 1 && (isSettings ? "Gelir ve Aile Bilgilerini Düzenle" : "Gelir ve Aile Bilgileri")}
          {step === 2 && (isSettings ? "Giderleri Düzenle" : "Giderler ve Faturalar")}
          {step === 3 && (isSettings ? "Borçları Düzenle" : "Borçlar ve Taksitler")}
          {step === 4 && (isSettings ? "Yatırımları Düzenle" : "Yatırım Portföyü")}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Mevcut gelir ve aile kişi sayısı bilgilerinizi buradan güncelleyebilirsiniz."}
          {step === 2 && "Aylık düzenli harcamalarınızı ve fatura tarihlerinizi güncelleyin."}
          {step === 3 && "Borç durumunuzu ve kalan taksitlerinizi revize edin."}
          {step === 4 && "Varlıklarınızın güncel değerlerini girin."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Aile Kişi Sayısı
                </Label>
                <Input type="number" {...form.register("familyCount")} />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Gelir Kalemleri
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendIncome({ type: "Diğer", amount: 0 })}>
                    <Plus className="w-4 h-4 mr-1" /> Ekle
                  </Button>
                </div>
                {incomeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-end group">
                    <div className="flex-1 space-y-2">
                      <Select 
                        onValueChange={(val) => form.setValue(`incomes.${index}.type`, val || "")}
                        defaultValue={field.type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tür" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maaş">Maaş</SelectItem>
                          <SelectItem value="Eş Maaşı">Eş Maaşı</SelectItem>
                          <SelectItem value="Kira Geliri">Kira Geliri</SelectItem>
                          <SelectItem value="Sosyal Medya">Sosyal Medya</SelectItem>
                          <SelectItem value="Taksi/Ek İş">Taksi/Ek İş</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input type="number" placeholder="Miktar" {...form.register(`incomes.${index}.amount`)} />
                    </div>
                    {index > 0 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeIncome(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Gider ve Faturalar
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={() => appendExpense({ type: "Fatura", amount: 0, isRecurring: true })}>
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
              {expenseFields.map((field, index) => (
                <div key={field.id} className="space-y-3 p-4 border rounded-lg relative group">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Input placeholder="Gider Adı (Kira, Elektrik vb.)" {...form.register(`expenses.${index}.type`)} />
                    </div>
                    <div className="space-y-2">
                      <Input type="number" placeholder="Miktar" {...form.register(`expenses.${index}.amount`)} />
                    </div>
                    <div className="space-y-2">
                      <Input type="number" placeholder="Ödeme Günü (1-31)" {...form.register(`expenses.${index}.dueDate`)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...form.register(`expenses.${index}.isRecurring`)} />
                      <Label className="text-sm">Düzenli Ödeme</Label>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2" onClick={() => removeExpense(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Borçlar
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={() => appendDebt({ type: "Kredi Kartı", amount: 0 })}>
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
              {debtFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-3 gap-3 items-end">
                  <Input placeholder="Tür (Banka, KK vb.)" {...form.register(`debts.${index}.type`)} />
                  <Input type="number" placeholder="Toplam Borç" {...form.register(`debts.${index}.amount`)} />
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Kalan Taksit" {...form.register(`debts.${index}.remainingInstallments`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDebt(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Yatırımlar
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={() => appendInvestment({ type: "Altın", amount: 0 })}>
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
              {investmentFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 gap-3 items-end p-4 border rounded-lg relative">
                  <div className="space-y-2">
                    <Controller
                      name={`investments.${index}.type` as any}
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Yatırım Türü" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BIST">BIST (Hisse)</SelectItem>
                            <SelectItem value="NASDAQ">NASDAQ (Hisse)</SelectItem>
                            <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                            <SelectItem value="GOLD">Altın/Emtia</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input type="number" placeholder="Güncel Değer (₺)" {...form.register(`investments.${index}.amount`, { valueAsNumber: true })} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2" onClick={() => removeInvestment(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={prevStep}
          disabled={step === 1}
        >
          Geri
        </Button>
        {step < 4 ? (
          <Button type="button" onClick={nextStep}>
            Devam Et
          </Button>
        ) : (
          <Button type="button" onClick={form.handleSubmit(onSubmit)} className="bg-gradient-to-r from-primary to-blue-600">
            {isSettings ? "Değişiklikleri Kaydet" : "Kurulumu Tamamla"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
