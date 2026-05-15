"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getInternalUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId } });
}

export async function sendMessage(receiverUsername: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const sender = await getInternalUser(userId);
  if (!sender) throw new Error("Sender not found");

  const receiver = await prisma.user.findUnique({ where: { username: receiverUsername } });
  if (!receiver) throw new Error("Receiver not found");

  // Check if receiver has blocked the sender
  const isBlocked = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: receiver.id,
        blockedId: sender.id
      }
    }
  });

  if (isBlocked) {
    throw new Error("Bu kullanıcıya mesaj gönderemezsiniz.");
  }

  // Check if sender has blocked the receiver
  const hasBlockedReceiver = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: sender.id,
        blockedId: receiver.id
      }
    }
  });

  if (hasBlockedReceiver) {
    throw new Error("Engellediğiniz bir kullanıcıya mesaj gönderemezsiniz.");
  }

  const message = await prisma.message.create({
    data: {
      senderId: sender.id,
      receiverId: receiver.id,
      content
    }
  });

  // Kendi Gelen Kutusunu / Mesajlaşmayı güncelle
  revalidatePath("/dashboard/messages");
  return message;
}

export async function getConversation(receiverUsername: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const currentUser = await getInternalUser(userId);
  if (!currentUser) throw new Error("User not found");

  const otherUser = await prisma.user.findUnique({ where: { username: receiverUsername } });
  if (!otherUser) throw new Error("Other user not found");

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: otherUser.id },
        { senderId: otherUser.id, receiverId: currentUser.id }
      ]
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { username: true } },
      receiver: { select: { username: true } }
    }
  });

  // Karşı taraftan gelen okunmamış mesajları okundu işaretle
  await prisma.message.updateMany({
    where: {
      senderId: otherUser.id,
      receiverId: currentUser.id,
      isRead: false
    },
    data: { isRead: true }
  });

  return messages;
}

export async function toggleBlockUser(usernameToBlock: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const currentUser = await getInternalUser(userId);
  if (!currentUser) throw new Error("User not found");

  const targetUser = await prisma.user.findUnique({ where: { username: usernameToBlock } });
  if (!targetUser) throw new Error("Target user not found");

  if (currentUser.id === targetUser.id) {
    throw new Error("Kendinizi engelleyemezsiniz.");
  }

  const existingBlock = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: currentUser.id,
        blockedId: targetUser.id
      }
    }
  });

  if (existingBlock) {
    // Unblock
    await prisma.userBlock.delete({
      where: { id: existingBlock.id }
    });
  } else {
    // Block
    await prisma.userBlock.create({
      data: {
        blockerId: currentUser.id,
        blockedId: targetUser.id
      }
    });
    
    // Unfollow each other automatically
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: currentUser.id, followingId: targetUser.id },
          { followerId: targetUser.id, followingId: currentUser.id }
        ]
      }
    });
  }

  revalidatePath(`/dashboard/profile/${usernameToBlock}`);
  revalidatePath("/dashboard/messages");
  return { blocked: !existingBlock };
}

export async function getBlockStatus(usernameToCheck: string) {
  const { userId } = await auth();
  if (!userId) return { isBlocked: false, hasBlockedMe: false };
  
  const currentUser = await getInternalUser(userId);
  if (!currentUser) return { isBlocked: false, hasBlockedMe: false };

  const targetUser = await prisma.user.findUnique({ where: { username: usernameToCheck } });
  if (!targetUser) return { isBlocked: false, hasBlockedMe: false };

  const [amIBlocking, areTheyBlocking] = await Promise.all([
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: currentUser.id, blockedId: targetUser.id } }
    }),
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: targetUser.id, blockedId: currentUser.id } }
    })
  ]);

  return {
    isBlocked: !!amIBlocking, // Ben onu engelledim
    hasBlockedMe: !!areTheyBlocking // O beni engelledi
  };
}

export async function getInboxConversations() {
  const { userId } = await auth();
  if (!userId) return [];
  
  const currentUser = await getInternalUser(userId);
  if (!currentUser) return [];

  // Mesajlaştığım tüm kullanıcıları bul (Gönderdiğim veya aldığım)
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id },
        { receiverId: currentUser.id }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, username: true, firstName: true } },
      receiver: { select: { id: true, username: true, firstName: true } }
    }
  });

  const conversationsMap = new Map();

  for (const msg of messages) {
    const otherUser = msg.senderId === currentUser.id ? msg.receiver : msg.sender;
    if (!otherUser || !otherUser.username) continue;

    if (!conversationsMap.has(otherUser.username)) {
      conversationsMap.set(otherUser.username, {
        user: otherUser,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unreadCount: 0
      });
    }

    if (msg.receiverId === currentUser.id && !msg.isRead) {
      conversationsMap.get(otherUser.username).unreadCount++;
    }
  }

  return Array.from(conversationsMap.values());
}
