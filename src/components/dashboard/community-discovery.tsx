"use client";

import { useState, useTransition, useEffect } from "react";
import { Users, Shield, Globe, Plus, LogOut, MessageSquare, Search, Filter, ChevronRight, Clock } from "lucide-react";
import { getCommunities, joinCommunity, leaveCommunity } from "@/app/actions/communities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const COMMUNITY_TAGS = ["altın", "kripto", "bes", "faiz", "ekonomi", "genel", "borsa", "tasarruf"];

type Community = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  tags: string[];
  memberCount: number;
  postCount: number;
  isMember: boolean;
  isPending: boolean;
};

export function CommunityDiscovery({ onSelectCommunity }: { onSelectCommunity?: (id: string, name: string) => void }) {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingAction, startTransition] = useTransition();
  
  // Filtreleme Durumları
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      // Eğer showAll false ise limit 2 ve random çek, true ise query/tag'e göre çek
      const data = await getCommunities({
        limit: showAll ? 100 : 2,
        random: !showAll && searchQuery === "" && activeTag === null,
        query: searchQuery,
        tag: activeTag || undefined
      });
      setCommunities(data as any);
    } catch (error) {
      console.error("Error loading communities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, [showAll, searchQuery, activeTag]);

  const handleJoin = (id: string) => {
    startTransition(async () => {
      try {
        const result = await joinCommunity(id);
        if (result === "PENDING") {
          alert("Başvurunuz admin onayı için gönderildi.");
        }
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

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Topluluk ara..."
            className="w-full pl-10 pr-4 py-3 bg-muted/20 border border-border/10 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1 opacity-50" />
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
              activeTag === null ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border/10"
            )}
          >
            Hepsi
          </button>
          {COMMUNITY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                "text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
                activeTag === tag ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border/10"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {communities.map((c) => (
          <div
            key={c.id}
            className="group bg-card border border-border/20 rounded-[28px] p-5 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Users className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                    <div className="flex items-center gap-2">
                      {c.isPrivate ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-tighter"><Shield className="h-2.5 w-2.5" /> Gizli</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter"><Globe className="h-2.5 w-2.5" /> Açık</span>
                      )}
                      <div className="flex gap-1">
                        {c.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[8px] font-bold bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {c.description || "Bu topluluk için bir açıklama henüz eklenmemiş."}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {c.memberCount}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {c.postCount}
                </div>
              </div>

              <div className="flex gap-2">
                {c.isMember ? (
                   <div className="flex gap-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => onSelectCommunity?.(c.id, c.name)}
                       className="h-8 rounded-xl text-[10px] font-bold text-primary hover:bg-primary/10"
                     >
                       Görüntüle
                     </Button>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeave(c.id)}
                        disabled={isPendingAction}
                        className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                   </div>
                ) : c.isPending ? (
                   <Button
                    disabled
                    size="sm"
                    className="h-8 rounded-xl text-[10px] font-bold bg-amber-500/10 text-amber-600"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Beklemede
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleJoin(c.id)}
                    disabled={isPendingAction}
                    className="h-8 rounded-xl text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {c.isPrivate ? "Başvur" : "Katıl"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-muted/10 rounded-[28px] animate-pulse" />)}
        </div>
      )}

      {!showAll && communities.length >= 2 && (
        <button 
          onClick={() => setShowAll(true)}
          className="w-full py-4 border border-dashed border-border/20 rounded-3xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
        >
          Tüm Toplulukları Gör <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {showAll && communities.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aradığınız kriterlerde topluluk bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
