import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/referrals/redeem
  New user redeems a referral code after signing up.
  Can only be done once per user.
  Requires: active session

  Body: { code }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Check if this user has already been referred
  const alreadyReferred = await prisma.referral.findUnique({
    where: { refereeId: session.user.id },
  });

  if (alreadyReferred) {
    return NextResponse.json(
      { error: "You have already used a referral code." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json({ error: "Referral code is required." }, { status: 400 });
  }

  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
    include: { owner: { select: { id: true, fullName: true } } },
  });

  if (!referralCode) {
    return NextResponse.json({ error: "Invalid referral code." }, { status: 400 });
  }

  // Cannot refer yourself
  if (referralCode.ownerId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot use your own referral code." },
      { status: 400 }
    );
  }

  const referral = await prisma.referral.create({
    data: {
      referrerId: referralCode.ownerId,
      refereeId: session.user.id,
      referralCode: code,
    },
    select: { id: true, createdAt: true },
  });

  // Increment the code's usage count
  await prisma.referralCode.update({
    where: { id: referralCode.id },
    data: { usedCount: { increment: 1 } },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Referral",
      entityId: referral.id,
      after: { referrerId: referralCode.ownerId, refereeId: session.user.id, code },
      req,
    }),
    notify(
      referralCode.ownerId,
      "Someone used your referral code!",
      `A new user signed up using your referral code ${code}. Keep sharing to earn more rewards.`,
      "SYSTEM",
      { referralId: referral.id }
    ),
  ]);

  return NextResponse.json(
    { message: "Referral code applied successfully.", referral },
    { status: 201 }
  );
}
