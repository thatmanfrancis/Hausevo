import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LandlordTenancyDetailClient from "./LandlordTenancyDetailClient";

export default async function LandlordTenancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const tenancy = await prisma.tenancy.findUnique({
    where: { id },
    select: {
      id: true, status: true, startDate: true, endDate: true,
      cautionDeposit: true, savingsGoal: true, currentSaved: true,
      isJoint: true, createdAt: true,
      property: {
        select: {
          id: true, title: true, address: true, lga: true,
          landlordId: true, pricePerYear: true,
          images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
        },
      },
      tenant: {
        select: {
          id: true, fullName: true, email: true, phoneNumber: true,
          verificationTier: true,
          shackScore: { select: { score: true } },
        },
      },
      rentSchedules: {
        select: {
          id: true, dueDate: true, amount: true,
          frequency: true, status: true, paidAt: true,
        },
        orderBy: { dueDate: "asc" },
      },
      agreement: {
        select: {
          id: true, status: true,
          tenantSigned: true, tenantSignedAt: true,
          ownerSigned: true, ownerSignedAt: true,
          content: true,
        },
      },
      movingOrder: {
        select: {
          id: true, scheduledDate: true, status: true,
          pickupAddress: true, deliveryAddress: true,
          providerName: true, price: true,
        },
      },
    },
  });

  if (!tenancy) notFound();
  // Only the landlord of the property can view this
  if (tenancy.property.landlordId !== session.user.id) redirect("/landlord/tenancies");

  return <LandlordTenancyDetailClient tenancy={tenancy as any} />;
}
