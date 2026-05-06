import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/properties/:id/management
  View all caretakers/managers for a property.
  Requires: active session + must be the owner.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Only the owner can view management delegation." }, { status: 403 });
  }

  const management = await prisma.propertyManagement.findMany({
    where: { propertyId: id },
    include: {
      manager: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
    },
  });

  return NextResponse.json({ management });
}

/*
  POST /api/properties/:id/management
  Invite a caretaker to manage a property.
  Requires: active session + must be the owner.

  Body: { managerId, canChat, canApproveTenants, canManageArtisans, canViewFinances }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { managerId, canChat = true, canApproveTenants = false, canManageArtisans = true, canViewFinances = false } = body;

  if (!managerId) {
    return NextResponse.json({ error: "managerId is required." }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, title: true, landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Only the owner can delegate management." }, { status: 403 });
  }

  const management = await prisma.propertyManagement.upsert({
    where: {
      propertyId_managerId: {
        propertyId: id,
        managerId,
      },
    },
    update: {
      canChat,
      canApproveTenants,
      canManageArtisans,
      canViewFinances,
      status: "ACTIVE",
    },
    create: {
      propertyId: id,
      ownerId: session.user.id,
      managerId,
      canChat,
      canApproveTenants,
      canManageArtisans,
      canViewFinances,
      status: "ACTIVE",
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "UPDATE",
      entity: "PropertyManagement",
      entityId: management.id,
      after: { managerId, canChat, canApproveTenants, canManageArtisans, canViewFinances },
      req,
    }),
    notify(
      managerId,
      "New management delegation 🏠",
      `You have been assigned as a manager for "${property.title}".`,
      "TENANCY_UPDATE",
      { propertyId: id }
    ),
  ]);

  return NextResponse.json({ management }, { status: 201 });
}
