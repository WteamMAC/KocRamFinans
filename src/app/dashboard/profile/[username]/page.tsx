import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getUserProfile, getProfilePosts, getFollowStatus } from "@/app/actions/blog";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { BlogFeed } from "@/components/dashboard/blog-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Award, TrendingUp, Users, Pen } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/");

  // Mevcut kullanıcının rolünü al
  const me = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, role: true, isBanned: true }
  });

  const profile = await getUserProfile(username);
  if (!profile) notFound();

  const isFollowing = await getFollowStatus(profile.id);
  const { posts, nextCursor } = await getProfilePosts(profile.id);

  const interactionScore = (profile.postCount * 10) + (profile.followerCount * 5) + (profile.followingCount * 2);

  let investorLevel = "Çırak";
  if (interactionScore > 500) investorLevel = "Finans Balinası";
  else if (interactionScore > 200) investorLevel = "Usta Yatırımcı";
  else if (interactionScore > 50) investorLevel = "Deneyimli";

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 md:pt-10 bg-background min-h-screen relative overflow-x-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto space-y-10 relative">
        {/* Profile Header Block */}
        <ProfileHeader 
          profile={profile} 
          initialIsFollowing={isFollowing} 
          currentUserRole={me?.role}
        />

        {/* Dashboard Style Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden bg-card border-border/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
            <div className="absolute -right-4 -top-4 p-8 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Topluluk Seviyesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-primary">{investorLevel}</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></div>
                <span className="text-[10px] font-bold text-muted-foreground opacity-60">Etkileşim Puanı: {interactionScore}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card border-border/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
            <div className="absolute -right-4 -top-4 p-8 bg-emerald-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" /> Ağ Büyüklüğü
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">{profile.followerCount + profile.followingCount}</div>
              <div className="mt-3 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Toplam Bağlantı
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card border-border/20 shadow-ambient-medium hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
            <div className="absolute -right-4 -top-4 p-8 bg-indigo-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Pen className="h-4 w-4 text-indigo-500" /> İçerik Üretimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">{profile.postCount}</div>
              <div className="mt-3 text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Aktif Paylaşım
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-primary border-none shadow-ambient-high hover:shadow-ambient-high transition-all duration-300 group rounded-[24px]">
            <div className="absolute -right-4 -top-4 p-8 bg-primary-foreground/10 rounded-full group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4" /> Hesap Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-primary-foreground">
                {profile.isBanned ? "Askıya Alındı" : "Aktif"}
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                {!profile.isBanned && <TrendingUp className="h-3 w-3" />}
                {!profile.isBanned ? "Sistemde Onaylı" : "Kısıtlanmış Hesap"}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Feed Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-2 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
              <h2 className="text-2xl font-black text-foreground tracking-tight">Kullanıcı Paylaşımları</h2>
            </div>
            <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-40 px-4 py-2 bg-muted/50 rounded-xl">
              {profile.postCount} İçerik Bulundu
            </div>
          </div>
          
          <div className="bg-card/40 backdrop-blur-xl rounded-[40px] p-4 md:p-8 border border-border/20 shadow-ambient-medium">
            <BlogFeed 
              initialPosts={posts} 
              initialNextCursor={nextCursor} 
              currentUserId={profile.id} 
              userRole={me?.role}
              isBanned={me?.isBanned}
              mode="profile"
              profileId={profile.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
