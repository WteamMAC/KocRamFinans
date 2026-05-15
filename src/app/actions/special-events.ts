"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addSpecialEvent(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const title = formData.get("title") as string;
    const dateStr = formData.get("date") as string;

    if (!title || !dateStr) {
      throw new Error("Eksik bilgi");
    }

    const date = new Date(dateStr);

    await prisma.specialEvent.create({
      data: {
        title,
        date,
        isAnnual: true,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding special event:", error);
    return { error: error.message || "Etkinlik eklenirken hata oluştu" };
  }
}

export async function deleteSpecialEvent(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Güvenlik için etkinliğin bu kullanıcıya ait olduğunu kontrol ediyoruz
    const event = await prisma.specialEvent.findUnique({
      where: { id },
    });

    if (!event || event.userId !== user.id) {
      throw new Error("Etkinlik bulunamadı veya yetkiniz yok");
    }

    await prisma.specialEvent.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting special event:", error);
    return { error: error.message || "Etkinlik silinirken hata oluştu" };
  }
}
