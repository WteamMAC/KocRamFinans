"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SlidingAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.includes("sign-in");
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const toggleAuth = () => {
    const newPath = isLogin ? "/sign-up" : "/sign-in";
    router.push(newPath);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <main className="w-full h-screen md:h-[calc(100vh-48px)] max-h-[900px] flex max-w-[1200px] mx-auto bg-white md:rounded-[32px] md:shadow-ambient-high overflow-hidden relative">
        
        {/* Form Container */}
        <motion.div 
          className="absolute inset-y-0 left-0 w-full lg:w-1/2 bg-white z-10 overflow-y-auto"
          animate={{ x: (isLargeScreen && isLogin) ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="min-h-full flex flex-col items-center justify-center p-8 md:p-12">
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="flex items-center gap-2 justify-center">
                <BarChart3 className="h-8 w-8 text-[#8c5000] fill-[#8c5000]" />
                <span className="text-2xl font-heading font-bold text-[#8c5000]">Koç Ram Finans</span>
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div 
                  key="signin"
                  initial={{ opacity: 0, x: isLargeScreen ? -20 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLargeScreen ? 20 : 0 }}
                  transition={{ duration: 0.3 }}
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
                        headerTitle: "text-3xl font-heading font-bold text-[#191c1d] mb-2",
                        headerSubtitle: "text-[#554336] font-medium mb-8",
                        socialButtonsBlockButton: "rounded-xl border-[#dbc2b0]/30 hover:bg-[#f8f9fa] h-12",
                        formButtonPrimary: "h-12 rounded-xl text-base font-bold",
                        formFieldInput: "h-12 rounded-xl",
                        footer: "hidden",
                      }
                    }}
                  />
                  <div className="mt-8 text-center">
                    <p className="text-[#554336] font-medium">
                      Henüz hesabınız yok mu?{" "}
                      <button 
                        onClick={toggleAuth}
                        className="text-[#8c5000] font-bold hover:underline"
                      >
                        Kayıt Ol
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="signup"
                  initial={{ opacity: 0, x: isLargeScreen ? 20 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLargeScreen ? -20 : 0 }}
                  transition={{ duration: 0.3 }}
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
                        headerTitle: "text-3xl font-heading font-bold text-[#191c1d] mb-2",
                        headerSubtitle: "text-[#554336] font-medium mb-8",
                        socialButtonsBlockButton: "rounded-xl border-[#dbc2b0]/30 hover:bg-[#f8f9fa] h-12",
                        formButtonPrimary: "h-12 rounded-xl text-base font-bold",
                        formFieldInput: "h-12 rounded-xl",
                        footer: "hidden",
                      }
                    }}
                  />
                  <div className="mt-8 text-center">
                    <p className="text-[#554336] font-medium">
                      Zaten hesabınız var mı?{" "}
                      <button 
                        onClick={toggleAuth}
                        className="text-[#8c5000] font-bold hover:underline"
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
          className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 bg-[#8c5000] z-20 items-center justify-center p-16 overflow-hidden shadow-2xl"
          animate={{ x: isLogin ? "-100%" : "0%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center text-white max-w-md">
            <motion.div
              animate={{ 
                rotate: isLogin ? [0, -5, 5, 0] : [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="mb-12"
            >
              <img 
                alt="Koç Ram Finans Mascot" 
                className="w-72 h-72 mx-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white rounded-full p-8 border-8 border-white/20" 
                src="https://lh3.googleusercontent.com/aida/ADBb0uii6ONYZ2VjCJ7Apc7e45lcMInjiFwwgPNuvJrgDZ_84hIkEoK9mIaLGXoWKEBg_Nz_7sQCF22UsVxuBMxDA-HWrUx6X21amjFZJ5TtQ4BucAnynbAZONheLmxUMXWyRXwqjn4jrEZNnJQpNZPc1l_SeGx4EqVG78rW3Xg_BVwU9A4ZqiEW6CYsO9v23tMJVjA8zj2AkBPxnip515vMVVfbxorMIIuhYaIXh67MMm2HByysQWipBKTuBHQxsBC7OZ4tiECjAH4Tshc" 
              />
            </motion.div>
            
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">Tekrar Hoş Geldiniz!</h1>
                  <p className="text-xl font-medium opacity-90 leading-relaxed italic">
                    "Finansal yolculuğunuza kaldığınız yerden devam edin. Biz her adımda yanınızdayız."
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">Geleceğinize Yatırım Yapın.</h1>
                  <p className="text-xl font-medium opacity-90 leading-relaxed italic">
                    "Koç Ram Finans ile finansal hedeflerinize ulaşmak artık çok daha kolay ve anlaşılır."
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 flex justify-center gap-4">
              <div className="w-3 h-3 rounded-full bg-white opacity-40"></div>
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <div className="w-3 h-3 rounded-full bg-white opacity-40"></div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
