import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/disputes/:id
  View a single dispute.
  Accessible by parties involved or admin.
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

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      raisedBy: { select: { id: true, fullName: true } },
      against: { select: { id: true, fullName: true } },
      resolvedBy: { select: { id: true, fullName: true } },
      property: { select: { id: true, title: true } },
    },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isInvolved =
    dispute.raisedById === session.user.id || dispute.againstId === session.user.id;

  if (!isAdmin && !isInvolved) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ dispute });
}

/*
  PATCH /api/disputes/:id
  Admin resolves or escalates a dispute.
  Requires: active session + ADMIN role

  Body: { status, resolution? }
*/
export async function PATCH(
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
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      status: true, raisedById: true, againstId: true,
      raisedBy: { select: { fullName: true } },
    },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found." }, { status: 404 });
  }

  const body = await req.json();
  const { status, resolution } = body;

  const validStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "ESCALATED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const before = { status: dispute.status };

  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      status,
      ...(resolution && { resolution }),
      ...(status === "RESOLVED" && { resolvedById: session.user.id }),
    },
    select: { id: true, status: true, resolution: true, updatedAt: true },
  });

  const notifyBoth = async (message: string) => {
    await Promise.all([
      notify(dispute.raisedById, "Dispute update", message, "DISPUTE_UPDATE", { disputeId: id }),
      notify(dispute.againstId, "Dispute update", message, "DISPUTE_UPDATE", { disputeId: id }),
    ]);
  };

  let notifyMessage = `Your dispute is now ${status.replace("_", " ").toLowerCase()}.`;
  if (status === "RESOLVED" && resolution) {
    notifyMessage = `Your dispute has been resolved: "${resolution}"`;
  }

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "UPDATE",
      entity: "Dispute",
      entityId: id,
      before,
      after: { status, resolution: resolution ?? null },
      req,
    }),
    notifyBoth(notifyMessage),
  ]);

  return NextResponse.json({ dispute: updated });
}
