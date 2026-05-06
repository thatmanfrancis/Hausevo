import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PropertyDetailClient from "./PropertyDetailClient";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      address: true,
      lga: true,
      state: true,
      listingType: true,
      pricePerYear: true,
      totalPackage: true,
      rentFrequency: true,
      metadata: true,
      isBoosted: true,
      deedVerified: true,
      priceVerified: true,
      healthScore: true,
      images: {
        select: { id: true, url: true, isPrimary: true, order: true },
        orderBy: { order: "asc" },
      },
      landlord: {
        select: {
          id: true,
          fullName: true,
          verificationTier: true,
          shackScore: { select: { score: true } },
        },
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { savedBy: true, waitlist: true } },
      createdAt: true,
    },
  });

  if (!property) {
    notFound();
  }

  return <PropertyDetailClient property={property as any} session={session} />;
}
