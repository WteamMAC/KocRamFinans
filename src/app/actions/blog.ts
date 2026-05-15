"use server";

import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

async function processAiMentions(content: string, postId: string) {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("@ai") || lowerContent.includes("@bot") || lowerContent.includes("@wteam") || lowerContent.includes("@asistan")) {
    try {
      let aiUser = await prisma.user.findUnique({ where: { clerkUserId: "system_ai_user" } });
      if (!aiUser) {
        aiUser = await prisma.user.create({
          data: {
            clerkUserId: "system_ai_user",
            username: "wteam_ai",
            role: "ADMIN",
            bio: "Wteam Yapay Zeka Asistanı",
          }
        });
      }

      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `Sen Wteam adlı finansal asistan uygulamasında "Wteam AI" isimli bir yapay zekasın. Bir kullanıcı post veya yorumunda senden ("@ai", "@bot" gibi) bahsederek yardım/görüş istiyor veya soru soruyor:\n\nKullanıcı mesajı: "${content}"\n\nLütfen buna profesyonel, samimi ve finansal tavsiye içermeyen (sadece bilgi veren, analiz yapan veya yorumlayan) bir dille, kısa ve öz bir cevap ver.`,
      });

      await prisma.blogComment.create({
        data: {
          postId: postId,
          authorId: aiUser.id,
          content: text
        }
      });
    } catch (e) {
      console.error("AI mention processing error:", e);
    }
  }
}

async function getInternalUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  
  // Eğer username yoksa Clerk'ten çek ve güncelle (Geriye dönük uyumluluk için)
  if (user && !user.username) {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const username = clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split("@")[0];
    
    if (username) {
      return prisma.user.update({
        where: { id: user.id },
        data: { username }
      });
    }
  }
  
  return user;
}

export async function createPost(
  content: string, 
  tags: string[], 
  imageUrl?: string, 
  communityId?: string,
  isAnnouncement: boolean = false
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");
  if (user.isBanned) throw new Error("Hesabınız askıya alındığı için paylaşım yapamazsınız.");

  // Duyuru yetkisi sadece adminlerde
  const announcementFlag = isAnnouncement && user.role === "ADMIN";

  const newPost = await prisma.blogPost.create({
    data: { 
      authorId: user.id, 
      content, 
      tags, 
      imageUrl,
      communityId,
      isAnnouncement: announcementFlag
    },
  });

  // AI etiketlemesi kontrolü
  await processAiMentions(content, newPost.id);

  revalidatePath("/dashboard/blog");
}


export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post bulunamadı");
  
  if (post.authorId !== user.id && user.role !== "ADMIN") throw new Error("Yetki yok");

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

  // AI etiketlemesi kontrolü
  await processAiMentions(content, postId);

  revalidatePath("/dashboard/blog");
}

export async function deleteComment(commentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getInternalUser(userId);
  if (!user) throw new Error("User not found");

  const comment = await prisma.blogComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Yorum bulunamadı");
  
  if (comment.authorId !== user.id && user.role !== "ADMIN") throw new Error("Yetki yok");

  await prisma.blogComment.delete({ where: { id: commentId } });
  revalidatePath("/dashboard/blog");
}

export async function getPosts(
  currentInternalUserId?: string, 
  cursor?: string, 
  type: "explore" | "following" | "my-communities" | "community" = "explore",
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
    whereClause = { authorId: { in: followingIds }, communityId: null };
  } else if (type === "my-communities" && currentInternalUserId) {
    const myCommunities = await prisma.communityMember.findMany({
      where: { userId: currentInternalUserId, status: "ACCEPTED" },
      select: { communityId: true },
    });
    const communityIds = myCommunities.map((c) => c.communityId);
    whereClause = { communityId: { in: communityIds } };
  } else if (type === "community" && communityId) {
    whereClause = { 
      communityId,
      OR: [
        { community: { isPrivate: false } },
        ...(currentInternalUserId ? [{ community: { members: { some: { userId: currentInternalUserId, status: "ACCEPTED" } } } }] : [])
      ]
    };
  } else {
    // Keşfet: Genel postlar (topluluk dışı olanlar ve gizli olmayan topluluk postları)
    whereClause = {
      OR: [
        { communityId: null },
        { community: { isPrivate: false } }
      ]
    };
  }

  const me = currentInternalUserId ? await prisma.user.findUnique({ where: { id: currentInternalUserId }, select: { role: true } }) : null;

  try {
    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: [
        { isAnnouncement: "desc" },
        { createdAt: "desc" }
      ],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, clerkUserId: true, username: true } },
        likes: { select: { id: true, userId: true } },
        community: { select: { id: true, name: true } },
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
        isAnnouncement: post.isAnnouncement,
        createdAt: post.createdAt,
        authorId: post.author.id,
        authorUsername: post.author.username,
        communityId: post.community?.id,
        communityName: post.community?.name,
        authorName:
          post.author.clerkUserId === "system_ai_user" ? "Wteam AI" : (clerkUser
            ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Kullanıcı"
            : "Kullanıcı"),
        authorImage: post.author.clerkUserId === "system_ai_user" ? "https://api.dicebear.com/7.x/bottts/svg?seed=wteam&backgroundColor=10b981" : (clerkUser?.imageUrl || ""),
        likeCount: post.likes.length,
        isLikedByMe: currentInternalUserId
          ? post.likes.some((l: any) => l.userId === currentInternalUserId)
          : false,
        isMyPost: currentInternalUserId ? post.author.id === currentInternalUserId : false,
        isAdmin: me?.role === "ADMIN",
        comments: post.comments.map((comment: any) => {
          const commentUser = userMap.get(comment.author.clerkUserId);
          return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            authorId: comment.author.id,
            authorUsername: comment.author.username,
            authorName:
              comment.author.clerkUserId === "system_ai_user" ? "Wteam AI" : (commentUser
                ? `${commentUser.firstName || ""} ${commentUser.lastName || ""}`.trim() || "Kullanıcı"
                : "Kullanıcı"),
            authorImage: comment.author.clerkUserId === "system_ai_user" ? "https://api.dicebear.com/7.x/bottts/svg?seed=wteam&backgroundColor=10b981" : (commentUser?.imageUrl || ""),
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

export async function getUserProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: username },
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
    username: user.username,
    bio: user.bio,
    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Kullanıcı",
    imageUrl: clerkUser.imageUrl,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    postCount: user._count.blogPosts,
    isMe: (await auth()).userId === user.clerkUserId,
    isBanned: user.isBanned,
  };
}

export async function updateBio(bio: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const user = await getInternalUser(clerkUserId);
  if (!user) throw new Error("User not found");

  if (bio.length > 160) throw new Error("Açıklama 160 karakterden uzun olamaz.");

  await prisma.user.update({
    where: { id: user.id },
    data: { bio }
  });

  revalidatePath(`/dashboard/profile/${user.username}`);
}

export async function getUserFollowers(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      followers: {
        include: {
          follower: {
            select: { id: true, username: true, clerkUserId: true }
          }
        }
      }
    }
  });

  if (!user) return [];

  const clerk = await clerkClient();
  const clerkUserIds = user.followers.map(f => f.follower.clerkUserId);
  
  let userMap = new Map();
  if (clerkUserIds.length > 0) {
    const clerkUsers = await clerk.users.getUserList({ userId: clerkUserIds });
    userMap = new Map(clerkUsers.data.map(u => [u.id, u]));
  }

  return user.followers.map(f => {
    const cu = userMap.get(f.follower.clerkUserId);
    return {
      id: f.follower.id,
      username: f.follower.username,
      name: `${cu?.firstName || ""} ${cu?.lastName || ""}`.trim() || "Kullanıcı",
      imageUrl: cu?.imageUrl || ""
    };
  });
}

export async function getUserFollowing(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      following: {
        include: {
          following: {
            select: { id: true, username: true, clerkUserId: true }
          }
        }
      }
    }
  });

  if (!user) return [];

  const clerk = await clerkClient();
  const clerkUserIds = user.following.map(f => f.following.clerkUserId);
  
  let userMap = new Map();
  if (clerkUserIds.length > 0) {
    const clerkUsers = await clerk.users.getUserList({ userId: clerkUserIds });
    userMap = new Map(clerkUsers.data.map(u => [u.id, u]));
  }

  return user.following.map(f => {
    const cu = userMap.get(f.following.clerkUserId);
    return {
      id: f.following.id,
      username: f.following.username,
      name: `${cu?.firstName || ""} ${cu?.lastName || ""}`.trim() || "Kullanıcı",
      imageUrl: cu?.imageUrl || ""
    };
  });
}

export async function getProfilePosts(targetInternalUserId: string, cursor?: string) {
  const PAGE_SIZE = 10;

  try {
    const posts = await prisma.blogPost.findMany({
      where: { authorId: targetInternalUserId },
      orderBy: [
        { isAnnouncement: "desc" },
        { createdAt: "desc" }
      ],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, clerkUserId: true, username: true } },
        likes: { select: { id: true, userId: true } },
        community: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, clerkUserId: true, username: true } } },
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
        isAnnouncement: post.isAnnouncement,
        createdAt: post.createdAt,
        authorId: post.author.id,
        authorUsername: post.author.username,
        communityId: post.community?.id,
        communityName: post.community?.name,
        authorName:
          post.author.clerkUserId === "system_ai_user" ? "Wteam AI" : (clerkUser
            ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Kullanıcı"
            : "Kullanıcı"),
        authorImage: post.author.clerkUserId === "system_ai_user" ? "https://api.dicebear.com/7.x/bottts/svg?seed=wteam&backgroundColor=10b981" : (clerkUser?.imageUrl || ""),
        likeCount: post.likes.length,
        isLikedByMe: me ? post.likes.some((l: any) => l.userId === me.id) : false,
        isMyPost: me ? post.author.id === me.id : false,
        isAdmin: me ? me.role === "ADMIN" : false,
        comments: post.comments.map((comment: any) => {
          const commentUser = userMap.get(comment.author.clerkUserId);
          return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            authorId: comment.author.id,
            authorUsername: comment.author.username,
            authorName:
              comment.author.clerkUserId === "system_ai_user" ? "Wteam AI" : (commentUser
                ? `${commentUser.firstName || ""} ${commentUser.lastName || ""}`.trim() || "Kullanıcı"
                : "Kullanıcı"),
            authorImage: comment.author.clerkUserId === "system_ai_user" ? "https://api.dicebear.com/7.x/bottts/svg?seed=wteam&backgroundColor=10b981" : (commentUser?.imageUrl || ""),
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

export async function toggleUserBan(targetInternalUserId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me || me.role !== "ADMIN") throw new Error("Bu işlem için yetkiniz yok.");

  const targetUser = await prisma.user.findUnique({ where: { id: targetInternalUserId } });
  if (!targetUser) throw new Error("Kullanıcı bulunamadı.");
  if (targetUser.role === "ADMIN") throw new Error("Başka bir admini banlayamazsınız.");

  await prisma.user.update({
    where: { id: targetInternalUserId },
    data: { isBanned: !targetUser.isBanned }
  });

  revalidatePath(`/dashboard/profile/${targetUser.username}`);
  revalidatePath("/dashboard/blog");
}

