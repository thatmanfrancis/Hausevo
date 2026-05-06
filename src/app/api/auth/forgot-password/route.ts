import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/forgot-password
  Generates a password reset token and stores it.
  In production, this token is emailed to the user.

  Body: { email }
*/
export async function POST(req: NextRequest) {
  // 3 requests per IP per 15 minutes
  const limited = rateLimit(req, { limit: 3, windowSeconds: 900 });
  if (limited) return limited;

  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always return the same message — prevents email enumeration
  const genericResponse = NextResponse.json({
    message: "If that email is registered, a reset link has been sent.",
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  // TODO: send email with reset link
  console.log(`[DEV] Reset link → ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`);

  return genericResponse;
}
