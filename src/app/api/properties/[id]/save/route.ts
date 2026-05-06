import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/properties/:id/save
  Tenant saves a property to their wishlist.
  Calling again removes it (toggle).
  Requires: active session
*/
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const existing = await prisma.savedProperty.findUnique({
    where: { tenantId_propertyId: { tenantId: session.user.id, propertyId } },
  });

  if (existing) {
    // Toggle off — unsave
    await prisma.savedProperty.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false, message: "Property removed from saved." });
  }

  await prisma.savedProperty.create({
    data: { tenantId: session.user.id, propertyId },
  });

  return NextResponse.json({ saved: true, message: "Property saved." }, { status: 201 });
}

/*
  GET /api/properties/:id/save
  Check if the current user has saved this property.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: propertyId } = await params;

  const saved = await prisma.savedProperty.findUnique({
    where: { tenantId_propertyId: { tenantId: session.user.id, propertyId } },
  });

  return NextResponse.json({ saved: !!saved });
}
