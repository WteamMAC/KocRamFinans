"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow, toggleUserBan, updateBio, getUserFollowers, getUserFollowing } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Users, BookOpen, UserPlus, UserMinus, ShieldAlert, Ban, Pencil, Check, X, Camera, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { MessageModal } from "./message-modal";

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
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const { user } = useUser();

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
    <div className="relative mb-12">
      {/* Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <div className="bg-card/40 backdrop-blur-xl border border-border/20 rounded-[40px] overflow-hidden shadow-ambient-medium animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Cover Section */}
        <div className="h-48 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-indigo-500/20 to-purple-600/30 animate-pulse-slow" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        
        <div className="px-6 md:px-10 pb-10 -mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
              {/* Avatar Container */}
              <div className="relative group">
                <div className="w-36 h-36 md:w-40 md:h-40 relative rounded-[36px] p-1.5 bg-gradient-to-br from-primary/50 to-purple-500/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <div className="w-full h-full relative rounded-[32px] border-4 border-card bg-muted overflow-hidden">
                    {profile.imageUrl ? (
                      <Image src={profile.imageUrl} alt={profile.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-5xl font-black">
                        {profile.name[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="pb-2 flex flex-col">
                {/* Name & Tags - Kept within the 80px cover area */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-none">
                      {profile.name}
                    </h1>
                    {profile.isBanned && (
                      <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                        Banned
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {profile.username && (
                      <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-xl border border-primary/10 leading-none">
                        @{profile.username}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-none">
                      Finansal Profil
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Bio Section - Pushed below the cover line */}
                <div className="mt-8 max-w-lg min-h-[60px]">
                  {isEditingBio ? (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <textarea
                        value={bioContent}
                        onChange={(e) => setBioContent(e.target.value)}
                        placeholder="Kendinizden ve finansal hedeflerinizden bahsedin..."
                        className="w-full bg-muted/40 border border-border/20 rounded-[20px] p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        rows={3}
                        maxLength={160}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          {bioContent.length} / 160
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => { setIsEditingBio(false); setBioContent(profile.bio || ""); }} 
                            className="h-8 rounded-xl text-xs font-bold px-4"
                          >
                            Vazgeç
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleUpdateBio} 
                            disabled={isPending} 
                            className="h-8 rounded-xl text-xs font-bold px-4 bg-primary shadow-lg shadow-primary/20"
                          >
                            {isPending ? "..." : "Güncelle"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative pr-8">
                      <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-medium">
                        {profile.bio || (profile.isMe ? "Henüz bir biyografi eklemediniz. Profilinizi tamamlamak için ekleyin!" : "Bu kullanıcı henüz bir açıklama eklememiş.")}
                      </p>
                      {profile.isMe && (
                        <button 
                          onClick={() => setIsEditingBio(true)}
                          className="absolute right-0 top-0 p-2 opacity-0 group-hover:opacity-100 transition-all text-primary hover:bg-primary/10 rounded-xl"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Group */}
            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 mt-4 md:mt-0">

               
               <div className="flex items-center gap-3">
                 {currentUserRole === "ADMIN" && !profile.isMe && (
                   <Button
                     onClick={handleBan}
                     disabled={isPending}
                     variant="ghost"
                     className={cn(
                       "rounded-2xl w-12 h-12 p-0 transition-all border border-border/20",
                       profile.isBanned ? "text-emerald-500 hover:bg-emerald-500/10" : "text-rose-500 hover:bg-rose-500/10 shadow-lg shadow-rose-500/5"
                     )}
                   >
                     {profile.isBanned ? <ShieldAlert className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                   </Button>
                 )}

                 {!profile.isMe && (
                   <>
                     <Button
                       onClick={() => setIsMessageModalOpen(true)}
                       variant="outline"
                       className="rounded-[20px] px-4 h-12 text-sm font-bold border-border/20 hover:bg-muted/50 text-foreground transition-all"
                     >
                       <MessageCircle className="h-5 w-5 mr-2" />
                       Mesaj
                     </Button>
                     <Button
                       onClick={handleFollow}
                       disabled={isPending}
                       className={cn(
                         "rounded-[20px] px-8 h-12 text-sm font-black uppercase tracking-widest transition-all active:scale-95",
                         isFollowing 
                           ? "bg-muted/50 border border-border/20 text-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20" 
                           : "bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90"
                       )}
                     >
                       {isPending ? "..." : isFollowing ? "Takibi Bırak" : "Takip Et"}
                     </Button>
                   </>
                 )}
                 
                 {profile.isMe && (
                    <>
                      <Button 
                        onClick={() => setIsMessageModalOpen(true)}
                        variant="outline" 
                        className="rounded-[20px] px-4 h-12 text-xs font-bold border-border/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Mesaj Kutusu
                      </Button>
                      <Button variant="outline" className="rounded-[20px] px-6 h-12 text-xs font-bold border-border/20 hover:bg-muted/50">
                         Profili Düzenle
                      </Button>
                    </>
                 )}
               </div>
            </div>
            
            <MessageModal 
              isOpen={isMessageModalOpen}
              onClose={() => setIsMessageModalOpen(false)}
              initialTargetUsername={profile.isMe ? null : profile.username}
              currentUsername={user?.username || ""}
            />
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 md:gap-12 mt-10 pt-10 border-t border-border/10">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-foreground">{profile.postCount}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Gönderi</span>
              </div>
            </div>

            <button onClick={openFollowers} className="flex items-center gap-4 group transition-all hover:translate-y-[-2px]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{followerCount}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Takipçi</span>
              </div>
            </button>

            <button onClick={openFollowing} className="flex items-center gap-4 group transition-all hover:translate-y-[-2px]">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 transition-transform group-hover:scale-110">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{profile.followingCount}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Takip</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Follow List Dialog */}
      {(showFollowers || showFollowing) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-[40px] w-full max-w-sm shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                   <h2 className="text-2xl font-black text-foreground">
                    {showFollowers ? "Takipçiler" : "Takip Edilenler"}
                  </h2>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                    {followList.length} Kullanıcı
                  </span>
                </div>
                <button 
                  onClick={() => { setShowFollowers(false); setShowFollowing(false); setFollowList([]); }}
                  className="p-3 bg-muted/50 hover:bg-muted rounded-2xl transition-all hover:rotate-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingList ? (
                  <div className="h-60 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Listeleniyor</p>
                  </div>
                ) : followList.length === 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                       <Users className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground opacity-50 italic">Henüz burada kimse yok.</p>
                  </div>
                ) : (
                  followList.map((u) => (
                    <Link 
                      key={u.id} 
                      href={`/dashboard/profile/${u.username}`}
                      onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                      className="flex items-center justify-between p-4 bg-muted/20 hover:bg-primary/5 rounded-3xl border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shadow-inner">
                          {u.imageUrl ? (
                            <Image src={u.imageUrl} alt={u.name} fill className="object-cover" />
                          ) : (
                            <span className="text-primary font-black text-lg">{u.name[0]}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{u.name}</span>
                          <span className="text-[11px] font-bold text-muted-foreground">@{u.username}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
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
