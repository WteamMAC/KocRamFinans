import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProfileRedirectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { username: true },
  });

  if (!user || !user.username) redirect("/onboarding");

  redirect(`/dashboard/profile/${user.username}`);
}
