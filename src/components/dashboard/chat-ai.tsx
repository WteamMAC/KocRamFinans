"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, X, MessageCircle, Sparkles, User, BarChart3, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string, role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); 
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedCooldown = localStorage.getItem("ai_cooldown_end");
    if (savedCooldown) {
      const remaining = Math.ceil((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) {
        startCooldown(remaining);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const appendMessage = (role: string, content: string) => {
    const newMsg = { id: Math.random().toString(36).substring(7), role, content };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const append = async (msg: { role: string, content: string }) => {
    if (!msg.content.trim()) return;

    appendMessage("user", msg.content);
    setIsLoading(true);
    setError(null);

    const currentMessages = [...messages, { id: Math.random().toString(), role: "user", content: msg.content }];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Sunucu hatası");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream oluşturulamadı");

      const decoder = new TextDecoder();
      const botMsgId = Math.random().toString(36).substring(7);

      setMessages((prev) => [...prev, { id: botMsgId, role: "model", content: "" }]);

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value, { stream: !done });
          setMessages((prev) => prev.map(m =>
            m.id === botMsgId ? { ...m, content: m.content + chunkValue } : m
          ));
        }
      }
    } catch (err: any) {
      console.error(">>> [DEBUG] FETCH_ERROR:", err);
      setError(err.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
      startCooldown(15); 
    }
  };

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const endTime = Date.now() + seconds * 1000;
    localStorage.setItem("ai_cooldown_end", endTime.toString());

    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          localStorage.removeItem("ai_cooldown_end");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleToolConfirm = async (name: string, args: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, args }),
      });
      if (!res.ok) throw new Error("İşlem başarısız oldu");

      append({ role: "user", content: `[SİSTEM BİLGİSİ]: ${name} işlemi kullanıcı tarafından onaylandı ve başarıyla veritabanına kaydedildi. Kullanıcıya işlemin tamamlandığını kısa bir mesajla bildir.` });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const toolCallRegex = /__TOOL_CALL__:(.*?)__END_TOOL_CALL__/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = toolCallRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
      }

      try {
        const toolData = JSON.parse(match[1]);
        parts.push(
          <div key={`tool-${match.index}`} className="mt-4 p-4 bg-white border border-[#fed65b]/30 rounded-2xl shadow-lg animate-in zoom-in-95">
            <p className="text-xs font-bold text-[#001b44] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fed65b] fill-[#fed65b]" /> {toolData.name === "addInvestment" ? "Yatırım Önerisi" : "İşlem Önerisi"}
            </p>
            <div className="text-[11px] bg-[#faf9f6] p-3 rounded-xl mb-4 text-[#434750] border border-[#c4c6d2]/10">
              {Object.entries(toolData.args).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-[#c4c6d2]/5 last:border-0">
                  <span className="font-bold opacity-60 uppercase tracking-tighter">{k}:</span> 
                  <span className="font-bold">{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleToolConfirm(toolData.name, toolData.args)} className="w-full text-xs h-9 bg-[#001b44] text-white hover:bg-[#002f6c] rounded-full shadow-md">
                Onayla ve Kaydet
              </Button>
            </div>
          </div>
        );
      } catch (e) {
        parts.push(<span key={`err-${match.index}`} className="text-red-500 text-xs">[Geçersiz İşlem]</span>);
      }

      lastIndex = toolCallRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msgContent = input;
    setInput("");
    append({ role: "user", content: msgContent });
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-16 w-16 rounded-full shadow-[0_20px_50px_rgba(0,27,68,0.3)] bg-[#001b44] hover:bg-[#002f6c] hover:scale-110 transition-all duration-300 relative group"
        >
          <BarChart3 className="h-8 w-8 text-[#fed65b] fill-[#fed65b] group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba1a1a] border-2 border-white rounded-full animate-bounce"></div>
        </Button>
      ) : (
        <Card className="w-[420px] h-[650px] shadow-[0_30px_60px_rgba(0,0,0,0.2)] flex flex-col border-none bg-white rounded-[32px] overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
          <CardHeader className="p-6 border-b border-[#c4c6d2]/20 bg-[#001b44] text-white flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/10 rounded-[14px]">
                <BarChart3 className="h-6 w-6 text-[#fed65b] fill-[#fed65b]" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading font-bold">Koç Ai</CardTitle>
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/60 flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  Aktif Danışman
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden bg-[#faf9f6]/30">
            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <p className="text-[11px] font-bold text-rose-600 flex-1">{error}</p>
                <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-6 w-6 rounded-full hover:bg-rose-100">
                  <X className="h-3 w-3 text-rose-500" />
                </Button>
              </div>
            )}
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-12 px-4 space-y-4">
                    <div className="bg-[#001b44]/5 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 rotate-3">
                      <Bot className="w-10 h-10 text-[#001b44]" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-[#001b44]">Merhaba! Ben Koç Ai.</h3>
                    <p className="text-sm text-[#434750] leading-relaxed">
                      Finansal hedeflerine ulaşman için buradayım. Harcamalarını analiz edebilir, yatırım tavsiyeleri verebilir veya bütçe planı yapabilirim.
                    </p>
                    <div className="flex flex-col gap-2 mt-8">
                      <Button variant="outline" className="justify-start h-auto py-3 px-4 rounded-xl border-[#c4c6d2]/30 hover:bg-white hover:border-[#fed65b] transition-all group" onClick={() => append({ role: "user", content: "Bütçemi analiz edebilir misin?" })}>
                        <div className="p-1.5 bg-[#f4f3f1] rounded-lg mr-3 group-hover:bg-[#fed65b]/20">
                           <BarChart3 className="w-4 h-4 text-[#001b44]" />
                        </div>
                        <span className="text-xs font-bold text-[#434750]">Bütçe Analizi İste</span>
                      </Button>
                      <Button variant="outline" className="justify-start h-auto py-3 px-4 rounded-xl border-[#c4c6d2]/30 hover:bg-white hover:border-[#fed65b] transition-all group" onClick={() => append({ role: "user", content: "Bu ayki yatırımlarımı nasıl optimize edebilirim?" })}>
                        <div className="p-1.5 bg-[#f4f3f1] rounded-lg mr-3 group-hover:bg-[#fed65b]/20">
                           <Sparkles className="w-4 h-4 text-[#001b44]" />
                        </div>
                        <span className="text-xs font-bold text-[#434750]">Yatırım Optimizasyonu</span>
                      </Button>
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[90%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${m.role === "user" ? "bg-[#fed65b]/20" : "bg-[#001b44]/10"}`}>
                        {m.role === "user" ? <User className="h-4 w-4 text-[#735c00]" /> : <BarChart3 className="h-4 w-4 text-[#001b44]" />}
                      </div>
                      <div className={`p-4 rounded-[20px] text-sm leading-relaxed shadow-sm ${m.role === "user"
                        ? "bg-[#001b44] text-white rounded-tr-none font-medium"
                        : "bg-white text-[#1a1c1a] border border-[#c4c6d2]/10 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                        }`}>
                        {renderMessageContent(m.content)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-[20px] rounded-tl-none border border-[#c4c6d2]/10 shadow-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#001b44]/40 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[#001b44]/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-[#001b44]/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-6 border-t border-[#c4c6d2]/20 bg-white">
            <form onSubmit={handleSubmit} className="flex w-full gap-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={cooldown > 0 ? `${cooldown}s Bekleyin...` : "Sorunuzu buraya yazın..."}
                  disabled={cooldown > 0 || isLoading}
                  className="bg-[#faf9f6] border-[#c4c6d2]/30 focus-visible:ring-[#001b44] h-12 rounded-2xl w-full pr-12 text-sm font-medium placeholder:text-[#747781]/50"
                />
                {cooldown > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-[10px] font-bold text-[#001b44]">{cooldown}s</span>
                  </div>
                )}
              </div>
              <Button type="submit" size="icon" disabled={isLoading || !input || cooldown > 0} className="h-12 w-12 rounded-2xl bg-[#001b44] hover:bg-[#002f6c] shadow-lg transition-all group">
                <Send className="h-5 w-5 text-[#fed65b] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
