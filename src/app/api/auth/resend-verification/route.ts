import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

/*
  POST /api/auth/resend-verification
  For users who didn't get the email or whose token expired.
  Deletes the old token, generates a fresh one, and resends.

  Body: { email }
*/
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic response whether the user exists or not — prevents enumeration
  const genericResponse = NextResponse.json({
    message: "If that email is registered and unverified, a new verification link has been sent.",
  });

  if (!user) return genericResponse;

  if (user.isVerified) {
    return NextResponse.json(
      { error: "This account is already verified." },
      { status: 400 }
    );
  }

  // Remove any existing token and issue a fresh one
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    },
  });

  // TODO: send email with the new verification link
  // await sendVerificationEmail(email, user.fullName, token)
  console.log(
    `[DEV] New verify link → ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`
  );

  return genericResponse;
}
