import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/applications/[id]/guarantors
  Add guarantors to an existing tenancy application.
  The tenant must own this application.

  Body: {
    guarantors: [
      { fullName: string; email: string; phone: string; relationship: string },
      ...
    ]
  }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: applicationId } = await params;
  const body = await req.json();
  const { guarantors } = body as {
    guarantors: { fullName: string; email: string; phone: string; relationship: string }[];
  };

  if (!Array.isArray(guarantors) || guarantors.length === 0) {
    return NextResponse.json({ error: "At least one guarantor is required." }, { status: 400 });
  }

  // Verify this application belongs to the current user
  const application = await prisma.tenancyApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      tenantId: true,
      property: { select: { title: true, address: true, lga: true } },
      tenant: { select: { fullName: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  if (application.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Validate each guarantor entry
  for (const g of guarantors) {
    if (!g.fullName?.trim() || !g.email?.trim() || !g.phone?.trim()) {
      return NextResponse.json(
        { error: "Each guarantor needs a full name, email, and phone number." },
        { status: 400 }
      );
    }
  }

  const userId = session.user.id;

  // Create all guarantor records in one transaction
  const created = await prisma.$transaction(
    guarantors.map((g) =>
      prisma.guarantor.create({
        data: {
          userId,
          applicationId,
          fullName: g.fullName.trim(),
          email: g.email.trim().toLowerCase(),
          phone: g.phone.trim(),
          relationship: g.relationship ?? "OTHER",
          isEmergency: false,
        },
      })
    )
  );

  // TODO: Send acknowledgment email to each guarantor
  // For each created guarantor, email:
  //   Subject: "[Tenant Name] has listed you as a guarantor on Hausevo"
  //   Body: Includes link to /guarantor/[token]
  // Using Resend/Nodemailer — add when email service is configured

  return NextResponse.json({
    message: `${created.length} guarantor(s) added.`,
    guarantors: created.map((g) => ({ id: g.id, fullName: g.fullName, status: g.status })),
  });
}

/*
  GET /api/applications/[id]/guarantors
  Returns the guarantors for an application.
  Accessible by the tenant or the property's landlord.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: applicationId } = await params;

  const application = await prisma.tenancyApplication.findUnique({
    where: { id: applicationId },
    select: {
      tenantId: true,
      property: { select: { landlordId: true } },
      guarantors: {
        select: {
          id: true,
          fullName: true,
          relationship: true,
          status: true,
          isEmergency: true,
          acknowledgedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const isOwner =
    application.tenantId === session.user.id ||
    application.property.landlordId === session.user.id;

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ guarantors: application.guarantors });
}
