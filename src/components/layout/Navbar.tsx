"use client";

import React from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const { userId, isLoaded } = useAuth();

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#dbc2b0]/30 shadow-ambient-low transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 md:px-8 py-4">
        <Link className="flex items-center gap-2 group" href="/">
          <div className="p-1 group-hover:scale-110 transition-transform">
            <img src="/mascot.png" alt="Logo" className="h-14 w-14 object-contain" />
          </div>
          <span className="text-2xl font-heading font-bold text-[#8c5000] tracking-tight">Koç Ram Finans</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link className="text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-semibold tracking-tight" href="/#hizmetler">Hizmetler</Link>
          <Link className="text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-semibold tracking-tight" href="/hakkimizda">Hakkımızda</Link>
          <Link className="text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-semibold tracking-tight" href="/#blog">Blog</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : !userId ? (
            <>
              <Link href="/sign-in" className="hidden md:block text-[#554336] hover:text-[#8c5000] transition-colors text-sm font-bold">
                Giriş Yap
              </Link>
              <Link href="/sign-up" className="bg-[#8c5000] text-white hover:bg-[#6e3f00] rounded-xl transition-all px-6 py-2.5 text-sm font-bold shadow-ambient-medium hover:shadow-ambient-high scale-100 active:scale-95">
                Koçluğa Başla
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <button className="bg-[#8c5000] text-white hover:bg-[#6e3f00] rounded-xl transition-all px-6 py-2.5 text-sm font-bold shadow-ambient-medium hover:shadow-ambient-high">
                Panele Git
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
