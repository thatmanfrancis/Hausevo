import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/auth/2fa/disable
  Turns off 2FA for the logged-in user.
  Requires them to confirm with a valid code before disabling —
  so a stolen session alone can't turn off 2FA.

  Body: { code }
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

  const body = await req.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: "Your current 2FA code is required to disable it." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA is not enabled on this account." },
      { status: 400 }
    );
  }

  // Verify the code before allowing disable
  const isValid = verify({ token: code, secret: user.twoFactorSecret });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid code. 2FA has not been disabled." },
      { status: 400 }
    );
  }

  // Clear the secret and disable 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  return NextResponse.json({ message: "2FA has been disabled." });
}
