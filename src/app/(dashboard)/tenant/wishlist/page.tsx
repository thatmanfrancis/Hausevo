import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import WishlistClient from "./WishlistClient";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const wishlist = await prisma.propertyWishlist.findUnique({
    where: { tenantId: session.user.id },
    select: {
      lga: true,
      maxBudget: true,
      minBedrooms: true,
      isActive: true,
    },
  });

  return <WishlistClient wishlist={wishlist ?? null} />;
}
