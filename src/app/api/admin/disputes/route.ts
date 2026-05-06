import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/admin/disputes
  Admin lists all disputes with filters.
  Requires: active session + ADMIN role

  Query params: status?, type?, page?, limit?
*/
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!admin?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;

  const validStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "ESCALATED"];
  const validTypes = ["MAINTENANCE", "RENT", "CAUTION_DEPOSIT", "PROPERTY_CONDITION"];

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  if (type && !validTypes.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const where = {
    ...(status && { status: status as never }),
    ...(type && { type: type as never }),
  };

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, type: true, status: true, description: true,
        evidence: true, resolution: true, createdAt: true, updatedAt: true,
        raisedBy: { select: { id: true, fullName: true, email: true } },
        against: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true } },
        property: { select: { id: true, title: true } },
      },
    }),
    prisma.dispute.count({ where }),
  ]);

  return NextResponse.json({
    disputes,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
