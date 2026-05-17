"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createPost, toggleLike, addComment, deletePost, deleteComment, getPosts, getProfilePosts, searchUsers } from "@/app/actions/blog";
import { 
  getCommunities, 
  getCommunityDetails, 
  getCommunityRequests, 
  getCommunityMembers,
  handleJoinRequest, 
  deleteCommunity, 
  removeMember,
  updateCommunity
} from "@/app/actions/communities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { CommunityCreateModal } from "./community-create-modal";
import { CommunityDiscovery } from "./community-discovery";
import { 
  Heart, MessageCircle, Trash2, Send, X, ChevronDown, 
  Filter, Image as ImageIcon, Plus, Users, LayoutGrid, ArrowLeft, Settings, Check, UserMinus, ShieldAlert, Ban,
  Edit, Globe, Shield, Tag, SlidersHorizontal, Clock, Flame, Calendar, TrendingUp, CheckSquare, Square, Search, RefreshCw, Sparkles
} from "lucide-react";

const ALL_TAGS = ["#yatırım", "#kripto", "#hisse", "#tasarruf", "#borç", "#bes", "#faiz", "#altın", "#bütçe"];
const MAX_CHARS = 500;
const HASHTAG_REGEX = /#([a-zA-Z0-9çşğüöıÇŞĞÜÖİ]+)/g;
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

// ─── Types ────────────────────────────────────────────────────────────
type Comment = {
  id: string; content: string; createdAt: Date;
  authorId: string; authorUsername: string | null; authorName: string; authorImage: string; isMyComment: boolean;
};
type Post = {
  id: string; content: string; tags: string[]; createdAt: Date;
  authorId: string; authorUsername: string | null; authorName: string; authorImage: string;
  likeCount: number; isLikedByMe: boolean; isMyPost: boolean;
  isAdmin: boolean;
  isAnnouncement: boolean;
  comments: Comment[];
  imageUrl?: string | null;
  communityId?: string | null;
  communityName?: string | null;
};

function formatTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Az önce";
  const m = Math.floor(s / 60); if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR");
}

function Avatar({ src, name, username, userId, size = "md" }: { src: string; name: string; username: string | null; userId?: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";
  const content = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("rounded-full object-cover ring-2 ring-border/30 flex-shrink-0", sz)} />
  ) : (
    <div className={cn("rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary", sz)}>
      {name?.[0] || "?"}
    </div>
  );

  const href = username ? `/dashboard/profile/${username}` : (userId ? `/dashboard/profile/${userId}` : "#");

  return (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}

// ─── Create Post Box ──────────────────────────────────────────────────
function CreatePostBox({ currentUserId, communityId, communityName, userRole, onPostAdded, onPostIdUpdate }: { 
  currentUserId: string; 
  communityId?: string;
  communityName?: string;
  userRole?: string;
  onPostAdded?: (post: Post) => void;
  onPostIdUpdate?: (tempId: string, realId: string) => void;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setContent(value);
    setCursorPosition(pos);

    const lastAtIdx = value.lastIndexOf("@", pos - 1);
    if (lastAtIdx !== -1) {
      const query = value.substring(lastAtIdx + 1, pos);
      if (!query.includes(" ") && !query.includes("\n")) {
        setMentionQuery(query);
        setShowMentionList(true);
        const users = await searchUsers(query);
        setMentionSuggestions(users);
        return;
      }
    }
    setShowMentionList(false);
  };

  const selectMention = (username: string) => {
    const lastAtIdx = content.lastIndexOf("@", cursorPosition - 1);
    const before = content.substring(0, lastAtIdx);
    const after = content.substring(cursorPosition);
    const newContent = `${before}@${username} ${after}`;
    setContent(newContent);
    setShowMentionList(false);
  };

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
    const extractedTags = content.match(HASHTAG_REGEX) || [];
    const allTags = Array.from(new Set([...selectedTags, ...extractedTags]));
    const postContent = content.trim();

    const tempId = "temp-post-" + Date.now();
    const optimisticPost: Post = {
      id: tempId,
      content: postContent,
      tags: allTags,
      createdAt: new Date(),
      authorId: currentUserId,
      authorUsername: user?.username || null,
      authorName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Ben",
      authorImage: user?.imageUrl || "",
      likeCount: 0,
      isLikedByMe: false,
      isMyPost: true,
      isAdmin: userRole === "ADMIN",
      isAnnouncement: isAnnouncement,
      comments: [],
      imageUrl: imageUrl || null,
      communityId: communityId || undefined,
      communityName: communityName || undefined
    };

    onPostAdded?.(optimisticPost);
    setContent(""); setSelectedTags([]); setFocused(false); setImageUrl(null); setIsAnnouncement(false);

    startTransition(async () => {
      try {
        const res = await createPost(postContent, allTags, imageUrl || undefined, communityId, isAnnouncement);
        if (res?.id) onPostIdUpdate?.(tempId, res.id);
        router.refresh();
      } catch (err) {
        console.error("Gönderi hatası:", err);
      }
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
        {user && <Avatar src={user.imageUrl} name={user.firstName || "K"} username={user.username || null} userId={currentUserId} />}
        <div className="flex-1 space-y-2">
          <div className="relative">
            <textarea
              value={content}
              onChange={handleContentChange}
              onKeyUp={(e: any) => setCursorPosition(e.target.selectionStart)}
              onClick={(e: any) => setCursorPosition(e.target.selectionStart)}
              onFocus={() => setFocused(true)}
              placeholder={communityName ? `${communityName} topluluğunda paylaş... 👥` : "Finansal deneyimlerinizi paylaşın... 💡"}
              rows={focused || content ? 3 : 2}
              className="w-full bg-muted/30 border border-border/20 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
            />
            {showMentionList && mentionSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 bottom-full mb-2 w-64 bg-card border border-border/30 rounded-2xl shadow-ambient-high overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                <div className="p-2 border-b border-border/10 bg-muted/20">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Kullanıcı Etiketle</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {mentionSuggestions.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectMention(u.username)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs group-hover:bg-primary/20">
                        {u.username?.[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-foreground">@{u.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          {imageUrl && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-border/20 group">
              <img src={imageUrl} alt="Önizleme" className="w-full h-auto max-h-[300px] object-cover" />
              <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-500 transition-all backdrop-blur-sm">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {(focused || content || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {ALL_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)} className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-200",
              selectedTags.includes(tag) ? "bg-primary text-primary-foreground border-primary scale-105" : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
            )}>
              {tag}
            </button>
          ))}
        </div>
      )}
      {(focused || content) && (
        <div className="flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1">
            <input type="file" id="post-image" className="hidden" accept="image/*" onChange={handleImageUpload} />
            <label htmlFor="post-image" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all">
              <ImageIcon className="h-4 w-4" /> Fotoğraf Ekle
            </label>
          </div>
          <div className="flex items-center gap-2">
            {userRole === "ADMIN" && (focused || content) && (
              <button 
                onClick={() => setIsAnnouncement(!isAnnouncement)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                  isAnnouncement ? "bg-amber-500/20 text-amber-600" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <ShieldAlert className="h-4 w-4" /> Duyuru Olarak Paylaş
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={() => { setFocused(false); setContent(""); setSelectedTags([]); setImageUrl(null); setIsAnnouncement(false); }} className="text-muted-foreground hover:text-foreground rounded-full">
              <X className="h-4 w-4 mr-1" /> Vazgeç
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || (!content.trim() && !imageUrl) || overLimit} className="rounded-full px-5 h-9 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-ambient-low">
              <Send className="h-4 w-4 mr-2" /> {isPending ? "Paylaşılıyor..." : "Paylaş"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Unified Filter & Tag Bar ───────────────────────────────────────────────
function UnifiedFilterAndTagBar({
  availableTags,
  activeTags,
  onToggleTag,
  onClearTags,
  filterCount,
  onToggleFilter,
  sortBy,
  onSelectSort,
  onResetFilters
}: {
  availableTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  filterCount: number;
  onToggleFilter: () => void;
  sortBy: string;
  onSelectSort: (sort: any) => void;
  onResetFilters: () => void;
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortLabels: Record<string, string> = {
    "latest": "En Yeniler",
    "oldest": "En Eskiler",
    "most-liked": "En Beğenilen",
    "most-commented": "Çok Yorum"
  };

  return (
    <div className="relative pt-1 z-30">
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-2">
        {/* 1. Filtrele Butonu */}
        <button 
          onClick={onToggleFilter}
          className={cn(
            "flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold transition-all shadow-ambient-low shrink-0 mr-1",
            filterCount > 0 ? "bg-primary text-primary-foreground border-primary shadow-primary/20" : "bg-card text-muted-foreground border-border/30 hover:border-primary/40 hover:text-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filtrele</span>
          {filterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white ml-0.5 shadow-sm">
              {filterCount}
            </span>
          )}
        </button>

        {/* 2. Sırala Butonu (Portal ile Katman Dışına Çıkarıldı) */}
        <div className="relative shrink-0 mr-1">
          <button 
            onClick={() => setIsSortOpen(p => !p)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-card border border-border/30 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all shadow-ambient-low"
          >
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>{sortLabels[sortBy] || "Sırala"}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>

          {isSortOpen && typeof document !== "undefined" && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSortOpen(false)}>
              <div className="bg-card border border-primary/20 rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden divide-y divide-border/10 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border/10">
                  <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" /> Sıralama Ölçütü
                  </span>
                  <button onClick={() => setIsSortOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-full"><X className="h-4 w-4" /></button>
                </div>
                {[
                  { id: "latest", label: "En Yeniler (Önce Yeni)", icon: Clock, desc: "En son paylaşılan gönderiler en üstte yer alır." },
                  { id: "most-liked", label: "En Çok Beğenilenler", icon: Flame, desc: "Topluluktan en çok beğeni alan popüler içerikler." },
                  { id: "most-commented", label: "En Çok Yorum Alanlar", icon: MessageCircle, desc: "Üyeler arasında en çok tartışılan konular." },
                  { id: "oldest", label: "En Eskiler (Önce Eski)", icon: Calendar, desc: "İlk paylaşılan geçmiş gönderilere göz atın." }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onSelectSort(item.id); setIsSortOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3.5 p-4 text-left transition-colors",
                        sortBy === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className={cn("p-2.5 rounded-xl shrink-0", sortBy === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* 3. Varsa Sıfırla Butonu */}
        {filterCount > 0 && (
          <button 
            onClick={onResetFilters}
            className="flex items-center gap-1 h-8 px-2.5 rounded-xl text-[11px] font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 shrink-0 transition-colors mr-1"
            title="Filtreleri Sıfırla"
          >
            <RefreshCw className="h-3 w-3" /> Sıfırla
          </button>
        )}

        {/* 4. Tümü Butonu */}
        <button 
          onClick={onClearTags} 
          className={cn(
            "text-[11px] font-bold px-3.5 h-8 rounded-full border shrink-0 transition-all duration-200 flex items-center justify-center", 
            activeTags.length === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
          )}
        >
          Tümü
        </button>

        {/* 5. Etiketler */}
        {availableTags.map((tag) => {
          const isActive = activeTags.includes(tag);
          return (
            <button 
              key={tag} 
              onClick={() => onToggleTag(tag)} 
              className={cn(
                "text-[11px] font-bold px-3 h-8 rounded-full border shrink-0 transition-all duration-200 flex items-center gap-1.5", 
                isActive ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow-sm shadow-primary/20" : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
              )}
            >
              <span>{tag}</span>
              {isActive && <X className="h-3 w-3 ml-0.5 opacity-80" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Comment Section ──────────────────────────────────────────────────
function CommentSection({ post, currentUserId, onTagClick, onCommentAdded, onCommentDeleted, onCommentIdUpdate }: { 
  post: Post; 
  currentUserId: string;
  onTagClick?: (tag: string) => void;
  onCommentAdded?: (postId: string, comment: Comment) => void;
  onCommentDeleted?: (postId: string, commentId: string) => void;
  onCommentIdUpdate?: (postId: string, tempId: string, realId: string) => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(pos);

    const lastAtIdx = value.lastIndexOf("@", pos - 1);
    if (lastAtIdx !== -1) {
      const query = value.substring(lastAtIdx + 1, pos);
      if (!query.includes(" ") && !query.includes("\n")) {
        setShowMentionList(true);
        const users = await searchUsers(query);
        setMentionSuggestions(users);
        return;
      }
    }
    setShowMentionList(false);
  };

  const selectMention = (username: string) => {
    const lastAtIdx = newComment.lastIndexOf("@", cursorPosition - 1);
    const before = newComment.substring(0, lastAtIdx);
    const after = newComment.substring(cursorPosition);
    setNewComment(`${before}@${username} ${after}`);
    setShowMentionList(false);
  };

  const handleAdd = () => {
    if (!newComment.trim()) return;
    const commentText = newComment.trim();
    
    const tempId = "temp-" + Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      content: commentText,
      createdAt: new Date(),
      authorId: currentUserId,
      authorUsername: user?.username || null,
      authorName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Ben",
      authorImage: user?.imageUrl || "",
      isMyComment: true
    };

    setNewComment("");
    onCommentAdded?.(post.id, optimisticComment);

    startTransition(async () => {
      try {
        const res = await addComment(post.id, commentText);
        if (res?.id) onCommentIdUpdate?.(post.id, tempId, res.id);
        router.refresh();
      } catch (err) {
        console.error("Yorum hatası:", err);
      }
    });
  };

  const handleDelete = (commentId: string) => {
    if (commentId.startsWith("temp-")) return;
    onCommentDeleted?.(post.id, commentId);
    startTransition(async () => { 
      try {
        await deleteComment(commentId); 
        router.refresh(); 
      } catch (err) {
        console.error("Silme hatası:", err);
      }
    });
  };

  return (
    <div className="space-y-4 pt-3 border-t border-border/10 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-3">
        {post.comments.length === 0 && <p className="text-xs text-muted-foreground opacity-50 text-center py-2">Henüz yorum yok. İlk yorumu yap!</p>}
        {post.comments.map((c) => (
          <div key={c.id} className="flex gap-2 items-start group">
            <Avatar src={c.authorImage} name={c.authorName} username={c.authorUsername} userId={c.authorId} size="sm" />
            <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Link href={c.authorUsername ? `/dashboard/profile/${c.authorUsername}` : `/dashboard/profile/${c.authorId}`} className="text-[11px] font-bold text-primary hover:underline">{c.authorName}</Link>
                  {c.authorUsername && <span className="text-[10px] font-bold text-muted-foreground opacity-40">@{c.authorUsername}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground opacity-50">{formatTimeAgo(c.createdAt)}</span>
                  {c.isMyComment && <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 transition-all ml-1 p-1 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-500/10"><X className="h-3 w-3" /></button>}
                </div>
              </div>
              <div className="text-xs text-foreground mt-0.5 leading-relaxed">{contentWithTagsAndMentions(c.content, onTagClick)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 relative">
        <textarea
          value={newComment}
          onChange={handleContentChange}
          onKeyUp={(e: any) => setCursorPosition(e.target.selectionStart)}
          onClick={(e: any) => setCursorPosition(e.target.selectionStart)}
          placeholder="Yorum yap..."
          className="flex-1 bg-muted/20 border border-border/10 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[40px] max-h-[120px] resize-none"
        />
        {showMentionList && mentionSuggestions.length > 0 && (
          <div className="absolute z-50 left-0 bottom-full mb-2 w-48 bg-card border border-border/30 rounded-xl shadow-ambient-high overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
            {mentionSuggestions.map((u) => (
              <button
                key={u.id}
                onClick={() => selectMention(u.username)}
                className="w-full flex items-center gap-2 p-2 hover:bg-primary/5 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                  {u.username?.[0].toUpperCase()}
                </div>
                <span className="text-[11px] font-bold text-foreground">@{u.username}</span>
              </button>
            ))}
          </div>
        )}
        <Button 
          size="icon" 
          onClick={handleAdd} 
          disabled={isPending || !newComment.trim()} 
          className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Content Highlighter ─────────────────────────────────────────────
function contentWithTagsAndMentions(text: string, onTagClick?: (tag: string) => void) {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  
  // Combine hashtags and mentions into one regex
  const regex = /(#([a-zA-Z0-9çşğüöıÇŞĞÜÖİ]+))|(@([a-zA-Z0-9_]+))/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    const tag = match[0];
    const isHashtag = tag.startsWith("#");
    
    parts.push(
      <button 
        key={match.index} 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (isHashtag) {
            onTagClick?.(tag); 
          } else {
            window.location.href = `/dashboard/profile/${tag.substring(1)}`;
          }
        }} 
        className={cn(
          "font-bold hover:underline transition-all",
          isHashtag ? "text-primary" : "text-amber-500"
        )}
      >
        {tag}
      </button>
    );
    lastIndex = match.index + tag.length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts;
}

// ─── Post Card ────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onTagClick, onCommunityClick, onCommentAdded, onCommentDeleted, onPostDeleted, onCommentIdUpdate }: { 
  post: Post; 
  currentUserId: string; 
  onTagClick?: (tag: string) => void;
  onCommunityClick?: (id: string, name: string) => void;
  onCommentAdded?: (postId: string, comment: Comment) => void;
  onCommentDeleted?: (postId: string, commentId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onCommentIdUpdate?: (postId: string, tempId: string, realId: string) => void;
}) {
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

  const [showDeletePostModal, setShowDeletePostModal] = useState(false);

  const handleDelete = () => {
    if (post.id.startsWith("temp-")) return;
    setShowDeletePostModal(true);
  };

  const confirmDelete = () => {
    setShowDeletePostModal(false);
    onPostDeleted?.(post.id);
    startTransition(async () => { 
      try {
        await deletePost(post.id); 
        router.refresh(); 
      } catch (err) {
        console.error("Silme hatası:", err);
      }
    });
  };

  const accentMap: Record<string, string> = {
    "#kripto": "border-l-orange-500/60", "#hisse": "border-l-emerald-500/60", "#yatırım": "border-l-blue-500/60",
    "#altın": "border-l-amber-500/60", "#bes": "border-l-teal-500/60", "#faiz": "border-l-yellow-500/60",
    "#borç": "border-l-rose-500/60", "#tasarruf": "border-l-indigo-500/60", "#bütçe": "border-l-purple-500/60",
  };
  const firstTag = post.tags[0];
  const accentClass = post.isAnnouncement 
    ? "border-l-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/10"
    : firstTag ? (accentMap[firstTag] || "border-l-primary/30") : "border-l-border/20";

  return (
    <div className={cn("bg-card border-l-4 border border-border/20 rounded-[24px] p-5 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-300 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500", accentClass)}>
      {post.isAnnouncement && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full w-fit mb-2">
          <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Resmi Duyuru</span>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={post.authorImage} name={post.authorName} username={post.authorUsername} userId={post.authorId} />
          <div className="flex flex-col -space-y-0.5">
            <div className="flex items-center gap-2">
              <Link href={post.authorUsername ? `/dashboard/profile/${post.authorUsername}` : `/dashboard/profile/${post.authorId}`} className="font-bold text-sm text-foreground hover:text-primary transition-colors leading-tight">{post.authorName}</Link>
              {post.communityName && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground/30">•</span>
                  <button onClick={(e) => { e.stopPropagation(); if(post.communityId) onCommunityClick?.(post.communityId, post.communityName || ""); }} className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-bold hover:bg-primary/20 transition-all">{post.communityName}</button>
                </div>
              )}
            </div>
            {post.authorUsername && (
              <p className="text-[10px] font-bold text-muted-foreground opacity-50 leading-tight">@{post.authorUsername}</p>
            )}
            <p className="text-[10px] text-muted-foreground opacity-40 font-medium mt-0.5">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!post.isMyPost && <Link href={post.authorUsername ? `/dashboard/profile/${post.authorUsername}` : `/dashboard/profile/${post.authorId}`}><Button variant="ghost" size="sm" className="h-8 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10">Profili Gör</Button></Link>}
          {(post.isMyPost || post.isAdmin) && (
            <button onClick={handleDelete} disabled={isPending} className="p-2 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {post.imageUrl && (
        <div className="rounded-[20px] overflow-hidden border border-border/10 bg-muted/20">
          <img src={post.imageUrl} alt="Paylaşım görseli" className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-500" />
        </div>
      )}
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contentWithTagsAndMentions(post.content, onTagClick)}</div>
      
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {post.tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => { 
                e.stopPropagation(); 
                onTagClick?.(tag); 
              }}
              className="text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 px-2.5 py-1 rounded-lg transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button onClick={handleLike} className={cn("flex items-center gap-1.5 text-xs font-bold transition-all", liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")}>
          <Heart className={cn("h-4 w-4", liked && "fill-current", likeAnim && "animate-ping")} /> {likeCount}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-all">
          <MessageCircle className="h-4 w-4" /> {post.comments.length}
        </button>
      </div>
      {showComments && <CommentSection post={post} currentUserId={currentUserId} onTagClick={onTagClick} onCommentAdded={onCommentAdded} onCommentDeleted={onCommentDeleted} onCommentIdUpdate={onCommentIdUpdate} />}

      {/* Delete Post Custom Modal */}
      {showDeletePostModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-bounce">
                <Trash2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground">Gönderiyi Sil?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bu paylaşımı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowDeletePostModal(false)} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                <Button onClick={confirmDelete} disabled={isPending} className="flex-1 h-12 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20">
                  {isPending ? "Siliniyor..." : "Evet, Sil"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Community Admin Panel ───────────────────────────────────────────
function CommunityAdminPanel({ communityId, communityDetails: initialDetails, onClose, onDeleteSuccess }: { 
  communityId: string, 
  communityDetails: any,
  onClose: () => void,
  onDeleteSuccess?: () => void
}) {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'edit'>('requests');
  const [isPending, startTransition] = useTransition();

  // Edit Form State
  const [editData, setEditData] = useState({
    name: initialDetails?.name || "",
    description: initialDetails?.description || "",
    imageUrl: initialDetails?.imageUrl || "",
    isPrivate: initialDetails?.isPrivate || false,
    tags: initialDetails?.tags || ["genel"]
  });

  const COMMUNITY_TAGS = ["altın", "kripto", "bes", "faiz", "ekonomi", "genel", "borsa", "tasarruf"];

  const toggleTag = (tag: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t: string) => t !== tag) : [...prev.tags, tag]
    }));
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateCommunity(communityId, editData);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        router.refresh();
      } catch (error) {
        alert("Güncelleme hatası: " + (error as Error).message);
      }
    });
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

  const setImageUrl = (url: string | null) => {
    setEditData(prev => ({ ...prev, imageUrl: url || "" }));
  };

  useEffect(() => {
    Promise.all([
      getCommunityRequests(communityId),
      getCommunityMembers(communityId)
    ]).then(([reqs, mems]) => {
      setRequests(reqs);
      setMembers(mems);
      setLoading(false);
    });
  }, [communityId]);

  const handleAction = (userId: string, action: 'ACCEPT' | 'REJECT') => {
    startTransition(async () => {
      await handleJoinRequest(communityId, userId, action);
      if (action === 'ACCEPT') {
        const accepted = requests.find(r => r.userId === userId);
        if (accepted) setMembers(prev => [...prev, { ...accepted, role: 'MEMBER' }]);
      }
      setRequests(prev => prev.filter(r => r.userId !== userId));
      router.refresh();
    });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      await removeMember(communityId, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
      setMemberToRemove(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCommunity(communityId);
      onClose();
      onDeleteSuccess?.();
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Custom Delete Community Confirm */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground">Topluluğu Sil?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  TÜM topluluğu silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm içerikler silinecektir.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                <Button onClick={handleDelete} disabled={isPending} className="flex-1 h-12 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20">{isPending ? "Siliniyor..." : "Evet, Sil"}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Remove Member Confirm */}
        {memberToRemove && (
          <div className="absolute inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <UserMinus className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground">Üyeyi Çıkar?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bu üyeyi topluluktan çıkarmak istediğinize emin misiniz?
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setMemberToRemove(null)} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                <Button onClick={() => handleRemove(memberToRemove)} disabled={isPending} className="flex-1 h-12 rounded-2xl font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20">{isPending ? "Çıkarılıyor..." : "Evet, Çıkar"}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Success Message */}
        {showSuccess && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold">Topluluk başarıyla güncellendi!</span>
          </div>
        )}

        <div className="p-6 space-y-6 flex flex-col h-full max-h-[600px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">Topluluk Yönetimi</h2>
            <button onClick={onClose} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground rounded-full transition-all"><X className="h-5 w-5" /></button>
          </div>

          <div className="flex p-1 bg-muted/30 rounded-2xl border border-border/10">
            <button onClick={() => setActiveTab('requests')} className={cn("flex-1 py-2 text-[10px] font-bold rounded-xl transition-all", activeTab === 'requests' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Başvurular ({requests.length})</button>
            <button onClick={() => setActiveTab('members')} className={cn("flex-1 py-2 text-[10px] font-bold rounded-xl transition-all", activeTab === 'members' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Üyeler ({members.length})</button>
            <button onClick={() => setActiveTab('edit')} className={cn("flex-1 py-2 text-[10px] font-bold rounded-xl transition-all", activeTab === 'edit' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Düzenle</button>
          </div>

          <div className="space-y-4 min-h-[300px]">
            {loading ? (
              <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div></div>
            ) : activeTab === 'requests' ? (
              requests.length === 0 ? (
                <p className="text-xs text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">Bekleyen başvuru yok.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {requests.map(r => (
                    <div key={r.userId} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-border/10">
                      <div className="flex items-center gap-3">
                         <Avatar src={r.image} name={r.name} username={r.username} userId={r.userId} size="sm" />
                         <span className="text-xs font-bold">{r.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(r.userId, 'ACCEPT')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20"><Check className="h-4 w-4" /></button>
                        <button onClick={() => handleAction(r.userId, 'REJECT')} className="p-2 bg-rose-500/10 text-rose-600 rounded-full hover:bg-rose-500/20 transition-all"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'members' ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-border/10">
                    <div className="flex items-center gap-3">
                       <Avatar src={m.image} name={m.name} username={m.username} userId={m.userId} size="sm" />
                       <div className="flex flex-col">
                         <span className="text-xs font-bold">{m.name}</span>
                         <span className="text-[10px] text-muted-foreground">{m.role === 'ADMIN' ? 'Kurucu/Admin' : 'Üye'}</span>
                       </div>
                    </div>
                    {m.role !== 'ADMIN' && (
                      <button onClick={() => setMemberToRemove(m.userId)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all">
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4 max-h-[350px] overflow-y-auto pr-2 pb-2 scrollbar-hide">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1">Topluluk Adı</label>
                  <input required value={editData.name} onChange={(e) => setEditData(prev => ({...prev, name: e.target.value}))} className="w-full bg-muted/30 border border-border/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1">Açıklama</label>
                  <textarea value={editData.description} onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))} rows={2} className="w-full bg-muted/30 border border-border/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1">Topluluk Görseli</label>
                  <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/10">
                    {editData.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden group">
                        <img src={editData.imageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setImageUrl(null)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-12 h-12 rounded-lg border border-dashed border-border/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                    <div className="flex-1">
                      <p className="text-[9px] text-muted-foreground leading-tight">Görseli değiştirmek için tıklayın veya yeni bir tane yükleyin.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1">Etiketler</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMUNITY_TAGS.map(tag => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)} className={cn("text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-all", editData.tags.includes(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border/10")}>{tag}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditData(prev => ({...prev, isPrivate: false}))} className={cn("flex-1 p-3 rounded-xl border transition-all text-left", !editData.isPrivate ? "bg-primary/5 border-primary" : "bg-muted/30 border-border/10")}>
                    <div className="flex items-center gap-2"><Globe className={cn("h-3 w-3", !editData.isPrivate ? "text-primary" : "text-muted-foreground")} /><span className={cn("text-[10px] font-bold", !editData.isPrivate ? "text-primary" : "text-foreground")}>Açık</span></div>
                  </button>
                  <button type="button" onClick={() => setEditData(prev => ({...prev, isPrivate: true}))} className={cn("flex-1 p-3 rounded-xl border transition-all text-left", editData.isPrivate ? "bg-primary/5 border-primary" : "bg-muted/30 border-border/10")}>
                    <div className="flex items-center gap-2"><Shield className={cn("h-3 w-3", editData.isPrivate ? "text-primary" : "text-muted-foreground")} /><span className={cn("text-[10px] font-bold", editData.isPrivate ? "text-primary" : "text-foreground")}>Gizli</span></div>
                  </button>
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-10 rounded-xl font-bold bg-primary text-primary-foreground">
                  {isPending ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </form>
            )}
          </div>

          <div className="pt-6 mt-2 border-t border-border/10">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-3.5 bg-rose-500/5 text-rose-500 rounded-2xl hover:bg-rose-500/10 transition-all font-bold text-xs border border-rose-500/10"
            >
              <Trash2 className="h-4 w-4" /> Topluluğu Tamamen Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Feed ─────────────────────────────────────────────────────────
export function BlogFeed({
  initialPosts,
  initialNextCursor,
  currentUserId,
  userRole,
  isBanned,
  mode = "feed",
  profileId,
  initialFeedType = "explore",
  userInterests = [],
}: {
  initialPosts: Post[];
  initialNextCursor: string | null;
  currentUserId: string;
  userRole?: string;
  isBanned?: boolean;
  mode?: "feed" | "profile";
  profileId?: string;
  initialFeedType?: "explore" | "following" | "my-communities";
  userInterests?: string[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMore, startLoadMore] = useTransition();
  const [feedType, setFeedType] = useState<"explore" | "following" | "my-communities">(initialFeedType);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<{ id: string, name: string } | null>(null);
  const [communityDetails, setCommunityDetails] = useState<any>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Filtre ve Sıralama Stateleri
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "most-liked" | "most-commented">("latest");
  const [timeRange, setTimeRange] = useState<"all" | "24h" | "7d" | "30d">("all");
  const [filterByInterests, setFilterByInterests] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const [allDiscoveredTags, setAllDiscoveredTags] = useState<string[]>([
    "#kripto", "#borsa", "#altın", "#bist100", "#hisse", "#yatırım", "#ekonomi", "#finans", "#bist"
  ]);

  useEffect(() => {
    if (posts.length > 0) {
      setAllDiscoveredTags(prev => {
        const currentSet = new Set(prev);
        posts.forEach(p => (p.tags || []).forEach(t => {
          const formatted = t.startsWith("#") ? t : `#${t}`;
          currentSet.add(formatted);
        }));
        return Array.from(currentSet);
      });
    }
  }, [posts]);

  const handleApplyAdvancedFilters = () => {
    if (tagSearch.trim()) {
      const query = tagSearch.trim().toLowerCase();
      const formatted = query.startsWith("#") ? query : `#${query}`;

      setAllDiscoveredTags(prev => {
        if (!prev.some(t => t.toLowerCase() === formatted)) {
          return [formatted, ...prev];
        }
        return prev;
      });

      setActiveTags(prev => {
        if (!prev.some(t => t.toLowerCase() === formatted)) {
          return [...prev, formatted];
        }
        return prev;
      });
    }
    setIsFilterPanelOpen(false);
  };

  const handleToggleInterestsFilter = () => {
    setFilterByInterests(prev => {
      const nextState = !prev;
      if (nextState) {
        const defaultInterests = (userInterests && userInterests.length > 0) ? userInterests : ["#yatırım", "#kripto", "#borsa", "#hisse", "#altın"];
        const formatted = defaultInterests.map(i => i.startsWith("#") ? i.toLowerCase() : `#${i.toLowerCase()}`);
        
        setAllDiscoveredTags(existing => {
          const combined = new Set(existing);
          formatted.forEach(i => combined.add(i));
          return Array.from(combined);
        });
        
        setActiveTags(formatted);
      } else {
        setActiveTags([]);
      }
      return nextState;
    });
  };

  const handleToggleTag = (tag: string) => {
    setActiveTags(prev => {
      const isSelected = prev.includes(tag);
      if (isSelected) {
        const normTag = tag.replace("#", "").toLowerCase();
        if (tagSearch.toLowerCase().replace("#", "") === normTag) {
          setTagSearch("");
        }
        return prev.filter(t => t !== tag);
      } else {
        setTagSearch(tag.replace("#", ""));
        return [...prev, tag];
      }
    });
  };

  const handleCommentAdded = (postId: string, comment: Comment) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, comment] };
      }
      return p;
    }));
  };

  const handleCommentDeleted = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: p.comments.filter(c => c.id !== commentId) };
      }
      return p;
    }));
  };

  const handlePostAdded = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleCommentIdUpdate = (postId: string, tempId: string, realId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          comments: p.comments.map(c => c.id === tempId ? { ...c, id: realId } : c) 
        };
      }
      return p;
    }));
  };

  const handlePostIdUpdate = (tempId: string, realId: string) => {
    setPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: realId } : p));
  };

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        let result;
        if (mode === "profile" && profileId) {
          result = await getProfilePosts(profileId);
        } else if (selectedCommunity) {
          result = await getPosts(currentUserId, undefined, "community", selectedCommunity.id);
        } else {
          result = await getPosts(currentUserId, undefined, feedType as any);
        }

        if (result && result.posts && result.posts.length > 0) {
          setPosts((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = result.posts.filter((p: Post) => !existingIds.has(p.id));
            if (newPosts.length === 0) return prev;
            return [...newPosts.map((p: Post) => ({ ...p, createdAt: new Date(p.createdAt) })), ...prev];
          });
        }
      } catch (error) { console.error("Polling error:", error); }
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [currentUserId, feedType, mode, profileId, selectedCommunity]);

  useEffect(() => {
    if (mode === "profile") return;
    startLoadMore(async () => {
      const result = await getPosts(
        currentUserId, 
        undefined, 
        selectedCommunity ? "community" : (feedType as any), 
        selectedCommunity?.id,
        sortBy as any,
        timeRange as any,
        filterByInterests ? userInterests : undefined,
        activeTags.length > 0 ? activeTags : undefined
      );
      setPosts(result.posts);
      setNextCursor(result.nextCursor);
    });
  }, [sortBy, timeRange, filterByInterests, activeTags, feedType, selectedCommunity, currentUserId, mode, userInterests]);

  const switchFeed = (type: "explore" | "following" | "my-communities") => {
    setFeedType(type);
    setSelectedCommunity(null);
    setCommunityDetails(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", type);
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleSelectCommunity = (id: string, name: string) => {
    setSelectedCommunity({ id, name });
    startLoadMore(async () => {
      const [postsRes, detailsRes] = await Promise.all([
        getPosts(currentUserId, undefined, "community", id, sortBy as any, timeRange as any, filterByInterests ? userInterests : undefined, activeTags.length > 0 ? activeTags : undefined),
        getCommunityDetails(id)
      ]);
      setPosts(postsRes.posts);
      setNextCursor(postsRes.nextCursor);
      setCommunityDetails(detailsRes);
    });
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    startLoadMore(async () => {
      let result;
      if (mode === "profile" && profileId) {
        result = await getProfilePosts(profileId, nextCursor);
      } else {
        result = await getPosts(
          currentUserId, 
          nextCursor, 
          selectedCommunity ? "community" : (feedType as any), 
          selectedCommunity?.id,
          sortBy as any,
          timeRange as any,
          filterByInterests ? userInterests : undefined,
          activeTags.length > 0 ? activeTags : undefined
        );
      }
      if (result) {
        setPosts((prev) => [...prev, ...result.posts]);
        setNextCursor(result.nextCursor);
      }
    });
  };

  const filteredTagsForBar = tagSearch 
    ? allDiscoveredTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase().replace("#", "")))
    : allDiscoveredTags;

  let activeFilterCount = 0;
  if (timeRange !== "all") activeFilterCount++;
  if (filterByInterests) activeFilterCount++;
  if (tagSearch) activeFilterCount++;

  const filtered = posts.filter((p) => {
    const matchesTag = activeTags.length > 0 ? p.tags.some(t => activeTags.includes(t)) : true;
    const matchesSearch = searchQuery 
      ? p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true;
      
    // Tag Search match
    const matchesTagSearchInput = tagSearch
      ? p.tags.some(t => t.toLowerCase().includes(tagSearch.toLowerCase().replace("#", ""))) || p.content.toLowerCase().includes(tagSearch.toLowerCase())
      : true;

    // Time Range match
    let matchesTime = true;
    if (timeRange !== "all") {
      const now = Date.now();
      const postTime = new Date(p.createdAt).getTime();
      if (timeRange === "24h") matchesTime = (now - postTime) <= (24 * 60 * 60 * 1000);
      else if (timeRange === "7d") matchesTime = (now - postTime) <= (7 * 24 * 60 * 60 * 1000);
      else if (timeRange === "30d") matchesTime = (now - postTime) <= (30 * 24 * 60 * 60 * 1000);
    }

    // Filter by Interests match
    let matchesInterests = true;
    if (filterByInterests) {
      const interests = (userInterests && userInterests.length > 0) ? userInterests : ["yatırım", "kripto", "borsa", "hisse", "altın"];
      const normInterests = interests.map(i => i.toLowerCase().replace("#", ""));
      matchesInterests = p.tags.some(t => normInterests.includes(t.toLowerCase().replace("#", "")));
    }

    return matchesTag && matchesSearch && matchesTagSearchInput && matchesTime && matchesInterests;
  }).sort((a, b) => {
    if (a.isAnnouncement !== b.isAnnouncement) {
      return a.isAnnouncement ? -1 : 1;
    }

    if (sortBy === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "most-liked") {
      return b.likeCount - a.likeCount;
    }
    if (sortBy === "most-commented") {
      return b.comments.length - a.comments.length;
    }
    return 0;
  });

  return (
    <div className="space-y-5">
      {mode === "feed" && (
        <div className="flex p-1 bg-muted/30 rounded-2xl border border-border/20">
          {["explore", "following", "my-communities"].map((t: string) => (
            <button key={t} onClick={() => switchFeed(t as any)} className={cn("flex-1 py-2 text-sm font-bold rounded-xl transition-all", feedType === t && !selectedCommunity ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t === "explore" ? "Keşfet" : t === "following" ? "Takip" : "Topluluklar"}
            </button>
          ))}
        </div>
      )}

      {selectedCommunity && (
        <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-5 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedCommunity(null); setCommunityDetails(null); switchFeed("my-communities"); }} className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:scale-110 transition-transform"><ArrowLeft className="h-4 w-4 text-primary" /></button>
            <div>
              <h2 className="text-lg font-black text-foreground">{selectedCommunity.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Topluluk Sayfası</span>
                <span className="text-[10px] font-medium text-muted-foreground">{posts.length} Paylaşım</span>
              </div>
            </div>
          </div>
          {communityDetails?.isAdmin && (
            <Button onClick={() => setIsAdminPanelOpen(true)} variant="ghost" size="sm" className="rounded-xl h-10 px-4 text-primary hover:bg-primary/10 border-primary/20 border"><Settings className="h-4 w-4 mr-2" /> Yönetim</Button>
          )}
        </div>
      )}

      {isAdminPanelOpen && selectedCommunity && (
        <CommunityAdminPanel 
          communityId={selectedCommunity.id} 
          communityDetails={communityDetails}
          onClose={() => setIsAdminPanelOpen(false)} 
          onDeleteSuccess={() => {
            setSelectedCommunity(null);
            setCommunityDetails(null);
            switchFeed("my-communities");
          }}
        />
      )}

      {feedType === "my-communities" && !selectedCommunity && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex justify-between items-center px-1">
             <h2 className="text-lg font-black text-foreground">Topluluklar</h2>
             <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl h-10 px-4 text-xs font-bold bg-primary/10 text-primary border-none hover:bg-primary/20"><Plus className="h-4 w-4 mr-1.5" /> Yeni Kur</Button>
           </div>
           <CommunityDiscovery onSelectCommunity={handleSelectCommunity} />
        </div>
      )}

      {(feedType !== "my-communities" || selectedCommunity) && (
        <>
          <div className="relative">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60" />
             <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={selectedCommunity ? `${selectedCommunity.name} içinde ara...` : "Gönderi veya kullanıcı ara..."} className="w-full pl-10 pr-4 py-3 bg-card border border-border/20 rounded-[20px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-ambient-low transition-all" />
             {searchQuery && (
               <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                 <X className="h-4 w-4" />
               </button>
             )}
          </div>

          <UnifiedFilterAndTagBar 
            availableTags={filteredTagsForBar} 
            activeTags={activeTags} 
            onToggleTag={handleToggleTag}
            onClearTags={() => {
              setActiveTags([]);
              setTagSearch("");
            }}
            filterCount={activeFilterCount}
            onToggleFilter={() => setIsFilterPanelOpen(p => !p)}
            sortBy={sortBy}
            onSelectSort={setSortBy}
            onResetFilters={() => {
              setSortBy("latest");
              setTimeRange("all");
              setFilterByInterests(false);
              setActiveTags([]);
              setTagSearch("");
              setSearchQuery("");
            }}
          />

          {isFilterPanelOpen && typeof document !== "undefined" && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsFilterPanelOpen(false)}>
              <div className="bg-card border border-primary/20 rounded-[28px] w-full max-w-md shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                 <div className="flex items-center justify-between border-b border-border/10 pb-3">
                   <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                     <SlidersHorizontal className="h-4 w-4" /> Gelişmiş Filtre
                   </span>
                   <div className="flex items-center gap-2">
                     {activeFilterCount > 0 && (
                       <button onClick={() => { setTimeRange("all"); setFilterByInterests(false); setTagSearch(""); setActiveTags([]); }} className="text-[11px] font-bold text-rose-500 hover:underline">Sıfırla</button>
                     )}
                     <button onClick={() => setIsFilterPanelOpen(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-full"><X className="h-4 w-4" /></button>
                   </div>
                 </div>

                 <div className="space-y-5">
                   <div className="space-y-2">
                     <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Zaman Aralığı</label>
                     <div className="grid grid-cols-2 gap-2">
                       {[
                         { id: "all", label: "Tüm Zamanlar" },
                         { id: "24h", label: "Son 24 Saat" },
                         { id: "7d", label: "Son 7 Gün" },
                         { id: "30d", label: "Son 30 Gün" }
                       ].map(t => (
                         <button 
                           key={t.id}
                           onClick={() => setTimeRange(t.id as any)}
                           className={cn("py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all", timeRange === t.id ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20" : "bg-muted/30 text-muted-foreground border-border/20 hover:border-primary/40")}
                         >
                           {t.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="pt-1">
                     <button 
                       onClick={handleToggleInterestsFilter} 
                       className={cn("w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all", filterByInterests ? "bg-primary/10 border-primary shadow-sm" : "bg-muted/20 border-border/20")}
                     >
                       <div className="flex items-center gap-2.5">
                         <Sparkles className={cn("h-4 w-4", filterByInterests ? "text-primary" : "text-muted-foreground")} />
                         <span className="text-xs font-bold text-foreground">Sadece ilgi alanlarımı göster</span>
                       </div>
                       {filterByInterests ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                     </button>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Etiket Ara</label>
                     <div className="relative">
                       <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                       <input value={tagSearch} onChange={e => setTagSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleApplyAdvancedFilters(); }} placeholder="Etiket yaz ve Enter'a bas..." className="w-full pl-10 pr-8 py-3 bg-muted/30 border border-border/20 rounded-2xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                       {tagSearch && <button onClick={() => setTagSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}
                     </div>
                   </div>
                 </div>

                 <Button onClick={handleApplyAdvancedFilters} className="w-full h-11 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                   Filtreleri Uygula
                 </Button>
              </div>
            </div>,
            document.body
          )}

          {isBanned ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-[24px] p-6 text-center animate-in fade-in duration-500">
              <Ban className="h-8 w-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-600 font-bold text-sm">Hesabınız kuralları ihlal ettiği için askıya alınmıştır.</p>
              <p className="text-rose-500/60 text-[11px] mt-1">Paylaşım yapma yetkiniz kısıtlanmıştır.</p>
            </div>
          ) : (
            <CreatePostBox 
              currentUserId={currentUserId} 
              communityId={selectedCommunity?.id} 
              communityName={selectedCommunity?.name} 
              userRole={userRole}
              onPostAdded={handlePostAdded}
              onPostIdUpdate={handlePostIdUpdate}
            />
          )}


          {filtered.length === 0 && !isLoadingMore ? (
            <div className="text-center py-16 bg-card border border-dashed border-border/30 rounded-[24px]">
              <p className="text-5xl mb-4">
                {(selectedCommunity && !communityDetails?.isMember && communityDetails?.isPrivate) ? "🔒" : "💬"}
              </p>
              <p className="font-bold text-foreground text-lg">
                {(selectedCommunity && !communityDetails?.isMember && communityDetails?.isPrivate) 
                  ? `${selectedCommunity.name} Gizli Bir Topluluktur` 
                  : "Henüz paylaşım yok"}
              </p>
              {(selectedCommunity && !communityDetails?.isMember && communityDetails?.isPrivate) && (
                <p className="text-xs text-muted-foreground mt-1">İçerikleri görmek için üye olmalısın.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId} 
                  onTagClick={handleToggleTag} 
                  onCommunityClick={handleSelectCommunity}
                  onCommentAdded={handleCommentAdded}
                  onCommentDeleted={handleCommentDeleted}
                  onPostDeleted={handlePostDeleted}
                  onCommentIdUpdate={handleCommentIdUpdate}
                />
              ))}
            </div>
          )}

          {nextCursor && activeTags.length === 0 && !searchQuery && (
            <div className="flex justify-center pt-2">
              <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline" className="rounded-full px-8 h-10 font-bold">
                {isLoadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
              </Button>
            </div>
          )}
        </>
      )}

      <CommunityCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
