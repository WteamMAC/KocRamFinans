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

  await prisma.user.update({
    where: { clerkUserId: userId },
    data: {
      firstName:  data.firstName,
      lastName:   data.lastName,
      birthDate:  data.birthDate ? new Date(data.birthDate) : undefined,
      gender:     data.gender,
      currency:   data.currency,
      country:    data.country,
      interests:  data.interests ?? [],
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
