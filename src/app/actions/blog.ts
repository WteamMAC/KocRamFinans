"use server";

import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getInternalUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId } });
}

export async function createPost(content: string, tags: string[], imageUrl?: string, communityId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  await prisma.blogPost.create({
    data: { 
      authorId: user.id, 
      content, 
      tags, 
      imageUrl,
      communityId 
    },
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

export async function getPosts(
  currentInternalUserId?: string, 
  cursor?: string, 
  type: "explore" | "following" | "community" = "explore",
  communityId?: string
) {
  const PAGE_SIZE = 10;

  let whereClause: any = {};

  if (type === "following" && currentInternalUserId) {
    const following = await prisma.follow.findMany({
      where: { followerId: currentInternalUserId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    whereClause = { authorId: { in: followingIds } };
  } else if (type === "community" && communityId) {
    whereClause = { communityId };
  } else {
    // Keşfet kısmında topluluk postlarını gizleyelim mi? 
    // Kullanıcı aksini belirtmediği sürece genel feed'de topluluk postlarını da görebilir (eğer topluluk gizli değilse)
    whereClause = {
      OR: [
        { communityId: null },
        { community: { isPrivate: false } },
        ...(currentInternalUserId ? [{ community: { members: { some: { userId: currentInternalUserId } } } }] : [])
      ]
    };
  }

  try {
    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, clerkUserId: true } },
        likes: { select: { id: true, userId: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, clerkUserId: true } } },
        },
      },
    });

    const hasMore = posts.length > PAGE_SIZE;
    const pagePosts = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

    const clerkUserIds = [
      ...new Set([
        ...pagePosts.map((p: any) => p.author.clerkUserId),
        ...pagePosts.flatMap((p: any) => p.comments.map((c: any) => c.author.clerkUserId)),
      ]),
    ];

    const clerk = await clerkClient();
    let userMap = new Map();
    
    if (clerkUserIds.length > 0) {
      const clerkUserList = await clerk.users.getUserList({ userId: clerkUserIds, limit: 100 });
      userMap = new Map(clerkUserList.data.map((u) => [u.id, u]));
    }

    const enrichedPosts = pagePosts.map((post: any) => {
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
          ? post.likes.some((l: any) => l.userId === currentInternalUserId)
          : false,
        isMyPost: currentInternalUserId ? post.author.id === currentInternalUserId : false,
        comments: post.comments.map((comment: any) => {
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

    return {
      posts: enrichedPosts,
      nextCursor: hasMore ? pagePosts[pagePosts.length - 1].id : null,
    };
  } catch (error) {
    console.error("getPosts error (Check if DB is pushed):", error);
    return { posts: [], nextCursor: null };
  }
}

export async function toggleFollow(targetInternalUserId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  if (me.id === targetInternalUserId) throw new Error("Kendini takip edemezsin");

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: me.id,
        followingId: targetInternalUserId,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: {
        followerId: me.id,
        followingId: targetInternalUserId,
      },
    });
  }
  revalidatePath("/dashboard/blog");
}

export async function getFollowStatus(targetInternalUserId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return false;
  const me = await getInternalUser(clerkUserId);
  if (!me) return false;

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: me.id,
        followingId: targetInternalUserId,
      },
    },
  });

  return !!follow;
}

export async function getUserProfile(targetInternalUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetInternalUserId },
    include: {
      _count: {
        select: { followers: true, following: true, blogPosts: true },
      },
    },
  });

  if (!user) return null;

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(user.clerkUserId);

  return {
    id: user.id,
    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Kullanıcı",
    imageUrl: clerkUser.imageUrl,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    postCount: user._count.blogPosts,
    isMe: (await auth()).userId === user.clerkUserId,
  };
}

export async function getProfilePosts(targetInternalUserId: string, cursor?: string) {
  const PAGE_SIZE = 10;

  try {
    const posts = await prisma.blogPost.findMany({
      where: { authorId: targetInternalUserId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, clerkUserId: true } },
        likes: { select: { id: true, userId: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, clerkUserId: true } } },
        },
      },
    });

    const hasMore = posts.length > PAGE_SIZE;
    const pagePosts = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

    const clerkUserIds = [
      ...new Set([
        pagePosts[0]?.author.clerkUserId,
        ...pagePosts.flatMap((p: any) => p.comments.map((c: any) => c.author.clerkUserId)),
      ]),
    ].filter(Boolean) as string[];

    const clerk = await clerkClient();
    let userMap = new Map();
    if (clerkUserIds.length > 0) {
      const clerkUserList = await clerk.users.getUserList({ userId: clerkUserIds, limit: 100 });
      userMap = new Map(clerkUserList.data.map((u) => [u.id, u]));
    }

    const { userId: myClerkId } = await auth();
    const me = myClerkId ? await getInternalUser(myClerkId) : null;

    const enrichedPosts = pagePosts.map((post: any) => {
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
        isLikedByMe: me ? post.likes.some((l: any) => l.userId === me.id) : false,
        isMyPost: me ? post.author.id === me.id : false,
        comments: post.comments.map((comment: any) => {
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
            isMyComment: me ? comment.author.id === me.id : false,
          };
        }),
      };
    });

    return {
      posts: enrichedPosts,
      nextCursor: hasMore ? pagePosts[pagePosts.length - 1].id : null,
    };
  } catch (error) {
    console.error("getProfilePosts error (Check if DB is pushed):", error);
    return { posts: [], nextCursor: null };
  }
}

