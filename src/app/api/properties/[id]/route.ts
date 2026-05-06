import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/properties/:id
  Full property detail. Public.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true, title: true, address: true, lga: true, state: true,
      latitude: true, longitude: true, pricePerYear: true, totalPackage: true,
      rentFrequency: true, status: true, healthScore: true,
      metadata: true,
      images: {
        select: { id: true, url: true, isPrimary: true, order: true },
        orderBy: { order: "asc" },
      },
      landlord: {
        select: {
          id: true, fullName: true, verificationTier: true,
          shackScore: { select: { score: true } },
        },
      },
      inspections: {
        select: { score: true, notes: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      reviews: {
        select: {
          rating: true, comment: true, createdAt: true,
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { savedBy: true, waitlist: true } },
      createdAt: true, updatedAt: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  return NextResponse.json({ property });
}

/*
  PATCH /api/properties/:id
  Landlord updates their own listing.
  Requires: active session + must be the landlord
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.property.findUnique({
    where: { id },
    select: {
      landlordId: true, title: true, status: true,
      pricePerYear: true, totalPackage: true, priceVerified: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  // Check if user is either the landlord OR an active manager
  const isLandlord = existing.landlordId === session.user.id;
  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: id,
      managerId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (!isLandlord && !management) {
    return NextResponse.json(
      { error: "You do not have permission to update this listing." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    title, address, lga, state, latitude, longitude,
    pricePerYear, totalPackage, rentFrequency, status, metadata,
  } = body;

  const updated = await prisma.property.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(address && { address }),
      ...(lga && { lga }),
      ...(state && { state }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(pricePerYear !== undefined && { 
        pricePerYear: Number(pricePerYear),
        // If price is changed, we MUST re-verify
        priceVerified: Number(pricePerYear) === existing.pricePerYear ? existing.priceVerified : false,
        status: Number(pricePerYear) === existing.pricePerYear ? (status || existing.status) : "PENDING"
      }),
      ...(totalPackage !== undefined && { totalPackage: Number(totalPackage) }),
      ...(rentFrequency && { rentFrequency }),
      ...(status && !pricePerYear && { status }), // only allow manual status change if price NOT changed
      ...(metadata !== undefined && { metadata }),
    },
    select: {
      id: true, title: true, address: true, lga: true, state: true,
      pricePerYear: true, totalPackage: true, rentFrequency: true,
      status: true, updatedAt: true,
    },
  });

  await audit({
    actorId: session.user.id,
    action: "UPDATE",
    entity: "Property",
    entityId: id,
    before: {
      title: existing.title,
      status: existing.status,
      pricePerYear: existing.pricePerYear,
    },
    after: { title: updated.title, status: updated.status, pricePerYear: updated.pricePerYear },
    req,
  });

  // Notify landlord if status changed (e.g. admin approved/flagged)
  if (status && status !== existing.status) {
    await notify(
      existing.landlordId,
      "Property status updated",
      `Your listing "${updated.title}" status changed to ${status}.`,
      "SYSTEM",
      { propertyId: id, status }
    );
  }

  return NextResponse.json({ property: updated });
}

/*
  DELETE /api/properties/:id
  Landlord removes their listing. Only PENDING or AVAILABLE listings can be deleted.
  Requires: active session + must be the landlord
*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { landlordId: true, status: true, title: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.landlordId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only delete your own listings." },
      { status: 403 }
    );
  }

  if (!["PENDING", "AVAILABLE"].includes(property.status)) {
    return NextResponse.json(
      { error: "Only PENDING or AVAILABLE listings can be deleted." },
      { status: 400 }
    );
  }

  await prisma.property.delete({ where: { id } });

  await audit({
    actorId: session.user.id,
    action: "DELETE",
    entity: "Property",
    entityId: id,
    before: { title: property.title, status: property.status },
    req,
  });

  return NextResponse.json({ message: "Property deleted." });
}
