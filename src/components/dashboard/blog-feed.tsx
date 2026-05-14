"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Trash2, Send, X, ChevronDown, Filter } from "lucide-react";
import { createPost, toggleLike, addComment, deletePost, deleteComment, getPosts } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

const ALL_TAGS = ["#yatırım", "#kripto", "#hisse", "#tasarruf", "#borç", "#bes", "#faiz", "#altın", "#bütçe"];
const MAX_CHARS = 500;

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
};

function formatTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Az önce";
  const m = Math.floor(s / 60); if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR");
}

function Avatar({ src, name, size = "md" }: { src: string; name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";
  if (src) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("rounded-full object-cover ring-2 ring-border/30 flex-shrink-0", sz)} />
  );
  return (
    <div className={cn("rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary", sz)}>
      {name?.[0] || "?"}
    </div>
  );
}

// ─── Create Post Box ──────────────────────────────────────────────────
function CreatePostBox() {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);

  const toggleTag = (tag: string) =>
    setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);

  const handleSubmit = () => {
    if (!content.trim() || content.length > MAX_CHARS) return;
    startTransition(async () => {
      await createPost(content.trim(), selectedTags);
      setContent(""); setSelectedTags([]); setFocused(false);
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
        <Avatar src={user?.imageUrl || ""} name={user?.firstName || "K"} />
        <div className="flex-1 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Finansal deneyimlerinizi paylaşın... 💡"
            rows={focused || content ? 3 : 2}
            className="w-full bg-muted/30 border border-border/20 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
          {/* Karakter göstergesi */}
          {(focused || content) && (
            <div className="flex items-center justify-between animate-in fade-in duration-200">
              <div className="w-full bg-muted/50 rounded-full h-1 mr-3">
                <div
                  className={cn("h-1 rounded-full transition-all duration-300", overLimit ? "bg-rose-500" : nearLimit ? "bg-amber-500" : "bg-primary")}
                  style={{ width: `${Math.min((content.length / MAX_CHARS) * 100, 100)}%` }}
                />
              </div>
              <span className={cn("text-[11px] font-bold flex-shrink-0", overLimit ? "text-rose-500" : nearLimit ? "text-amber-500" : "text-muted-foreground")}>
                {remaining}
              </span>
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
        <div className="flex items-center justify-end gap-2 animate-in fade-in duration-200">
          <Button variant="ghost" size="sm" onClick={() => { setFocused(false); setContent(""); setSelectedTags([]); }}
            className="text-muted-foreground hover:text-foreground rounded-full">
            <X className="h-4 w-4 mr-1" /> Vazgeç
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !content.trim() || overLimit}
            className="rounded-full px-5 h-9 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-ambient-low">
            <Send className="h-4 w-4 mr-2" />
            {isPending ? "Paylaşılıyor..." : "Paylaş"}
          </Button>
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
function CommentSection({ post }: { post: Post }) {
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
          <Avatar src={c.authorImage} name={c.authorName} size="sm" />
          <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary">{c.authorName}</span>
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
            <p className="text-xs text-foreground mt-0.5 leading-relaxed">{c.content}</p>
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

// ─── Post Card ────────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
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
          <Avatar src={post.authorImage} name={post.authorName} />
          <div>
            <p className="font-bold text-sm text-foreground">{post.authorName}</p>
            <p className="text-[11px] text-muted-foreground opacity-60">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        {post.isMyPost && (
          <button onClick={handleDelete} disabled={isPending}
            className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* İçerik */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

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

      {showComments && <CommentSection post={post} />}
    </div>
  );
}

// ─── Ana Feed ─────────────────────────────────────────────────────────
export function BlogFeed({
  initialPosts,
  initialNextCursor,
  currentUserId,
}: {
  initialPosts: Post[];
  initialNextCursor: string | null;
  currentUserId: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMore, startLoadMore] = useTransition();

  const handleLoadMore = () => {
    if (!nextCursor) return;
    startLoadMore(async () => {
      const result = await getPosts(currentUserId, nextCursor);
      setPosts((prev) => [...prev, ...result.posts]);
      setNextCursor(result.nextCursor);
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
      <CreatePostBox />

      {/* Arama */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Gönderi veya kullanıcı ara..."
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/20 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

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
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border/30 rounded-[24px] animate-in fade-in duration-500">
          <p className="text-5xl mb-4">{activeTag || searchQuery ? "🔍" : "💬"}</p>
          <p className="font-bold text-foreground text-lg">
            {activeTag || searchQuery ? "Sonuç bulunamadı" : "Henüz paylaşım yok"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTag || searchQuery
              ? "Farklı filtre veya arama terimi deneyin."
              : "Topluluğa katıl, ilk paylaşımı sen yap!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => <PostCard key={post.id} post={post} />)}
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

