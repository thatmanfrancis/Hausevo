import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/reset-password
  Validates the reset token and updates the user's password.

  Body: { token, password, confirmPassword }
*/
export async function POST(req: NextRequest) {
  // 5 attempts per IP per 15 minutes
  const limited = rateLimit(req, { limit: 5, windowSeconds: 900 });
  if (limited) return limited;

  const body = await req.json();
  const { token, password, confirmPassword } = body;

  if (!token || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    );
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character." },
      { status: 400 }
    );
  }

  const record = await prisma.verificationToken.findFirst({ where: { token } });

  if (!record) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 }
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    });
    return NextResponse.json(
      { error: "Reset link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  return NextResponse.json({ message: "Password updated. You can now log in." });
}
