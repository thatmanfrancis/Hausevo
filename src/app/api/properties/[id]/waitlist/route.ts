import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

/*
  POST /api/properties/:id/waitlist
  Tenant joins the waitlist for a RENTED property.
  When it becomes available, they'll be notified in order.
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
    select: { id: true, title: true, status: true, landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.status === "AVAILABLE") {
    return NextResponse.json(
      { error: "This property is available — apply directly instead of joining the waitlist." },
      { status: 400 }
    );
  }

  const existing = await prisma.waitlist.findUnique({
    where: { propertyId_tenantId: { propertyId, tenantId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You are already on the waitlist for this property." },
      { status: 409 }
    );
  }

  // Position = current count + 1
  const count = await prisma.waitlist.count({ where: { propertyId } });

  const entry = await prisma.waitlist.create({
    data: { propertyId, tenantId: session.user.id, position: count + 1 },
    select: { id: true, position: true, createdAt: true },
  });

  await notify(
    session.user.id,
    "Added to waitlist",
    `You're #${entry.position} on the waitlist for "${property.title}". We'll notify you when it's available.`,
    "WAITLIST_AVAILABLE",
    { propertyId, position: entry.position }
  );

  return NextResponse.json({ entry }, { status: 201 });
}

/*
  DELETE /api/properties/:id/waitlist
  Leave the waitlist.
*/
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: propertyId } = await params;

  const entry = await prisma.waitlist.findUnique({
    where: { propertyId_tenantId: { propertyId, tenantId: session.user.id } },
  });

  if (!entry) {
    return NextResponse.json({ error: "You are not on the waitlist." }, { status: 404 });
  }

  await prisma.waitlist.delete({ where: { id: entry.id } });

  return NextResponse.json({ message: "Removed from waitlist." });
}
