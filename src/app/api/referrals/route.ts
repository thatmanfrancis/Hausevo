import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/referrals/generate
  Generate a HAUSEVO-XXXXXX referral code for the logged-in user.
  Each user gets one code. Calling again returns the existing one.
  Requires: active session
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Return existing code if already generated
  const existing = await prisma.referralCode.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, code: true, usedCount: true, createdAt: true },
  });

  if (existing) {
    return NextResponse.json({ referralCode: existing });
  }

  // Generate a unique HAUSEVO-XXXXXX code
  let code: string;
  let attempts = 0;
  do {
    const raw = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `HAUSEVO-${raw}`;
    const taken = await prisma.referralCode.findUnique({ where: { code } });
    if (!taken) break;
    attempts++;
  } while (attempts < 10);

  const referralCode = await prisma.referralCode.create({
    data: { ownerId: session.user.id, code: code! },
    select: { id: true, code: true, usedCount: true, createdAt: true },
  });

  await audit({
    actorId: session.user.id,
    action: "CREATE",
    entity: "ReferralCode",
    entityId: referralCode.id,
    after: { code: referralCode.code },
    req,
  });

  return NextResponse.json({ referralCode }, { status: 201 });
}

/*
  GET /api/referrals
  Get the logged-in user's referral code and stats.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const referralCode = await prisma.referralCode.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, code: true, usedCount: true, createdAt: true },
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    select: {
      id: true, rewardPaid: true, createdAt: true,
      referee: { select: { id: true, fullName: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ referralCode: referralCode ?? null, referrals });
}
