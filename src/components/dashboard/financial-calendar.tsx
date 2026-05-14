"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialCalendarProps {
  incomes: any[];
  expenses: any[];
  debts: any[];
  userChildren?: any[];
  marriageDate?: Date | null;
}

export function FinancialCalendar({ incomes, expenses, debts, userChildren = [], marriageDate }: FinancialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map events to specific dates
  const eventsByDate = new Map<string, { incomes: any[], expenses: any[], debts: any[], birthdays: any[], anniversary: boolean }>();

  // Helper to normalize dates for comparison (ignoring time)
  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const addEvent = (dateStr: string, type: 'incomes' | 'expenses' | 'debts' | 'birthdays' | 'anniversary', event: any) => {
    if (!eventsByDate.has(dateStr)) {
      eventsByDate.set(dateStr, { incomes: [], expenses: [], debts: [], birthdays: [], anniversary: false });
    }
    if (type === 'anniversary') {
      eventsByDate.get(dateStr)!.anniversary = true;
    } else {
      (eventsByDate.get(dateStr)![type] as any[]).push(event);
    }
  };

  // Add all transactions to the map
  [...incomes, ...expenses, ...debts].forEach(tx => {
    // Determine the date
    let eventDate = new Date(tx.createdAt);
    
    // For recurring expenses/debts, we might want to map them to the current month based on dueDate
    if ((tx.type === "Gider" || tx.type === "Borç") && tx.dueDate) {
      // Create a date in the current viewing month using the due date
      eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), tx.dueDate);
    }
    
    const key = getDateKey(eventDate);
    if (incomes.includes(tx)) addEvent(key, 'incomes', tx);
    else if (expenses.includes(tx)) addEvent(key, 'expenses', tx);
    else addEvent(key, 'debts', tx);
  });

  // Add birthdays to the current year
  userChildren.forEach(child => {
    if (!child.birthDate) return;
    const birthDate = new Date(child.birthDate);
    const birthdayThisYear = new Date(currentDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    const key = getDateKey(birthdayThisYear);
    addEvent(key, 'birthdays', child);
  });

  // Add anniversary to the current year
  if (marriageDate) {
    const marriageD = new Date(marriageDate);
    const anniversaryThisYear = new Date(currentDate.getFullYear(), marriageD.getMonth(), marriageD.getDate());
    const key = getDateKey(anniversaryThisYear);
    addEvent(key, 'anniversary', true);
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const selectedKey = selectedDate ? getDateKey(selectedDate) : null;
  const selectedEvents = selectedKey ? eventsByDate.get(selectedKey) : null;

  return (
    <Card className="border-border/30 shadow-ambient-medium rounded-[32px] overflow-hidden bg-card">
      <CardHeader className="bg-primary/5 pb-4 border-b border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Finansal Takvim</CardTitle>
              <p className="text-xs text-muted-foreground">Gelir, gider ve ödeme günleriniz</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold w-24 text-center">
              {format(currentDate, "MMMM yyyy", { locale: tr })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Padding for first day of month (Monday start) */}
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
                
                {/* Dots indicator container */}
                {events && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {events.incomes.length > 0 && <span className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500", isSelected && "bg-white")} />}
                    {events.expenses.length > 0 && <span className={cn("w-1.5 h-1.5 rounded-full bg-rose-500", isSelected && "bg-white")} />}
                    {events.debts.length > 0 && <span className={cn("w-1.5 h-1.5 rounded-full bg-orange-500", isSelected && "bg-white")} />}
                    {events.birthdays.length > 0 && <span className={cn("w-1.5 h-1.5 rounded-full bg-purple-500", isSelected && "bg-white")} />}
                    {events.anniversary && <span className={cn("w-1.5 h-1.5 rounded-full bg-pink-500", isSelected && "bg-white")} />}
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
              <h4 className="text-sm font-bold text-primary mb-3 pb-2 border-b border-border/20">
                {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })}
              </h4>
              
              {!selectedEvents || (selectedEvents.incomes.length === 0 && selectedEvents.expenses.length === 0 && selectedEvents.debts.length === 0 && selectedEvents.birthdays.length === 0 && !selectedEvents.anniversary) ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-70">
                  <Info className="h-4 w-4" />
                  Bu tarihte herhangi bir işlem veya ödeme bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.incomes.map((inc, i) => (
                    <div key={`inc-${i}`} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-foreground">{inc.type} (Gelir)</span>
                      </div>
                      <span className="font-bold text-emerald-600">+{inc.amount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                  {selectedEvents.expenses.map((exp, i) => (
                    <div key={`exp-${i}`} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-medium text-foreground">{exp.type} (Gider)</span>
                      </div>
                      <span className="font-bold text-rose-600">-{exp.amount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                  {selectedEvents.debts.map((debt, i) => (
                    <div key={`debt-${i}`} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="font-medium text-foreground">{debt.type} (Borç/Ödeme)</span>
                      </div>
                      <span className="font-bold text-orange-600">-{debt.amount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                  {selectedEvents.birthdays.map((child, i) => {
                    const age = selectedDate.getFullYear() - new Date(child.birthDate).getFullYear();
                    return (
                      <div key={`bday-${i}`} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-medium text-foreground">Çocuğun Doğum Günü {age > 0 ? `(${age}. Yaş)` : ''}</span>
                        </div>
                        <span className="font-bold text-purple-600 text-lg leading-none">🎂</span>
                      </div>
                    );
                  })}
                  {selectedEvents.anniversary && (
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                        <span className="font-medium text-foreground">Evlilik Yıl Dönümü</span>
                      </div>
                      <span className="font-bold text-pink-600 text-lg leading-none">💑</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
             <div className="text-center text-xs text-muted-foreground opacity-60 mt-4">
                Detayları görmek için takvimden bir güne tıklayın.
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
