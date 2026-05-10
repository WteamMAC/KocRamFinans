"use client";


import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, X, MessageCircle, Sparkles, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    }
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
          <div key={`tool-${match.index}`} className="mt-2 p-3 bg-white border border-primary/20 rounded-lg shadow-sm">
            <p className="text-[11px] font-bold text-primary mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> İşlem Önerisi: {toolData.name}
            </p>
            <div className="text-[10px] bg-slate-50 p-2 rounded mb-3 text-slate-600 border">
              {Object.entries(toolData.args).map(([k, v]) => (
                <div key={k}><span className="font-semibold">{k}:</span> {String(v)}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleToolConfirm(toolData.name, toolData.args)} className="w-full text-[10px] h-7 bg-primary text-white hover:bg-primary/90">
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
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-tr from-primary to-blue-600 hover:scale-110 transition-transform animate-pulse"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      ) : (
        <Card className="w-[400px] h-[600px] shadow-2xl flex flex-col border-none bg-white/95 backdrop-blur-xl animate-in slide-in-from-bottom-10 duration-300">
          <CardHeader className="p-4 border-b bg-gradient-to-r from-primary to-blue-600 text-white rounded-t-xl flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Finans Koç AI</CardTitle>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <Sparkles className="w-2 h-2" /> Çevrimiçi - Gemini 3.1
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Merhaba! Ben senin AI Finans Koçunum.</p>
                    <p className="text-xs text-slate-500">Bütçen, borçların veya yatırımların hakkında bana her şeyi sorabilirsin.</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      <Button variant="outline" size="sm" className="text-[10px]" onClick={() => append({ role: "user", content: "Bütçemi analiz eder misin?" })}>
                        Bütçemi analiz et
                      </Button>
                      <Button variant="outline" size="sm" className="text-[10px]" onClick={() => append({ role: "user", content: "Borçlarımı nasıl kapatırım?" })}>
                        Borç kapatma stratejisi
                      </Button>
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-slate-100" : "bg-primary/10"}`}>
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm ${
                        m.role === "user" 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-slate-100 text-slate-800 rounded-tl-none"
                      }`}>
                        {renderMessageContent(m.content)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none animate-pulse flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>
          
          {error && (
            <div className="px-4 py-2 mx-4 mb-2 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">Hata:</span> {error}
            </div>
          )}

          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Mesajınızı yazın..."
                className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input} className="shadow-lg">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
