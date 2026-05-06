import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/properties/:id/inspect
  Admin or scout submits a pre-tenancy inspection report.
  Score feeds into the property's healthScore.
  Requires: active session + ADMIN or SCOUT role

  Body: { score, notes?, photos? }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      { error: "Only admins can submit inspection reports." },
      { status: 403 }
    );
  }

  const { id: propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const body = await req.json();
  const { score, notes, photos = [] } = body;

  if (score === undefined || score === null) {
    return NextResponse.json({ error: "score is required." }, { status: 400 });
  }

  const scoreNum = Number(score);
  if (scoreNum < 0 || scoreNum > 100) {
    return NextResponse.json({ error: "score must be between 0 and 100." }, { status: 400 });
  }

  const inspection = await prisma.inspection.create({
    data: {
      propertyId,
      inspectorId: session.user.id,
      score: scoreNum,
      notes: notes ?? null,
      photos,
    },
    select: { id: true, score: true, notes: true, photos: true, createdAt: true },
  });

  // Update the property's healthScore to the latest inspection score
  await prisma.property.update({
    where: { id: propertyId },
    data: { healthScore: scoreNum },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Inspection",
      entityId: inspection.id,
      after: { propertyId, score: scoreNum },
      req,
    }),
    notify(
      property.landlordId,
      "Inspection completed",
      `Your property "${property.title}" has been inspected and received a health score of ${scoreNum}/100.`,
      "DOC_VERIFIED",
      { propertyId, inspectionId: inspection.id, score: scoreNum }
    ),
  ]);

  return NextResponse.json({ inspection }, { status: 201 });
}

/*
  GET /api/properties/:id/inspect
  View inspection history for a property.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await params;

  const inspections = await prisma.inspection.findMany({
    where: { propertyId },
    select: {
      id: true, score: true, notes: true, photos: true, createdAt: true,
      inspector: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inspections });
}
