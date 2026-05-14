import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPosts } from "@/app/actions/blog";
import { BlogFeed } from "@/components/dashboard/blog-feed";

export default async function BlogPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!user) redirect("/onboarding");

  const posts = await getPosts(user.id);

  return (
    <div className="flex-1 p-6 pt-10 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Topluluk</h1>
          <p className="text-muted-foreground opacity-70 mt-1">
            Finansal deneyimlerinizi paylaşın, birbirinden öğrenin.
          </p>
        </div>
        <BlogFeed initialPosts={posts} currentUserId={user.id} />
      </div>
    </div>
  );
}
