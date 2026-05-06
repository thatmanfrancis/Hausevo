import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*
  GET /api/auth/verify-email?token=xxx
  Called when the user clicks the verification link in their email.
  Marks the account as verified and deletes the used token.
*/
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Verification token is missing." }, { status: 400 });
  }

  // Find the token record
  const record = await prisma.verificationToken.findFirst({ where: { token } });

  if (!record) {
    return NextResponse.json(
      { error: "Invalid or already used verification link." },
      { status: 400 }
    );
  }

  // Check it hasn't expired
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    });
    return NextResponse.json(
      { error: "Verification link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Mark the user as verified
  await prisma.user.update({
    where: { email: record.identifier },
    data: { isVerified: true },
  });

  // Delete the token — it's single use
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  return NextResponse.json({ message: "Email verified successfully. You can now log in." });
}
