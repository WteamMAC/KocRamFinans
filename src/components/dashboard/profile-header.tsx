"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow, toggleUserBan, updateBio, updateProfile, getUserFollowers, getUserFollowing } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Users, BookOpen, UserPlus, ShieldAlert, Ban, Pencil, Check, X, MessageCircle, AtSign, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { MessageModal } from "./message-modal";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

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
  const [followingCount, setFollowingCount] = useState(profile.followingCount);
  const [unfollowTarget, setUnfollowTarget] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioContent, setBioContent] = useState(profile.bio || "");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followList, setFollowList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editUsername, setEditUsername] = useState(profile.username || "");
  const [editError, setEditError] = useState<string | null>(null);

  // Custom confirm & alert state
  const [showBanModal, setShowBanModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user } = useUser();
  const router = useRouter();

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
    setShowBanModal(true);
  };

  const confirmBan = () => {
    setShowBanModal(false);
    startTransition(async () => {
      try {
        await toggleUserBan(profile.id);
        setSuccessMessage(`Kullanıcı başarıyla ${profile.isBanned ? 'aktif edildi' : 'engellendi'}.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "İşlem başarısız");
        setTimeout(() => setErrorMessage(null), 4000);
      }
    });
  };

  const handleUpdateBio = () => {
    startTransition(async () => {
      try {
        await updateBio(bioContent);
        setIsEditingBio(false);
        setSuccessMessage("Biyografi başarıyla güncellendi.");
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Hata oluştu");
        setTimeout(() => setErrorMessage(null), 4000);
      }
    });
  };

  const handleUpdateProfile = () => {
    setEditError(null);
    startTransition(async () => {
      try {
        const result = await updateProfile({ bio: editBio, username: editUsername });
        setIsEditModalOpen(false);
        setSuccessMessage("Profil başarıyla güncellendi!");
        setTimeout(() => setSuccessMessage(null), 4000);
        // Navigate to new username if changed
        if (result?.username && result.username !== profile.username) {
          router.push(`/dashboard/profile/${result.username}`);
        } else {
          router.refresh();
        }
      } catch (error) {
        setEditError(error instanceof Error ? error.message : "Güncelleme başarısız.");
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
      {/* Success / Error Banners */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <X className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      <div className="bg-card/40 backdrop-blur-xl border border-border/20 rounded-[40px] overflow-hidden shadow-ambient-medium animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="px-6 md:px-16 pb-10 pt-8 md:pt-12 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
            <div className="flex flex-row items-start gap-4 md:gap-8">
              {/* Avatar Container */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 md:w-40 md:h-40 relative rounded-3xl md:rounded-[36px] p-1.5 bg-gradient-to-br from-primary/50 to-purple-500/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <div className="w-full h-full relative rounded-[24px] md:rounded-[32px] border-2 md:border-4 border-card bg-muted overflow-hidden">
                    {profile.imageUrl ? (
                      <Image src={profile.imageUrl} alt={profile.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-4xl md:text-5xl font-black">
                        {profile.name[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="pb-2 flex flex-col">
                <div className="pt-2 md:pt-2 flex flex-col gap-2 md:gap-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                      {profile.name}
                    </h1>
                    {profile.isBanned && (
                      <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                        Banned
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-1 md:mt-0">
                    {profile.username && (
                      <span className="text-xs md:text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-xl border border-primary/10 leading-none">
                        @{profile.username}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-none">
                      Finansal Profil
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 md:mt-8 max-w-lg min-h-[40px] md:min-h-[60px]">
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
                    <div className="group relative pr-4 md:pr-8">
                      <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-medium line-clamp-3 md:line-clamp-none">
                        {profile.bio || (profile.isMe ? "Biyografi ekleyin..." : "Açıklama yok.")}
                      </p>
                      {profile.isMe && (
                        <button 
                          onClick={() => setIsEditingBio(true)}
                          className="absolute right-0 top-0 p-1.5 opacity-0 group-hover:opacity-100 transition-all text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Group */}
            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 mt-0 md:mt-0">
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
                      <Button
                        onClick={() => {
                          setEditBio(profile.bio || "");
                          setEditUsername(profile.username || "");
                          setEditError(null);
                          setIsEditModalOpen(true);
                        }}
                        variant="outline"
                        className="rounded-[20px] px-6 h-12 text-xs font-bold border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Profili Düzenle
                      </Button>
                    </>
                 )}
               </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:gap-12 mt-10 pt-10 border-t border-border/10">
            <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-4 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col items-center md:flex-start">
                <span className="text-lg md:text-xl font-black text-foreground">{profile.postCount}</span>
                <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Gönderi</span>
              </div>
            </div>

            <button onClick={openFollowers} className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-4 group transition-all hover:translate-y-[-2px]">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <span className="text-lg md:text-xl font-black text-foreground group-hover:text-primary transition-colors">{followerCount}</span>
                <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Takipçi</span>
              </div>
            </button>

            <button onClick={openFollowing} className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-4 group transition-all hover:translate-y-[-2px]">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 transition-transform group-hover:scale-110">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <span className="text-lg md:text-xl font-black text-foreground group-hover:text-primary transition-colors">{followingCount}</span>
                <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Takip</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <MessageModal 
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        initialTargetUsername={profile.isMe ? null : profile.username}
        currentUsername={user?.username || ""}
      />

      {/* === Edit Profile Modal === */}
      {isEditModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-card border border-border/20 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

            {/* Header */}
            <div className="p-6 md:p-8 pb-5 border-b border-border/10 flex items-center justify-between bg-gradient-to-b from-primary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-foreground">Profili Düzenle</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Kullanıcı adı ve biyografinizi güncelleyin.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-5">
              {/* Avatar preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/10">
                <div className="w-14 h-14 relative rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20">
                  {profile.imageUrl ? (
                    <Image src={profile.imageUrl} alt={profile.name} fill className="object-cover" />
                  ) : (
                    <span className="text-primary font-black text-xl">{profile.name[0]}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">Profil fotoğrafı Clerk üzerinden değiştirilebilir.</p>
                </div>
              </div>

              {/* Username field */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Kullanıcı Adı</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    placeholder="kullanici_adi"
                    maxLength={30}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/30 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground pl-1">Sadece harf, rakam ve alt çizgi (_). Min 3, max 30 karakter.</p>
              </div>

              {/* Bio field */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Biyografi</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Kendinizden ve finansal hedeflerinizden bahsedin..."
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/30 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="flex justify-end">
                  <span className={cn("text-[10px] font-bold", editBio.length > 140 ? "text-amber-500" : "text-muted-foreground/50")}>
                    {editBio.length} / 160
                  </span>
                </div>
              </div>

              {/* Error message */}
              {editError && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                  <X className="w-4 h-4 shrink-0" />
                  {editError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="h-11 px-6 rounded-xl font-bold text-sm"
              >
                Vazgeç
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={isPending}
                className="h-11 px-8 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
              >
                {isPending ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</span>
                ) : (
                  <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Kaydet</span>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Ban User Modal */}
      {showBanModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground">
                  {profile.isBanned ? "Kullanıcı Banını Kaldır?" : "Kullanıcıyı Banla?"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kullanıcıyı <span className="font-bold text-foreground">{profile.name}</span> {profile.isBanned ? 'banını kaldırmak' : 'banlamak'} istediğinize emin misiniz?
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowBanModal(false)} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                <Button onClick={confirmBan} className="flex-1 h-12 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20">Evet, Onayla</Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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
                    <div 
                      key={u.id} 
                      className="flex items-center justify-between p-4 bg-muted/20 hover:bg-primary/5 rounded-3xl border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <Link 
                        href={`/dashboard/profile/${u.username}`}
                        onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                        className="flex items-center gap-4 flex-grow cursor-pointer"
                      >
                        <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shadow-inner shrink-0">
                          {u.imageUrl ? (
                            <Image src={u.imageUrl} alt={u.name} fill className="object-cover" />
                          ) : (
                            <span className="text-primary font-black text-lg shrink-0">{u.name[0]}</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">{u.name}</span>
                          <span className="text-[11px] font-bold text-muted-foreground truncate">@{u.username}</span>
                        </div>
                      </Link>
                      {showFollowing && profile.isMe ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setUnfollowTarget({ id: u.id, name: u.name });
                          }}
                          className="h-9 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 shrink-0"
                        >
                          Bırak
                        </button>
                      ) : (
                        <Link 
                          href={`/dashboard/profile/${u.username}`}
                          onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                          className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shrink-0"
                        >
                          <UserPlus className="h-4 w-4 text-primary" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unfollow Confirmation Modal */}
      {unfollowTarget && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                <UserPlus className="h-8 w-8 rotate-45" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground">
                  Takibi Bırak?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">{unfollowTarget.name}</span> kullanıcısını takipten çıkarmak istediğinize emin misiniz?
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setUnfollowTarget(null)} className="flex-1 h-12 rounded-2xl font-bold hover:bg-muted">Vazgeç</Button>
                <Button 
                  onClick={async () => {
                    const targetId = unfollowTarget.id;
                    setUnfollowTarget(null);
                    startTransition(async () => {
                      try {
                        await toggleFollow(targetId);
                        setFollowList(prev => prev.filter(item => item.id !== targetId));
                        setFollowingCount(prev => Math.max(0, prev - 1));
                        setSuccessMessage("Kullanıcı takipten çıkarıldı.");
                        setTimeout(() => setSuccessMessage(null), 4000);
                        router.refresh();
                      } catch (error) {
                        setErrorMessage("İşlem başarısız.");
                        setTimeout(() => setErrorMessage(null), 4000);
                      }
                    });
                  }} 
                  className="flex-1 h-12 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                >
                  Evet, Bırak
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
