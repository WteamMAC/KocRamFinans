
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  X,
  Bot,
  User,
  Minimize2,
  Maximize2,
  TrendingUp,
  Paperclip,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string; image?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("open-chat-ai", handleOpenChat);
    return () => {
      window.removeEventListener("open-chat-ai", handleOpenChat);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        setSelectedImage(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    }
  };

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechUnsupported(true);
      console.warn("Bu tarayıcı sesli komutu desteklemiyor.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? " " : "") + transcript);
      };
      recognition.onerror = (event: any) => {
        console.error("Ses tanıma hatası:", event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Ses tanıma başlatılamadı:", error);
      setIsListening(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: input, image: selectedImage || undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `API Hatası (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream desteklenmiyor");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentAssistantMessage = "";
      let done = false;

      const assistantMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Tamamlanmamış son satırı buffer'da beklet

          let chunkText = "";
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try { chunkText += JSON.parse(line.substring(2)); } catch (e: any) { /* Hatalı JSON'u yoksay */ }
            }
          }

          if (chunkText) {
            currentAssistantMessage += chunkText;
            setMessages(prev => prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: currentAssistantMessage } : msg));
          }
        }
      }

      // Eğer API hiçbir metin döndürmediyse (Boş yanıt)
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId && !msg.content.trim()
          ? { ...msg, content: "Yapay zeka bu isteğinize cevap üretemedi, lütfen farklı bir şekilde sorun." }
          : msg
      ));

    } catch (error: any) {
      console.error("Chat Hatası:", error);
      let displayError = "Bağlantı koptu, lütfen tekrar deneyin.";
      try {
        // Sunucudan gelen hata mesajı '{"error":"mesaj"}' formatında bir JSON string'i olabilir.
        const parsedError = JSON.parse(error.message);
        if (parsedError && parsedError.error) {
          displayError = parsedError.error;
        }
      } catch (e: any) {
        // Eğer parse edilemezse, düz bir metin hatasıdır.
        displayError = error.message || displayError;
      }

      setMessages(prev => prev.map(msg =>
        msg.role === "assistant" && msg.content === ""
          ? { ...msg, content: displayError }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Yeni mesaj geldiğinde pürüzsüz bir şekilde en alta kaydır
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999]">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="tour-step-2 w-14 h-14 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-full shadow-ambient-high flex items-center justify-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="h-7 w-7 animate-pulse" />
          </motion.button>
        ) : (
          <motion.div
            key="chat-window"
            initial={{ y: 20, opacity: 0, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className={cn(
              "bg-card/95 backdrop-blur-2xl border border-border/40 shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-[height,width] duration-300",
              isMinimized ? "h-20 w-[calc(100vw-2rem)] sm:w-80" : "h-[600px] max-h-[80vh] w-[calc(100vw-2rem)] sm:w-[400px] md:w-[450px]"
            )}
          >
            <CardHeader className={cn(
              "bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0 transition-all",
              isMinimized ? "p-4 h-20" : "p-6"
            )}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center shrink-0">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="overflow-hidden">
                  <CardTitle className="text-base sm:text-lg font-heading font-bold tracking-tight whitespace-nowrap truncate">Koç Ram Finans AI</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Çevrimiçi Asistan</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-primary-foreground" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-500 hover:text-white transition-all" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center mb-4">
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-bold text-primary mb-2">Nasıl yardımcı olabilirim?</h4>
                      <p className="text-xs text-muted-foreground opacity-60 max-w-[200px]">
                        Finansal durumunu analiz edebilir, harcama ekleyebilir veya piyasaları sorabilirsin.
                      </p>
                    </div>
                  )}
                  {messages.map((m: { id: string; role: "user" | "assistant"; content: string; image?: string }) => (
                    <div key={m.id} className={cn("flex gap-3", m.role === "assistant" ? "justify-start" : "justify-end animate-in fade-in slide-in-from-bottom-2 duration-300")}>
                      {m.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                        m.role === "assistant"
                          ? "bg-card border border-border/40 shadow-sm text-foreground rounded-tl-sm"
                          : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md rounded-tr-sm"
                      )}>
                        {m.image && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                            <img src={m.image} alt="Upload preview" className="max-w-full h-auto max-h-32 object-cover" />
                          </div>
                        )}
                        {m.content ? (
                          m.role === "assistant" ? (
                            <div className="prose-sm max-w-none [>p]:mb-2 [>p:last-child]:mb-0 [>ul]:list-disc [>ul]:pl-4 [>ul]:mb-2 [>li]:mb-1 [>strong]:text-primary [>strong]:font-bold [>ol]:list-decimal [>ol]:pl-4 dark:prose-invert">
                              <ReactMarkdown>
                                {m.content || ""}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            m.content
                          )
                        ) : (isLoading && m.role === "assistant" ? (
                          <div className="flex items-center gap-1.5 h-5 px-2">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                          </div>
                        ) : null)}
                      </div>
                      {m.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} className="h-1" />
                </div>

                <CardFooter className="p-4 bg-card/50 backdrop-blur-sm border-t border-border/20">
                  <div className="w-full flex flex-col gap-2">
                    {selectedImage && (
                      <div className="relative self-start inline-block">
                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-border/40 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <form
                      onSubmit={handleSubmit}
                      className="w-full flex items-center gap-2 bg-muted p-1.5 rounded-2xl border border-border/40 shadow-inner"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("h-10 w-10 shrink-0 rounded-xl transition-colors", 
                         speechUnsupported ? "text-muted-foreground/30 cursor-not-allowed" :
                         isListening ? "text-red-500 bg-red-500/10 animate-pulse shadow-sm" : "text-primary hover:bg-primary/10")}
                        onClick={toggleListening}
                        disabled={speechUnsupported}
                        title={speechUnsupported ? "Tarayıcınız sesli komutu desteklemiyor" : "Sesli komut"}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        onPaste={handlePaste}
                        placeholder="Sorunuzu buraya yazın veya görsel yapıştırın..."
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-3 shadow-none text-sm placeholder:text-muted-foreground/50"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl shadow-md transition-all disabled:opacity-50 disabled:hover:bg-primary"
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardFooter>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
