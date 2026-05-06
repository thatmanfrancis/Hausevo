import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/maintenance/:id
  View a single maintenance job.
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

  const job = await prisma.maintenanceJob.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, landlordId: true } },
      artisan: { select: { id: true, fullName: true, artisanProfile: true } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({ job });
}

/*
  PATCH /api/maintenance/:id
  Update a maintenance job — assign artisan, update status, add photos, set cost.
  Requires: active session + landlord of the property

  Body: { artisanId?, status?, cost?, beforePhotos?, afterPhotos? }
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

  const job = await prisma.maintenanceJob.findUnique({
    where: { id },
    include: {
      property: { select: { landlordId: true, title: true, tenancy: { select: { tenantId: true } } } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const isLandlord = job.property.landlordId === session.user.id;
  const isArtisan = job.artisanId === session.user.id;

  if (!isLandlord && !isArtisan) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await req.json();
  const { artisanId, status, cost, beforePhotos, afterPhotos } = body;

  const before = { status: job.status, artisanId: job.artisanId, cost: job.cost };

  const updated = await prisma.maintenanceJob.update({
    where: { id },
    data: {
      ...(artisanId !== undefined && { artisanId }),
      ...(status && { status }),
      ...(cost !== undefined && { cost: Number(cost) }),
      ...(beforePhotos && { beforePhotos }),
      ...(afterPhotos && { afterPhotos }),
    },
    select: {
      id: true, status: true, artisanId: true, cost: true,
      beforePhotos: true, afterPhotos: true, updatedAt: true,
    },
  });

  const notifyTargets: Promise<void>[] = [];

  if (status && status !== job.status) {
    // Notify tenant of status changes
    if (job.property.tenancy?.tenantId) {
      notifyTargets.push(
        notify(
          job.property.tenancy.tenantId,
          "Maintenance update",
          `Job "${job.title}" for "${job.property.title}" is now ${status}.`,
          "JOB_UPDATE",
          { jobId: id }
        )
      );
    }
    // Notify artisan when assigned
    if (artisanId && artisanId !== job.artisanId) {
      notifyTargets.push(
        notify(
          artisanId,
          "New job assigned",
          `You've been assigned to "${job.title}" at "${job.property.title}".`,
          "JOB_UPDATE",
          { jobId: id }
        )
      );
    }
  }

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "UPDATE",
      entity: "MaintenanceJob",
      entityId: id,
      before,
      after: { status: updated.status, artisanId: updated.artisanId, cost: updated.cost },
      req,
    }),
    ...notifyTargets,
  ]);

  return NextResponse.json({ job: updated });
}
