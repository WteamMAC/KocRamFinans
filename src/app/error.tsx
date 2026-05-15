'use client';

import { useEffect } from 'react';
import { motion } from "framer-motion";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Home, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F18D02 0%, #e67e00 40%, #f5a623 100%)" }}
    >
      {/* Sky Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-4 left-[-60px] opacity-80" width="340" height="180" viewBox="0 0 340 180" fill="none">
          <ellipse cx="140" cy="110" rx="140" ry="70" fill="#F9A825" fillOpacity="0.7"/>
          <ellipse cx="230" cy="90" rx="110" ry="60" fill="#F9A825" fillOpacity="0.6"/>
        </svg>
        <svg className="absolute top-2 right-[-40px] opacity-80" width="300" height="160" viewBox="0 0 300 160" fill="none">
          <ellipse cx="160" cy="100" rx="130" ry="65" fill="#F9A825" fillOpacity="0.7"/>
          <ellipse cx="80" cy="80" rx="90" ry="55" fill="#FFB74D" fillOpacity="0.6"/>
        </svg>
      </div>

      {/* Ground / Dunes */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 380" preserveAspectRatio="none">
          <path d="M0,180 C200,80 400,260 720,160 C1040,60 1280,200 1440,140 L1440,380 L0,380 Z" fill="#F5DEB3" fillOpacity="0.5"/>
        </svg>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 340" preserveAspectRatio="none">
          <path d="M0,220 C300,120 500,280 780,180 C1060,80 1300,240 1440,170 L1440,340 L0,340 Z" fill="#FAEBD7" fillOpacity="0.8"/>
        </svg>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 300" preserveAspectRatio="none">
          <path d="M0,260 C250,160 500,300 760,220 C1020,140 1250,280 1440,210 L1440,300 L0,300 Z" fill="#FFF8F0"/>
        </svg>

        {/* Scattered Coins */}
        <svg className="absolute bottom-[160px] left-[44%]" width="100" height="32" viewBox="0 0 100 32">
          <ellipse cx="50" cy="16" rx="50" ry="16" fill="#D4A017" opacity="0.9"/>
          <ellipse cx="50" cy="14" rx="46" ry="13" fill="#F0C040"/>
          <text x="50" y="19" textAnchor="middle" fontSize="12" fill="#C8940D" fontWeight="bold">!</text>
          <line x1="35" y1="8" x2="60" y2="24" stroke="#C8940D" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full" style={{marginTop: '-60px'}}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md mb-1">
            Oops! Bir hata oluştu.
          </h2>
          <p className="text-white/80 text-base md:text-lg font-medium">
            Sistemsel bir pürüz çıktı, hemen toparlıyoruz!
          </p>
        </motion.div>

        {/* Error Title */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.1 }}
          className="relative"
        >
          <h1
            className="font-black select-none leading-none"
            style={{
              fontSize: "clamp(100px, 15vw, 180px)",
              color: "#E8780A",
              textShadow: `
                0 2px 0 #C5620A,
                0 4px 0 #A85208,
                0 6px 0 #8C4207,
                0 30px 40px rgba(100,40,0,0.35)
              `,
            }}
          >
            HATA
          </h1>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={() => reset()}
            className="h-12 px-8 font-bold rounded-full text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Tekrar Dene
          </Button>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 px-10 font-bold rounded-full text-white shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2"
            )}
            style={{
              background: "linear-gradient(135deg, #F18D02, #E07000)",
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
