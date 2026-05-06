import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/service-requests/:id
  Update service request status.
  Requires: active session + admin or landlord of the property

  Body: { status }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      property: { select: { landlordId: true, title: true } },
      tenant: { select: { id: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Service request not found." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isLandlord = request.property.landlordId === userId;

  if (!isAdmin && !isLandlord) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  const validStatuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "VERIFIED", "PAID", "DISPUTED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const before = { status: request.status };

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: { status },
    select: { id: true, status: true, updatedAt: true },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "UPDATE",
      entity: "ServiceRequest",
      entityId: id,
      before,
      after: { status },
      req,
    }),
    notify(
      request.tenantId,
      "Service request update",
      `Your ${request.category.toLowerCase()} request for "${request.property.title}" is now ${status.toLowerCase()}.`,
      "JOB_UPDATE",
      { serviceRequestId: id }
    ),
  ]);

  return NextResponse.json({ request: updated });
}
