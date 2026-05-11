"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="h-full relative flex flex-col md:flex-row bg-[#faf9f6]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-[#c4c6d2]/30 sticky top-0 z-[100]">
        <Link className="flex items-center gap-2" href="/dashboard">
          <BarChart3 className="h-7 w-7 text-[#fed65b] fill-[#fed65b]" />
          <span className="text-xl font-heading font-bold text-[#001b44]">Koç Ai</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileOpen(true)}
          className="text-[#001b44]"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex h-full md:flex-col md:fixed md:inset-y-0 z-[80] bg-white transition-all duration-300 ease-in-out shadow-sm",
        isCollapsed ? "md:w-20" : "md:w-72"
      )}>
        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[110] md:hidden animate-in fade-in duration-300" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[120] w-72 bg-white md:hidden transition-transform duration-300 ease-in-out transform shadow-2xl",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
            <X className="h-6 w-6 text-[#001b44]" />
          </Button>
        </div>
        <Sidebar isCollapsed={false} onToggle={() => setIsMobileOpen(false)} hideToggle />
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        "md:pl-0", // Default pl
        !isCollapsed ? "md:ml-72" : "md:ml-20"
      )}>
        {children}
      </main>
    </div>
  );
}
