import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { RentFrequency } from "@/generated/prisma/enums";

/*
  POST /api/tenancy/:id/rent-schedule
  Landlord creates rent payment schedule entries for a tenancy.
  Requires: active session + must be the landlord

  Body: { schedules: [{ dueDate, amount, frequency? }] }
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

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: { property: { select: { id: true, landlordId: true, title: true } } },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const isLandlord = tenancy.property.landlordId === userId;
  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: tenancy.property.id,
      managerId: userId,
      status: "ACTIVE",
      canApproveTenants: true,
    },
  });

  if (!isLandlord && !management) {
    return NextResponse.json({ error: "Only the landlord or authorized manager can set rent schedules." }, { status: 403 });
  }

  const body = await req.json();
  const { schedules } = body;

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return NextResponse.json(
      { error: "Provide an array of schedule entries." },
      { status: 400 }
    );
  }

  const created = await prisma.rentSchedule.createMany({
    data: schedules.map((s: { dueDate: string; amount: number; frequency?: string }) => ({
      tenancyId,
      dueDate: new Date(s.dueDate),
      amount: Number(s.amount),
      frequency: (s.frequency ?? "ANNUALLY") as RentFrequency,
    })),
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "RentSchedule",
      entityId: tenancyId,
      after: { count: created.count, tenancyId },
      req,
    }),
    notify(
      tenancy.tenantId,
      "Rent schedule set",
      `Your landlord has set up ${created.count} rent payment(s) for "${tenancy.property.title}".`,
      "RENT_DUE",
      { tenancyId }
    ),
  ]);

  return NextResponse.json({ message: `${created.count} schedule(s) created.` }, { status: 201 });
}

/*
  GET /api/tenancy/:id/rent-schedule
  View rent schedule for a tenancy.
  Accessible by the tenant or landlord.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id: tenancyId } = await params;

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    select: { tenantId: true, property: { select: { id: true, landlordId: true } } },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const isAllowed =
    tenancy.tenantId === userId ||
    tenancy.property.landlordId === userId ||
    !!(await prisma.propertyManagement.findFirst({
      where: { propertyId: tenancy.property.id, managerId: userId, status: "ACTIVE" },
    }));

  if (!isAllowed) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const schedules = await prisma.rentSchedule.findMany({
    where: { tenancyId },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ schedules });
}
