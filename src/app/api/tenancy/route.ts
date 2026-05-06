import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/tenancy
  Landlord creates a tenancy after accepting an application.
  Requires: active session + LANDLORD role

  Body: { applicationId, startDate, endDate, cautionDeposit, savingsGoal, isJoint? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { applicationId, startDate, endDate, cautionDeposit, savingsGoal, isJoint = false } = body;

  if (!applicationId || !startDate || !endDate || !cautionDeposit || !savingsGoal) {
    return NextResponse.json(
      { error: "applicationId, startDate, endDate, cautionDeposit and savingsGoal are required." },
      { status: 400 }
    );
  }

  const application = await prisma.tenancyApplication.findUnique({
    where: { id: applicationId },
    include: {
      property: { select: { id: true, title: true, landlordId: true, status: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  // Check if user is either the landlord OR a manager with approval permission
  const isLandlord = application.property.landlordId === userId;
  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: application.propertyId,
      managerId: userId,
      status: "ACTIVE",
      canApproveTenants: true,
    },
  });

  if (!isLandlord && !management) {
    return NextResponse.json({ error: "Only the landlord or an authorized manager can create a tenancy." }, { status: 403 });
  }

  if (application.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Application must be ACCEPTED before creating a tenancy." },
      { status: 400 }
    );
  }

  const existing = await prisma.tenancy.findUnique({
    where: { propertyId: application.propertyId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An active tenancy already exists for this property." },
      { status: 409 }
    );
  }

  const tenancy = await prisma.tenancy.create({
    data: {
      propertyId: application.propertyId,
      tenantId: application.tenantId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      cautionDeposit: Number(cautionDeposit),
      savingsGoal: Number(savingsGoal),
      isJoint,
      agreement: {
        create: {
          content: `TENANCY AGREEMENT for ${application.property.title}.\n\nThis agreement is made between the Landlord and the Tenant...`,
          status: "PENDING",
        },
      },
    },
    select: {
      id: true, propertyId: true, tenantId: true, status: true,
      startDate: true, endDate: true, cautionDeposit: true,
      savingsGoal: true, currentSaved: true, isJoint: true, createdAt: true,
    },
  });

  // ── Auto-generate rent schedule based on frequency ──────────────────────
  // Determine frequency from the property's rentFrequency field
  const propertyWithFreq = await prisma.property.findUnique({
    where: { id: application.propertyId },
    select: { rentFrequency: true, pricePerYear: true },
  });

  const freq = propertyWithFreq?.rentFrequency ?? "ANNUALLY";
  const annualRent = propertyWithFreq?.pricePerYear ?? Number(savingsGoal);

  // Map frequency to interval in months and payment amount
  const freqConfig: Record<string, { months: number; amount: number }> = {
    ANNUALLY:   { months: 12, amount: annualRent },
    BIANNUALLY: { months: 6,  amount: annualRent / 2 },
    QUARTERLY:  { months: 3,  amount: annualRent / 4 },
    MONTHLY:    { months: 1,  amount: annualRent / 12 },
  };

  const { months, amount } = freqConfig[freq] ?? freqConfig.ANNUALLY;

  // Generate schedule entries from startDate to endDate
  const scheduleEntries: { tenancyId: string; dueDate: Date; amount: number; frequency: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let current = new Date(start);

  while (current <= end) {
    scheduleEntries.push({
      tenancyId: tenancy.id,
      dueDate: new Date(current),
      amount: Math.round(amount),
      frequency: freq,
    });
    current = new Date(current);
    current.setMonth(current.getMonth() + months);
  }

  if (scheduleEntries.length > 0) {
    await prisma.rentSchedule.createMany({ data: scheduleEntries as any });
  }

  await prisma.property.update({
    where: { id: application.propertyId },
    data: { status: "RENTED" },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "Tenancy",
      entityId: tenancy.id,
      after: { propertyId: application.propertyId, tenantId: application.tenantId, startDate, endDate },
      req,
    }),
    notify(
      application.tenantId,
      "Tenancy confirmed! 🏠",
      `Your tenancy for "${application.property.title}" has been confirmed. Welcome home!`,
      "TENANCY_UPDATE",
      { tenancyId: tenancy.id, propertyId: application.propertyId }
    ),
    notify(
      userId,
      "Tenancy created",
      `Tenancy for "${application.property.title}" has been set up successfully.`,
      "TENANCY_UPDATE",
      { tenancyId: tenancy.id }
    ),
  ]);

  return NextResponse.json({ tenancy }, { status: 201 });
}

/*
  GET /api/tenancy
  - Tenant: their current tenancy
  - Landlord: all tenancies across their properties
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isLandlord = user?.roles.includes("LANDLORD");

  if (isLandlord) {
    const tenancies = await prisma.tenancy.findMany({
      where: { property: { landlordId: userId } },
      include: {
        property: { select: { id: true, title: true, address: true, lga: true } },
        tenant: { select: { id: true, fullName: true, email: true } },
        rentSchedules: { select: { id: true, dueDate: true, amount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tenancies });
  }

  const tenancy = await prisma.tenancy.findUnique({
    where: { tenantId: userId },
    include: {
      property: {
        select: {
          id: true, title: true, address: true, lga: true,
          images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
        },
      },
      rentSchedules: {
        select: { id: true, dueDate: true, amount: true, frequency: true, status: true, paidAt: true },
        orderBy: { dueDate: "asc" },
      },
      movingOrder: true,
    },
  });

  return NextResponse.json({ tenancy: tenancy ?? null });
}
