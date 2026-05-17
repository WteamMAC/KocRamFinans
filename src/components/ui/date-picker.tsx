"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside a portal (like Select dropdown or radix popovers)
      if (
        target.closest('[data-slot="select-content"]') || 
        target.closest('[data-slot="select-popup"]') ||
        target.closest('[data-slot="select-item"]') ||
        target.closest('[data-radix-popper-content-wrapper]')
      ) {
        return;
      }
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        (!calendarRef.current || !calendarRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateCoords = React.useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const calendarWidth = 300;
      const calculatedLeft = rect.left + window.scrollX;
      // Ensure calendar popover doesn't overflow horizontal viewport
      const maxLeft = window.innerWidth + window.scrollX - calendarWidth - 16;
      setCoords({
        top: rect.bottom + window.scrollY,
        left: Math.max(16, Math.min(calculatedLeft, maxLeft)),
        width: rect.width,
      });
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      updateCoords();
      // Listen to all scroll events in capture phase so we catch scroll events from modals
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, updateCoords]);

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

      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div 
          ref={calendarRef}
          style={{
            position: "absolute",
            top: `${coords.top + 8}px`,
            left: `${coords.left}px`,
            minWidth: "300px",
          }}
          className="z-[99999] bg-card border border-border/30 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <Calendar
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setIsOpen(false);
            }}
            className="rounded-2xl"
          />
        </div>,
        document.body
      )}
    </div>
  );
}
