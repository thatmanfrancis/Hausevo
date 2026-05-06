import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/tenancy/:id/agreement
  View the digital agreement for a tenancy.
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

  const agreement = await prisma.tenancyAgreement.findUnique({
    where: { tenancyId: id },
    include: {
      tenancy: {
        select: {
          tenantId: true,
          property: { select: { id: true, landlordId: true, title: true } },
        },
      },
    },
  });

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  // Auth check: only tenant, landlord, or manager
  const userId = session.user.id;
  const isTenant = agreement.tenancy.tenantId === userId;
  const isLandlord = agreement.tenancy.property.landlordId === userId;
  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: agreement.tenancy.property.id,
      managerId: userId,
      status: "ACTIVE",
    },
  });

  if (!isTenant && !isLandlord && !management) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ agreement });
}

/*
  PATCH /api/tenancy/:id/agreement
  Sign the digital agreement.
*/
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const agreement = await prisma.tenancyAgreement.findUnique({
    where: { tenancyId: id },
    include: {
      tenancy: {
        select: {
          tenantId: true,
          property: { select: { id: true, landlordId: true, title: true } },
        },
      },
    },
  });

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  const isTenant = agreement.tenancy.tenantId === userId;
  const isLandlord = agreement.tenancy.property.landlordId === userId;
  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId: agreement.tenancy.property.id,
      managerId: userId,
      status: "ACTIVE",
      canApproveTenants: true,
    },
  });

  let data: any = {};
  let actionLabel = "";

  if (isTenant) {
    if (agreement.tenantSigned) {
      return NextResponse.json({ error: "Tenant has already signed." }, { status: 400 });
    }
    data = { tenantSigned: true, tenantSignedAt: new Date() };
    actionLabel = "Tenant signed";
  } else if (isLandlord || management) {
    if (agreement.ownerSigned) {
      return NextResponse.json({ error: "Owner/Manager has already signed." }, { status: 400 });
    }
    data = { ownerSigned: true, ownerSignedAt: new Date() };
    actionLabel = isLandlord ? "Landlord signed" : "Manager signed";
  } else {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Update agreement
  const updated = await prisma.tenancyAgreement.update({
    where: { tenancyId: id },
    data,
  });

  // If both have signed, update status to SIGNED
  if (
    (updated.tenantSigned && updated.ownerSigned) || 
    (isTenant && updated.ownerSigned) || 
    ((isLandlord || management) && updated.tenantSigned)
  ) {
    await prisma.tenancyAgreement.update({
      where: { tenancyId: id },
      data: { status: "SIGNED" },
    });
  }

  await Promise.all([
    audit({
      actorId: userId,
      action: "UPDATE",
      entity: "TenancyAgreement",
      entityId: updated.id,
      after: data,
    }),
    notify(
      isTenant ? agreement.tenancy.property.landlordId : agreement.tenancy.tenantId,
      "Agreement signed ✍️",
      `The ${actionLabel.toLowerCase()} has signed the agreement for "${agreement.tenancy.property.title}".`,
      "TENANCY_UPDATE",
      { tenancyId: id }
    ),
  ]);

  return NextResponse.json({ agreement: updated });
}
