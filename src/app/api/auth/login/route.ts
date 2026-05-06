import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/login
  Validates email + password and returns the user.
  Auth.js session creation is handled separately via /api/auth/[...nextauth].

  Body: { email, password }
*/
export async function POST(req: NextRequest) {
  // 10 attempts per IP per minute
  const limited = rateLimit(req, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      passwordHash: true,
      roles: true,
      isVerified: true,
      twoFactorEnabled: true,
      verificationTier: true,
    },
  });

  // Generic message — don't reveal whether the email exists
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      {
        error: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 }
    );
  }

  // If 2FA is enabled, signal the client to prompt for a code
  if (user.twoFactorEnabled) {
    return NextResponse.json({ requires2FA: true, userId: user.id });
  }

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
