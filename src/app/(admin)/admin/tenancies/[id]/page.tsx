import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import TenancyDetailClient from "./TenancyDetailClient";

export default async function AdminTenancyDetailPage({
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
      id: true,
      status: true,
      isJoint: true,
      savingsGoal: true,
      currentSaved: true,
      cautionDeposit: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          lga: true,
          pricePerYear: true,
          totalPackage: true,
          listingType: true,
          status: true,
          metadata: true,
          landlord: {
            select: { id: true, fullName: true, email: true, phoneNumber: true, isVerified: true },
          },
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          isVerified: true,
          verificationTier: true,
          roles: true,
          walletBalance: true,
          shackScore: { select: { score: true } },
        },
      },
      coTenants: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          isVerified: true,
          roles: true,
        },
      },
      rentSchedules: {
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          dueDate: true,
          amount: true,
          frequency: true,
          status: true,
          paidAt: true,
        },
      },
      agreement: {
        select: {
          id: true,
          status: true,
          ownerSigned: true,
          ownerSignedAt: true,
          tenantSigned: true,
          tenantSignedAt: true,
          createdAt: true,
        },
      },
      conditionReport: {
        select: {
          id: true,
          type: true,
          notes: true,
          claimedAmount: true,
          isAcknowledgedByTenant: true,
          isAcknowledgedByOwner: true,
          createdAt: true,
        },
      },
      _count: {
        select: { rentSchedules: true, coTenants: true },
      },
    },
  });

  if (!tenancy) notFound();

  return <TenancyDetailClient tenancy={tenancy as any} />;
}
