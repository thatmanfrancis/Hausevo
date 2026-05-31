import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { lookupBVN } from "@/lib/dojah";

/*
  POST /api/verify/bvn
  Optional BVN lookup — enriches Hausevo Score with financial identity signals.
  Does NOT change verificationTier (that's NIN-based).
  Stores a vault record and flags the user's fintechPartnerRef.

  Requires: active session

  Body: { bvn }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, fintechPartnerRef: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.fintechPartnerRef) {
    return NextResponse.json(
      { error: "BVN already linked to this account." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { bvn } = body;

  if (!bvn || typeof bvn !== "string" || bvn.trim().length !== 11) {
    return NextResponse.json(
      { error: "A valid 11-digit BVN is required." },
      { status: 400 }
    );
  }

  // Call Dojah
  let bvnData;
  try {
    bvnData = await lookupBVN(bvn.trim());
  } catch (err) {
    const message = err instanceof Error ? err.message : "BVN lookup failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Name match check
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

  // Store masked BVN ref and vault record
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { fintechPartnerRef: `bvn:${bvn.slice(0, 4)}*******` },
    }),
    prisma.vaultItem.create({
      data: {
        title: "BVN Verification",
        fileUrl: `bvn:${bvn.slice(0, 4)}*******`,
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
        result: "bvn_linked",
        bvn: bvn.slice(0, 4) + "*******",
        enrollmentBank: bvnData.enrollment_bank ?? null,
      },
      req,
    }),
    notify(
      userId,
      "BVN linked ✅",
      "Your BVN has been linked to your Hausevo account. This strengthens your Hausevo Score.",
      "DOC_VERIFIED",
      { bvnLinked: true }
    ),
  ]);

  return NextResponse.json({
    message: "BVN linked successfully.",
    bvnName: `${bvnData.first_name} ${bvnData.last_name}`,
    enrollmentBank: bvnData.enrollment_bank ?? null,
  });
}
