/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTheme } from "next-themes";
import { ChatAI } from "@/components/dashboard/chat-ai";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="h-full relative flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-4 bg-card border-b border-border/30 sticky top-0 z-[100] shadow-ambient-low">
        <Link className="flex items-center gap-2" href="/dashboard">
          <img src="/mascot.png" alt="Logo" className="h-12 w-12 object-contain" />
          <span className="text-xl font-heading font-bold text-primary">Koç Ram Finans</span>
        </Link>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="text-primary"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex h-full md:flex-col md:fixed md:inset-y-0 z-[80] bg-card transition-all duration-300 ease-in-out shadow-ambient-low",
        isCollapsed ? "md:w-20" : "md:w-72"
      )}>
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          theme={theme as "light" | "dark"}
          onToggleTheme={toggleTheme}
        />
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
        "fixed inset-y-0 left-0 z-[120] w-72 bg-card md:hidden transition-transform duration-300 ease-in-out transform shadow-ambient-high",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
            <X className="h-6 w-6 text-primary" />
          </Button>
        </div>
        <Sidebar
          isCollapsed={false}
          onToggle={() => setIsMobileOpen(false)}
          hideToggle
          theme={theme as "light" | "dark"}
          onToggleTheme={toggleTheme}
        />
      </div>

      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        "md:pl-0", // Default pl
        !isCollapsed ? "md:ml-72" : "md:ml-20"
      )}>
        {children}
      </main>
      <ChatAI />
      <OnboardingTour />
    </div>
  );
}
