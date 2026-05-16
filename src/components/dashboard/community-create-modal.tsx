"use client";

import { useState, useTransition } from "react";
import { Users, Plus, Shield, Globe, Info, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCommunity } from "@/app/actions/communities";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const COMMUNITY_TAGS = ["altın", "kripto", "bes", "faiz", "ekonomi", "genel", "borsa", "tasarruf"];

export function CommunityCreateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(["genel"]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Resim boyutu 2MB'dan küçük olmalıdır.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };
 
   const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await createCommunity(name, description, selectedTags, imageUrl || undefined, isPrivate);
        onClose();
        router.refresh();
      } catch (error) {
        alert("Topluluk oluşturulurken hata oluştu: " + (error as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-foreground">Topluluk Kur</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Topluluk Adı</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: BIST Yatırımcıları"
                className="w-full bg-muted/30 border border-border/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Topluluğun amacını kısaca açıklayın..."
                rows={2}
                className="w-full bg-muted/30 border border-border/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Topluluk Görseli</label>
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-border/20 group">
                    <img src={imageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-border/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 transition-colors">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">Ekle</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground leading-tight">Topluluğunuzu temsil eden bir görsel yükleyin. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Etiketler */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Etiketler
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all",
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border/10 hover:border-primary/40"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={cn(
                  "flex-1 p-4 rounded-2xl border transition-all text-left space-y-1",
                  !isPrivate ? "bg-primary/5 border-primary" : "bg-muted/30 border-border/20 hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Globe className={cn("h-4 w-4", !isPrivate ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-bold", !isPrivate ? "text-primary" : "text-foreground")}>Herkese Açık</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Herkes görebilir.</p>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={cn(
                  "flex-1 p-4 rounded-2xl border transition-all text-left space-y-1",
                  isPrivate ? "bg-primary/5 border-primary" : "bg-muted/30 border-border/20 hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Shield className={cn("h-4 w-4", isPrivate ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-bold", isPrivate ? "text-primary" : "text-foreground")}>Gizli</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Başvuru ile alım.</p>
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-2xl text-amber-600">
              <Info className="h-4 w-4 flex-shrink-0" />
              <p className="text-[10px] font-medium leading-tight">Gizli topluluklarda postlar sadece üyeler tarafından görülür.</p>
            </div>

            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="w-full h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-ambient-medium"
            >
              {isPending ? "Oluşturuluyor..." : "Topluluğu Oluştur"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
