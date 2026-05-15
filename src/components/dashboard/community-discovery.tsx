"use client";

import { useState, useTransition, useEffect } from "react";
import { Users, Shield, Globe, Plus, LogOut, MessageSquare } from "lucide-react";
import { getCommunities, joinCommunity, leaveCommunity } from "@/app/actions/communities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Community = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
  isMember: boolean;
};

export function CommunityDiscovery({ onSelectCommunity }: { onSelectCommunity?: (id: string, name: string) => void }) {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      const data = await getCommunities();
      setCommunities(data as any);
    } catch (error) {
      console.error("Error loading communities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoin = (id: string) => {
    startTransition(async () => {
      try {
        await joinCommunity(id);
        await loadCommunities();
        router.refresh();
      } catch (error) {
        alert((error as Error).message);
      }
    });
  };

  const handleLeave = (id: string) => {
    if (!confirm("Bu topluluktan ayrılmak istediğinize emin misiniz?")) return;
    startTransition(async () => {
      try {
        await leaveCommunity(id);
        await loadCommunities();
        router.refresh();
      } catch (error) {
        alert((error as Error).message);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card border border-border/20 rounded-[24px] p-5 h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {communities.map((c) => (
          <div
            key={c.id}
            className="group bg-card border border-border/20 rounded-[24px] p-5 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Users className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {c.isPrivate ? (
                        <span className="flex items-center gap-1 text-amber-600"><Shield className="h-3 w-3" /> Gizli</span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600"><Globe className="h-3 w-3" /> Herkese Açık</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {c.description || "Bu topluluk için bir açıklama henüz eklenmemiş."}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {c.memberCount} Üye
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {c.postCount} Paylaşım
                </div>
              </div>

              <div className="flex gap-2">
                {c.isMember ? (
                   <div className="flex gap-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => onSelectCommunity?.(c.id, c.name)}
                       className="h-8 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10"
                     >
                       Görüntüle
                     </Button>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeave(c.id)}
                        disabled={isPending}
                        className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                   </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleJoin(c.id)}
                    disabled={isPending || c.isPrivate}
                    className="h-8 rounded-xl text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Katıl
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {communities.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/20 border border-dashed border-border/30 rounded-[32px]">
            <p className="text-4xl mb-3">🤝</p>
            <p className="font-bold text-muted-foreground">Henüz topluluk bulunmuyor.</p>
            <p className="text-xs text-muted-foreground/60">İlk topluluğu siz kurarak insanları bir araya getirin!</p>
          </div>
        )}
      </div>
    </div>
  );
}
