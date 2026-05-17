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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background text-foreground transition-colors duration-500">
      {/* Top right theme button */}
      {mounted && (
        <div className="absolute top-6 right-6 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-12 h-12 rounded-full bg-card border border-border/20 shadow-md backdrop-blur-md hover:scale-105 transition-all text-foreground"
            aria-label="Tema Değiştir"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </Button>
        </div>
      )}

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
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
          <div className="relative rounded-3xl overflow-hidden border border-border/20 shadow-sm transition-all duration-500">
            <Image
              src={isDark ? "/fisherman-404-night.png" : "/fisherman-404.png"}
              alt="Balıkçı 404 illüstrasyonu"
              width={800}
              height={800}
              className="w-full h-auto object-cover rounded-3xl"
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
            className="font-black leading-tight mb-3 text-primary transition-colors duration-500"
            style={{
              fontSize: "clamp(40px, 6vw, 70px)",
            }}
          >
            404 Not Found
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl font-bold mb-2 text-foreground transition-colors duration-500"
          >
            Sayfayı Balıkladık!
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm md:text-base mb-8 max-w-xs leading-relaxed text-muted-foreground transition-colors duration-500"
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
                "h-12 px-8 font-bold rounded-full text-primary-foreground flex items-center gap-2.5 text-base transition-all duration-300 hover:opacity-90 active:scale-95 bg-primary"
              )}
            >
              <Home className="w-5 h-5 text-primary-foreground" />
              <span>Ana Menüye Dön</span>
            </Link>
          </motion.div>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-8 opacity-25">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-full bg-primary"
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
