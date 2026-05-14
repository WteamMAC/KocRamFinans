"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Trash2, Send, X, ChevronDown } from "lucide-react";
import { createPost, toggleLike, addComment, deletePost, deleteComment } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

const TAGS = ["#yatırım", "#kripto", "#hisse", "#tasarruf", "#borç", "#bes", "#faiz", "#altın", "#bütçe"];

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorImage: string;
  isMyComment: boolean;
};

type Post = {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorImage: string;
  likeCount: number;
  isLikedByMe: boolean;
  isMyPost: boolean;
  comments: Comment[];
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Az önce";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR");
}

// ─── Create Post Box ────────────────────────────────────────────────
function CreatePostBox({ currentUserId }: { currentUserId: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const MAX = 500;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!content.trim() || content.length > MAX) return;
    startTransition(async () => {
      await createPost(content.trim(), selectedTags);
      setContent("");
      setSelectedTags([]);
      router.refresh();
    });
  };

  return (
    <div className="bg-card border border-border/20 rounded-[24px] p-5 shadow-ambient-medium space-y-4">
      <div className="flex gap-3 items-start">
        {user?.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={user.imageUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">{user?.firstName?.[0] || "K"}</span>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Finansal deneyimlerinizi, ipuçlarınızı paylaşın..."
          className="flex-1 bg-muted/30 border border-border/20 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-h-[90px]"
          maxLength={MAX}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              "text-[11px] font-bold px-3 py-1 rounded-full border transition-all duration-200",
              selectedTags.includes(tag)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/20 hover:border-primary/40 hover:text-primary"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className={cn("text-[11px] font-medium", content.length > MAX * 0.9 ? "text-rose-500" : "text-muted-foreground")}>
          {content.length}/{MAX}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !content.trim() || content.length > MAX}
          className="rounded-full px-6 h-9 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-ambient-low"
        >
          <Send className="h-4 w-4 mr-2" />
          {isPending ? "Paylaşılıyor..." : "Paylaş"}
        </Button>
      </div>
    </div>
  );
}

// ─── Comment Section ─────────────────────────────────────────────────
function CommentSection({ post }: { post: Post }) {
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment(post.id, newComment.trim());
      setNewComment("");
      router.refresh();
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      await deleteComment(commentId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/10">
      {post.comments.map((c) => (
        <div key={c.id} className="flex gap-2 items-start group">
          {c.authorImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={c.authorImage} alt={c.authorName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
              {c.authorName[0]}
            </div>
          )}
          <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary">{c.authorName}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground opacity-60">{formatTimeAgo(c.createdAt)}</span>
                {c.isMyComment && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-rose-500 hover:text-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-foreground mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}

      {/* Add comment input */}
      <div className="flex gap-2 items-center">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Yorum yaz..."
          className="flex-1 bg-muted/30 border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newComment.trim()}
          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    // Optimistic update
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    startTransition(async () => {
      await toggleLike(post.id);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm("Bu paylaşımı silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      await deletePost(post.id);
      router.refresh();
    });
  };

  return (
    <div className="bg-card border border-border/20 rounded-[24px] p-5 shadow-ambient-low hover:shadow-ambient-medium transition-all duration-300 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {post.authorImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={post.authorImage} alt={post.authorName} className="w-10 h-10 rounded-full object-cover ring-2 ring-border/30" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {post.authorName[0]}
            </div>
          )}
          <div>
            <p className="font-bold text-sm text-foreground">{post.authorName}</p>
            <p className="text-[11px] text-muted-foreground opacity-60">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        {post.isMyPost && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-sm font-bold transition-all duration-200 group",
            liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
          )}
        >
          <Heart className={cn("h-5 w-5 transition-transform duration-200 group-hover:scale-110", liked && "fill-rose-500")} />
          <span>{likeCount}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments.length}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showComments && "rotate-180")} />
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection post={post} />}
    </div>
  );
}

// ─── Main Feed ───────────────────────────────────────────────────────
export function BlogFeed({ initialPosts, currentUserId }: { initialPosts: Post[]; currentUserId: string }) {
  return (
    <div className="space-y-5">
      <CreatePostBox currentUserId={currentUserId} />

      {initialPosts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border/30 rounded-[24px]">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-bold text-foreground">Henüz paylaşım yok</p>
          <p className="text-sm text-muted-foreground mt-1">İlk paylaşımı sen yap!</p>
        </div>
      ) : (
        initialPosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
