"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireArtisan() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.roles.includes("ARTISAN")) throw new Error("Forbidden");
  
  return user.id;
}

export async function updateArtisanProfile(data: any) {
  try {
    const userId = await requireArtisan();
    
    const profile = await prisma.artisanProfile.upsert({
      where: { userId },
      create: {
        userId,
        category: data.category,
        yearsOfExperience: parseInt(data.yearsOfExperience),
        startingPrice: parseFloat(data.startingPrice),
        bio: data.bio,
      },
      update: {
        category: data.category,
        yearsOfExperience: parseInt(data.yearsOfExperience),
        startingPrice: parseFloat(data.startingPrice),
        bio: data.bio,
      }
    });

    revalidatePath("/artisan/profile");
    revalidatePath("/artisan/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update profile" };
  }
}
