import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPosts } from "@/app/actions/blog";
import { BlogFeed } from "@/components/dashboard/blog-feed";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, isBanned: true, interests: true },
  });

  if (!user) redirect("/onboarding");

  // Read tab parameter for initial state
  const resolvedParams = await searchParams;
  const tabParam = typeof resolvedParams.tab === "string" ? resolvedParams.tab : "explore";
  const initialFeedType = (tabParam === "explore" || tabParam === "following" || tabParam === "my-communities")
    ? tabParam
    : "explore";

  const { posts, nextCursor } = await getPosts(user.id, undefined, initialFeedType);
  
  // Takipçi verilerini çek (DB hatasına karşı korumalı)
  let userData = null;
  try {
    userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: { followers: true, following: true }
        }
      }
    });
  } catch (e) {
    console.error("Social stats fetch error (Check if DB is pushed):", e);
  }

  return (
    <div className="flex-1 p-6 pt-10 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary">Topluluk</h1>
            <p className="text-muted-foreground opacity-70 mt-1">
              Finansal deneyimlerinizi paylaşın, birbirinden öğrenin.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 bg-card border border-border/20 p-3 rounded-2xl shadow-ambient-low">
            <div className="text-center px-3 border-r border-border/10">
              <p className="text-lg font-black text-foreground leading-none">{userData?._count.followers || 0}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Takipçi</p>
            </div>
            <div className="text-center px-3">
              <p className="text-lg font-black text-foreground leading-none">{userData?._count.following || 0}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Takip</p>
            </div>
          </div>
        </div>
        <BlogFeed 
          initialPosts={posts} 
          initialNextCursor={nextCursor} 
          currentUserId={user.id} 
          userRole={user.role}
          isBanned={user.isBanned}
          initialFeedType={initialFeedType}
          userInterests={user.interests}
        />
      </div>
    </div>
  );
}
