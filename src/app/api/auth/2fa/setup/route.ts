import { NextRequest, NextResponse } from "next/server";
import { TOTP, generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/2fa/setup
  Generates a TOTP secret for the logged-in user and returns a QR code.
  The user scans this with Google Authenticator / Authy.
  2FA is NOT enabled yet — the user must verify a code first (see /2fa/verify).

  Requires: active session
*/
export async function POST(req: NextRequest) {
  // 5 attempts per IP per minute
  const limited = rateLimit(req, { limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA is already enabled on this account." },
      { status: 400 }
    );
  }

  // Generate a new TOTP secret
  const secret = generateSecret();

  // Save the secret (not enabled yet — stored until they verify)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret },
  });

  // Build the otpauth URI that authenticator apps understand
  const otpauthUrl = generateURI({
    issuer: "Hausevo",
    label: user.email,
    secret,
  });

  // Convert to a QR code image (base64 data URL)
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

  return NextResponse.json({
    message: "Scan the QR code with your authenticator app, then call /2fa/verify to activate.",
    qrCode: qrCodeDataUrl,
    secret, // also expose for manual entry
  });
}
