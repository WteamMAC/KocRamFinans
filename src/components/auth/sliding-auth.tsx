"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function SlidingAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.includes("sign-in");
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    setMounted(true);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const toggleAuth = () => {
    const newPath = isLogin ? "/sign-up" : "/sign-in";
    router.push(newPath);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0 md:p-6 overflow-hidden relative">
      {mounted && (
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 z-50 p-3 rounded-xl bg-background/80 backdrop-blur-md border border-border text-foreground hover:bg-muted transition-all shadow-sm"
          aria-label="Tema Değiştir"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      )}
      <main className="w-full h-screen md:h-[calc(100vh-48px)] max-h-[900px] flex max-w-[1200px] mx-auto bg-card md:rounded-[32px] md:shadow-ambient-high overflow-hidden relative">
        
        {/* Form Container */}
        <motion.div 
          className="absolute inset-y-0 left-0 w-full lg:w-1/2 bg-card z-10 overflow-y-auto"
          animate={{ x: (isLargeScreen && isLogin) ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <div className="min-h-full flex flex-col items-center justify-center p-8 md:p-12">
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="flex items-center gap-2 justify-center">
                <img src="/mascot.png" alt="Logo" className="h-14 w-14 object-contain" />
                <span className="text-3xl font-heading font-bold text-primary">Koç Ram Finans</span>
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div 
                  key="signin"
                  initial={{ opacity: 0, x: isLargeScreen ? -30 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLargeScreen ? 30 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-md"
                >
                  <SignIn 
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-none p-0 w-full bg-transparent",
                        headerTitle: "text-3xl font-heading font-bold text-foreground mb-2",
                        headerSubtitle: "text-muted-foreground font-medium mb-8",
                        socialButtonsBlockButton: "rounded-xl border-border/30 hover:bg-muted h-12 text-foreground",
                        formButtonPrimary: "h-12 rounded-xl text-base font-bold bg-gradient-to-r from-[#f18d02] to-[#8C5000] hover:brightness-110 active:scale-95 transition-all text-white shadow-lg shadow-[#8C5000]/20 disabled:opacity-70 disabled:brightness-90",
                        formFieldInput: "h-12 rounded-xl bg-background border-border text-foreground focus:ring-2 focus:ring-[#f18d02]/20",
                        formFieldLabel: "text-foreground",
                        footer: "hidden",
                      }
                    }}
                  />
                  <div className="mt-8 text-center">
                    <p className="text-muted-foreground font-medium">
                      Henüz hesabınız yok mu?{" "}
                      <button 
                        onClick={toggleAuth}
                        className="text-primary font-bold hover:underline"
                      >
                        Kayıt Ol
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="signup"
                  initial={{ opacity: 0, x: isLargeScreen ? 30 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLargeScreen ? -30 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-md"
                >
                  <SignUp 
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-none p-0 w-full bg-transparent",
                        headerTitle: "text-3xl font-heading font-bold text-foreground mb-2",
                        headerSubtitle: "text-muted-foreground font-medium mb-8",
                        socialButtonsBlockButton: "rounded-xl border-border/30 hover:bg-muted h-12 text-foreground",
                        formButtonPrimary: "h-12 rounded-xl text-base font-bold bg-gradient-to-r from-[#f18d02] to-[#8C5000] hover:brightness-110 active:scale-95 transition-all text-white shadow-lg shadow-[#8C5000]/20 disabled:opacity-70 disabled:brightness-90",
                        formFieldInput: "h-12 rounded-xl bg-background border-border text-foreground focus:ring-2 focus:ring-[#f18d02]/20",
                        formFieldLabel: "text-foreground",
                        footer: "hidden",
                      }
                    }}
                  />
                  <div className="mt-8 text-center">
                    <p className="text-muted-foreground font-medium">
                      Zaten hesabınız var mı?{" "}
                      <button 
                        onClick={toggleAuth}
                        className="text-primary font-bold hover:underline"
                      >
                        Giriş Yap
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Overlay Panel (Mascot Side) */}
        <motion.div 
          className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 bg-primary dark:bg-primary-foreground z-20 items-center justify-center p-12 overflow-hidden shadow-2xl"
          animate={{ x: isLogin ? "-100%" : "0%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-foreground/10 dark:bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center text-primary-foreground dark:text-primary max-w-xl flex flex-col items-center">
            <motion.div
              animate={{ 
                rotate: isLogin ? [0, -3, 3, 0] : [0, 3, -3, 0],
                scale: [1, 1.03, 1]
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="mb-10"
            >
              <div className="relative w-[360px] h-[360px] mx-auto">
                <div className="absolute inset-0 bg-primary-foreground/10 dark:bg-primary/10 rounded-full blur-2xl transform scale-110"></div>
                <div className="w-full h-full bg-card rounded-full border-[12px] border-primary-foreground/20 dark:border-primary/20 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative z-10 flex items-center justify-center overflow-hidden">
                  <img 
                    alt="Koç Ram Finans Mascot" 
                    className="w-full h-full object-contain drop-shadow-xl transform scale-[1.8]" 
                    src="/mascot.png" 
                  />
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login-text"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="px-4"
                >
                  <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">Tekrar Hoş Geldiniz!</h1>
                  <p className="text-2xl font-medium opacity-95 leading-relaxed italic max-w-lg mx-auto">
                    "Finansal yolculuğunuza kaldığınız yerden devam edin. Biz her adımda yanınızdayız."
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-text"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="px-4"
                >
                  <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">Geleceğinize Yatırım Yapın.</h1>
                  <p className="text-2xl font-medium opacity-95 leading-relaxed italic max-w-lg mx-auto">
                    "Koç Ram Finans ile finansal hedeflerinize ulaşmak artık çok daha kolay ve anlaşılır."
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 flex justify-center gap-4">
              <motion.div 
                animate={{ scale: isLogin ? 1.2 : 1, opacity: isLogin ? 1 : 0.4 }}
                className="w-3 h-3 rounded-full bg-primary-foreground dark:bg-primary"
              ></motion.div>
              <motion.div 
                animate={{ scale: !isLogin ? 1.2 : 1, opacity: !isLogin ? 1 : 0.4 }}
                className="w-3 h-3 rounded-full bg-primary-foreground dark:bg-primary"
              ></motion.div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
