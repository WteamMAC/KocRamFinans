import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bell, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions/notifications";

export default async function NotificationsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  });

  if (!user) redirect("/onboarding");

  const notifications = user.notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex-1 p-6 pt-10 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Bildirimler
            </h1>
            <p className="text-muted-foreground text-sm font-medium opacity-70">
              Sizinle ilgili tüm güncellemeleri buradan takip edebilirsiniz.
            </p>
          </div>
          {unreadCount > 0 && (
            <form action={async () => {
              "use server";
              await markAllNotificationsAsRead();
            }}>
              <Button variant="outline" size="sm" className="rounded-xl font-bold border-border/40 hover:bg-primary/5 hover:text-primary transition-all">
                <Check className="mr-2 h-4 w-4" />
                Hepsini Okundu Yap
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-card border border-border/30 rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-ambient-low">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Henüz bildirim yok</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Biri sizden bahsettiğinde veya bir güncelleme olduğunda burada göreceksiniz.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`group bg-card border ${notif.isRead ? 'border-border/20' : 'border-primary/20 shadow-ambient-low'} rounded-2xl p-4 transition-all hover:border-primary/40`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.isRead ? 'bg-muted/40 text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${notif.isRead ? 'text-foreground/80' : 'text-foreground'}`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                        <Clock className="h-3 w-3" />
                        {new Date(notif.createdAt).toLocaleDateString('tr-TR')} {new Date(notif.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link 
                        href={notif.link}
                        className="inline-flex items-center text-xs font-bold text-primary hover:underline mt-2"
                      >
                        Görüntüle →
                      </Link>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 animate-pulse" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
