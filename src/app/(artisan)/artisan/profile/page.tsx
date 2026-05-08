import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ArtisanCategory } from "@/generated/prisma/enums";
import ArtisanProfileClient from "./ArtisanProfileClient";

export default async function ArtisanProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const artisanProfile = await prisma.artisanProfile.findUnique({
    where: { userId: session.user.id },
  });

  const categories = Object.values(ArtisanCategory);

  return (
    <ArtisanProfileClient 
      profile={artisanProfile as any} 
      categories={categories} 
      userId={session.user.id}
    />
  );
}
