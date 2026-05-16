"use client";

import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, setDate, placeholder = "Tarih seçin", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside a portal (like Select dropdown)
      if (target.closest('[data-slot="select-content"]') || 
          target.closest('[data-slot="select-popup"]') ||
          target.closest('[data-slot="select-item"]')) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border/50 bg-[#faf9f6] dark:bg-[#120d0a] px-6 py-2 text-sm font-semibold cursor-pointer transition-all hover:border-primary/50",
          !date && "text-muted-foreground",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 opacity-50" />
          {date ? format(date, "PPP", { locale: tr }) : <span>{placeholder}</span>}
        </div>
        {date && (
          <X 
            className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" 
            onClick={(e) => {
              e.stopPropagation();
              setDate(undefined);
            }}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[100] min-w-[300px] bg-card border border-border/30 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <Calendar
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setIsOpen(false);
            }}
            className="rounded-2xl"
          />
        </div>
      )}
    </div>
  );
}
