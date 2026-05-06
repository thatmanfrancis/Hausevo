import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { verifyNINWithSelfie, lookupBVN } from "@/lib/dojah";

/*
  POST /api/verify/upgrade
  Upgrade from Tier 0 (FREE) to Tier 1 (VERIFIED) - ₦1,500
  
  Includes:
  - Biometric selfie verification
  - BVN financial signal
  - Ability to apply for properties
  - ShackScore visible to landlords
  - "Verified" badge
  
  Requires: active session + verificationTier 0 + wallet balance ₦1,500
  
  Body: {
    nin: string,
    selfieBase64: string,
    bvn: string
  }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      verificationTier: true,
      walletBalance: true,
      verificationBundlePaid: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Check if already upgraded
  if (user.verificationTier >= 1) {
    return NextResponse.json(
      { error: "You are already verified at Tier 1 or higher." },
      { status: 409 }
    );
  }

  // Check if already paid (shouldn't happen, but safety check)
  if (user.verificationBundlePaid) {
    return NextResponse.json(
      { error: "Verification bundle already paid." },
      { status: 409 }
    );
  }

  // Check wallet balance
  const UPGRADE_FEE = 1500;
  if (user.walletBalance < UPGRADE_FEE) {
    return NextResponse.json(
      {
        error: "Insufficient wallet balance.",
        required: UPGRADE_FEE,
        current: user.walletBalance,
        shortfall: UPGRADE_FEE - user.walletBalance,
        message: "Please top up your wallet to upgrade to Tier 1.",
      },
      { status: 402 }
    );
  }

  const body = await req.json();
  const { nin, selfieBase64, bvn } = body;

  // Validation
  if (!nin || typeof nin !== "string" || nin.trim().length !== 11) {
    return NextResponse.json(
      { error: "A valid 11-digit NIN is required." },
      { status: 400 }
    );
  }

  if (!selfieBase64 || typeof selfieBase64 !== "string") {
    return NextResponse.json(
      { error: "selfieBase64 is required." },
      { status: 400 }
    );
  }

  if (!bvn || typeof bvn !== "string" || bvn.trim().length !== 11) {
    return NextResponse.json(
      { error: "A valid 11-digit BVN is required." },
      { status: 400 }
    );
  }

  // Strip data URI prefix if present
  const cleanSelfie = selfieBase64.replace(/^data:image\/\w+;base64,/, "");

  // Step 1: Verify NIN + Selfie
  let selfieResult;
  try {
    selfieResult = await verifyNINWithSelfie(nin.trim(), cleanSelfie);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Selfie verification failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { confidence_value, match } = selfieResult.selfie_verification;
  const CONFIDENCE_THRESHOLD = 70;
  const selfiePass = match && confidence_value >= CONFIDENCE_THRESHOLD;

  if (!selfiePass) {
    return NextResponse.json(
      {
        error: "Selfie does not match the NIN photo. Please try again with a clearer photo.",
        confidence_value,
        match,
      },
      { status: 422 }
    );
  }

  // Step 2: Verify BVN
  let bvnData;
  try {
    bvnData = await lookupBVN(bvn.trim());
  } catch (err) {
    const message = err instanceof Error ? err.message : "BVN lookup failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Name match check (BVN vs account) — skipped in mock mode
  const USE_MOCK = process.env.DOJAH_USE_MOCK === "true";
  if (!USE_MOCK) {
    const accountName = user.fullName.toLowerCase().trim();
    const bvnFullName = `${bvnData.first_name} ${bvnData.last_name}`.toLowerCase().trim();
    const bvnTokens = bvnFullName.split(/\s+/);
    const accountTokens = accountName.split(/\s+/);
    const hasNameMatch = accountTokens.some((t) => bvnTokens.includes(t));

    if (!hasNameMatch) {
      return NextResponse.json(
        {
          error: "Name on BVN does not match your account name.",
          bvnName: `${bvnData.first_name} ${bvnData.last_name}`,
        },
        { status: 422 }
      );
    }
  }

  // All verifications passed - charge user and upgrade
  await prisma.$transaction([
    // Deduct ₦1,500 from wallet
    prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { decrement: UPGRADE_FEE },
        verificationTier: 1,
        verificationBundlePaid: true,
        verificationBundlePaidAt: new Date(),
        fintechPartnerRef: `bvn:${bvn.slice(0, 4)}*******`,
      },
    }),

    // Record transaction
    prisma.transaction.create({
      data: {
        userId,
        amount: -UPGRADE_FEE,
        shackFee: 0, // No Shack fee for verification service
        netAmount: -UPGRADE_FEE,
        type: "SERVICE",
        status: "SUCCESS",
        reference: `verification-upgrade-${userId}-${Date.now()}`,
        metadata: {
          service: "Tier 1 Verification Upgrade",
          includes: ["NIN", "Selfie", "BVN"],
          tier: 1,
        },
      },
    }),

    // Store BVN vault item
    prisma.vaultItem.create({
      data: {
        title: "BVN Verification",
        fileUrl: `bvn:${bvn.slice(0, 4)}*******`,
        category: "IDENTITY",
        ownerId: userId,
        isVerified: true,
      },
    }),

    // Update existing NIN vault item
    prisma.vaultItem.updateMany({
      where: {
        ownerId: userId,
        category: "IDENTITY",
        title: { contains: "NIN" },
      },
      data: {
        title: "NIN Verification (Full)",
      },
    }),
  ]);

  await Promise.all([
    audit({
      actorId: userId,
      action: "PAYMENT",
      entity: "User",
      entityId: userId,
      after: {
        service: "Verification Upgrade",
        amount: -UPGRADE_FEE,
        verificationTier: 1,
        selfieConfidence: confidence_value,
      },
      req,
    }),
    notify(
      userId,
      "Upgraded to Tier 1! 🎉",
      `Your account is now fully verified. You can apply for properties. Selfie match: ${confidence_value}%`,
      "DOC_VERIFIED",
      {
        verificationTier: 1,
        confidence_value,
        canApply: true,
      }
    ),
  ]);

  return NextResponse.json({
    message: "Successfully upgraded to Tier 1!",
    verificationTier: 1,
    amountCharged: UPGRADE_FEE,
    newWalletBalance: user.walletBalance - UPGRADE_FEE,
    verification: {
      nin: `${nin.slice(0, 4)}*******`,
      selfieConfidence: confidence_value,
      bvn: `${bvn.slice(0, 4)}*******`,
      bvnBank: bvnData.enrollment_bank,
    },
    benefits: [
      "Can now apply for properties",
      "ShackScore visible to landlords",
      "Verified badge on profile",
      "Priority in application queue",
    ],
  });
}

/*
  GET /api/verify/upgrade
  Get upgrade information and pricing
*/
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      verificationTier: true,
      walletBalance: true,
      verificationBundlePaid: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const UPGRADE_FEE = 1500;
  const canUpgrade = user.verificationTier === 0 && !user.verificationBundlePaid;
  const hasBalance = user.walletBalance >= UPGRADE_FEE;

  return NextResponse.json({
    currentTier: user.verificationTier,
    canUpgrade,
    upgradeFee: UPGRADE_FEE,
    walletBalance: user.walletBalance,
    hasBalance,
    shortfall: hasBalance ? 0 : UPGRADE_FEE - user.walletBalance,
    benefits: {
      tier0: [
        "Browse all properties",
        "Save favorite properties",
        "Chat with landlords",
        "View property details",
      ],
      tier1: [
        "Everything in Tier 0",
        "Apply for properties",
        "ShackScore visible to landlords",
        "Verified badge on profile",
        "Priority in application queue",
        "Vault document storage (100MB)",
      ],
    },
  });
}
