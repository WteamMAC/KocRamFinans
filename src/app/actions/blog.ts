"use server";

import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getInternalUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId } });
}

export async function createPost(content: string, tags: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  await prisma.blogPost.create({
    data: { authorId: user.id, content, tags },
  });
  revalidatePath("/dashboard/blog");
}

export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== user.id) throw new Error("Yetki yok");

  await prisma.blogPost.delete({ where: { id: postId } });
  revalidatePath("/dashboard/blog");
}

export async function toggleLike(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  const existing = await prisma.blogLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    await prisma.blogLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.blogLike.create({ data: { postId, userId: user.id } });
  }
  revalidatePath("/dashboard/blog");
}

export async function addComment(postId: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  await prisma.blogComment.create({
    data: { postId, authorId: user.id, content },
  });
  revalidatePath("/dashboard/blog");
}

export async function deleteComment(commentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  const comment = await prisma.blogComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== user.id) throw new Error("Yetki yok");

  await prisma.blogComment.delete({ where: { id: commentId } });
  revalidatePath("/dashboard/blog");
}

export async function getPosts(currentInternalUserId?: string) {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, clerkUserId: true } },
      likes: { select: { id: true, userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, clerkUserId: true } } },
      },
    },
  });

  // Tüm benzersiz Clerk kullanıcı ID'lerini topla
  const clerkUserIds = [
    ...new Set([
      ...posts.map((p) => p.author.clerkUserId),
      ...posts.flatMap((p) => p.comments.map((c) => c.author.clerkUserId)),
    ]),
  ];

  const clerk = await clerkClient();
  const clerkUserList = await clerk.users.getUserList({ userId: clerkUserIds, limit: 100 });
  const userMap = new Map(clerkUserList.data.map((u) => [u.id, u]));

  return posts.map((post) => {
    const clerkUser = userMap.get(post.author.clerkUserId);
    return {
      id: post.id,
      content: post.content,
      tags: post.tags,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      authorId: post.author.id,
      authorName:
        clerkUser
          ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Kullanıcı"
          : "Kullanıcı",
      authorImage: clerkUser?.imageUrl || "",
      likeCount: post.likes.length,
      isLikedByMe: currentInternalUserId
        ? post.likes.some((l) => l.userId === currentInternalUserId)
        : false,
      isMyPost: currentInternalUserId ? post.author.id === currentInternalUserId : false,
      comments: post.comments.map((comment) => {
        const commentUser = userMap.get(comment.author.clerkUserId);
        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          authorId: comment.author.id,
          authorName:
            commentUser
              ? `${commentUser.firstName || ""} ${commentUser.lastName || ""}`.trim() || "Kullanıcı"
              : "Kullanıcı",
          authorImage: commentUser?.imageUrl || "",
          isMyComment: currentInternalUserId
            ? comment.author.id === currentInternalUserId
            : false,
        };
      }),
    };
  });
}
