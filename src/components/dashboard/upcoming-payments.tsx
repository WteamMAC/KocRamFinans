import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UpcomingPaymentsProps {
  expenses: any[];
}

export function UpcomingPayments({ expenses }: UpcomingPaymentsProps) {
  // Bugünün gününü al (1-31)
  const today = new Date().getDate();
  
  // Gelecek ödemeleri filtrele ve sırala
  const sortedExpenses = [...expenses]
    .filter(exp => exp.dueDate)
    .sort((a, b) => {
      const dayA = a.dueDate > today ? a.dueDate : a.dueDate + 31;
      const dayB = b.dueDate > today ? b.dueDate : b.dueDate + 31;
      return dayA - dayB;
    });

  if (sortedExpenses.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">Henüz fatura/gider girişi yapılmamış.</p>;
  }

  return (
    <div className="space-y-4">
      {sortedExpenses.slice(0, 5).map((exp) => {
        const isSoon = exp.dueDate - today <= 5 && exp.dueDate >= today;
        return (
          <div key={exp.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{exp.type}</p>
              <p className="text-xs text-slate-500">Ayın {exp.dueDate}. günü</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-slate-900">{exp.amount.toLocaleString()} ₺</div>
              {isSoon && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Yaklaşıyor!" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
