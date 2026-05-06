import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/maintenance
  Tenant or landlord raises a maintenance job on a property.
  Requires: active session

  Body: { propertyId, title, description }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { propertyId, title, description } = body;

  if (!propertyId || !title || !description) {
    return NextResponse.json(
      { error: "propertyId, title and description are required." },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, landlordId: true, tenancy: { select: { tenantId: true } } },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  // Only the landlord or current tenant can raise a job
  // Only the landlord, current tenant, or authorized manager can raise a job
  const isLandlord = property.landlordId === session.user.id;
  const isTenant = property.tenancy?.tenantId === session.user.id;
  const management = await prisma.propertyManagement.findFirst({
    where: {
      propertyId,
      managerId: session.user.id,
      status: "ACTIVE",
      canManageArtisans: true,
    },
  });

  if (!isLandlord && !isTenant && !management) {
    return NextResponse.json(
      { error: "Access denied. Only authorized persons can raise maintenance jobs." },
      { status: 403 }
    );
  }

  const job = await prisma.maintenanceJob.create({
    data: { propertyId, title, description },
    select: {
      id: true, propertyId: true, title: true, description: true,
      status: true, createdAt: true,
    },
  });

  const notifyTarget = isLandlord ? property.tenancy?.tenantId : property.landlordId;

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "MaintenanceJob",
      entityId: job.id,
      after: { propertyId, title, status: "OPEN" },
      req,
    }),
    notifyTarget
      ? notify(
          notifyTarget,
          "New maintenance request",
          `A maintenance job "${title}" has been raised for "${property.title}".`,
          "JOB_UPDATE",
          { jobId: job.id, propertyId }
        )
      : Promise.resolve(),
  ]);

  return NextResponse.json({ job }, { status: 201 });
}

/*
  GET /api/maintenance
  - Landlord: all jobs across their properties
  - Tenant: all jobs for their current tenancy property
  - Artisan: jobs assigned to them
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

  let jobs;

  if (user?.roles.includes("LANDLORD") || (await prisma.propertyManagement.count({ where: { managerId: session.user.id, status: "ACTIVE" } })) > 0) {
    // Landlord or Manager — jobs for properties they own or manage
    jobs = await prisma.maintenanceJob.findMany({
      where: {
        OR: [
          { property: { landlordId: session.user.id } },
          { property: { management: { some: { managerId: session.user.id, status: "ACTIVE" } } } }
        ]
      },
      include: {
        property: { select: { id: true, title: true } },
        artisan: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (user?.roles.includes("ARTISAN")) {
    jobs = await prisma.maintenanceJob.findMany({
      where: { artisanId: session.user.id },
      include: { property: { select: { id: true, title: true, address: true } } },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Tenant — jobs for their property
    const tenancy = await prisma.tenancy.findUnique({
      where: { tenantId: session.user.id },
      select: { propertyId: true },
    });
    jobs = tenancy
      ? await prisma.maintenanceJob.findMany({
          where: { propertyId: tenancy.propertyId },
          include: { artisan: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];
  }

  return NextResponse.json({ jobs });
}
