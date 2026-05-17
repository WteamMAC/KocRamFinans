"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Plus, Trash2, Loader2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addSpecialEvent, deleteSpecialEvent } from "@/app/actions/special-events";
import { useCurrency } from "@/context/currency-context";

interface FinancialCalendarProps {
  incomes: any[];
  expenses: any[];
  debts: any[];
  specialEvents?: any[];
}

export function FinancialCalendar({ incomes, expenses, debts, specialEvents = [] }: FinancialCalendarProps) {
  const { formatAmount } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsByDate = new Map<string, { incomes: any[], expenses: any[], debts: any[], specialEvents: any[] }>();

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const addEvent = (dateStr: string, type: 'incomes' | 'expenses' | 'debts' | 'specialEvents', event: any) => {
    if (!eventsByDate.has(dateStr)) {
      eventsByDate.set(dateStr, { incomes: [], expenses: [], debts: [], specialEvents: [] });
    }
    (eventsByDate.get(dateStr)![type] as any[]).push(event);
  };

  [...incomes, ...expenses, ...debts].forEach(tx => {
    let eventDate = new Date(tx.createdAt);
    if (tx.dueDate) {
      eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), tx.dueDate);
    }
    const key = getDateKey(eventDate);
    if (incomes.find(i => i.id === tx.id)) addEvent(key, 'incomes', tx);
    else if (expenses.find(e => e.id === tx.id)) addEvent(key, 'expenses', tx);
    else addEvent(key, 'debts', tx);
  });

  specialEvents.forEach(evt => {
    const evtDate = new Date(evt.date);
    let targetDate = evtDate;

    if (evt.isAnnual) {
      targetDate = new Date(currentDate.getFullYear(), evtDate.getMonth(), evtDate.getDate());
    }

    addEvent(getDateKey(targetDate), 'specialEvents', evt);
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedKey = selectedDate ? getDateKey(selectedDate) : null;
  const selectedEvents = selectedKey ? eventsByDate.get(selectedKey) : null;

  const handleAddEvent = async () => {
    if (!selectedDate || !newEventTitle.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", newEventTitle);
    formData.append("date", selectedDate.toISOString());

    const result = await addSpecialEvent(formData);

    if (result.error) {
      alert("Hata: " + result.error);
    } else {
      alert("Özel gün başarıyla eklendi ve her yıl tekrarlanacak şekilde ayarlandı.");
      setIsAddModalOpen(false);
      setNewEventTitle("");
    }
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (id: string) => {
    setDeletingId(id);
    const result = await deleteSpecialEvent(id);
    if (result.error) {
      alert("Hata: " + result.error);
    }
    setDeletingId(null);
  };

  return (
    <Card className="border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden bg-card h-full pt-0">
      <CardHeader className="bg-primary/5 border-b border-border/10 h-20 !flex flex-row items-center justify-between px-6 py-0">
        <div className="flex items-center gap-4 w-full justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col justify-center">
              <CardTitle className="text-base md:text-lg leading-tight">Finansal Takvim</CardTitle>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Gelir, gider, özel günleriniz</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-background/50 p-1 rounded-full border border-border/10">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[11px] md:text-xs font-black min-w-[90px] text-center uppercase tracking-tighter text-primary/80">
              {format(currentDate, "MMMM yyyy", { locale: tr })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 md:h-14 rounded-xl opacity-0" />
          ))}

          {daysInMonth.map((day, idx) => {
            const key = getDateKey(day);
            const events = eventsByDate.get(key);
            const isSelected = selectedDate && isSameDay(selectedDate, day);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative h-10 md:h-14 rounded-xl flex flex-col items-center justify-center border transition-all",
                  isSelected ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10" : "bg-muted/30 border-transparent hover:border-border hover:bg-muted",
                  isToday && !isSelected && "border-primary/30 text-primary font-bold bg-primary/5"
                )}
              >
                <span className={cn("text-xs font-semibold", isSelected && "text-primary-foreground")}>
                  {format(day, "d")}
                </span>

                {events && (
                  <div className="absolute bottom-1 md:bottom-1.5 flex gap-0.5">
                    {events.incomes.length > 0 && <span className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500", isSelected && "bg-white")} />}
                    {events.expenses.length > 0 && <span className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-rose-500", isSelected && "bg-white")} />}
                    {events.debts.length > 0 && <span className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-orange-500", isSelected && "bg-white")} />}
                    {events.specialEvents.length > 0 && <span className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-sky-500", isSelected && "bg-white")} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Details */}
        <div className="mt-6">
          {selectedDate ? (
            <div className="bg-muted/50 rounded-2xl p-4 border border-border/20 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pb-2 border-b border-border/20 gap-2">
                <h4 className="text-xs md:text-sm font-bold text-primary">
                  {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })}
                </h4>
                <Button variant="outline" size="sm" className="h-7 text-[10px] md:text-xs rounded-lg w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Özel Gün Ekle
                </Button>
              </div>

              {!selectedEvents || (selectedEvents.incomes.length === 0 && selectedEvents.expenses.length === 0 && selectedEvents.debts.length === 0 && selectedEvents.specialEvents.length === 0) ? (
                <div className="flex items-center gap-2 text-[10px] md:text-sm text-muted-foreground opacity-70">
                  <Info className="h-3 w-3 md:h-4 md:w-4" />
                  Bu tarihte herhangi bir işlem bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.specialEvents.map((evt) => (
                    <div key={`spe-${evt.id}`} className="flex justify-between items-center text-xs md:text-sm bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Star className="h-3 w-3 md:h-4 md:w-4 text-sky-500 fill-sky-500 shrink-0" />
                        <span className="font-bold text-sky-600 dark:text-sky-400 truncate">{evt.title}</span>
                        {!isMobile && <span className="text-[10px] bg-sky-500/20 text-sky-600 px-2 py-0.5 rounded-full">Her Yıl</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDeleteEvent(evt.id)} disabled={deletingId === evt.id}>
                        {deletingId === evt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  ))}
                  {selectedEvents.incomes.map((inc, i) => (
                    <div key={`inc-${i}`} className="flex justify-between items-center text-xs md:text-sm px-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-foreground truncate">{inc.type}</span>
                      </div>
                      <span className="font-bold text-emerald-600 whitespace-nowrap">
                        {isMobile ? `+${new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(inc.amount)} ₺` : `+${formatAmount(inc.amount)}`}
                      </span>
                    </div>
                  ))}
                  {selectedEvents.expenses.map((exp, i) => (
                    <div key={`exp-${i}`} className="flex justify-between items-center text-xs md:text-sm px-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="font-medium text-foreground truncate">{exp.type}</span>
                      </div>
                      <span className="font-bold text-rose-600 whitespace-nowrap">
                        {isMobile ? `-${new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(exp.amount)} ₺` : `-${formatAmount(exp.amount)}`}
                      </span>
                    </div>
                  ))}
                  {selectedEvents.debts.map((debt, i) => (
                    <div key={`debt-${i}`} className="flex justify-between items-center text-xs md:text-sm px-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 shrink-0" />
                        <span className="font-medium text-foreground truncate">{debt.type}</span>
                      </div>
                      <span className="font-bold text-orange-600 whitespace-nowrap">
                        {isMobile ? `-${new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(debt.amount)} ₺` : `-${formatAmount(debt.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-[10px] md:text-xs text-muted-foreground opacity-60 mt-4">
              Detayları görmek için takvimden bir güne tıklayın.
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Özel Gün Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Seçili Tarih: <strong className="text-foreground">{selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}</strong>
              <br />
              <span className="text-xs text-emerald-500 mt-1 inline-block">* Bu etkinlik her yıl aynı ay ve günde takviminizde görünecektir.</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Etkinlik/Özel Gün Adı</label>
              <Input
                placeholder="Örn: Araç Sigortası Yenileme, Anneler Günü..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
            <Button onClick={handleAddEvent} disabled={isSubmitting || !newEventTitle.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
