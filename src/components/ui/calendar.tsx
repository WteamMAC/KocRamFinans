"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  getYear,
  getMonth,
  setYear,
  setMonth
} from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());
  
  const days = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"];
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  return (
    <div className={cn("p-4 bg-card text-card-foreground", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Select 
            value={getMonth(currentMonth).toString()}
            onValueChange={(v) => setCurrentMonth(setMonth(currentMonth, parseInt(v as string)))}
          >
            <SelectTrigger className="h-8 w-[100px] bg-transparent border-none p-0 hover:text-primary transition-colors font-bold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[120px]">
              {months.map((m, i) => (
                <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={getYear(currentMonth).toString()}
            onValueChange={(v) => setCurrentMonth(setYear(currentMonth, parseInt(v as string)))}
          >
            <SelectTrigger className="h-8 w-[80px] bg-transparent border-none p-0 hover:text-primary transition-colors font-bold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[100px]">
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 rounded-lg">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);

          return (
            <button
              key={i}
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all relative",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isSelected && "hover:bg-muted text-foreground",
                isSelected && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                isDayToday && !isSelected && "text-primary border border-primary/30"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
