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

  let where: any = {};
  
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

  // Basit randomizasyon (Eğer limit varsa ve random istenmişse)
  if (params?.random && communities.length > 0) {
    communities = communities.sort(() => 0.5 - Math.random()).slice(0, params.limit || 2);
  }

  return communities.map(c => ({
    ...c,
    isMember: c.members && c.members.length > 0 && c.members[0].status === "ACCEPTED",
    isPending: c.members && c.members.length > 0 && c.members[0].status === "PENDING",
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
  
  const isMember = community.members && community.members.length > 0 && community.members[0].status === "ACCEPTED";
  
  // Gizli topluluklarda üye olmayan sadece ismi görebilsin (postları göremesin)
  // Bu kontrol frontend'de yapılacak ama veriyi burada kısıtlayabiliriz.

  const clerk = await clerkClient();
  const creatorClerk = await clerk.users.getUser(community.creator.clerkUserId);

  return {
    ...community,
    isMember,
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

  // İstek atılan toplulukta admin miyiz?
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
