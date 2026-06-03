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

  const [property, similarProperties] = await Promise.all([
    prisma.property.findUnique({
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
        status: true,
        createdAt: true,
      },
    }),
    // Will be populated after we know the property's lga and listingType
    Promise.resolve(null),
  ]);

  if (!property) notFound();

  // Fetch similar properties in the same LGA and listing type, excluding this one
  const similar = await prisma.property.findMany({
    where: {
      id: { not: id },
      lga: property.lga,
      listingType: property.listingType,
      status: "AVAILABLE",
    },
    take: 3,
    orderBy: [{ isBoosted: "desc" }, { healthScore: "desc" }],
    select: {
      id: true,
      title: true,
      address: true,
      lga: true,
      listingType: true,
      pricePerYear: true,
      metadata: true,
      deedVerified: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
  });

  void similarProperties;

  return (
    <PropertyDetailClient
      property={property as any}
      session={session}
      similarProperties={similar as any[]}
    />
  );
}
