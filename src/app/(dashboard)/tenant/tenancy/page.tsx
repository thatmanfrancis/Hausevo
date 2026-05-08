import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TenancyClient from "./TenancyClient";

export default async function TenancyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const tenancy = await prisma.tenancy.findUnique({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      tenantId: true,
      status: true,
      startDate: true,
      endDate: true,
      cautionDeposit: true,
      savingsGoal: true,
      currentSaved: true,
      isJoint: true,
      createdAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          lga: true,
          state: true,
          pricePerYear: true,
          listingType: true,
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
      rentSchedules: {
        select: {
          id: true,
          dueDate: true,
          amount: true,
          frequency: true,
          status: true,
          paidAt: true,
        },
        orderBy: { dueDate: "asc" },
      },
      agreement: {
        select: {
          id: true,
          status: true,
          tenantSigned: true,
          tenantSignedAt: true,
          ownerSigned: true,
          ownerSignedAt: true,
          content: true,
        },
      },
      movingOrder: {
        select: {
          id: true,
          scheduledDate: true,
          pickupAddress: true,
          deliveryAddress: true,
          status: true,
          providerName: true,
          price: true,
        },
      },
      coTenants: {
        select: {
          id: true,
          fullName: true,
          email: true,
          verificationTier: true,
        },
      },
      conditionReport: {
        select: {
          id: true,
          type: true,
          beforePhotos: true,
          afterPhotos: true,
          notes: true,
          isAcknowledgedByTenant: true,
          isAcknowledgedByOwner: true,
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true },
  });

  return <TenancyClient tenancy={tenancy} userId={session.user.id} walletBalance={user?.walletBalance ?? 0} />;
}
