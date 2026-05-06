import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/2fa/verify
  Verifies the 6-digit TOTP code from the user's authenticator app.

  Two uses:
  1. During setup  → confirms the secret works, then enables 2FA
  2. During login  → confirms identity before granting full access

  Body: { code }
  Requires: active session
*/
export async function POST(req: NextRequest) {
  // 10 attempts per IP per minute
  const limited = rateLimit(req, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: "Verification code is required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA has not been set up for this account. Call /2fa/setup first." },
      { status: 400 }
    );
  }

  // Check the code against the stored secret
  const isValid = verify({ token: code, secret: user.twoFactorSecret });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid code. Please try again." },
      { status: 400 }
    );
  }

  // If 2FA wasn't enabled yet, this verification activates it
  if (!user.twoFactorEnabled) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ message: "2FA has been enabled on your account." });
  }

  // If already enabled, this is a login verification — code is correct
  return NextResponse.json({ message: "2FA verified successfully." });
}
