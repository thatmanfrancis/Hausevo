import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/applications/:id
  View a single application.
  Accessible by the tenant who applied or the landlord of the property.
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

  const application = await prisma.tenancyApplication.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, landlordId: true } },
      tenant: { select: { id: true, fullName: true, verificationTier: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const isLandlord = application.property.landlordId === session.user.id;
  const isTenant = application.tenantId === session.user.id;

  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: application.property.id,
      managerId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (!isLandlord && !isTenant && !management) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ application });
}

/*
  PATCH /api/applications/:id
  Landlord accepts or rejects an application.
  Tenant can withdraw (WITHDRAWN) their own application.
  Requires: active session

  Body: { status: "ACCEPTED" | "REJECTED" | "WITHDRAWN", rejectionReason? }
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

  const application = await prisma.tenancyApplication.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, landlordId: true } },
      tenant: { select: { id: true, fullName: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const isLandlord = application.property.landlordId === session.user.id;
  const isTenant = application.tenantId === session.user.id;

  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: application.property.id,
      managerId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (!isLandlord && !isTenant && !management) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await req.json();
  const { status, rejectionReason } = body;

  // Tenants can only withdraw
  if (isTenant && status !== "WITHDRAWN") {
    return NextResponse.json(
      { error: "Tenants can only withdraw their application." },
      { status: 403 }
    );
  }

  // Landlords or managers with permission can only accept or reject
  const canModifyStatus = isLandlord || management?.canApproveTenants;

  if (canModifyStatus && !["ACCEPTED", "REJECTED", "REVIEWING"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be REVIEWING, ACCEPTED, or REJECTED." },
      { status: 400 }
    );
  }

  if (!isTenant && !canModifyStatus) {
    return NextResponse.json(
      { error: "You do not have permission to modify this application's status." },
      { status: 403 }
    );
  }

  if (application.status === "ACCEPTED" || application.status === "WITHDRAWN") {
    return NextResponse.json(
      { error: `Application is already ${application.status.toLowerCase()}.` },
      { status: 400 }
    );
  }

  const before = { status: application.status };

  const updated = await prisma.tenancyApplication.update({
    where: { id },
    data: {
      status,
      ...(rejectionReason && { rejectionReason }),
    },
    select: {
      id: true,
      status: true,
      rejectionReason: true,
      updatedAt: true,
    },
  });

  // Build notifications based on what happened
  const notifyPromises = [];

  if (status === "ACCEPTED") {
    notifyPromises.push(
      notify(
        application.tenantId,
        "Application accepted! 🎉",
        `Your application for "${application.property.title}" has been accepted. The landlord will be in touch.`,
        "TENANCY_UPDATE",
        { applicationId: id, propertyId: application.propertyId }
      )
    );
  } else if (status === "REJECTED") {
    notifyPromises.push(
      notify(
        application.tenantId,
        "Application update",
        `Your application for "${application.property.title}" was not successful this time.`,
        "TENANCY_UPDATE",
        { applicationId: id, propertyId: application.propertyId }
      )
    );
  } else if (status === "REVIEWING") {
    notifyPromises.push(
      notify(
        application.tenantId,
        "Application under review",
        `The landlord is reviewing your application for "${application.property.title}".`,
        "TENANCY_UPDATE",
        { applicationId: id, propertyId: application.propertyId }
      )
    );
  } else if (status === "WITHDRAWN") {
    notifyPromises.push(
      notify(
        application.property.landlordId,
        "Application withdrawn",
        `${application.tenant.fullName} has withdrawn their application for "${application.property.title}".`,
        "TENANCY_UPDATE",
        { applicationId: id, propertyId: application.propertyId }
      )
    );
  }

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "UPDATE",
      entity: "TenancyApplication",
      entityId: id,
      before,
      after: { status, rejectionReason: rejectionReason ?? null },
      req,
    }),
    ...notifyPromises,
  ]);

  return NextResponse.json({ application: updated });
}
