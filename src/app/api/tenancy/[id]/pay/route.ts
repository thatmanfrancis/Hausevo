import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/tenancy/:id/pay
  Tenant records a rent payment against a schedule entry.
  Automatically splits the payment between the owner and any active manager.
  
  Requires: active session + must be the tenant

  Body: { scheduleId, amount, paymentReference? }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id: tenancyId } = await params;
  const body = await req.json();
  const { scheduleId, amount, paymentReference } = body;

  if (!scheduleId || !amount) {
    return NextResponse.json(
      { error: "scheduleId and amount are required." },
      { status: 400 }
    );
  }

  // Load tenancy with property and any active management delegation
  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          landlordId: true,
          management: {
            where: { status: "ACTIVE" },
            select: {
              managerId: true,
              commissionPercentage: true,
              fixedCommission: true,
            },
          },
        },
      },
    },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  if (tenancy.tenantId !== userId) {
    return NextResponse.json({ error: "Only the tenant can record payments." }, { status: 403 });
  }

  // Validate the schedule entry
  const schedule = await prisma.rentSchedule.findFirst({
    where: { id: scheduleId, tenancyId },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Schedule entry not found for this tenancy." }, { status: 404 });
  }

  if (schedule.status === "COMPLETED") {
    return NextResponse.json({ error: "This schedule entry is already marked as paid." }, { status: 409 });
  }

  const paidAmount = Number(amount);
  const landlordId = tenancy.property.landlordId;
  const management = tenancy.property.management[0] ?? null;

  // ─── Wallet Balance Check ──────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (!user || user.walletBalance < paidAmount) {
    return NextResponse.json(
      { error: "Insufficient wallet balance. Please top up your wallet first." },
      { status: 402 }
    );
  }

  // ─── Payment Splitting Logic ────────────────────────────────────
  // Calculate manager's commission (% takes priority over fixed fee)
  let managerCut = 0;
  if (management) {
    if (management.commissionPercentage > 0) {
      managerCut = (paidAmount * management.commissionPercentage) / 100;
    } else if (management.fixedCommission > 0) {
      managerCut = management.fixedCommission;
    }
  }
  const ownerAmount = paidAmount - managerCut;
  // ─────────────────────────────────────────────────────────────────

  // All DB writes in a transaction for atomicity
  const [updatedSchedule] = await prisma.$transaction([
    // Deduct from tenant wallet
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: paidAmount } },
    }),
    // Credit landlord (owner) wallet
    prisma.user.update({
      where: { id: landlordId },
      data: { walletBalance: { increment: ownerAmount } },
    }),
    // Credit manager wallet (if exists)
    ...(management && managerCut > 0
      ? [
          prisma.user.update({
            where: { id: management.managerId },
            data: { walletBalance: { increment: managerCut } },
          }),
        ]
      : []),
    // Mark the schedule as paid
    prisma.rentSchedule.update({
      where: { id: scheduleId },
      data: { status: "COMPLETED", paidAt: new Date() },
    }),
    // Owner's portion of the rent transaction
    prisma.transaction.create({
      data: {
        userId,
        amount: ownerAmount,
        type: "RENT",
        fromId: userId,
        toId: landlordId,
        propertyId: tenancy.property.id,
        tenancyId,
        reference: paymentReference ?? `PAY-${Date.now()}`,
        description: `Rent payment for ${tenancy.property.title} (Owner portion)`,
        status: "COMPLETED",
      },
    }),
    // Manager's commission (only if a manager exists)
    ...(management && managerCut > 0
      ? [
          prisma.transaction.create({
            data: {
              userId,
              amount: managerCut,
              type: "MANAGEMENT_FEE",
              fromId: userId,
              toId: management.managerId,
              propertyId: tenancy.property.id,
              tenancyId,
              reference: `MGT-${Date.now()}`,
              description: `Management fee for ${tenancy.property.title}`,
              status: "COMPLETED",
            },
          }),
        ]
      : []),
  ]);

  // Notify all parties
  const notifyPromises = [
    notify(
      landlordId,
      "Rent received 💰",
      `${management ? `Your manager has collected` : "You received"} ₦${ownerAmount.toLocaleString()} for "${tenancy.property.title}".`,
      "RENT_PAID",
      { tenancyId, scheduleId, amount: ownerAmount }
    ),
    notify(
      userId,
      "Payment confirmed ✅",
      `Your rent payment of ₦${paidAmount.toLocaleString()} for "${tenancy.property.title}" has been recorded.`,
      "RENT_PAID",
      { tenancyId, scheduleId }
    ),
  ];

  if (management && managerCut > 0) {
    notifyPromises.push(
      notify(
        management.managerId,
        "Management fee received 💼",
        `You received ₦${managerCut.toLocaleString()} commission for "${tenancy.property.title}".`,
        "RENT_PAID",
        { tenancyId, scheduleId, amount: managerCut }
      )
    );
  }

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "Transaction",
      entityId: tenancyId,
      after: {
        scheduleId,
        totalPaid: paidAmount,
        ownerAmount,
        managerCut,
        managerId: management?.managerId ?? null,
        paymentReference,
      },
      req,
    }),
    ...notifyPromises,
  ]);

  // Refetch balances to be sure
  const [tenantUser, landlordUser, managerUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } }),
    prisma.user.findUnique({ where: { id: landlordId }, select: { walletBalance: true } }),
    management && managerCut > 0
      ? prisma.user.findUnique({ where: { id: management.managerId }, select: { walletBalance: true } })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    message: "Payment recorded successfully.",
    summary: {
      totalPaid: paidAmount,
      ownerReceives: ownerAmount,
      managerReceives: managerCut,
      schedule: updatedSchedule,
      tenantBalance: tenantUser?.walletBalance,
      ownerBalance: landlordUser?.walletBalance,
      managerBalance: managerUser?.walletBalance,
    },
  }, { status: 201 });
}
