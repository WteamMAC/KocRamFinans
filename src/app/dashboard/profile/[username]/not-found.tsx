'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Home, Compass, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileNotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-screen w-full flex flex-col items-center justify-center overflow-hidden p-4 md:p-8"
      style={{ background: "linear-gradient(180deg, #1f120c 0%, #0f0805 100%)" }}>
      
      {/* Wild West Dust Background Pattern */}
      <div className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffb874 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow behind container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8c5000]/25 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Wanted Bulletin Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl bg-[#fdf9f3] dark:bg-[#1a100b] border-4 border-[#8c5000] dark:border-[#d97706] rounded-[36px] shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center p-6 md:p-12 gap-8 md:gap-12 border-opacity-90"
        style={{ boxShadow: "0 30px 60px -15px rgba(140, 80, 0, 0.5)" }}
      >
        {/* Left: Cowboy Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-[340px] md:max-w-[380px] aspect-square rounded-3xl overflow-hidden border-4 border-[#8c5000]/40 shadow-2xl bg-[#f5edd8] group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none" />
            <Image
              src="/cowboy-404.png"
              alt="Kovboy Kayıp Kullanıcı İllüstrasyonu"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            {/* Wanted Stamp */}
            <div className="absolute top-5 right-5 z-20 bg-red-600 text-white font-black px-4 py-1.5 rounded-full text-xs md:text-sm tracking-widest uppercase shadow-xl transform rotate-12 border-2 border-white animate-pulse">
              WANTED / KAYIP
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8c5000]/10 dark:bg-[#ffb874]/10 border border-[#8c5000]/25 text-[#8c5000] dark:text-[#ffb874] text-xs font-black uppercase tracking-wider mb-4">
            <ShieldAlert className="w-4 h-4 text-red-500" /> Vahşi Batı Bildirisi
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-heading text-[#3a1d00] dark:text-[#fbf9f4] tracking-tight leading-none mb-4">
            Kullanıcı Diyarı Terk Etti!
          </h1>

          <p className="text-base md:text-lg font-bold text-[#887364] dark:text-[#dbc2b0] mb-6 leading-relaxed">
            Aradığınız yatırımcı ya atına atlayıp gün batımına doğru uzaklaştı, ya da şerifler (yöneticiler) kurallara uymadığı için onu hakladı! 🤠🏜️
          </p>

          <div className="bg-[#8c5000]/5 dark:bg-black/30 border border-[#8c5000]/20 rounded-2xl p-4 mb-8 w-full shadow-inner">
            <p className="text-xs md:text-sm font-semibold text-[#5a3100] dark:text-[#ffb874] flex items-center gap-2 justify-center lg:justify-start">
              <span className="text-lg">📌</span> <span><strong className="underline">Şerifin Notu:</strong> Bu kullanıcının hesabı silinmiş, banlanmış veya adı değişmiş olabilir.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:w-auto h-12 px-8 font-black rounded-2xl text-white flex items-center justify-center gap-2 text-base shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 bg-gradient-to-r from-[#d97706] to-[#8c5000] border-none"
              )}
            >
              <Home className="w-5 h-5" />
              <span>Kasabaya Dön</span>
            </Link>

            <Link
              href="/dashboard/blog"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full sm:w-auto h-12 px-8 font-black rounded-2xl flex items-center justify-center gap-2 text-base shadow-sm transition-all duration-300 hover:bg-[#8c5000]/10 border-2 border-[#8c5000]/30 text-[#8c5000] dark:text-[#ffb874]"
              )}
            >
              <Compass className="w-5 h-5" />
              <span>Topluluğu Keşfet</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
