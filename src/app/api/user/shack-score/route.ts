import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/user/shack-score
  Get the logged-in user's Hausevo Score breakdown.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const score = await prisma.shackScore.findUnique({
    where: { userId },
  });

  if (!score) {
    return NextResponse.json({
      score: {
        score: 500,
        onTimePayments: 0,
        latePayments: 0,
        disputesRaised: 0,
        disputesLost: 0,
        completedTenancies: 0,
        lastCalculated: null,
      },
    });
  }

  return NextResponse.json({ score });
}
