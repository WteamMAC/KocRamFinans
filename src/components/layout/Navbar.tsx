"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { userId, isLoaded } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-background/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-ambient-low transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 md:px-8 py-4">
        <Link className="flex items-center gap-2 group" href="/">
          <div className="p-1 group-hover:scale-110 transition-transform">
            <img src="/mascot.png" alt="Logo" className="h-14 w-14 object-contain" />
          </div>
          <span className="text-2xl font-heading font-bold text-primary tracking-tight">Koç Ram Finans</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold tracking-tight" href="/#hizmetler">Hizmetler</Link>
          <Link className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold tracking-tight" href="/hakkimizda">Hakkımızda</Link>
          <Link className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold tracking-tight" href="/#blog">Blog</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-all shadow-sm"
              aria-label="Tema Değiştir"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {!isLoaded ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-xl"></div>
          ) : !userId ? (
            <>
              <Link href="/sign-in" className="hidden md:block text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
                Giriş Yap
              </Link>
              <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all px-6 py-2.5 text-sm font-bold shadow-ambient-medium hover:shadow-ambient-high scale-100 active:scale-95">
                Koçluğa Başla
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all px-6 py-2.5 text-sm font-bold shadow-ambient-medium hover:shadow-ambient-high">
                Panele Git
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
