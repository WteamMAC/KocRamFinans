"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUnreadMessageCount } from "@/app/actions/messages";
import { MessageModal } from "./message-modal";
import { useUser } from "@clerk/nextjs";

export function MessageBell({ className }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Basit bir polling mekanizması ile okunmamış mesajları belirli aralıklarla kontrol edebiliriz
    const interval = setInterval(fetchUnreadCount, 30000); // 30 saniyede bir
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0); // Açıldığında optimistic olarak sayacı sıfırla
        }}
        className={cn("relative rounded-full h-10 w-10 text-muted-foreground hover:text-primary transition-colors hover:bg-muted", className)}
      >
        <MessageCircle className="h-5 w-5" />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-card animate-pulse shadow-sm shadow-rose-500/50" />
        )}
      </Button>

      <MessageModal 
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          fetchUnreadCount(); // Kapandığında güncel sayıyı tekrar al
        }}
        currentUsername={user?.username || ""}
      />
    </>
  );
}
