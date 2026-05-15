"use server";

import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getInternalUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId } });
}

export async function createCommunity(name: string, description: string, imageUrl?: string, isPrivate: boolean = false) {
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
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN"
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
  if (community.isPrivate) throw new Error("Bu topluluk gizli, katılım için davet gereklidir");

  await prisma.communityMember.create({
    data: {
      communityId,
      userId: user.id,
      role: "MEMBER"
    }
  });

  revalidatePath("/dashboard/blog");
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

export async function getCommunities() {
  try {
    const { userId: clerkUserId } = await auth();
    const internalUser = clerkUserId ? await getInternalUser(clerkUserId) : null;

    const communities = await prisma.community.findMany({
      where: {
        OR: [
          { isPrivate: false },
          ...(internalUser ? [{ members: { some: { userId: internalUser.id } } }] : [])
        ]
      },
      include: {
        _count: { select: { members: true, posts: true } },
        members: internalUser ? { where: { userId: internalUser.id } } : false
      }
    });

    return communities.map(c => ({
      ...c,
      isMember: c.members && c.members.length > 0,
      memberCount: c._count.members,
      postCount: c._count.posts
    }));
  } catch (error) {
    console.error("getCommunities error (Check if DB is pushed):", error);
    return [];
  }
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
  if (community.isPrivate && (!internalUser || !community.members.length)) {
    throw new Error("Bu topluluk gizlidir");
  }

  const clerk = await clerkClient();
  const creatorClerk = await clerk.users.getUser(community.creator.clerkUserId);

  return {
    ...community,
    isMember: community.members && community.members.length > 0,
    memberCount: community._count.members,
    postCount: community._count.posts,
    creatorName: `${creatorClerk.firstName || ""} ${creatorClerk.lastName || ""}`.trim() || "Kullanıcı",
    creatorImage: creatorClerk.imageUrl
  };
}
