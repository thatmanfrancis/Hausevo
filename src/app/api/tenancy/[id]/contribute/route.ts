import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/*
  POST /api/tenancy/[id]/contribute
  Co-tenant contributes funds to the primary tenant for rent.
  Body: { amount }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Valid amount is required." },
      { status: 400 },
    );
  }

  // Get tenancy and participants
  const tenancy = await prisma.tenancy.findUnique({
    where: { id },
    select: {
      id: true,
      tenantId: true,
      isJoint: true,
      coTenants: { select: { id: true } },
      property: { select: { title: true } },
    },
  });

  const userId = session.user.id;

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const isCoTenant = tenancy.coTenants.some((ct: any) => ct.id === userId);
  if (!isCoTenant) {
    return NextResponse.json(
      { error: "Only co-tenants can contribute to rent." },
      { status: 403 },
    );
  }

  // Perform wallet transfer in a transaction
  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Check co-tenant balance
      const coTenant = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, fullName: true },
      });

      if (!coTenant || coTenant.walletBalance < amount) {
        throw new Error("Insufficient wallet balance.");
      }

      // 2. Deduct from co-tenant
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      // 3. Add to primary tenant
      await tx.user.update({
        where: { id: tenancy.tenantId },
        data: { walletBalance: { increment: amount } },
      });

      // 4. Create transaction logs for both
      await tx.transaction.create({
        data: {
          userId: userId,
          amount: amount,
          type: "RENT",
          status: "SUCCESS",
          reference: `CONTRIB-${Date.now()}-${userId.slice(-4)}`,
          description: `Rent contribution for ${tenancy.property.title}`,
          toId: tenancy.tenantId,
          tenancyId: tenancy.id,
        },
      });

      await tx.transaction.create({
        data: {
          userId: tenancy.tenantId,
          amount: amount,
          type: "RENT",
          status: "SUCCESS",
          reference: `RECV-${Date.now()}-${tenancy.tenantId.slice(-4)}`,
          description: `Rent contribution from ${coTenant.fullName}`,
          fromId: userId,
          tenancyId: tenancy.id,
        },
      });
    });

    await Promise.all([
      audit({
        actorId: userId,
        action: "PAYMENT",
        entity: "Tenancy",
        entityId: tenancy.id,
        after: { contributionAmount: amount, recipientId: tenancy.tenantId },
        req,
      }),
      notify(
        tenancy.tenantId,
        "Rent contribution received",
        `A co-tenant has contributed ₦${amount.toLocaleString()} towards your joint rent.`,
        "RENT_PAID",
        { tenancyId: tenancy.id },
      ),
    ]);

    return NextResponse.json({ message: "Contribution successful." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process contribution." },
      { status: 400 },
    );
  }
}
