'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#FEF6E4] text-[#8C5000] font-sans">
      
      {/* Floating Clouds Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -200, y: Math.random() * 400 }}
            animate={{ 
              x: i % 2 === 0 ? [ -200, 2000 ] : [ 2000, -200 ],
              y: [Math.random() * 400, Math.random() * 400 + 50, Math.random() * 400]
            }}
            transition={{ 
              duration: 40 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute opacity-40"
            style={{ 
              top: `${10 + i * 15}%`, 
              left: 0,
              filter: 'blur(2px)'
            }}
          >
            <svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M160 40C160 17.9086 142.091 0 120 0C106.636 0 94.819 6.55171 87.5879 16.6343C82.1643 12.4347 75.3676 10 68 10C51.4315 10 38 23.4315 38 40C38 41.3411 38.0883 42.6617 38.2587 43.955C16.4867 47.9625 0 67.0601 0 90C0 112.091 17.9086 130 40 130H160C182.091 130 200 112.091 200 90C200 67.9086 182.091 50 160 50V40Z" fill="#F18D02" fillOpacity="0.6"/>
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Decorative Ground Dunes */}
      <div className="absolute bottom-0 left-0 w-full h-[30vh] pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#F9EBD2" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,176C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute bottom-[-20px] left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#F1E0C6" fillOpacity="1" d="M0,256L60,240C120,224,240,192,360,192C480,192,600,224,720,218.7C840,213,960,171,1080,165.3C1200,160,1320,192,1380,208L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 10,
            delay: 0.2
          }}
          className="relative"
        >
          {/* Big 3D 404 Text */}
          <h1 className="text-[12rem] md:text-[18rem] font-black leading-none select-none
            text-[#F18D02] 
            [text-shadow:0_1px_0_#8C5000,0_2px_0_#8C5000,0_3px_0_#8C5000,0_4px_0_#8C5000,0_5px_0_#8C5000,0_6px_0_#8C5000,0_7px_0_#8C5000,0_8px_0_#8C5000,0_20px_30px_rgba(140,80,0,0.4)]"
          >
            404
          </h1>
          
          {/* Scattered Coins (broken/decorative) */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 text-[#FFD700]"
          >
            <Sparkles size={48} className="text-[#F18D02]" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-md"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#8C5000] to-[#F18D02] bg-clip-text text-transparent">
            Sayfa Bulunamadı
          </h2>
          <p className="text-[#8C5000]/70 text-lg mb-10 font-medium">
            Görünüşe göre mali yolculuğunuzda yanlış bir sapağa girdiniz. 
            Endişelenmeyin, sizi ana merkeze geri götürebiliriz.
          </p>

          <Link 
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-14 px-10 text-lg font-bold rounded-2xl shadow-[0_10px_25px_-5px_rgba(241,141,2,0.4)] hover:shadow-[0_15px_35px_-5px_rgba(241,141,2,0.6)] bg-[#F18D02] hover:bg-[#8C5000] text-white transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
            )}
          >
            <Home className="w-6 h-6" />
            Ana Menüye Dön
          </Link>
        </motion.div>
      </div>

      {/* Floating Broken Coin Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 1000 - 500, 
              y: Math.random() * 1000 - 500,
              opacity: 0,
              rotate: Math.random() * 360
            }}
            animate={{ 
              opacity: [0, 0.6, 0],
              y: [500, -500],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity,
              delay: Math.random() * 10
            }}
            className="absolute"
            style={{ 
              left: `${Math.random() * 100}%`,
              top: '100%'
            }}
          >
             <div className="w-8 h-8 rounded-full border-4 border-[#F18D02] opacity-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#F18D02] rotate-45" />
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
