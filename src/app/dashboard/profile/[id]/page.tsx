import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getUserProfile, getProfilePosts, getFollowStatus } from "@/app/actions/blog";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { BlogFeed } from "@/components/dashboard/blog-feed";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/");

  // Mevcut kullanıcının rolünü al
  const me = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true, isBanned: true }
  });

  const profile = await getUserProfile(id);
  if (!profile) notFound();

  const isFollowing = await getFollowStatus(id);
  const { posts, nextCursor } = await getProfilePosts(id);

  return (
    <div className="flex-1 p-6 pt-10 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <ProfileHeader 
          profile={profile} 
          initialIsFollowing={isFollowing} 
          currentUserRole={me?.role}
        />
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-foreground">Paylaşımlar</h2>
          </div>
          
          <BlogFeed 
            initialPosts={posts} 
            initialNextCursor={nextCursor} 
            currentUserId={id} 
            userRole={me?.role}
            isBanned={me?.isBanned}
            mode="profile"
            profileId={id}
          />
        </div>
      </div>
    </div>
  );
}
