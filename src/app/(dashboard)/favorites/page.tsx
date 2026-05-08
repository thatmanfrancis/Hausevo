import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const savedProperties = await prisma.savedProperty.findMany({
    where: { tenantId: session.user.id },
    include: {
      property: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          landlord: {
            select: { id: true, fullName: true, verificationTier: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <FavoritesClient initialFavorites={savedProperties as any} session={session} />;
}
