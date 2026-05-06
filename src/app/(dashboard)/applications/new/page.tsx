import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NewApplicationClient from "./NewApplicationClient";

type Props = {
  searchParams: Promise<{ property?: string }>;
};

export default async function NewApplicationPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { property: propertyId } = await searchParams;

  if (!propertyId) redirect("/properties");

  const [property, user, existing] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
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
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verificationTier: true,
        shackScore: { select: { score: true } },
      },
    }),
    prisma.tenancyApplication.findUnique({
      where: {
        propertyId_tenantId: {
          propertyId,
          tenantId: session.user.id,
        },
      },
      select: { id: true, status: true },
    }),
  ]);

  if (!property) redirect("/properties");

  return (
    <NewApplicationClient
      property={property}
      verificationTier={user?.verificationTier ?? 0}
      shackScore={user?.shackScore?.score ?? null}
      existingApplication={existing ?? null}
    />
  );
}
