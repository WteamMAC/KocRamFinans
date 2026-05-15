import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getUserProfile, getProfilePosts, getFollowStatus } from "@/app/actions/blog";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { BlogFeed } from "@/components/dashboard/blog-feed";

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

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-2xl mx-auto space-y-12 relative">
        <ProfileHeader 
          profile={profile} 
          initialIsFollowing={isFollowing} 
          currentUserRole={me?.role}
        />
        
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
              <h2 className="text-xl font-black text-foreground tracking-tight">Paylaşımlar</h2>
            </div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              {profile.postCount} İçerik
            </div>
          </div>
          
          <div className="bg-card/30 backdrop-blur-sm rounded-[40px] p-2 border border-border/10">
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
