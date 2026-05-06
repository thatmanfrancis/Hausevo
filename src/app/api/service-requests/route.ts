import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/service-requests
  Tenant requests a home service (DSTV, internet, fumigation, etc.)
  Requires: active session + must have an active tenancy

  Body: { category, notes? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const tenancy = await prisma.tenancy.findUnique({
    where: { tenantId: userId },
    select: {
      propertyId: true,
      status: true,
      property: { select: { title: true, landlordId: true } },
    },
  });

  if (!tenancy || tenancy.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "You must have an active tenancy to request services." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { category, notes } = body;

  const validCategories = ["INTERNET", "DSTV", "GENERATOR", "FUMIGATION", "CLEANING", "SECURITY", "OTHER"];
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      tenantId: userId,
      propertyId: tenancy.propertyId,
      category,
      notes: notes ?? null,
    },
    select: {
      id: true, category: true, notes: true, status: true, createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "ServiceRequest",
      entityId: serviceRequest.id,
      after: { category, propertyId: tenancy.propertyId, status: "OPEN" },
      req,
    }),
    notify(
      userId,
      "Service request submitted",
      `Your ${category.toLowerCase()} service request has been submitted. We'll be in touch shortly.`,
      "JOB_UPDATE",
      { serviceRequestId: serviceRequest.id }
    ),
    notify(
      tenancy.property.landlordId,
      "Tenant service request",
      `Your tenant has requested ${category.toLowerCase()} service for "${tenancy.property.title}".`,
      "JOB_UPDATE",
      { serviceRequestId: serviceRequest.id }
    ),
  ]);

  return NextResponse.json({ serviceRequest }, { status: 201 });
}

/*
  GET /api/service-requests
  - Tenant: their own requests
  - Landlord: requests for their properties
  - Admin: all requests
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isLandlord = user?.roles.includes("LANDLORD");

  const requests = await prisma.serviceRequest.findMany({
    where: isAdmin
      ? {}
      : isLandlord
      ? { property: { landlordId: userId } }
      : { tenantId: userId },
    select: {
      id: true, category: true, notes: true, status: true, createdAt: true, updatedAt: true,
      property: { select: { id: true, title: true, lga: true } },
      tenant: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
