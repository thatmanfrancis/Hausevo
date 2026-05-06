import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/admin/properties
  Admin lists all properties with filters.
  Requires: active session + ADMIN role

  Query params: status?, lga?, page?, limit?, search?
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
  const lga = searchParams.get("lga") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;

  const validStatuses = ["PENDING", "AVAILABLE", "RENTED", "MAINTENANCE", "FLAGGED"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const where = {
    ...(status && { status: status as never }),
    ...(lga && { lga }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, address: true, lga: true, state: true,
        status: true, pricePerYear: true, totalPackage: true,
        healthScore: true, createdAt: true, updatedAt: true,
        landlord: { select: { id: true, fullName: true, email: true } },
        accessKey: { select: { key: true } },
        _count: {
          select: {
            images: true,
            applications: true,
            maintenanceJobs: true,
          },
        },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json({
    properties,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
