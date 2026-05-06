import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/user/wishlist
  Get the logged-in tenant's property wishlist/matching criteria.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const wishlist = await prisma.propertyWishlist.findUnique({
    where: { tenantId: userId },
  });

  return NextResponse.json({ wishlist: wishlist ?? null });
}

/*
  PUT /api/user/wishlist
  Create or update the tenant's wishlist criteria.
  When a matching property goes AVAILABLE, they get notified.
  Requires: active session

  Body: { lga?, maxBudget?, minBedrooms?, requirements?, isActive? }
*/
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { lga, maxBudget, minBedrooms, requirements, isActive = true } = body;

  const wishlist = await prisma.propertyWishlist.upsert({
    where: { tenantId: userId },
    create: {
      tenantId: userId,
      lga: lga ?? null,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      minBedrooms: minBedrooms ? Number(minBedrooms) : null,
      requirements: requirements ?? undefined,
      isActive,
    },
    update: {
      ...(lga !== undefined && { lga }),
      ...(maxBudget !== undefined && { maxBudget: maxBudget ? Number(maxBudget) : null }),
      ...(minBedrooms !== undefined && { minBedrooms: minBedrooms ? Number(minBedrooms) : null }),
      ...(requirements !== undefined && { requirements }),
      isActive,
    },
  });

  return NextResponse.json({ wishlist });
}

/*
  DELETE /api/user/wishlist
  Deactivate the wishlist (stop receiving match notifications).
*/
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  await prisma.propertyWishlist.updateMany({
    where: { tenantId: userId },
    data: { isActive: false },
  });

  return NextResponse.json({ message: "Wishlist deactivated." });
}
