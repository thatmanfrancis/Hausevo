import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/tenancy/:id/escrow
  Tenant locks their caution deposit into Hausevo Escrow at the start of tenancy.
  The deposit cannot be touched by anyone until the tenancy ends and an exit
  inspection is completed.

  Requires: active session + must be the tenant

  Body: { amount, paymentReference }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: tenancyId } = await params;
  const body = await req.json();
  const { amount, paymentReference } = body;

  if (!amount) {
    return NextResponse.json({ error: "amount is required." }, { status: 400 });
  }

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: {
      property: { select: { id: true, title: true, landlordId: true } },
    },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  if (tenancy.tenantId !== userId) {
    return NextResponse.json(
      { error: "Only the tenant can lock the caution deposit." },
      { status: 403 },
    );
  }

  if (tenancy.cautionDeposit === null || tenancy.cautionDeposit <= 0) {
    return NextResponse.json(
      { error: "No caution deposit was set for this tenancy." },
      { status: 400 },
    );
  }

  // Check if escrow transaction already exists
  const existing = await prisma.transaction.findFirst({
    where: { tenancyId, type: "CAUTION_DEPOSIT", status: "ESCROW" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Caution deposit is already held in escrow." },
      { status: 409 },
    );
  }

  // Create the escrow hold transaction
  // "toId" is the landlordId because ultimately the deposit belongs to the landlord
  // but status = ESCROW means it's locked until the platform releases it
  const escrow = await prisma.transaction.create({
    data: {
      userId,
      amount: Number(amount),
      type: "CAUTION_DEPOSIT",
      fromId: userId,
      toId: tenancy.property.landlordId,
      propertyId: tenancy.property.id,
      tenancyId,
      reference: paymentReference ?? `ESC-${Date.now()}`,
      description: `Caution deposit held in Hausevo Escrow for "${tenancy.property.title}"`,
      status: "ESCROW" as const,
    },
    select: {
      id: true,
      amount: true,
      type: true,
      status: true,
      reference: true,
      createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "Transaction",
      entityId: escrow.id,
      after: {
        type: "CAUTION_DEPOSIT",
        status: "ESCROW",
        amount: Number(amount),
        tenancyId,
      },
      req,
    }),
    notify(
      tenancy.property.landlordId,
      "Caution deposit secured 🔒",
      '₦${Number(amount).toLocaleString()} caution deposit for "${tenancy.property.title}" is held in Hausevo Escrow. It will be released after exit inspection.',
      "SYSTEM",
      { tenancyId, escrowId: escrow.id },
    ),
    notify(
      userId,
      "Deposit locked in escrow ✅",
      `Your ₦${Number(amount).toLocaleString()} caution deposit is safely held by Hausevo. You will get it back after your exit inspection is completed.`,
      "SYSTEM",
      { tenancyId, escrowId: escrow.id },
    ),
  ]);

  return NextResponse.json(
    {
      message: "Caution deposit locked in Hausevo Escrow.",
      escrow,
    },
    { status: 201 },
  );
}

/*
  PATCH /api/tenancy/:id/escrow
  Admin releases or forfeit the caution deposit after exit inspection.

  Requires: active session + ADMIN role

  Body: { decision: "RELEASE" | "FORFEIT", reason?, deductionAmount? }
  - RELEASE: full or partial refund to the tenant
  - FORFEIT: landlord keeps all or part of it (for damages)
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { id: tenancyId } = await params;
  const body = await req.json();
  const {
    decision,
    reason,
    deductionAmount = 0,
    moveWithinShack = false,
  } = body;

  if (!["RELEASE", "FORFEIT"].includes(decision)) {
    return NextResponse.json(
      { error: "decision must be RELEASE or FORFEIT." },
      { status: 400 },
    );
  }

  const escrow = await prisma.transaction.findFirst({
    where: { tenancyId, type: "CAUTION_DEPOSIT", status: "ESCROW" },
    include: {
      tenancy: {
        select: {
          tenantId: true,
          property: { select: { id: true, title: true, landlordId: true } },
        },
      },
    },
  });

  if (!escrow) {
    return NextResponse.json(
      { error: "No active escrow found for this tenancy." },
      { status: 404 },
    );
  }

  const tenantId = escrow.tenancy!.tenantId;
  const landlordId = escrow.tenancy!.property.landlordId;
  const propertyTitle = escrow.tenancy!.property.title;
  const propertyId = escrow.tenancy!.property.id;
  const totalDeposit = escrow.amount;
  const deduction = Number(deductionAmount);
  let refundAmount = Math.max(0, totalDeposit - deduction);

  let bondAmount = 0;
  let shackFee = 0;

  if (moveWithinShack && refundAmount > 0) {
    // 80/20 split as requested by USER
    bondAmount = refundAmount * 0.8;
    shackFee = refundAmount * 0.2;
    refundAmount = 0; // The money goes to the bond/next house instead of direct cash refund
  }

  await prisma.$transaction(async (tx: any) => {
    // 1. Mark escrow as settled
    await tx.transaction.update({
      where: { id: escrow.id },
      data: { status: decision === "RELEASE" ? "COMPLETED" : "FAILED" },
    });

    // 2. If there's a deduction, credit the landlord
    if (deduction > 0) {
      await tx.transaction.create({
        data: {
          userId: landlordId,
          amount: deduction,
          type: "CAUTION_DEPOSIT",
          fromId: tenantId,
          toId: landlordId,
          propertyId,
          tenancyId,
          reference: `FORFEIT-${Date.now()}`,
          description: `Deposit deduction for damages: ${reason ?? "No reason given"}`,
          status: "COMPLETED" as const,
        },
      });
      // Credit landlord wallet
      await tx.user.update({
        where: { id: landlordId },
        data: { walletBalance: { increment: deduction } },
      });
    }

    // 3. Handle Rolling Deposit vs Cash Refund
    if (bondAmount > 0) {
      // Add to tenant's accumulated bond for next property
      await tx.user.update({
        where: { id: tenantId },
        data: { accumulatedBond: { increment: bondAmount } },
      });
      // Create record for the bond
      await tx.transaction.create({
        data: {
          userId: tenantId,
          amount: bondAmount,
          type: "BOND_CONTRIBUTION",
          status: "SUCCESS",
          reference: `BOND-${Date.now()}`,
          description: `Rolling deposit from "${propertyTitle}" (80% carried forward)`,
          tenancyId,
        },
      });
    } else if (refundAmount > 0) {
      // Direct cash refund to tenant wallet
      await tx.user.update({
        where: { id: tenantId },
        data: { walletBalance: { increment: refundAmount } },
      });
      await tx.transaction.create({
        data: {
          userId: tenantId,
          amount: refundAmount,
          type: "CAUTION_DEPOSIT",
          fromId: landlordId,
          toId: tenantId,
          propertyId,
          tenancyId,
          reference: `REFUND-${Date.now()}`,
          description: `Caution deposit refund for "${propertyTitle}"`,
          status: "COMPLETED" as const,
        },
      });
    }
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "UPDATE",
      entity: "Transaction",
      entityId: escrow.id,
      before: { status: "ESCROW" },
      after: {
        decision,
        deductionAmount: deduction,
        refundAmount,
        bondAmount,
        shackFee,
        moveWithinShack,
      },
      req,
    }),
    notify(
      tenantId,
      moveWithinShack
        ? "Bond Carried Forward! 🏠"
        : decision === "RELEASE"
          ? "Deposit refunded 🎉"
          : "Deposit partially kept",
      moveWithinShack
        ? `₦${bondAmount.toLocaleString()} has been added to your Hausevo Bond for your next home! (20% platform fee applied).`
        : refundAmount > 0
          ? `₦${refundAmount.toLocaleString()} of your caution deposit for "${propertyTitle}" is being refunded.${deduction > 0 ? ` ₦${deduction.toLocaleString()} was deducted for damages.` : ""}`
          : `Your caution deposit for "${propertyTitle}" has been forfeited due to damages. Reason: ${reason}`,
      "SYSTEM",
      { tenancyId },
    ),
    notify(
      landlordId,
      "Escrow settled",
      `The caution deposit for "${propertyTitle}" has been settled. ${deduction > 0 ? `₦${deduction.toLocaleString()} was credited to you for damages.` : "Full refund was issued to the tenant."}`,
      "SYSTEM",
      { tenancyId },
    ),
  ]);

  return NextResponse.json({
    message: `Escrow ${decision === "RELEASE" ? "released" : "forfeited"} successfully.`,
    summary: {
      totalDeposit,
      refundToTenant: refundAmount,
      forfeitedToLandlord: deduction,
      carriedAsBond: bondAmount,
      processingFee: shackFee,
    },
  });
}
