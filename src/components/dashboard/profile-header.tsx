"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow, toggleUserBan, updateBio, getUserFollowers, getUserFollowing } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Users, BookOpen, UserPlus, UserMinus, ShieldAlert, Ban, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string | null;
    name: string;
    imageUrl: string;
    bio?: string | null;
    followerCount: number;
    followingCount: number;
    postCount: number;
    isMe: boolean;
    isBanned: boolean;
  };
  initialIsFollowing: boolean;
  currentUserRole?: string;
}

export function ProfileHeader({ profile, initialIsFollowing, currentUserRole }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [isPending, startTransition] = useTransition();
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioContent, setBioContent] = useState(profile.bio || "");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followList, setFollowList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const handleFollow = () => {
    startTransition(async () => {
      try {
        await toggleFollow(profile.id);
        setIsFollowing(!isFollowing);
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      } catch (error) {
        console.error("Follow error:", error);
      }
    });
  };

  const handleBan = () => {
    if (!confirm(`Kullanıcıyı ${profile.isBanned ? 'banını kaldırmak' : 'banlamak'} istediğinize emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await toggleUserBan(profile.id);
      } catch (error) {
        alert(error instanceof Error ? error.message : "İşlem başarısız");
      }
    });
  };

  const handleUpdateBio = () => {
    startTransition(async () => {
      try {
        await updateBio(bioContent);
        setIsEditingBio(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Hata oluştu");
      }
    });
  };

  const openFollowers = async () => {
    if (!profile.username) return;
    setShowFollowers(true);
    setIsLoadingList(true);
    try {
      const list = await getUserFollowers(profile.username);
      setFollowList(list);
    } finally {
      setIsLoadingList(false);
    }
  };

  const openFollowing = async () => {
    if (!profile.username) return;
    setShowFollowing(true);
    setIsLoadingList(true);
    try {
      const list = await getUserFollowing(profile.username);
      setFollowList(list);
    } finally {
      setIsLoadingList(false);
    }
  };

  return (
    <div className="bg-card border border-border/30 rounded-[32px] overflow-hidden shadow-ambient-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Cover Gradient */}
      <div className="h-32 bg-gradient-to-r from-primary/20 via-pink-500/10 to-purple-500/20" />
      
      <div className="px-8 pb-8 -mt-12 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 relative rounded-[28px] border-4 border-card bg-muted overflow-hidden shadow-xl">
                {profile.imageUrl ? (
                  <Image src={profile.imageUrl} alt={profile.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">
                    {profile.name[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="pb-2 space-y-1">
              <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
                {profile.name}
              </h1>
              <p className="text-sm text-muted-foreground opacity-70 flex items-center gap-2">
                {profile.isBanned ? (
                  <span className="text-rose-500 font-bold flex items-center gap-1">
                    <Ban className="h-3.5 w-3.5" /> Hesabı Askıya Alındı
                  </span>
                ) : (
                  profile.username && <span className="text-primary/70 font-medium">@{profile.username}</span>
                )}
              </p>
              
              {/* Bio Section */}
              <div className="pt-2 max-w-md">
                {isEditingBio ? (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <textarea
                      value={bioContent}
                      onChange={(e) => setBioContent(e.target.value)}
                      placeholder="Kendinizden bahsedin..."
                      className="w-full bg-muted/30 border border-border/20 rounded-xl p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      rows={2}
                      maxLength={160}
                    />
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-muted-foreground font-bold">{bioContent.length}/160</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setBioContent(profile.bio || ""); }} className="h-7 text-[10px] font-bold rounded-lg"><X className="h-3 w-3 mr-1" /> İptal</Button>
                        <Button size="sm" onClick={handleUpdateBio} disabled={isPending} className="h-7 text-[10px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"><Check className="h-3 w-3 mr-1" /> Kaydet</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                      {profile.bio || (profile.isMe ? "Henüz bir açıklama eklemediniz." : "Henüz bir açıklama yok.")}
                    </p>
                    {profile.isMe && (
                      <button 
                        onClick={() => setIsEditingBio(true)}
                        className="absolute -right-6 top-0 p-1 opacity-0 group-hover:opacity-100 transition-all text-primary hover:scale-110"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {currentUserRole === "ADMIN" && !profile.isMe && (
              <Button
                onClick={handleBan}
                disabled={isPending}
                variant="ghost"
                className={cn(
                  "rounded-2xl px-5 h-12 font-bold transition-all border border-border/20",
                  profile.isBanned ? "text-emerald-500 hover:bg-emerald-500/10" : "text-rose-500 hover:bg-rose-500/10"
                )}
              >
                {profile.isBanned ? <ShieldAlert className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                {profile.isBanned ? "Banı Kaldır" : "Kullanıcıyı Banla"}
              </Button>
            )}

            {!profile.isMe && (
              <Button
                onClick={handleFollow}
                disabled={isPending}
                variant={isFollowing ? "outline" : "default"}
                className={cn(
                  "rounded-2xl px-8 h-12 font-bold transition-all active:scale-95",
                  isFollowing ? "border-border/30 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/50" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    İşleniyor...
                  </span>
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Takibi Bırak
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Takip Et
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border/10">
          <div className="flex flex-col items-center md:items-start group cursor-default">
            <span className="text-2xl font-black text-foreground">{profile.postCount}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              <BookOpen className="w-3 h-3" />
              Gönderi
            </div>
          </div>
          <button onClick={openFollowers} className="flex flex-col items-center md:items-start group hover:opacity-70 transition-opacity">
            <span className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">{followerCount}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:text-primary/60 transition-colors">
              <Users className="w-3 h-3" />
              Takipçi
            </div>
          </button>
          <button onClick={openFollowing} className="flex flex-col items-center md:items-start group hover:opacity-70 transition-opacity">
            <span className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">{profile.followingCount}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:text-primary/60 transition-colors">
              <Users className="w-3 h-3" />
              Takip
            </div>
          </button>
        </div>
      </div>

      {/* Follow List Modal */}
      {(showFollowers || showFollowing) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-foreground">
                  {showFollowers ? "Takipçiler" : "Takip Edilenler"}
                </h2>
                <button 
                  onClick={() => { setShowFollowers(false); setShowFollowing(false); setFollowList([]); }}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingList ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-bold text-muted-foreground animate-pulse">Yükleniyor...</p>
                  </div>
                ) : followList.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center px-6">
                    <p className="text-sm font-bold text-muted-foreground/50 italic">Henüz kimse yok.</p>
                  </div>
                ) : (
                  followList.map((u) => (
                    <Link 
                      key={u.id} 
                      href={`/dashboard/profile/${u.username}`}
                      onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                      className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                          {u.imageUrl ? (
                            <Image src={u.imageUrl} alt={u.name} fill className="object-cover" />
                          ) : (
                            <span className="text-primary font-bold">{u.name[0]}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold group-hover:text-primary transition-colors">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">@{u.username}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
