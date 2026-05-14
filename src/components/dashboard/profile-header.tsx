"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/actions/blog";
import { cn } from "@/lib/utils";
import { Users, BookOpen, UserPlus, UserMinus } from "lucide-react";
import Image from "next/image";

interface ProfileHeaderProps {
  profile: {
    id: string;
    name: string;
    imageUrl: string;
    followerCount: number;
    followingCount: number;
    postCount: number;
    isMe: boolean;
  };
  initialIsFollowing: boolean;
}

export function ProfileHeader({ profile, initialIsFollowing }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [isPending, startTransition] = useTransition();

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
            <div className="pb-2">
              <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
                {profile.name}
              </h1>
              <p className="text-sm text-muted-foreground opacity-70">
                Topluluk Üyesi
              </p>
            </div>
          </div>

          {/* Follow Button */}
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

        {/* Stats */}
        <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border/10">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-black text-foreground">{profile.postCount}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              <BookOpen className="w-3 h-3" />
              Gönderi
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-black text-foreground">{followerCount}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              <Users className="w-3 h-3" />
              Takipçi
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-black text-foreground">{profile.followingCount}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              <Users className="w-3 h-3" />
              Takip
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
