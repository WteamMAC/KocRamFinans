"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPost, toggleLike, addComment, deletePost, deleteComment, getPosts, getProfilePosts } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { CommunityCreateModal } from "./community-create-modal";
import { CommunityDiscovery } from "./community-discovery";
import { 
  Heart, MessageCircle, Trash2, Send, X, ChevronDown, 
  Filter, Image as ImageIcon, Plus, Users, LayoutGrid, ArrowLeft 
} from "lucide-react";

const ALL_TAGS = ["#yatırım", "#kripto", "#hisse", "#tasarruf", "#borç", "#bes", "#faiz", "#altın", "#bütçe"];
const MAX_CHARS = 500;
const HASHTAG_REGEX = /#([a-zA-Z0-9çşğüöıÇŞĞÜÖİ]+)/g;

// ─── Types ────────────────────────────────────────────────────────────
type Comment = {
  id: string; content: string; createdAt: Date;
  authorId: string; authorName: string; authorImage: string; isMyComment: boolean;
};
type Post = {
  id: string; content: string; tags: string[]; createdAt: Date;
  authorId: string; authorName: string; authorImage: string;
  likeCount: number; isLikedByMe: boolean; isMyPost: boolean;
  comments: Comment[];
  imageUrl?: string | null;
};

function formatTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Az önce";
  const m = Math.floor(s / 60); if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR");
}

function Avatar({ src, name, id, size = "md" }: { src: string; name: string; id: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";
  const content = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("rounded-full object-cover ring-2 ring-border/30 flex-shrink-0", sz)} />
  ) : (
    <div className={cn("rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary", sz)}>
      {name?.[0] || "?"}
    </div>
  );

  return (
    <Link href={`/dashboard/profile/${id}`} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}

// ─── Create Post Box ──────────────────────────────────────────────────
function CreatePostBox({ currentUserId, communityId, communityName }: { 
  currentUserId: string; 
  communityId?: string;
  communityName?: string;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const toggleTag = (tag: string) =>
    setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Resim boyutu 2MB'dan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if ((!content.trim() && !imageUrl) || content.length > MAX_CHARS) return;
    
    // Otomatik hashtag ayıklama
    const extractedTags = content.match(HASHTAG_REGEX) || [];
    const allTags = Array.from(new Set([...selectedTags, ...extractedTags]));

    startTransition(async () => {
      await createPost(content.trim(), allTags, imageUrl || undefined, communityId);
      setContent(""); setSelectedTags([]); setFocused(false); setImageUrl(null);
      router.refresh();
    });
  };

  const remaining = MAX_CHARS - content.length;
  const overLimit = remaining < 0;
  const nearLimit = remaining >= 0 && remaining < 50;

  return (
    <div className={cn(
      "bg-card border rounded-[24px] p-5 shadow-ambient-medium space-y-3 transition-all duration-300",
      focused ? "border-primary/30 shadow-ambient-high" : "border-border/20"
    )}>
      <div className="flex gap-3 items-start">
        {user && <Avatar src={user.imageUrl} name={user.firstName || "K"} id={currentUserId} />}
        <div className="flex-1 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={communityName ? `${communityName} topluluğunda paylaş... 👥` : "Finansal deneyimlerinizi paylaşın... 💡"}
            rows={focused || content ? 3 : 2}
            className="w-full bg-muted/30 border border-border/20 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
          {/* Karakter göstergesi ve Otomatik Tag Tespiti */}
          <div className="flex items-center justify-between animate-in fade-in duration-200">
            {(focused || content) && (
              <div className="flex-1 flex items-center">
                <div className="w-full bg-muted/50 rounded-full h-1 mr-3">
                  <div
                    className={cn("h-1 rounded-full transition-all duration-300", overLimit ? "bg-rose-500" : nearLimit ? "bg-amber-500" : "bg-primary")}
                    style={{ width: `${Math.min((content.length / MAX_CHARS) * 100, 100)}%` }}
                  />
                </div>
                <span className={cn("text-[11px] font-bold flex-shrink-0 mr-3", overLimit ? "text-rose-500" : nearLimit ? "text-amber-500" : "text-muted-foreground")}>
                  {remaining}
                </span>
              </div>
            )}
            
            {/* Canlı Hashtag Tespiti İpucu */}
            {content.includes("#") && (
              <div className="flex gap-1 items-center">
                {Array.from(new Set(content.match(HASHTAG_REGEX) || [])).slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md animate-pulse">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resim Önizleme */}
          {imageUrl && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-border/20 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Önizleme" className="w-full h-auto max-h-[300px] object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Etiketler */}
      {(focused || content || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {ALL_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)} className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-200",
              selectedTags.includes(tag)
                ? "bg-primary text-primary-foreground border-primary scale-105"
                : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
            )}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {(focused || content) && (
        <div className="flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1">
            <input
              type="file"
              id="post-image"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <label
              htmlFor="post-image"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all"
            >
              <ImageIcon className="h-4 w-4" />
              Fotoğraf Ekle
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setFocused(false); setContent(""); setSelectedTags([]); setImageUrl(null); }}
              className="text-muted-foreground hover:text-foreground rounded-full">
              <X className="h-4 w-4 mr-1" /> Vazgeç
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || (!content.trim() && !imageUrl) || overLimit}
              className="rounded-full px-5 h-9 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-ambient-low">
              <Send className="h-4 w-4 mr-2" />
              {isPending ? "Paylaşılıyor..." : "Paylaş"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tag Filter Bar ───────────────────────────────────────────────────
function TagFilterBar({ availableTags, activeTag, onSelect }: {
  availableTags: string[]; activeTag: string | null; onSelect: (tag: string | null) => void;
}) {
  if (availableTags.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 opacity-60" />
      <button onClick={() => onSelect(null)} className={cn(
        "text-[11px] font-bold px-3 py-1.5 rounded-full border flex-shrink-0 transition-all duration-200",
        activeTag === null
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
      )}>
        Tümü
      </button>
      {availableTags.map((tag) => (
        <button key={tag} onClick={() => onSelect(activeTag === tag ? null : tag)} className={cn(
          "text-[11px] font-bold px-3 py-1.5 rounded-full border flex-shrink-0 transition-all duration-200",
          activeTag === tag
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
        )}>
          {tag}
        </button>
      ))}
    </div>
  );
}

// ─── Comment Section ──────────────────────────────────────────────────
function CommentSection({ post, onTagClick }: { post: Post; onTagClick?: (tag: string) => void }) {
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment(post.id, newComment.trim());
      setNewComment(""); router.refresh();
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => { await deleteComment(commentId); router.refresh(); });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/10 animate-in fade-in slide-in-from-top-2 duration-300">
      {post.comments.length === 0 && (
        <p className="text-xs text-muted-foreground opacity-50 text-center py-2">Henüz yorum yok. İlk yorumu yap!</p>
      )}
      {post.comments.map((c) => (
        <div key={c.id} className="flex gap-2 items-start group">
          <Avatar src={c.authorImage} name={c.authorName} id={c.authorId} size="sm" />
          <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between">
              <Link href={`/dashboard/profile/${c.authorId}`} className="text-[11px] font-bold text-primary hover:underline">
                {c.authorName}
              </Link>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground opacity-50">{formatTimeAgo(c.createdAt)}</span>
                {c.isMyComment && (
                  <button onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-rose-400 hover:text-rose-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-foreground mt-0.5 leading-relaxed">
              {contentWithHashtags(c.content, onTagClick)}
            </div>
          </div>
        </div>
      ))}

      {/* Yeni yorum */}
      <div className="flex gap-2 items-center">
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Yorum yaz... (Enter)"
          className="flex-1 bg-muted/30 border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <button onClick={handleAdd} disabled={isPending || !newComment.trim()}
          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-40 hover:scale-110">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Content Highlighter ─────────────────────────────────────────────
function contentWithHashtags(text: string, onTagClick?: (tag: string) => void) {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex index
  HASHTAG_REGEX.lastIndex = 0;

  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const tag = match[0];
    parts.push(
      <button
        key={match.index}
        onClick={(e) => {
          e.stopPropagation();
          onTagClick?.(tag);
        }}
        className="text-primary font-bold hover:underline transition-all"
      >
        {tag}
      </button>
    );
    lastIndex = match.index + tag.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

// ─── Post Card ────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onTagClick }: { post: Post; currentUserId: string; onTagClick?: (tag: string) => void }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    setLiked((p) => !p);
    setLikeCount((p) => liked ? p - 1 : p + 1);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    startTransition(async () => { await toggleLike(post.id); router.refresh(); });
  };

  const handleDelete = () => {
    if (!confirm("Bu paylaşımı silmek istediğinize emin misiniz?")) return;
    startTransition(async () => { await deletePost(post.id); router.refresh(); });
  };

  // Etiket rengine göre kart vurgusu
  const accentMap: Record<string, string> = {
    "#kripto": "border-l-orange-500/60",
    "#hisse": "border-l-emerald-500/60",
    "#yatırım": "border-l-blue-500/60",
    "#altın": "border-l-amber-500/60",
    "#bes": "border-l-teal-500/60",
    "#faiz": "border-l-yellow-500/60",
    "#borç": "border-l-rose-500/60",
    "#tasarruf": "border-l-indigo-500/60",
    "#bütçe": "border-l-purple-500/60",
  };
  const firstTag = post.tags[0];
  const accentClass = firstTag ? (accentMap[firstTag] || "border-l-primary/30") : "border-l-border/20";

  return (
    <div className={cn(
      "bg-card border-l-4 border border-border/20 rounded-[24px] p-5 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-300 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
      accentClass
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={post.authorImage} name={post.authorName} id={post.authorId} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/profile/${post.authorId}`} className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                {post.authorName}
              </Link>
              {post.authorId !== currentUserId && (
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-bold">
                  Topluluk
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground opacity-60">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {!post.isMyPost && (
            <Link href={`/dashboard/profile/${post.authorId}`}>
              <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10">
                Profili Gör
              </Button>
            </Link>
          )}
          {post.isMyPost && (
            <button onClick={handleDelete} disabled={isPending}
              className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Resim İçeriği */}
      {post.imageUrl && (
        <div className="rounded-[20px] overflow-hidden border border-border/10 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.imageUrl} 
            alt="Paylaşım görseli" 
            className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-500" 
          />
        </div>
      )}

      {/* İçerik */}
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {contentWithHashtags(post.content, (tag) => {
          // Bu fonksiyon BlogFeed içindeki setActiveTag'e ulaşmalı. 
          // Şimdilik window event veya prop drilling yerine context-like bir yapı lazım.
          // Basitlik için BlogFeed içinde tanımlanan bir handler'ı prop olarak geçeceğiz.
          onTagClick?.(tag);
        })}
      </div>

      {/* Etiketler */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/10">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Aksiyon Barı */}
      <div className="flex items-center gap-5 pt-1 border-t border-border/10">
        <button onClick={handleLike} className={cn(
          "flex items-center gap-1.5 text-sm font-bold transition-all duration-200 group",
          liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
        )}>
          <Heart className={cn(
            "h-5 w-5 transition-all duration-200 group-hover:scale-110",
            liked && "fill-rose-500",
            likeAnim && "scale-125"
          )} />
          <span>{likeCount}</span>
        </button>

        <button onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-200">
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments.length}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showComments && "rotate-180")} />
        </button>
      </div>

      {showComments && <CommentSection post={post} onTagClick={onTagClick} />}
    </div>
  );
}

// ─── Ana Feed ─────────────────────────────────────────────────────────
export function BlogFeed({
  initialPosts,
  initialNextCursor,
  currentUserId,
  mode = "feed",
  profileId,
}: {
  initialPosts: Post[];
  initialNextCursor: string | null;
  currentUserId: string;
  mode?: "feed" | "profile";
  profileId?: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMore, startLoadMore] = useTransition();
  const [feedType, setFeedType] = useState<"explore" | "following" | "my-communities" | "communities">("explore");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<{ id: string, name: string } | null>(null);

  // Fast Polling - Arka planda yeni postları kontrol et (Her 30 saniyede bir)
  useEffect(() => {
    // Profil sayfasındaysak veya arama yapılıyorsa otomatik yenileme yapmayabiliriz
    // Ama genel akışta (Keşfet/Takip) yeni postları çekmek iyidir.
    const pollInterval = setInterval(async () => {
      try {
        let result;
        if (mode === "profile" && profileId) {
          result = await getProfilePosts(profileId);
        } else if (selectedCommunity) {
          result = await getPosts(currentUserId, undefined, "community", selectedCommunity.id);
        } else if (feedType !== "communities") {
          result = await getPosts(currentUserId, undefined, feedType);
        } else {
          return; // Topluluk keşif ekranındayken polling yapma
        }

        if (result && result.posts && result.posts.length > 0) {
          setPosts((prev) => {
            // Sadece gerçekten yeni olanları (id'si bizde olmayanları) ekle
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = result.posts.filter((p: Post) => !existingIds.has(p.id));
            
            if (newPosts.length === 0) return prev;
            
            // Yeni postları listenin başına ekle ve tarihleri düzelt
            const formattedNewPosts = newPosts.map((p: Post) => ({
              ...p,
              createdAt: new Date(p.createdAt)
            }));
            
            return [...formattedNewPosts, ...prev];
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 30000); // 30 saniye

    return () => clearInterval(pollInterval);
  }, [currentUserId, feedType, mode, profileId, selectedCommunity]);

  // Feed tipi değiştiğinde veriyi sıfırla ve yeniden çek
  const switchFeed = (type: "explore" | "following" | "my-communities" | "communities") => {
    if (type === feedType && !selectedCommunity) return;
    setFeedType(type);
    setSelectedCommunity(null);
    if (type !== "communities") {
      startLoadMore(async () => {
        const result = await getPosts(currentUserId, undefined, type);
        setPosts(result.posts);
        setNextCursor(result.nextCursor);
      });
    }
  };

  const handleSelectCommunity = (id: string, name: string) => {
    setSelectedCommunity({ id, name });
    startLoadMore(async () => {
      const result = await getPosts(currentUserId, undefined, "community", id);
      setPosts(result.posts);
      setNextCursor(result.nextCursor);
    });
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    startLoadMore(async () => {
      let result;
      if (mode === "profile" && profileId) {
        result = await getProfilePosts(profileId, nextCursor);
      } else if (selectedCommunity) {
        result = await getPosts(currentUserId, nextCursor, "community", selectedCommunity.id);
      } else if (feedType !== "communities") {
        result = await getPosts(currentUserId, nextCursor, feedType);
      } else {
        return;
      }
      if (result) {
        setPosts((prev) => [...prev, ...result.posts]);
        setNextCursor(result.nextCursor);
      }
    });
  };

  const availableTags = [...new Set(posts.flatMap((p) => p.tags))];

  const filtered = posts.filter((p) => {
    const matchesTag = activeTag ? p.tags.includes(activeTag) : true;
    const matchesSearch = searchQuery
      ? p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {mode === "feed" && (
        <>
          {/* Feed Tipi Seçimi */}
          <div className="flex p-1 bg-muted/30 rounded-2xl border border-border/20">
            <button
              onClick={() => switchFeed("explore")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                feedType === "explore" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Keşfet
            </button>
            <button
              onClick={() => switchFeed("following")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                feedType === "following" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Takip
            </button>
            <button
              onClick={() => switchFeed("my-communities")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                feedType === "my-communities" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Topluluklar
            </button>
            <button
              onClick={() => switchFeed("communities")}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                feedType === "communities" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Keşfet
            </button>
          </div>

          <CommunityCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
          
          {feedType === "communities" && !selectedCommunity && (
            <div className="flex justify-between items-center px-1 animate-in fade-in duration-300">
               <div>
                 <h2 className="text-lg font-black text-foreground">Toplulukları Keşfet</h2>
                 <p className="text-xs text-muted-foreground">İlgi alanlarınıza göre bir topluluğa katılın veya yenisini oluşturun.</p>
               </div>
               <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-2xl h-10 px-4 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none"
               >
                 <Plus className="h-4 w-4 mr-1.5" /> Yeni Kur
               </Button>
            </div>
          )}
        </>
      )}

      {/* Seçili Topluluk Header */}
      {selectedCommunity && (
        <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-5 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedCommunity(null)}
              className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:scale-110 transition-transform"
            >
              <ArrowLeft className="h-4 w-4 text-primary" />
            </button>
            <div>
              <h2 className="text-lg font-black text-foreground">{selectedCommunity.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Topluluk Sayfası</span>
                <span className="text-[10px] font-medium text-muted-foreground">{posts.length} Paylaşım</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arama (Topluluk keşfinde gizleyebiliriz veya arama topluluklarda da çalışır) */}
      {feedType !== "communities" || selectedCommunity ? (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedCommunity ? `${selectedCommunity.name} içinde ara...` : "Gönderi veya kullanıcı ara..."}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/20 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      ) : null}

      {/* Topluluk Keşif Ekranı */}
      {feedType === "communities" && !selectedCommunity && (
        <CommunityDiscovery onSelectCommunity={handleSelectCommunity} />
      )}

      {/* Gönderi Yazma Alanı (Sadece feed veya topluluk içindeyken) */}
      {(feedType !== "communities" || selectedCommunity) && mode === "feed" && (
        <CreatePostBox 
          currentUserId={currentUserId} 
          communityId={selectedCommunity?.id}
          communityName={selectedCommunity?.name}
        />
      )}

      {/* Etiket filtresi */}
      {availableTags.length > 0 && (
        <TagFilterBar availableTags={availableTags} activeTag={activeTag} onSelect={setActiveTag} />
      )}

      {/* Gönderi sayısı */}
      {posts.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {activeTag ? `${activeTag} gönderileri` : searchQuery ? "Arama sonuçları" : "Son Gönderiler"}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {filtered.length} gönderi
          </span>
        </div>
      )}

      {/* Gönderiler */}
      {filtered.length === 0 && !isLoadingMore ? (
        <div className="text-center py-16 bg-card border border-dashed border-border/30 rounded-[24px] animate-in fade-in duration-500">
          <p className="text-5xl mb-4">
            {selectedCommunity ? "🔒" : (activeTag || searchQuery || feedType === "following" ? "🔍" : "💬")}
          </p>
          <p className="font-bold text-foreground text-lg">
            {selectedCommunity 
              ? `${selectedCommunity.name} Gizli Olabilir` 
              : (feedType === "following" && posts.length === 0 
                ? "Henüz kimseyi takip etmiyorsun" 
                : (activeTag || searchQuery ? "Sonuç bulunamadı" : "Henüz paylaşım yok"))}
          </p>
          <p className="text-sm text-muted-foreground mt-1 px-8">
            {selectedCommunity 
              ? "Bu topluluktaki gönderileri sadece üyeler görebilir. Eğer üyeyseniz ve içerik göremiyorsanız henüz paylaşım yapılmamış olabilir."
              : (feedType === "following" && posts.length === 0
                ? "Yeni kişiler keşfederek akışını canlandır!"
                : (activeTag || searchQuery ? "Farklı filtre veya arama terimi deneyin." : "Topluluğa katıl, ilk paylaşımı sen yap!"))}
          </p>
        </div>
      ) : (
        <div className={cn("space-y-4 transition-opacity", isLoadingMore && posts.length === 0 ? "opacity-50" : "opacity-100")}>
          {filtered.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId} 
              onTagClick={(tag) => {
                setActiveTag(tag);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {nextCursor && !activeTag && !searchQuery && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="rounded-full px-8 h-10 font-bold border-border/30 hover:bg-muted/50 text-muted-foreground hover:text-primary transition-all"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Yükleniyor...
              </span>
            ) : "Daha Fazla Yükle"}
          </Button>
        </div>
      )}
    </div>
  );
}

