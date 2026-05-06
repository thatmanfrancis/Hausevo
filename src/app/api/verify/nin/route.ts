import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { lookupNIN } from "@/lib/dojah";

/*
  POST /api/verify/nin
  Step 1 of identity verification — NIN lookup (FREE TIER).
  Confirms the NIN exists and that the name on it matches the account.
  On success, bumps verificationTier to 0 (basic verification).
  
  This is FREE for all users - part of the freemium onboarding.
  Users can browse properties but cannot apply until they upgrade to Tier 1.

  Cost: ~₦100 per call (Dojah starter rate) - absorbed by Shack.
  Charge to User: ₦0 (FREE)

  Requires: active session

  Body: { nin }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, verificationTier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.verificationTier >= 1) {
    return NextResponse.json(
      { error: "Your NIN is already verified." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { nin } = body;

  if (!nin || typeof nin !== "string" || nin.trim().length !== 11) {
    return NextResponse.json(
      { error: "A valid 11-digit NIN is required." },
      { status: 400 }
    );
  }

  // Call Dojah
  let ninData;
  try {
    ninData = await lookupNIN(nin.trim());
  } catch (err) {
    const message = err instanceof Error ? err.message : "NIN lookup failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Name match — compare first + last name (case-insensitive)
  // In mock mode, skip the name check to allow testing with any account name
  const USE_MOCK = process.env.DOJAH_USE_MOCK === "true";

  if (!USE_MOCK) {
    const accountName = user.fullName.toLowerCase().trim();
    const ninFullName = `${ninData.first_name} ${ninData.last_name}`.toLowerCase().trim();
    const accountTokens = accountName.split(/\s+/);
    const ninTokens = ninFullName.split(/\s+/);
    const hasNameMatch = accountTokens.some((t) => ninTokens.includes(t));

    if (!hasNameMatch) {
      await audit({
        actorId: userId,
        action: "VERIFY",
        entity: "User",
        entityId: userId,
        after: {
          result: "name_mismatch",
          nin: nin.slice(0, 4) + "*******",
          ninName: ninFullName,
          accountName,
        },
        req,
      });

      return NextResponse.json(
        {
          error: "Name on NIN does not match your account name. Please contact support if this is incorrect.",
          ninName: `${ninData.first_name} ${ninData.last_name}`,
        },
        { status: 422 }
      );
    }
  }

  // Bump verificationTier to 0 (FREE tier) and store vault record
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { verificationTier: 0 }, // Tier 0 = Basic NIN verified (FREE)
    }),
    prisma.vaultItem.create({
      data: {
        title: "NIN Verification (Basic)",
        fileUrl: `nin:${nin.slice(0, 4)}*******`,  // never store full NIN
        category: "IDENTITY",
        ownerId: userId,
        isVerified: true,
      },
    }),
  ]);

  await Promise.all([
    audit({
      actorId: userId,
      action: "VERIFY",
      entity: "User",
      entityId: userId,
      after: {
        result: "success",
        verificationTier: 0,
        nin: nin.slice(0, 4) + "*******",
        tier: "FREE",
      },
      req,
    }),
    notify(
      userId,
      "Identity verified ✅",
      "Your NIN has been verified. You can now browse properties. Upgrade to Tier 1 (₦1,500) to apply for properties.",
      "DOC_VERIFIED",
      { verificationTier: 0, upgradeRequired: true }
    ),
  ]);

  return NextResponse.json({
    message: "NIN verified successfully (FREE tier).",
    verificationTier: 0,
    ninName: `${ninData.first_name} ${ninData.last_name}`,
    nextStep: "Upgrade to Tier 1 (₦1,500) to apply for properties",
    upgradeUrl: "/api/verify/upgrade",
  });
}
