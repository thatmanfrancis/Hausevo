import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import WaitlistClient from "./WaitlistClient";

export default async function WaitlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const waitlists = await prisma.waitlist.findMany({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      position: true,
      createdAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          lga: true,
          pricePerYear: true,
          listingType: true,
          status: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <WaitlistClient waitlists={waitlists} />;
}
