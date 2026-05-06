import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/admin/users
  Admin lists all users with filters.
  Requires: active session + ADMIN role

  Query params: role, isVerified, page, limit, search
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
  const role = searchParams.get("role") ?? undefined;
  const isVerified = searchParams.get("isVerified");
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;

  const where = {
    ...(role && { roles: { has: role as never } }),
    ...(isVerified !== null && { isVerified: isVerified === "true" }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phoneNumber: { contains: search } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, fullName: true, email: true, phoneNumber: true,
        roles: true, isVerified: true, verificationTier: true,
        createdAt: true,
        _count: { select: { ownedProperties: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
