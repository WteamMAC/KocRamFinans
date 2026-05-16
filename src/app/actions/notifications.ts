"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getUserNotifications() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return [];

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationAsRead(id: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return;

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) return;

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true }
  });

  revalidatePath("/dashboard");
}

export async function markAllNotificationsAsRead() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return;

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) return;

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });

  revalidatePath("/dashboard");
}

export async function deleteNotification(id: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return;

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) return;

  await prisma.notification.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/dashboard");
}
