"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-secondary dark:bg-surface-container-highest text-secondary-foreground dark:text-foreground w-full border-t border-border/5">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-6 mb-8 md:mb-0">
            <Link className="flex items-center gap-2 group" href="/">
              <div className="p-1 group-hover:scale-110 transition-transform">
                <img src="/mascot.png" alt="Logo" className="h-16 w-16 object-contain brightness-0 invert" />
              </div>
              <span className="text-3xl font-heading font-bold text-secondary-foreground dark:text-foreground tracking-tight">Koç Ram Finans</span>
            </Link>
            <p className="text-secondary-foreground/70 dark:text-foreground/70 font-medium text-center md:text-left max-w-sm">
              Geleceğinizi güvence altına almak için yanınızdayız. Profesyonel finansal koçluk ve stratejik planlama.
            </p>
          </div>
          
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-10 gap-y-4">
            <Link className="text-secondary-foreground/80 dark:text-foreground/80 hover:text-secondary-foreground dark:hover:text-foreground font-bold transition-colors uppercase tracking-widest text-xs" href="/hakkimizda">Hakkımızda</Link>
            <a className="text-secondary-foreground/80 dark:text-foreground/80 hover:text-secondary-foreground dark:hover:text-foreground font-bold transition-colors uppercase tracking-widest text-xs" href="#">Gizlilik</a>
            <a className="text-secondary-foreground/80 dark:text-foreground/80 hover:text-secondary-foreground dark:hover:text-foreground font-bold transition-colors uppercase tracking-widest text-xs" href="#">İletişim</a>
            <a className="text-secondary-foreground/80 dark:text-foreground/80 hover:text-secondary-foreground dark:hover:text-foreground font-bold transition-colors uppercase tracking-widest text-xs" href="#">SSS</a>
          </nav>
        </div>
        
        <div className="mt-16 pt-8 border-t border-secondary-foreground/10 dark:border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-secondary-foreground/40 dark:text-foreground/40 uppercase tracking-widest">
            © 2026 Koç Ram Finans. Tüm Hakları Saklıdır.
          </p>
          <div className="flex gap-6 opacity-40">
            <div className="w-5 h-5 bg-secondary-foreground dark:bg-foreground rounded-full"></div>
            <div className="w-5 h-5 bg-secondary-foreground dark:bg-foreground rounded-full"></div>
            <div className="w-5 h-5 bg-secondary-foreground dark:bg-foreground rounded-full"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
