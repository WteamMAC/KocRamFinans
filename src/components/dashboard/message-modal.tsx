"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, ArrowLeft, Loader2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInboxConversations, getConversation, sendMessage, toggleBlockUser, getBlockStatus } from "@/app/actions/messages";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetUsername?: string | null;
  currentUsername: string;
}

export function MessageModal({ isOpen, onClose, initialTargetUsername, currentUsername }: MessageModalProps) {
  const [view, setView] = useState<"inbox" | "chat">(initialTargetUsername ? "chat" : "inbox");
  const [targetUser, setTargetUser] = useState<{ username: string, name?: string } | null>(
    initialTargetUsername ? { username: initialTargetUsername } : null
  );
  
  const [inbox, setInbox] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  
  const [blockStatus, setBlockStatus] = useState({ isBlocked: false, hasBlockedMe: false });
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (view === "inbox") {
      fetchInbox();
    } else if (view === "chat" && targetUser) {
      fetchChat(targetUser.username);
    }
  }, [isOpen, view, targetUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const data = await getInboxConversations();
      setInbox(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchChat = async (username: string) => {
    setLoading(true);
    try {
      const [msgs, blockData] = await Promise.all([
        getConversation(username),
        getBlockStatus(username)
      ]);
      setMessages(msgs);
      setBlockStatus(blockData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !targetUser) return;
    setSending(true);
    try {
      const newMsg = await sendMessage(targetUser.username, inputText);
      // Gelen mesaja mevcut kullanıcı bilgisini ekle
      const messageToAppend = {
        ...newMsg,
        sender: { username: currentUsername },
        receiver: { username: targetUser.username }
      };
      setMessages(prev => [...prev, messageToAppend]);
      setInputText("");
    } catch (e: any) {
      alert(e.message || "Mesaj gönderilemedi");
    }
    setSending(false);
  };

  const handleBlockToggle = async () => {
    if (!targetUser) return;
    try {
      const res = await toggleBlockUser(targetUser.username);
      setBlockStatus(prev => ({ ...prev, isBlocked: res.blocked }));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/20 overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-border/10 flex items-center justify-between px-4 shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            {view === "chat" && !initialTargetUsername && (
              <Button variant="ghost" size="icon" onClick={() => setView("inbox")} className="h-8 w-8 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="font-bold text-lg">
              {view === "inbox" ? "Mesajlar" : `@${targetUser?.username}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {view === "chat" && targetUser && (
              <Button variant="ghost" size="icon" onClick={() => setShowBlockConfirm(true)} className={cn("h-8 w-8 rounded-full", blockStatus.isBlocked ? "text-rose-500 bg-rose-500/10 shadow-inner" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10")}>
                <Ban className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-background/50">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : view === "inbox" ? (
            <div className="flex-1 overflow-y-auto p-2">
              {inbox.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                  <span className="text-4xl">💬</span>
                  <p className="text-sm font-medium">Henüz mesajınız yok</p>
                </div>
              ) : (
                inbox.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setTargetUser(item.user); setView("chat"); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-muted/40 transition-colors rounded-2xl text-left"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                      {item.user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">@{item.user.username}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(item.lastMessageAt), "d MMM", { locale: tr })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.lastMessage}</p>
                    </div>
                    {item.unreadCount > 0 && (
                      <div className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                        {item.unreadCount}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {blockStatus.isBlocked && (
                  <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-xs font-bold text-center border border-rose-500/20">
                    Bu kullanıcıyı engellediniz.
                  </div>
                )}
                {blockStatus.hasBlockedMe && (
                  <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl text-xs font-bold text-center border border-amber-500/20">
                    Bu kullanıcıya mesaj gönderemezsiniz.
                  </div>
                )}
                {messages.length === 0 && !blockStatus.isBlocked && !blockStatus.hasBlockedMe && (
                  <p className="text-center text-xs text-muted-foreground opacity-60 mt-4">Sohbeti başlatın...</p>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender.username === currentUsername;
                  return (
                    <div key={idx} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        isMe ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm" : "bg-muted rounded-bl-sm border border-border/10"
                      )}>
                        {msg.content}
                        <div className={cn("text-[9px] mt-1 opacity-70 text-right", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-card border-t border-border/10">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sending || blockStatus.isBlocked || blockStatus.hasBlockedMe}
                    placeholder="Mesaj yazın..."
                    className="flex-1 h-12 bg-muted/40 border-transparent focus:border-primary/30 rounded-2xl px-4 text-sm focus:outline-none transition-colors disabled:opacity-50"
                  />
                  <Button 
                    type="submit" 
                    disabled={sending || !inputText.trim() || blockStatus.isBlocked || blockStatus.hasBlockedMe}
                    className="h-12 w-12 rounded-2xl shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    size="icon"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-border/20 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                <Ban className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                {blockStatus.isBlocked ? "Engeli Kaldır" : "Kullanıcıyı Engelle"}
              </h3>
              <p className="text-sm text-muted-foreground font-medium px-2">
                {blockStatus.isBlocked 
                  ? `@${targetUser?.username} kullanıcısının engelini kaldırmak istiyor musunuz?` 
                  : `@${targetUser?.username} kullanıcısını engellemek istediğinize emin misiniz? Bu işlemden sonra birbirinize mesaj gönderemezsiniz.`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBlockConfirm(false)} 
                className="flex-1 h-12 rounded-2xl font-bold border-border/20"
              >
                Vazgeç
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowBlockConfirm(false);
                  handleBlockToggle();
                }} 
                className="flex-1 h-12 rounded-[18px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20"
              >
                {blockStatus.isBlocked ? "ENGELİ KALDIR" : "ENGELLE"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
