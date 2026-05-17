"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { 
  BarChart3, Sun, Moon, ShieldAlert, FileText, Check, 
  AlertTriangle, Lock, X, Info, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function SlidingAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.includes("sign-in");
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Test Sistemi Aydınlatma Metni State'leri
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [showErrorAnim, setShowErrorAnim] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);


  const isTextCorrect = 
    confirmationText.trim().toUpperCase() === "ONAYLADIM" || 
    confirmationText.trim().toLocaleUpperCase("tr-TR") === "ONAYLADIM";

  const handleAccept = () => {
    if (isTextCorrect) {
      setIsTermsAccepted(true);
      setIsModalOpen(false);
      setConfirmationText("");
    } else {
      setShowErrorAnim(true);
      setTimeout(() => setShowErrorAnim(false), 500);
    }
  };

  const handleBoxClick = () => {
    if (!isTermsAccepted) {
      setIsModalOpen(true);
    } else {
      setIsTermsAccepted(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0 md:p-6 overflow-hidden relative">
      <main className="w-full h-screen md:h-[calc(100vh-48px)] max-h-[900px] flex max-w-[1200px] mx-auto bg-card md:rounded-[32px] md:shadow-ambient-high overflow-y-auto md:overflow-hidden relative">
        
        {/* Form Container */}
        <motion.div 
          className={`w-full lg:w-1/2 bg-card z-20 ${isLargeScreen ? "absolute inset-y-0 left-0 overflow-y-auto" : "relative"}`}
          animate={isLargeScreen ? { x: isLogin ? "100%" : "0%" } : { x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <div className="min-h-full w-full flex flex-col items-center justify-start lg:justify-center p-4 sm:p-8 md:p-12">
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
                  className="w-full max-w-md relative z-30 mx-auto"
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
                      }
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="signup"
                  initial={{ opacity: 0, x: isLargeScreen ? 30 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLargeScreen ? -30 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-md flex flex-col items-center mx-auto"
                >
                  {/* Şartlar ve Onay Kutusu Kartı */}
                  <div 
                    onClick={handleBoxClick}
                    className={`w-full p-4 mb-6 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-4 ${
                      isTermsAccepted 
                        ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/5 dark:border-emerald-500/20 hover:bg-emerald-500/15" 
                        : "bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/5 dark:border-amber-500/20 hover:bg-amber-500/15"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isTermsAccepted 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : "border-amber-500/60 bg-background text-transparent"
                    }`}>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Test Ortamı Sorumluluk Reddi</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isTermsAccepted 
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {isTermsAccepted ? "Onaylandı" : "Zorunlu"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5 leading-snug">
                        {isTermsAccepted 
                          ? "Kayıt işleminize devam edebilirsiniz." 
                          : "Kayıt formunu açmak için tıklayıp onaylayın."}
                      </span>
                    </div>
                    
                    {!isTermsAccepted && (
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Kayıt Formu Alanı */}
                  <div className="relative w-full">
                    {!isTermsAccepted && (
                      <div className="absolute inset-0 z-30 backdrop-blur-[8px] bg-background/85 dark:bg-background/85 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-border shadow-2xl transition-all duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-inner">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-foreground mb-2">Kayıt Formu Kilitli</h3>
                        <p className="text-xs text-muted-foreground mb-6 max-w-[280px] leading-relaxed">
                          Güvenliğiniz ve bilgilendirme amacıyla, devam etmeden önce test ortamı şartlarını onaylamanız gerekmektedir.
                        </p>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#f18d02] to-[#8C5000] text-white font-bold text-sm shadow-lg shadow-[#8C5000]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2.5"
                        >
                          <FileText className="w-4 h-4" />
                          Aydınlatma Metnini İncele
                        </button>
                      </div>
                    )}
                    
                    <div className={!isTermsAccepted ? "opacity-20 pointer-events-none select-none filter blur-[2px] transition-all duration-300" : "relative z-30 transition-all duration-300 w-full mx-auto"}>
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
                          }
                        }}
                      />
                    </div>
                  </div>
<<<<<<< HEAD
=======

>>>>>>> 0ad829e114a2b0c98ec41d8ed9f28e72895252c6
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

        {/* Modal / Popup for Terms & Disclaimer */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl bg-card rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="p-6 md:p-8 pb-6 border-b border-border bg-gradient-to-b from-[#f18d02]/10 to-transparent flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#f18d02]/20 border border-[#f18d02]/30 text-[#f18d02] flex items-center justify-center shrink-0 shadow-inner">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">TEST ORTAMI AYDINLATMA VE SORUMLULUK REDDİ METNİ</h2>
                      <p className="text-xs text-muted-foreground mt-1">ÖNEMLİ UYARI: Bu platform bir "Test Sistemi"dir.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm text-foreground/90 pr-2 md:pr-6">
                  {/* Giriş Uyarısı */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex gap-3 text-xs md:text-sm leading-relaxed">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-1">ÖNEMLİ UYARI:</span>
                      Bu platform henüz canlıya alınmamış, tamamen geliştirme ve test süreçlerinin yürütüldüğü bir <strong className="underline decoration-amber-500 font-bold">"Test Sistemi"dir</strong>. Sistem üzerinde işlem yaparken aşağıdaki hususları dikkate almanız ve onaylamanız gerekmektedir:
                    </div>
                  </div>

                  {/* Madde 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#f18d02] font-bold text-base">
                      <div className="w-6 h-6 rounded-lg bg-[#f18d02]/10 text-[#f18d02] flex items-center justify-center text-xs">1</div>
                      <h4>Gerçek Veri Kullanımı Yasaktır</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground text-xs md:text-sm leading-relaxed">
                      Bu sistem bir test ortamı olduğundan; gerçek ad-soyad, şifre, T.C. kimlik numarası, gerçek e-posta (Gmail, Outlook vb.) adresleri, telefon numaraları veya finansal bilgilerinizi sisteme kesinlikle girmeyiniz. Sistemdeki tüm denemelerinizi lütfen tamamen rastgele/sahte (mock) verilerle gerçekleştiriniz.
                    </div>
                  </div>

                  {/* Madde 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#f18d02] font-bold text-base">
                      <div className="w-6 h-6 rounded-lg bg-[#f18d02]/10 text-[#f18d02] flex items-center justify-center text-xs">2</div>
                      <h4>Veri Güvenliği ve Sorumsuzluk Beyanı</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3 text-xs md:text-sm leading-relaxed text-muted-foreground">
                      <p>
                        <strong className="text-foreground font-semibold block mb-0.5">• Güvenlik Garantisi Yoktur:</strong> Test ortamında canlı sistemlerdeki siber güvenlik önlemleri, şifreleme protokolleri ve sızma testleri tam olarak aktif olmayabilir. Sisteme girilen verilerin güvenliği hiçbir şekilde garanti edilmemektedir.
                      </p>
                      <p>
                        <strong className="text-foreground font-semibold block mb-0.5">• Sorumluluk Reddi:</strong> Bu uyarıya rağmen sisteme gerçek kişisel verilerini giren kullanıcıların, söz konusu verilerin üçüncü tarafların eline geçmesi, kaybolması veya ifşa olması durumunda doğabilecek hiçbir zarardan sistem yönetimi ve geliştiriciler sorumlu tutulamaz. Tüm sorumluluk kullanıcıya aittir.
                      </p>
                    </div>
                  </div>

                  {/* Madde 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#f18d02] font-bold text-base">
                      <div className="w-6 h-6 rounded-lg bg-[#f18d02]/10 text-[#f18d02] flex items-center justify-center text-xs">3</div>
                      <h4>Verilerin Saklanması ve Silinmesi</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground text-xs md:text-sm leading-relaxed">
                      Bu ortamdaki veritabanı düzenli aralıklarla, önceden haber verilmeksizin tamamen sıfırlanabilir, silinebilir veya değiştirilebilir. Sistemde veri saklama yükümlülüğü bulunmamaktadır.
                    </div>
                  </div>

                  {/* Madde 4 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#f18d02] font-bold text-base">
                      <div className="w-6 h-6 rounded-lg bg-[#f18d02]/10 text-[#f18d02] flex items-center justify-center text-xs">4</div>
                      <h4>Kabul Beyanı</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground text-xs md:text-sm leading-relaxed">
                      Sisteme giriş yaparak veya test işlemlerine devam ederek, bu platformun bir test ortamı olduğunu, gerçek kişisel verilerinizi paylaşmamanız gerektiğini anladığınızı ve aksine davrandığınızda doğacak tüm hukuki ve teknik sorumluluğu peşinen kabul etmiş sayılırsınız.
                    </div>
                  </div>
                </div>

                {/* Modal Footer & Confirmation Input */}
                <div className="p-6 md:p-8 border-t border-border bg-card/80 backdrop-blur-sm space-y-4 shrink-0">
                  <motion.div 
                    animate={showErrorAnim ? { x: [-10, 10, -10, 10, 0] } : {}} 
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-2xl bg-[#f18d02]/10 border border-[#f18d02]/30 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Info className="w-5 h-5 text-[#f18d02] shrink-0 hidden md:block" />
                      <span className="text-xs md:text-sm font-medium text-foreground text-left leading-snug">
                        Onaylamak için kutucuğa büyük harflerle <strong className="font-bold text-[#f18d02]">ONAYLADIM</strong> yazınız:
                      </span>
                    </div>
                    <div className="w-full sm:w-auto flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="ONAYLADIM"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className={`h-11 px-4 rounded-xl bg-background border text-sm font-bold text-center uppercase tracking-wider focus:outline-none focus:ring-2 transition-all w-full sm:w-44 ${
                          showErrorAnim 
                            ? "border-red-500 focus:ring-red-500/20 text-red-500" 
                            : isTextCorrect 
                              ? "border-emerald-500 text-emerald-500 focus:ring-emerald-500/20 bg-emerald-500/5" 
                              : "border-border focus:ring-[#f18d02]/20 text-foreground"
                        }`}
                      />
                    </div>
                  </motion.div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="h-12 px-6 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-sm transition-all"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={!isTextCorrect}
                      className={`h-12 px-8 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                        isTextCorrect 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white shadow-emerald-500/25 cursor-pointer transform hover:scale-[1.02]" 
                          : "bg-muted text-muted-foreground border border-border/50 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Şartları Kabul Ediyorum
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

