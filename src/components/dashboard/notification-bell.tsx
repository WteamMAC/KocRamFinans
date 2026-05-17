"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/app/actions/notifications";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications();
      if (Array.isArray(data)) {
        setNotifications(data as any);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (e: any) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const deleted = notifications.find(n => n.id === id);
      return deleted && !deleted.isRead ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <button className="relative text-primary rounded-full hover:bg-primary/10 transition-all h-10 w-10 inline-flex items-center justify-center focus:outline-none border border-border/10 bg-card shadow-sm group">
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0.5 text-[10px] animate-pulse border-2 border-background ring-2 ring-destructive/20">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      } />
      <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
        <div className="bg-primary/5 p-6 border-b border-border/10">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-2xl">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead} 
                  className="text-[10px] font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 border border-primary/20"
                >
                  <Check className="h-3 w-3" />
                  Hepsini Oku
                </button>
              )}
            </div>
            <DialogTitle className="text-xl font-black text-foreground">Bildirimlerin</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Güncel aktiviteleri buradan takip edebilirsin.</p>
          </DialogHeader>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <BellOff className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">Şimdilik bir şey yok.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Yeni bir etkileşim olduğunda haber vereceğiz.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "relative flex flex-col items-start p-4 cursor-pointer rounded-2xl border transition-all duration-300 group",
                  !notif.isRead 
                    ? "bg-primary/5 border-primary/20 shadow-sm hover:bg-primary/10" 
                    : "bg-muted/10 border-transparent hover:bg-muted/20"
                )}
              >
                {!notif.isRead && (
                  <div className="absolute top-4 right-10 h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                )}
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={cn("text-xs font-black uppercase tracking-wider", !notif.isRead ? "text-primary" : "text-muted-foreground")}>
                    {notif.type === "MENTION" ? "Etiketlendin 👤" : notif.type === "LIKE" ? "Beğeni ❤️" : notif.type === "COMMENT" ? "Yorum 💬" : "Sistem ⚙️"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/40 bg-muted/20 px-2 py-0.5 rounded-md">
                      {new Date(notif.createdAt).getHours().toString().padStart(2, '0')}:
                      {new Date(notif.createdAt).getMinutes().toString().padStart(2, '0')}
                    </span>
                    <button 
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-foreground mt-1.5">{notif.title}</h4>
                <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
                {notif.link && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform">
                    Detayı Gör <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-muted/5 border-t border-border/10 flex justify-center">
           <button 
             onClick={() => setIsOpen(false)}
             className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
           >
             Kapat
           </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
