import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*
  GET /api/user/:id
  Public profile — only safe fields exposed.
  Used by tenants viewing a landlord, or landlords viewing a tenant.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      roles: true,
      verificationTier: true,
      shackScore: {
        select: {
          score: true,
          completedTenancies: true,
        },
      },
      reviewsReceived: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}
