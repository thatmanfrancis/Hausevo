import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/scout-rewards
  - Scout: their own rewards
  - Admin: all rewards
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

  const isAdmin = user?.roles.includes("ADMIN");

  const rewards = await prisma.scoutReward.findMany({
    where: isAdmin ? {} : { redeemerId: session.user.id },
    select: {
      id: true, amount: true, status: true, paidAt: true, createdAt: true,
      property: { select: { id: true, title: true, lga: true, status: true } },
      redeemer: { select: { id: true, fullName: true } },
      accessKey: { select: { key: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rewards });
}
