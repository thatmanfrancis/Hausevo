import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/2fa/login-verify
  Verifies a TOTP code during the login flow, before a session exists.
  Called after credentials are validated and the server returns requires2FA: true.

  Body: { userId, code }
  No session required — userId is passed explicitly.
  Rate-limited aggressively to prevent brute force.
*/
export async function POST(req: NextRequest) {
  // 5 attempts per IP per minute — tighter than the session-based endpoint
  const limited = rateLimit(req, { limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const body = await req.json();
  const { userId, code } = body;

  if (!userId || !code) {
    return NextResponse.json(
      { error: "User ID and verification code are required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      isVerified: true,
    },
  });

  // Don't reveal whether the user exists
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "Invalid code. Please try again." },
      { status: 400 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      { error: "Account is not verified." },
      { status: 403 }
    );
  }

  const isValid = verify({ token: code, secret: user.twoFactorSecret });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid code. Please try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "2FA verified." });
}
