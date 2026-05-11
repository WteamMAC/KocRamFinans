import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingPaymentsProps {
  expenses: any[];
}

export function UpcomingPayments({ expenses }: UpcomingPaymentsProps) {
  const today = new Date().getDate();
  
  const sortedExpenses = [...expenses]
    .filter(exp => exp.dueDate)
    .sort((a, b) => {
      const dayA = a.dueDate > today ? a.dueDate : a.dueDate + 31;
      const dayB = b.dueDate > today ? b.dueDate : b.dueDate + 31;
      return dayA - dayB;
    });

  if (sortedExpenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="w-12 h-12 bg-[#faf9f6] rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-[#c4c6d2]" />
         </div>
         <p className="text-sm font-medium text-[#434750] opacity-60">Henüz kayıtlı ödeme bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedExpenses.slice(0, 5).map((exp) => {
        const isSoon = exp.dueDate - today <= 5 && exp.dueDate >= today;
        return (
          <div key={exp.id} className="flex items-center justify-between p-4 bg-white border border-[#c4c6d2]/10 hover:border-[#fed65b]/50 hover:shadow-md transition-all rounded-2xl group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isSoon ? "bg-rose-50 text-rose-600" : "bg-[#faf9f6] text-[#001b44]"
              )}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#001b44] group-hover:text-[#735c00] transition-colors">{exp.type}</p>
                <p className="text-[10px] font-bold text-[#747781] uppercase tracking-widest mt-0.5">Ayın {exp.dueDate}. günü</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold text-[#1a1c1a]">{exp.amount.toLocaleString()} ₺</div>
              <ArrowRight className="h-4 w-4 text-[#c4c6d2] opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
              {isSoon && (
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Yaklaşıyor!" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
