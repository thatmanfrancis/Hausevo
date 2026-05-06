import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SavedClient from "./SavedClient";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const saved = await prisma.savedProperty.findMany({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      createdAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          lga: true,
          state: true,
          pricePerYear: true,
          totalPackage: true,
          listingType: true,
          status: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
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

  return <SavedClient saved={saved} />;
}
