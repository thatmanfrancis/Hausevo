import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/applications
  - Landlord: sees all applications across their properties
  - Tenant: sees all their own applications
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  const isLandlord = user?.roles.includes("LANDLORD");

  const applications = await prisma.tenancyApplication.findMany({
    where: isLandlord
      ? { property: { landlordId: session.user.id } }
      : { tenantId: session.user.id },
    select: {
      id: true,
      status: true,
      message: true,
      shackScoreAtApplication: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          lga: true,
          pricePerYear: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          verificationTier: true,
          shackScore: { select: { score: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
