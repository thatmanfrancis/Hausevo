import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { verifyNINWithSelfie } from "@/lib/dojah";

/*
  POST /api/verify/nin-selfie
  Step 2 of identity verification — NIN + liveness selfie match.
  Confirms the person holding the account is the NIN owner.
  On success, bumps verificationTier to 2.

  Requires: active session + verificationTier >= 1 (NIN lookup done first)

  Body: { nin, selfieBase64 }
  selfieBase64: base64 string of the selfie image.
                Strip "data:image/jpeg;base64," prefix before sending.
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verificationTier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.verificationTier < 1) {
    return NextResponse.json(
      { error: "Complete NIN verification (Tier 1) before selfie verification." },
      { status: 400 }
    );
  }

  if (user.verificationTier >= 2) {
    return NextResponse.json(
      { error: "Selfie verification already completed." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { nin, selfieBase64 } = body;

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

  // Strip data URI prefix if caller forgot to
  const cleanSelfie = selfieBase64.replace(/^data:image\/\w+;base64,/, "");

  // Call Dojah
  let result;
  try {
    result = await verifyNINWithSelfie(nin.trim(), cleanSelfie);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Selfie verification failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { confidence_value, match } = result.selfie_verification;

  // Require at least 70% confidence for a pass
  const CONFIDENCE_THRESHOLD = 70;
  const passed = match && confidence_value >= CONFIDENCE_THRESHOLD;

  await audit({
    actorId: userId,
    action: "VERIFY",
    entity: "User",
    entityId: userId,
    after: {
      result: passed ? "success" : "face_mismatch",
      confidence_value,
      match,
      nin: nin.slice(0, 4) + "*******",
    },
    req,
  });

  if (!passed) {
    return NextResponse.json(
      {
        error: "Selfie does not match the NIN photo. Please try again with a clearer photo.",
        confidence_value,
        match,
      },
      { status: 422 }
    );
  }

  // Bump to Tier 2
  await prisma.user.update({
    where: { id: userId },
    data: { verificationTier: 2 },
  });

  await notify(
    userId,
    "Face verification passed ✅",
    "Your selfie matched your NIN. Your account is now Tier 2 verified on Hausevo.",
    "DOC_VERIFIED",
    { verificationTier: 2, confidence_value }
  );

  return NextResponse.json({
    message: "Selfie verification passed.",
    verificationTier: 2,
    confidence_value,
  });
}
