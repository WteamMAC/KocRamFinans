'use client';

import { useEffect } from 'react';
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCcw, AlertTriangle } from "lucide-react";

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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#FEF6E4] text-[#8C5000] font-sans">
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         {[...Array(5)].map((_, i) => (
           <motion.div
             key={i}
             animate={{ 
               y: [0, -20, 0],
               rotate: [0, 10, 0]
             }}
             transition={{ duration: 5 + i, repeat: Infinity }}
             className="absolute"
             style={{ top: `${20 * i}%`, left: `${15 * i}%` }}
           >
             <AlertTriangle size={100} />
           </motion.div>
         ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8"
        >
          <h1 className="text-[8rem] md:text-[12rem] font-black leading-none select-none
            text-[#F18D02] 
            [text-shadow:0_1px_0_#8C5000,0_2px_0_#8C5000,0_3px_0_#8C5000,0_4px_0_#8C5000,0_5px_0_#8C5000,0_20px_30px_rgba(140,80,0,0.4)]"
          >
            Hata
          </h1>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#8C5000] to-[#F18D02] bg-clip-text text-transparent">
            Bir Şeyler Yanlış Gitti
          </h2>
          <p className="text-[#8C5000]/70 text-lg mb-10 font-medium">
            Sistemsel bir sorun oluştu. Teknik ekibimiz (yani biz) üzerinde çalışıyoruz.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => reset()}
              className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl 
                bg-[#F18D02] hover:bg-[#8C5000] text-white transition-all flex items-center gap-3"
            >
              <RefreshCcw className="w-6 h-6" />
              Tekrar Dene
            </Button>
            
            <Button 
              asChild
              variant="outline"
              className="h-14 px-8 text-lg font-bold rounded-2xl border-2 border-[#F18D02] text-[#F18D02] hover:bg-[#F18D02]/10 transition-all flex items-center gap-3"
            >
              <Link href="/">
                <Home className="w-6 h-6" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
