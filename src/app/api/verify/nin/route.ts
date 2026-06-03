import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { lookupNIN } from "@/lib/dojah";

/*
  POST /api/verify/nin
  Identity verification via NIN lookup (Dojah sandbox/production).
  On success, sets verificationTier to 1 — user is fully verified.
  No payment required.

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
      { error: "Your identity is already verified." },
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

  // Call Dojah (sandbox when DOJAH_ENV !== "production", mock when DOJAH_USE_MOCK=true)
  let ninData;
  try {
    ninData = await lookupNIN(nin.trim(), user.fullName);
  } catch (err) {
    const message = err instanceof Error ? err.message : "NIN lookup failed.";
    console.error("[NIN verify] Dojah error:", message);
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Name match — include first, middle, and last name in any order
  const ninParts = [ninData.first_name, ninData.middle_name, ninData.last_name]
    .filter(Boolean)
    .map((p) => p!.toLowerCase().trim());

  const accountTokens = user.fullName
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const matchCount = accountTokens.filter((token) =>
    ninParts.some((part) => part.includes(token) || token.includes(part))
  ).length;

  const requiredMatches = Math.min(2, accountTokens.length);
  const hasNameMatch = matchCount >= requiredMatches;

  if (!hasNameMatch) {
    console.warn("[NIN verify] Name mismatch", {
      accountName: user.fullName,
      accountTokens,
      ninParts,
      matchCount,
      requiredMatches,
    });

    await audit({
      actorId: userId,
      action: "VERIFY",
      entity: "User",
      entityId: userId,
      after: {
        result: "name_mismatch",
        nin: nin.slice(0, 4) + "*******",
        matchCount,
      },
      req,
    });

    return NextResponse.json(
      {
        error: "The name on your NIN doesn't match your account name. Update your profile name to match your NIN, or contact support.",
      },
      { status: 422 }
    );
  }

  // Verification passed — grant Tier 1 directly
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        verificationTier: 1,
        verificationBundlePaid: true,
        verificationBundlePaidAt: new Date(),
      },
    }),
    prisma.vaultItem.upsert({
      where: {
        // Use a stable synthetic ID so repeat calls don't duplicate
        id: `nin-vault-${userId}`,
      },
      create: {
        id: `nin-vault-${userId}`,
        title: "NIN Verification",
        fileUrl: `nin:${nin.slice(0, 4)}*******`,
        category: "IDENTITY",
        ownerId: userId,
        isVerified: true,
      },
      update: {
        isVerified: true,
        fileUrl: `nin:${nin.slice(0, 4)}*******`,
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
        verificationTier: 1,
        nin: nin.slice(0, 4) + "*******",
      },
      req,
    }),
    notify(
      userId,
      "Identity verified ✅",
      "Your NIN has been verified. You can now apply for properties.",
      "DOC_VERIFIED",
      { verificationTier: 1 }
    ),
  ]);

  return NextResponse.json({
    message: "NIN verified successfully.",
    verificationTier: 1,
    ninName: `${ninData.first_name} ${ninData.last_name}`,
  });
}

