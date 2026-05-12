
"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Sparkles, 
  X, 
  Bot, 
  User, 
  Loader2, 
  Minimize2, 
  Maximize2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onError: (error: any) => {
      console.error("Chat Error Details:", error);
    }
  } as any) as any;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-[#8c5000] text-white rounded-full shadow-ambient-high flex items-center justify-center hover:scale-110 transition-transform group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="h-7 w-7 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className={cn(
              "bg-white/80 backdrop-blur-2xl border border-[#dbc2b0]/30 shadow-ambient-high rounded-[32px] overflow-hidden flex flex-col transition-all duration-300",
              isMinimized ? "h-20 w-72" : "h-[600px] w-[400px] md:w-[450px]"
            )}
          >
            <CardHeader className="p-6 bg-[#8c5000] text-white flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading font-bold tracking-tight">Koç Ram Finans AI</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Çevrimiçi Asistan</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white" onClick={() => setIsMinimized(!isMinimized)}>
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                  <div className="space-y-6">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[#8c5000]/5 rounded-3xl flex items-center justify-center mb-4">
                          <TrendingUp className="h-8 w-8 text-[#8c5000]" />
                        </div>
                        <h4 className="font-bold text-[#8c5000] mb-2">Nasıl yardımcı olabilirim?</h4>
                        <p className="text-xs text-[#554336] opacity-60 max-w-[200px]">
                          Finansal durumunu analiz edebilir, harcama ekleyebilir veya piyasaları sorabilirsin.
                        </p>
                      </div>
                    )}
                    {messages.map((m: any) => (
                      <div key={m.id} className={cn("flex gap-3", m.role === "assistant" ? "justify-start" : "justify-end")}>
                        {m.role === "assistant" && (
                          <div className="w-8 h-8 rounded-lg bg-[#8c5000]/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-[#8c5000]" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                          m.role === "assistant" 
                            ? "bg-[#f8f9fa] text-[#191c1d] rounded-tl-none border border-[#dbc2b0]/20 shadow-sm" 
                            : "bg-[#8c5000] text-white rounded-tr-none shadow-ambient-medium"
                        )}>
                          {m.content}
                          {m.toolInvocations?.map((toolInvocation: any) => {
                            const { toolName, toolCallId, state } = toolInvocation;
                            if (state === 'result') {
                              return null; // Tool sonuçlarını direkt göstermiyoruz, asistanın yorumlamasını bekliyoruz
                            } else {
                              return (
                                <div key={toolCallId} className="flex items-center gap-2 mt-2 text-[10px] font-bold text-[#8c5000] animate-pulse">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {toolName === 'getFinancialHistory' ? 'Veriler Sorgulanıyor...' : 'İşlem Kaydediliyor...'}
                                </div>
                              );
                            }
                          })}
                        </div>
                        {m.role === "user" && (
                          <div className="w-8 h-8 rounded-lg bg-[#8c5000] flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <CardFooter className="p-6 pt-0">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit(e);
                    }} 
                    className="w-full flex gap-3 relative"
                  >
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Sorunuzu buraya yazın..."
                      className="bg-[#f8f9fa] border-[#dbc2b0]/30 h-14 rounded-2xl pr-14 focus:ring-[#8c5000] placeholder:text-[#554336]/40"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="absolute right-2 top-2 h-10 w-10 bg-[#8c5000] hover:bg-[#6e3f00] text-white rounded-xl shadow-ambient-medium active:scale-95 transition-all"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
