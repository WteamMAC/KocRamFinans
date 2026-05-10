"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, X, MessageCircle, Sparkles, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
                  <Sparkles className="w-2 h-2" /> Çevrimiçi - Gemini 1.5
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full pr-4" viewportRef={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Merhaba! Ben senin AI Finans Koçunum.</p>
                    <p className="text-xs text-slate-500">Bütçen, borçların veya yatırımların hakkında bana her şeyi sorabilirsin.</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      <Button variant="outline" size="sm" className="text-[10px]" onClick={() => handleSubmit({ target: { value: "Bütçemi analiz eder misin?" } } as any)}>
                        Bütçemi analiz et
                      </Button>
                      <Button variant="outline" size="sm" className="text-[10px]" onClick={() => handleSubmit({ target: { value: "Borçlarımı nasıl kapatırım?" } } as any)}>
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
                        {m.content}
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
              </div>
            </ScrollArea>
          </CardContent>

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
