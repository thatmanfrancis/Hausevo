import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/tenancy/:id/moving-order
  Tenant books a moving order for their tenancy.
  Requires: active session + must be the tenant

  Body: { scheduledDate, pickupAddress, deliveryAddress, providerName?, price? }
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
    include: {
      property: { select: { title: true, landlordId: true } },
      movingOrder: true,
    },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  if (tenancy.tenantId !== userId) {
    return NextResponse.json(
      { error: "Only the tenant can book a moving order." },
      { status: 403 }
    );
  }

  if (tenancy.movingOrder) {
    return NextResponse.json(
      { error: "A moving order already exists for this tenancy." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { scheduledDate, pickupAddress, deliveryAddress, providerName, price } = body;

  if (!scheduledDate || !pickupAddress || !deliveryAddress) {
    return NextResponse.json(
      { error: "scheduledDate, pickupAddress and deliveryAddress are required." },
      { status: 400 }
    );
  }

  const movingOrder = await prisma.movingOrder.create({
    data: {
      tenancyId,
      scheduledDate: new Date(scheduledDate),
      pickupAddress,
      deliveryAddress,
      providerName: providerName ?? null,
      price: price ? Number(price) : null,
    },
    select: {
      id: true, scheduledDate: true, pickupAddress: true,
      deliveryAddress: true, status: true, providerName: true,
      price: true, createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "MovingOrder",
      entityId: movingOrder.id,
      after: { tenancyId, scheduledDate, status: "SCHEDULED" },
      req,
    }),
    notify(
      userId,
      "Moving order booked",
      `Your move to "${tenancy.property.title}" is scheduled for ${new Date(scheduledDate).toDateString()}.`,
      "MOVE_UPDATE",
      { movingOrderId: movingOrder.id, tenancyId }
    ),
    notify(
      tenancy.property.landlordId,
      "Tenant moving in",
      `Your tenant has scheduled their move-in for "${tenancy.property.title}" on ${new Date(scheduledDate).toDateString()}.`,
      "MOVE_UPDATE",
      { movingOrderId: movingOrder.id, tenancyId }
    ),
  ]);

  return NextResponse.json({ movingOrder }, { status: 201 });
}

/*
  GET /api/tenancy/:id/moving-order
  View the moving order for a tenancy.
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
    select: {
      tenantId: true,
      property: { select: { landlordId: true } },
      movingOrder: true,
    },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const isAllowed =
    tenancy.tenantId === userId ||
    tenancy.property.landlordId === userId;

  if (!isAllowed) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ movingOrder: tenancy.movingOrder ?? null });
}

/*
  PATCH /api/tenancy/:id/moving-order
  Update moving order status.
  Requires: active session + must be the tenant

  Body: { status }
*/
export async function PATCH(
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
    include: {
      movingOrder: true,
      property: { select: { title: true, landlordId: true } },
    },
  });

  if (!tenancy || !tenancy.movingOrder) {
    return NextResponse.json({ error: "Moving order not found." }, { status: 404 });
  }

  if (tenancy.tenantId !== userId) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  const validStatuses = ["SCHEDULED", "IN_TRANSIT", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.movingOrder.update({
    where: { id: tenancy.movingOrder.id },
    data: { status },
    select: { id: true, status: true },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "UPDATE",
      entity: "MovingOrder",
      entityId: tenancy.movingOrder.id,
      before: { status: tenancy.movingOrder.status },
      after: { status },
      req,
    }),
    notify(
      tenancy.property.landlordId,
      "Moving order update",
      `The moving order for "${tenancy.property.title}" is now ${status}.`,
      "MOVE_UPDATE",
      { movingOrderId: tenancy.movingOrder.id }
    ),
  ]);

  return NextResponse.json({ movingOrder: updated });
}
