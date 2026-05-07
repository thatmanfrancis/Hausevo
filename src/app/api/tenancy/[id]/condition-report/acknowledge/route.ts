import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/*
  POST /api/tenancy/[id]/condition-report/acknowledge
  Either tenant or landlord acknowledges the condition report.
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenancyId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = session.user.id;

  const report = await prisma.conditionReport.findUnique({
    where: { tenancyId },
    include: {
      tenancy: {
        select: {
          tenantId: true,
          property: { select: { title: true, landlordId: true } },
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Condition report not found." }, { status: 404 });
  }

  const isTenant = report.tenancy.tenantId === userId;
  const isLandlord = report.tenancy.property.landlordId === userId;

  if (!isTenant && !isLandlord) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const data: any = {};
  if (isTenant) data.isAcknowledgedByTenant = true;
  if (isLandlord) data.isAcknowledgedByOwner = true;

  const updatedReport = await prisma.conditionReport.update({
    where: { id: report.id },
    data,
  });

  // Notify other party
  const otherId = isTenant ? report.tenancy.property.landlordId : report.tenancy.tenantId;
  const partyType = isTenant ? "Tenant" : "Landlord";

  await Promise.all([
    audit({
      actorId: userId,
      action: "UPDATE",
      entity: "ConditionReport",
      entityId: report.id,
      after: data,
      req,
    }),
    notify(
      otherId,
      "Condition Report Acknowledged",
      `The ${partyType} has acknowledged the ${report.type.toLowerCase()} condition report for "${report.tenancy.property.title}".`,
      "TENANCY_UPDATE",
      { tenancyId, reportId: report.id }
    ),
  ]);

  return NextResponse.json({
    message: "Report acknowledged successfully.",
    report: updatedReport,
  });
}
