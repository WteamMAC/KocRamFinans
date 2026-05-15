'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F18D02 0%, #e67e00 40%, #f5a623 100%)" }}
    >
      {/* Sky Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large cloud left */}
        <svg className="absolute top-4 left-[-60px] opacity-80" width="340" height="180" viewBox="0 0 340 180" fill="none">
          <ellipse cx="140" cy="110" rx="140" ry="70" fill="#F9A825" fillOpacity="0.7"/>
          <ellipse cx="230" cy="90" rx="110" ry="60" fill="#F9A825" fillOpacity="0.6"/>
          <ellipse cx="80" cy="120" rx="80" ry="50" fill="#FFB74D" fillOpacity="0.5"/>
          <ellipse cx="300" cy="120" rx="60" ry="40" fill="#F9A825" fillOpacity="0.5"/>
        </svg>
        {/* Large cloud right */}
        <svg className="absolute top-2 right-[-40px] opacity-80" width="300" height="160" viewBox="0 0 300 160" fill="none">
          <ellipse cx="160" cy="100" rx="130" ry="65" fill="#F9A825" fillOpacity="0.7"/>
          <ellipse cx="80" cy="80" rx="90" ry="55" fill="#FFB74D" fillOpacity="0.6"/>
          <ellipse cx="240" cy="110" rx="70" ry="45" fill="#F9A825" fillOpacity="0.5"/>
        </svg>
        {/* Small cloud center-left */}
        <svg className="absolute top-16 left-[20%] opacity-60" width="180" height="100" viewBox="0 0 180 100" fill="none">
          <ellipse cx="90" cy="60" rx="90" ry="45" fill="#FFB74D" fillOpacity="0.6"/>
          <ellipse cx="50" cy="50" rx="60" ry="35" fill="#F9A825" fillOpacity="0.5"/>
          <ellipse cx="140" cy="55" rx="50" ry="30" fill="#FFB74D" fillOpacity="0.4"/>
        </svg>
        {/* Small cloud center-right */}
        <svg className="absolute top-8 right-[22%] opacity-60" width="160" height="90" viewBox="0 0 160 90" fill="none">
          <ellipse cx="80" cy="55" rx="80" ry="40" fill="#FFB74D" fillOpacity="0.6"/>
          <ellipse cx="40" cy="45" rx="50" ry="30" fill="#F9A825" fillOpacity="0.5"/>
          <ellipse cx="130" cy="50" rx="40" ry="25" fill="#FFB74D" fillOpacity="0.4"/>
        </svg>
      </div>

      {/* Ground / Dunes */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none">
        {/* Back dune */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 380" preserveAspectRatio="none">
          <path d="M0,180 C200,80 400,260 720,160 C1040,60 1280,200 1440,140 L1440,380 L0,380 Z" fill="#F5DEB3" fillOpacity="0.5"/>
        </svg>
        {/* Middle dune */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 340" preserveAspectRatio="none">
          <path d="M0,220 C300,120 500,280 780,180 C1060,80 1300,240 1440,170 L1440,340 L0,340 Z" fill="#FAEBD7" fillOpacity="0.8"/>
        </svg>
        {/* Front dune */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 300" preserveAspectRatio="none">
          <path d="M0,260 C250,160 500,300 760,220 C1020,140 1250,280 1440,210 L1440,300 L0,300 Z" fill="#FFF8F0"/>
        </svg>

        {/* Small plants */}
        {/* Left plants */}
        <svg className="absolute bottom-[110px] left-[6%]" width="60" height="80" viewBox="0 0 60 80">
          <rect x="28" y="30" width="4" height="50" fill="#D4851A" rx="2"/>
          <ellipse cx="30" cy="28" rx="14" ry="20" fill="#E8960F" opacity="0.85"/>
          <ellipse cx="18" cy="38" rx="10" ry="16" fill="#D4851A" opacity="0.7"/>
          <ellipse cx="42" cy="40" rx="9" ry="14" fill="#D4851A" opacity="0.7"/>
        </svg>
        <svg className="absolute bottom-[90px] left-[12%]" width="40" height="55" viewBox="0 0 40 55">
          <rect x="18" y="20" width="3" height="35" fill="#C97A10" rx="1.5"/>
          <ellipse cx="20" cy="18" rx="10" ry="14" fill="#D4851A" opacity="0.8"/>
          <ellipse cx="12" cy="26" rx="7" ry="11" fill="#C97A10" opacity="0.65"/>
        </svg>
        <svg className="absolute bottom-[100px] left-[19%]" width="50" height="65" viewBox="0 0 50 65">
          <rect x="23" y="25" width="4" height="40" fill="#D4851A" rx="2"/>
          <ellipse cx="25" cy="23" rx="12" ry="17" fill="#E8960F" opacity="0.8"/>
        </svg>

        {/* Right plants */}
        <svg className="absolute bottom-[105px] right-[5%]" width="65" height="85" viewBox="0 0 65 85">
          <rect x="30" y="32" width="4" height="53" fill="#D4851A" rx="2"/>
          <ellipse cx="32" cy="30" rx="15" ry="22" fill="#E8960F" opacity="0.85"/>
          <ellipse cx="20" cy="42" rx="11" ry="17" fill="#D4851A" opacity="0.7"/>
          <ellipse cx="44" cy="44" rx="10" ry="15" fill="#D4851A" opacity="0.7"/>
        </svg>
        <svg className="absolute bottom-[85px] right-[13%]" width="45" height="60" viewBox="0 0 45 60">
          <rect x="21" y="22" width="3" height="38" fill="#C97A10" rx="1.5"/>
          <ellipse cx="22" cy="20" rx="11" ry="15" fill="#D4851A" opacity="0.8"/>
        </svg>
        <svg className="absolute bottom-[100px] right-[21%]" width="50" height="68" viewBox="0 0 50 68">
          <rect x="23" y="26" width="4" height="42" fill="#D4851A" rx="2"/>
          <ellipse cx="25" cy="24" rx="13" ry="18" fill="#E8960F" opacity="0.8"/>
          <ellipse cx="15" cy="34" rx="9" ry="13" fill="#C97A10" opacity="0.65"/>
        </svg>

        {/* Scattered Coins */}
        {/* Cracked coin center */}
        <svg className="absolute bottom-[160px] left-[44%]" width="100" height="32" viewBox="0 0 100 32">
          <ellipse cx="50" cy="16" rx="50" ry="16" fill="#D4A017" opacity="0.9"/>
          <ellipse cx="50" cy="14" rx="46" ry="13" fill="#F0C040"/>
          <text x="50" y="19" textAnchor="middle" fontSize="12" fill="#C8940D" fontWeight="bold">$</text>
          <line x1="35" y1="8" x2="60" y2="24" stroke="#C8940D" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="55" y1="6" x2="45" y2="22" stroke="#C8940D" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        {/* Small coin left */}
        <svg className="absolute bottom-[148px] left-[30%]" width="50" height="16" viewBox="0 0 50 16">
          <ellipse cx="25" cy="8" rx="25" ry="8" fill="#D4A017" opacity="0.75"/>
          <ellipse cx="25" cy="7" rx="22" ry="6.5" fill="#F0C040" opacity="0.85"/>
        </svg>
        {/* Small coin right */}
        <svg className="absolute bottom-[142px] right-[28%]" width="45" height="14" viewBox="0 0 45 14">
          <ellipse cx="22" cy="7" rx="22" ry="7" fill="#D4A017" opacity="0.7"/>
          <ellipse cx="22" cy="6" rx="19" ry="5.5" fill="#F0C040" opacity="0.8"/>
        </svg>
        {/* Tiny fragments */}
        <svg className="absolute bottom-[152px] left-[38%]" width="20" height="12" viewBox="0 0 20 12">
          <ellipse cx="10" cy="6" rx="10" ry="6" fill="#E8B820" opacity="0.65"/>
        </svg>
        <svg className="absolute bottom-[155px] right-[35%]" width="16" height="10" viewBox="0 0 16 10">
          <ellipse cx="8" cy="5" rx="8" ry="5" fill="#D4A017" opacity="0.6"/>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full" style={{marginTop: '-60px'}}>
        {/* Top Text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md mb-1">
            Oops! Bir hata oldu sanırım.
          </h2>
          <p className="text-white/80 text-base md:text-lg font-medium">
            Aradığınız site finansal radarımızdan kaçmış!
          </p>
        </motion.div>

        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.15 }}
          className="relative"
        >
          <h1
            className="font-black select-none leading-none"
            style={{
              fontSize: "clamp(130px, 20vw, 220px)",
              color: "#E8780A",
              textShadow: `
                0 2px 0 #C5620A,
                0 4px 0 #A85208,
                0 6px 0 #8C4207,
                0 8px 0 #703205,
                0 10px 0 #582804,
                0 30px 40px rgba(100,40,0,0.35)
              `,
            }}
          >
            404
          </h1>
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 mb-8"
        >
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-13 px-10 py-3.5 text-base font-bold rounded-full text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95 flex items-center gap-2.5"
            )}
            style={{
              background: "linear-gradient(135deg, #F18D02, #E07000)",
              boxShadow: "0 8px 24px rgba(180,80,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "none",
            }}
          >
            <Home className="w-5 h-5" />
            Ana Menüye Dön
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
