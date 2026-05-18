"use server";

import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getInternalUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId } });
}

export async function createCommunity(
  name: string, 
  description: string, 
  tags: string[], 
  imageUrl?: string, 
  isPrivate: boolean = false
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const user = await getInternalUser(clerkUserId);
  if (!user) throw new Error("User not found");

  const community = await prisma.community.create({
    data: {
      name,
      description,
      imageUrl,
      isPrivate,
      tags,
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
          status: "ACCEPTED"
        }
      }
    }
  });

  revalidatePath("/dashboard/blog");
  return community;
}

export async function joinCommunity(communityId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const user = await getInternalUser(clerkUserId);
  if (!user) throw new Error("User not found");

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new Error("Topluluk bulunamadı");

  const existingMember = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: user.id } }
  });

  if (existingMember) {
    if (existingMember.status === "PENDING") throw new Error("Başvurunuz zaten beklemede");
    if (existingMember.status === "ACCEPTED") throw new Error("Zaten üyesiniz");
  }

  await prisma.communityMember.create({
    data: {
      communityId,
      userId: user.id,
      role: "MEMBER",
      status: community.isPrivate ? "PENDING" : "ACCEPTED"
    }
  });

  revalidatePath("/dashboard/blog");
  return community.isPrivate ? "PENDING" : "ACCEPTED";
}

export async function leaveCommunity(communityId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const user = await getInternalUser(clerkUserId);
  if (!user) throw new Error("User not found");

  await prisma.communityMember.delete({
    where: {
      communityId_userId: {
        communityId,
        userId: user.id
      }
    }
  });

  revalidatePath("/dashboard/blog");
}

export async function getCommunities(params?: { 
  query?: string, 
  tag?: string, 
  limit?: number, 
  random?: boolean 
}) {
  const { userId: clerkUserId } = await auth();
  const internalUser = clerkUserId ? await getInternalUser(clerkUserId) : null;

  const where: any = {};
  
  if (params?.query) {
    where.OR = [
      { name: { contains: params.query, mode: 'insensitive' } },
      { description: { contains: params.query, mode: 'insensitive' } }
    ];
  }

  if (params?.tag) {
    where.tags = { has: params.tag };
  }

  let communities = await prisma.community.findMany({
    where,
    take: params?.limit || 100,
    include: {
      _count: { select: { members: true, posts: true } },
      members: internalUser ? { where: { userId: internalUser.id } } : false
    }
  });

  if (params?.random && communities.length > 0) {
    communities = communities.sort(() => 0.5 - Math.random()).slice(0, params.limit || 2);
  }

  return communities.map(c => ({
    ...c,
    isMember: (c.members && c.members.length > 0 && c.members[0].status === "ACCEPTED") || (internalUser?.role === "ADMIN"),
    isPending: c.members && c.members.length > 0 && c.members[0].status === "PENDING",
    isAdmin: (c.members && c.members.length > 0 && c.members[0].role === "ADMIN") || (internalUser?.role === "ADMIN"),
    memberCount: c._count.members,
    postCount: c._count.posts
  }));
}

export async function getCommunityDetails(communityId: string) {
  const { userId: clerkUserId } = await auth();
  const internalUser = clerkUserId ? await getInternalUser(clerkUserId) : null;

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      _count: { select: { members: true, posts: true } },
      members: internalUser ? { where: { userId: internalUser.id } } : false,
      creator: { select: { id: true, clerkUserId: true } }
    }
  });

  if (!community) return null;
  
  const isMember = (community.members && community.members.length > 0 && community.members[0].status === "ACCEPTED") || (internalUser?.role === "ADMIN");
  const isAdmin = (community.members && community.members.length > 0 && community.members[0].role === "ADMIN") || (internalUser?.role === "ADMIN");

  const clerk = await clerkClient();
  const creatorClerk = await clerk.users.getUser(community.creator.clerkUserId);

  return {
    ...community,
    isMember,
    isAdmin,
    isPending: community.members && community.members.length > 0 && community.members[0].status === "PENDING",
    memberCount: community._count.members,
    postCount: community._count.posts,
    creatorName: `${creatorClerk.firstName || ""} ${creatorClerk.lastName || ""}`.trim() || "Kullanıcı",
    creatorImage: creatorClerk.imageUrl
  };
}

export async function handleJoinRequest(communityId: string, targetUserId: string, action: 'ACCEPT' | 'REJECT') {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  const myMemberInfo = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } }
  });

  if (!myMemberInfo || myMemberInfo.role !== "ADMIN") throw new Error("Yetkiniz yok");

  if (action === 'ACCEPT') {
    await prisma.communityMember.update({
      where: { communityId_userId: { communityId, userId: targetUserId } },
      data: { status: "ACCEPTED" }
    });
  } else {
    await prisma.communityMember.delete({
      where: { communityId_userId: { communityId, userId: targetUserId } }
    });
  }

  revalidatePath("/dashboard/blog");
}

export async function getCommunityRequests(communityId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  const myMemberInfo = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } }
  });

  if ((!myMemberInfo || myMemberInfo.role !== "ADMIN") && me.role !== "ADMIN") throw new Error("Yetkiniz yok");

  const requests = await prisma.communityMember.findMany({
    where: { communityId, status: "PENDING" },
    include: { user: { select: { id: true, clerkUserId: true, username: true } } }
  });

  const clerk = await clerkClient();
  const userIds = requests.map(r => r.user.clerkUserId);
  let userMap = new Map();
  
  if (userIds.length > 0) {
    const userList = await clerk.users.getUserList({ userId: userIds });
    userMap = new Map(userList.data.map(u => [u.id, u]));
  }

  return requests.map(r => {
    const u = userMap.get(r.user.clerkUserId);
    return {
      id: r.id,
      userId: r.userId,
      username: r.user.username,
      name: `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "Kullanıcı",
      image: u?.imageUrl || ""
    };
  });
}

export async function getCommunityMembers(communityId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  const members = await prisma.communityMember.findMany({
    where: { communityId, status: "ACCEPTED" },
    include: { user: { select: { id: true, clerkUserId: true, username: true } } }
  });

  const clerk = await clerkClient();
  const userIds = members.map(m => m.user.clerkUserId);
  let userMap = new Map();
  
  if (userIds.length > 0) {
    const userList = await clerk.users.getUserList({ userId: userIds });
    userMap = new Map(userList.data.map(u => [u.id, u]));
  }

  return members.map(m => {
    const u = userMap.get(m.user.clerkUserId);
    return {
      id: m.id,
      userId: m.userId,
      username: m.user.username,
      name: `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "Kullanıcı",
      image: u?.imageUrl || "",
      role: m.role
    };
  });
}

export async function updateCommunity(
  communityId: string,
  data: {
    name?: string;
    description?: string;
    tags?: string[];
    imageUrl?: string;
    isPrivate?: boolean;
  }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new Error("Topluluk bulunamadı");
  
  if (community.creatorId !== me.id && me.role !== "ADMIN") throw new Error("Yetki yok");

  const updated = await prisma.community.update({
    where: { id: communityId },
    data: {
      name: data.name,
      description: data.description,
      tags: data.tags,
      imageUrl: data.imageUrl,
      isPrivate: data.isPrivate
    }
  });

  revalidatePath("/dashboard/blog");
  return updated;
}

export async function deleteCommunity(communityId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new Error("Topluluk bulunamadı");
  
  if (community.creatorId !== me.id && me.role !== "ADMIN") throw new Error("Yetki yok");

  // Topluluğa ait tüm postları ve bunlara bağlı beğeni/yorumları manuel olarak temizle
  const posts = await prisma.blogPost.findMany({
    where: { communityId },
    select: { id: true }
  });
  const postIds = posts.map(p => p.id);

  if (postIds.length > 0) {
    // Beğenileri sil
    await prisma.blogLike.deleteMany({
      where: { postId: { in: postIds } }
    });

    // Yorumları sil
    await prisma.blogComment.deleteMany({
      where: { postId: { in: postIds } }
    });

    // Postları sil
    await prisma.blogPost.deleteMany({
      where: { id: { in: postIds } }
    });
  }

  await prisma.community.delete({ where: { id: communityId } });
  revalidatePath("/dashboard/blog");
}

export async function removeMember(communityId: string, targetUserId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");
  const me = await getInternalUser(clerkUserId);
  if (!me) throw new Error("User not found");

  const myMemberInfo = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } }
  });

  if ((!myMemberInfo || myMemberInfo.role !== "ADMIN") && me.role !== "ADMIN") throw new Error("Yetkiniz yok");
  if (me.id === targetUserId) throw new Error("Kendinizi çıkaramazsınız");

  await prisma.communityMember.delete({
    where: { communityId_userId: { communityId, userId: targetUserId } }
  });

  revalidatePath("/dashboard/blog");
}
