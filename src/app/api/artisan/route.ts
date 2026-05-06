import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/artisan
  List vetted artisans, optionally filtered by category.
  Used when assigning an artisan to a maintenance job.
  Requires: active session

  Query params: category?, page?, limit?
  category: PLUMBER | ELECTRICIAN | AC_TECHNICIAN | CARPENTER | PAINTER | CLEANER | SECURITY | GENERAL
*/
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;

  const validCategories = [
    "PLUMBER", "ELECTRICIAN", "AC_TECHNICIAN", "CARPENTER",
    "PAINTER", "CLEANER", "SECURITY", "GENERAL",
  ];

  if (category && !validCategories.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const [artisans, total] = await Promise.all([
    prisma.artisanProfile.findMany({
      where: {
        isVetted: true,
        ...(category && { category: category as never }),
      },
      skip,
      take: limit,
      orderBy: { rating: "desc" },
      select: {
        id: true, category: true, rating: true, safetyBond: true, isVetted: true,
        user: {
          select: {
            id: true, fullName: true, verificationTier: true,
            _count: { select: { maintenanceJobs: true, reviewsReceived: true } },
          },
        },
      },
    }),
    prisma.artisanProfile.count({
      where: {
        isVetted: true,
        ...(category && { category: category as never }),
      },
    }),
  ]);

  return NextResponse.json({
    artisans,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
