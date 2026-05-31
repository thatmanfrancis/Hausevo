import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/properties/:id/apply
  Tenant applies for a property.
  Requires: active session + TENANT role

  Body: { message? }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: propertyId } = await params;

  const [user, property] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        roles: true,
        verificationTier: true,
        shackScore: { select: { score: true } },
      },
    }),
    prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, status: true, landlordId: true },
    }),
  ]);

  if (!user?.roles.includes("TENANT")) {
    return NextResponse.json(
      { error: "Only tenants can apply for properties." },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────────────
  // TIER 1 VERIFICATION REQUIRED (FREEMIUM GATE)
  // Users must upgrade to Tier 1 (₦1,500) to apply
  // ─────────────────────────────────────────────
  if (user.verificationTier < 1) {
    return NextResponse.json(
      {
        error: "Verification required to apply for properties.",
        currentTier: user.verificationTier,
        requiredTier: 1,
        message: "Upgrade to Tier 1 (₦1,500) to apply for properties.",
        upgradeUrl: "/api/verify/upgrade",
        benefits: [
          "Apply for unlimited properties",
          "Hausevo Score visible to landlords",
          "Verified badge on profile",
          "Priority in application queue",
        ],
      },
      { status: 403 }
    );
  }

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: "This property is not currently available." },
      { status: 400 }
    );
  }

  // Landlord cannot apply to their own property
  if (property.landlordId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot apply to your own property." },
      { status: 400 }
    );
  }

  // One application per tenant per property
  const existing = await prisma.tenancyApplication.findUnique({
    where: {
      propertyId_tenantId: { propertyId, tenantId: session.user.id },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already applied for this property." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const application = await prisma.tenancyApplication.create({
    data: {
      propertyId,
      tenantId: session.user.id,
      message: body.message ?? null,
      shackScoreAtApplication: user.shackScore?.score ?? null,
    },
    select: {
      id: true,
      propertyId: true,
      status: true,
      message: true,
      shackScoreAtApplication: true,
      createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "TenancyApplication",
      entityId: application.id,
      after: { propertyId, status: "PENDING" },
      req,
    }),
    // Notify the landlord
    notify(
      property.landlordId,
      "New application received",
      `Someone has applied for your property "${property.title}". Review it in your dashboard.`,
      "TENANCY_UPDATE",
      { applicationId: application.id, propertyId }
    ),
    // Confirm to the tenant
    notify(
      session.user.id,
      "Application submitted",
      `Your application for "${property.title}" has been submitted. The landlord will review it shortly.`,
      "TENANCY_UPDATE",
      { applicationId: application.id, propertyId }
    ),
  ]);

  return NextResponse.json({ application }, { status: 201 });
}

/*
  GET /api/properties/:id/apply
  Landlord views all applications for their property.
  Requires: active session + must be the landlord
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

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.landlordId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the landlord can view applications for this property." },
      { status: 403 }
    );
  }

  const applications = await prisma.tenancyApplication.findMany({
    where: { propertyId },
    select: {
      id: true,
      status: true,
      message: true,
      shackScoreAtApplication: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
      tenant: {
        select: {
          id: true,
          fullName: true,
          verificationTier: true,
          shackScore: { select: { score: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
