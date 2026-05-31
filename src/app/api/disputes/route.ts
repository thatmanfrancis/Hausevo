import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/disputes
  Raise a formal dispute against another user.
  Requires: active session

  Body: { againstId, type, description, evidence?, propertyId? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { againstId, type, description, evidence = [], propertyId } = body;

  if (!againstId || !type || !description) {
    return NextResponse.json(
      { error: "againstId, type and description are required." },
      { status: 400 }
    );
  }

  if (againstId === session.user.id) {
    return NextResponse.json({ error: "You cannot raise a dispute against yourself." }, { status: 400 });
  }

  const validTypes = ["MAINTENANCE", "RENT", "CAUTION_DEPOSIT", "PROPERTY_CONDITION"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const against = await prisma.user.findUnique({
    where: { id: againstId },
    select: { fullName: true },
  });

  if (!against) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const dispute = await prisma.dispute.create({
    data: {
      raisedById: session.user.id,
      againstId,
      type,
      description,
      evidence,
      propertyId: propertyId ?? null,
    },
    select: {
      id: true, type: true, status: true, description: true,
      evidence: true, propertyId: true, createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Dispute",
      entityId: dispute.id,
      after: { againstId, type, status: "OPEN", propertyId: propertyId ?? null },
      req,
    }),
    // Notify the person the dispute is raised against
    notify(
      againstId,
      "Dispute raised against you",
      `A ${type.replace("_", " ").toLowerCase()} dispute has been raised against you. Hausevo will review it shortly.`,
      "DISPUTE_UPDATE",
      { disputeId: dispute.id }
    ),
    // Notify admins (in production, query all ADMIN users)
    notify(
      session.user.id,
      "Dispute submitted",
      `Your ${type.replace("_", " ").toLowerCase()} dispute has been submitted and is under review.`,
      "DISPUTE_UPDATE",
      { disputeId: dispute.id }
    ),
  ]);

  return NextResponse.json({ dispute }, { status: 201 });
}

/*
  GET /api/disputes
  - User: disputes they raised or are involved in
  - Admin: all disputes
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");

  const disputes = await prisma.dispute.findMany({
    where: isAdmin
      ? {}
      : { OR: [{ raisedById: session.user.id }, { againstId: session.user.id }] },
    select: {
      id: true, type: true, status: true, description: true,
      evidence: true, resolution: true, createdAt: true, updatedAt: true,
      raisedBy: { select: { id: true, fullName: true } },
      against: { select: { id: true, fullName: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ disputes });
}
