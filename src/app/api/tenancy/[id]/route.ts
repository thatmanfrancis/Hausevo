import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/tenancy/:id
  Landlord requests an edit to a tenancy.
  Does NOT apply changes immediately — creates an admin approval request.
  An admin must review and approve via /admin/audit before changes go live.

  Body: { startDate?, endDate?, cautionDeposit?, savingsGoal?, reason }
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
  const { id: tenancyId } = await params;

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: {
      property: { select: { id: true, title: true, landlordId: true } },
    },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const isLandlord = tenancy.property.landlordId === userId;
  const isManager = !!(await prisma.propertyManagement.findFirst({
    where: { propertyId: tenancy.property.id, managerId: userId, status: "ACTIVE", canApproveTenants: true },
  }));

  if (!isLandlord && !isManager) {
    return NextResponse.json({ error: "Only the landlord or an authorized manager can request tenancy edits." }, { status: 403 });
  }

  const body = await req.json();
  const { startDate, endDate, cautionDeposit, savingsGoal, reason } = body;

  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "A reason for the edit is required." }, { status: 400 });
  }

  const requestedChanges: Record<string, unknown> = {};
  if (startDate) requestedChanges.startDate = startDate;
  if (endDate) requestedChanges.endDate = endDate;
  if (cautionDeposit !== undefined) requestedChanges.cautionDeposit = Number(cautionDeposit);
  if (savingsGoal !== undefined) requestedChanges.savingsGoal = Number(savingsGoal);

  if (Object.keys(requestedChanges).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  // Write an admin-review audit entry — admin will action this
  const auditEntry = await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "UPDATE",
      entity: "Tenancy",
      entityId: tenancyId,
      before: {
        startDate: tenancy.startDate,
        endDate: tenancy.endDate,
        cautionDeposit: tenancy.cautionDeposit,
        savingsGoal: tenancy.savingsGoal,
      },
      after: {
        ...requestedChanges,
        _pendingAdminApproval: true,
        _reason: reason.trim(),
        _propertyTitle: tenancy.property.title,
        _requestedBy: userId,
      },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { roles: { has: "ADMIN" } },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      notify(
        admin.id,
        "Tenancy edit requested",
        `Landlord has requested changes to tenancy for "${tenancy.property.title}". Reason: ${reason.trim()}`,
        "SYSTEM",
        { tenancyId, auditLogId: auditEntry.id, action: "EDIT_REQUEST" }
      )
    )
  );

  return NextResponse.json({
    message: "Edit request submitted. An admin will review and apply the changes.",
    requestId: auditEntry.id,
  });
}

/*
  DELETE /api/tenancy/:id
  Landlord requests deletion (termination) of a tenancy.
  Does NOT delete immediately — creates an admin approval request.

  Body: { reason }
*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: tenancyId } = await params;

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: {
      property: { select: { id: true, title: true, landlordId: true } },
      tenant: { select: { id: true, fullName: true } },
    },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const isLandlord = tenancy.property.landlordId === userId;
  const isManager = !!(await prisma.propertyManagement.findFirst({
    where: { propertyId: tenancy.property.id, managerId: userId, status: "ACTIVE", canApproveTenants: true },
  }));

  if (!isLandlord && !isManager) {
    return NextResponse.json({ error: "Only the landlord or an authorized manager can request tenancy deletion." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = body?.reason?.trim();

  if (!reason) {
    return NextResponse.json({ error: "A reason for the deletion request is required." }, { status: 400 });
  }

  const auditEntry = await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "DELETE",
      entity: "Tenancy",
      entityId: tenancyId,
      before: {
        status: tenancy.status,
        tenantId: tenancy.tenantId,
        tenantName: tenancy.tenant.fullName,
        propertyTitle: tenancy.property.title,
        startDate: tenancy.startDate,
        endDate: tenancy.endDate,
      },
      after: {
        _pendingAdminApproval: true,
        _reason: reason,
        _requestedBy: userId,
      },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  const admins = await prisma.user.findMany({
    where: { roles: { has: "ADMIN" } },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      notify(
        admin.id,
        "Tenancy deletion requested",
        `Landlord has requested termination of tenancy for "${tenancy.property.title}" (tenant: ${tenancy.tenant.fullName}). Reason: ${reason}`,
        "SYSTEM",
        { tenancyId, auditLogId: auditEntry.id, action: "DELETE_REQUEST" }
      )
    )
  );

  return NextResponse.json({
    message: "Deletion request submitted. An admin will review and action this.",
    requestId: auditEntry.id,
  });
}
