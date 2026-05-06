import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PropertyDetailClient from "./PropertyDetailClient";

export default async function LandlordPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true, title: true, address: true, lga: true, state: true,
      listingType: true, pricePerYear: true, totalPackage: true,
      rentFrequency: true, status: true, healthScore: true,
      deedVerified: true, priceVerified: true, metadata: true,
      createdAt: true, updatedAt: true,
      landlordId: true,
      images: {
        select: { id: true, url: true, isPrimary: true, order: true },
        orderBy: { order: "asc" },
      },
      applications: {
        select: {
          id: true, status: true, message: true, createdAt: true,
          shackScoreAtApplication: true,
          tenant: {
            select: {
              id: true, fullName: true, verificationTier: true,
              shackScore: { select: { score: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      tenancy: {
        select: {
          id: true, status: true, startDate: true, endDate: true,
          tenant: { select: { id: true, fullName: true } },
          rentSchedules: {
            select: { id: true, dueDate: true, amount: true, status: true },
            orderBy: { dueDate: "asc" },
            take: 3,
          },
        },
      },
      _count: { select: { waitlist: true } },
    },
  });

  if (!property) notFound();
  if (property.landlordId !== session.user.id) redirect("/landlord/properties");

  return <PropertyDetailClient property={property as any} />;
}
