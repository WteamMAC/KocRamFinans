"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  firstName?: string; lastName?: string; birthDate?: string;
  gender?: string; currency?: string; country?: string; interests?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Oturum açmanız gerekiyor.");

  const updateData: any = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.interests !== undefined) updateData.interests = data.interests;

  await prisma.user.update({
    where: { clerkUserId: userId },
    data: updateData,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

export async function completeTour() {
  const { userId } = await auth();
  if (!userId) return;

  await prisma.user.update({
    where: { clerkUserId: userId },
    data: { hasCompletedTour: true },
  });

  revalidatePath("/dashboard");
}

export async function getTourStatus() {
  const { userId } = await auth();
  if (!userId) return true; // Oturum yoksa gösterme

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { hasCompletedTour: true }
  });

  return user?.hasCompletedTour ?? false;
}
