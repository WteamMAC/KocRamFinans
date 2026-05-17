'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants, Button } from "@/components/ui/button";
import { Home, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export default function NotFound() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#F5EDD8] dark:bg-[#120d0a] transition-colors duration-500 text-[#5a3100] dark:text-[#ffb874]">
      
      {/* Top right theme button */}
      {mounted && (
        <div className="absolute top-6 right-6 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-12 h-12 rounded-full bg-white/50 dark:bg-black/40 border border-[#8c5000]/20 dark:border-[#ffb874]/20 shadow-md backdrop-blur-md hover:scale-105 transition-all text-[#5a3100] dark:text-[#ffb874]"
            aria-label="Tema Değiştir"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </Button>
        </div>
      )}

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 py-8">

        {/* Left: Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full md:w-[50%] flex-shrink-0"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-[0_0_50px_rgba(255,184,116,0.15)] dark:border dark:border-[#ffb874]/20 transition-all duration-500 bg-[#F5EDD8] dark:bg-[#120d0a]">
            <Image
              src={isDark ? "/fisherman-404-night.png" : "/fisherman-404.png"}
              alt="Balıkçı 404 illüstrasyonu"
              width={800}
              height={800}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Right: Text + Button */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="flex flex-col items-start text-left"
        >
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-black leading-none mb-3 text-[#5a3100] dark:text-[#ffb874] transition-colors duration-500"
            style={{
              fontSize: "clamp(80px, 12vw, 130px)",
              textShadow: "0 8px 20px rgba(140,80,0,0.2)",
            }}
          >
            404
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl font-bold mb-2 text-[#5a3100] dark:text-[#fbf9f4] transition-colors duration-500"
          >
            Sayfayı Balıkladık!
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm md:text-base mb-8 max-w-xs leading-relaxed text-[#887364] dark:text-[#dbc2b0]/80 transition-colors duration-500"
          >
            Aradığınız sayfa finansal derinliklerde kaybolmuş. Sizi güvenli sulara geri alalım.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 px-8 font-bold rounded-full text-white flex items-center gap-2.5 text-base shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
              )}
              style={{
                background: "linear-gradient(135deg, #f18d02 0%, #8c5000 100%)",
                border: "none",
                boxShadow: "0 6px 20px rgba(140,80,0,0.35)",
              }}
            >
              <Home className="w-5 h-5 text-white" />
              <span className="text-white">Ana Menüye Dön</span>
            </Link>
          </motion.div>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-8 opacity-25 dark:opacity-40">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-full bg-[#8C5000] dark:bg-[#ffb874]"
                style={{
                  width: i === 2 ? 10 : 6,
                  height: i === 2 ? 10 : 6,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
