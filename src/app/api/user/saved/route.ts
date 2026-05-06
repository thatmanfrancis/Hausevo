import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/user/saved
  List all properties the logged-in tenant has saved.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const saved = await prisma.savedProperty.findMany({
    where: { tenantId: userId },
    select: {
      id: true,
      createdAt: true,
      property: {
        select: {
          id: true, title: true, address: true, lga: true, state: true,
          pricePerYear: true, totalPackage: true, status: true, healthScore: true,
          images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          landlord: { select: { id: true, fullName: true, verificationTier: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ saved });
}
