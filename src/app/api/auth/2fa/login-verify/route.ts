import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { verify } from "otplib";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/mail";
import { HAUSEVO_LOGO_BASE64 } from "@/lib/assets";
import LoginAlertEmail from "@/emails/LoginAlert";

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
      fullName: true,
      email: true,
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

  // Send Login Notification Email
  const userAgent = req.headers.get("user-agent") || "Unknown Device";

  // Use require to bypass Next.js static analysis for react-dom/server in Route Handlers
  const { renderToStaticMarkup } = require("react-dom/server");

  const html = `<!DOCTYPE html>${renderToStaticMarkup(
    React.createElement(LoginAlertEmail, {
      name: user.fullName || user.email,
      device: userAgent,
      location: "Lagos, Nigeria",
      time: new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
    })
  )}`;

  sendEmail({
    to: [{ email: user.email, name: user.fullName || undefined }],
    subject: "Security Alert: New login to your Hausevo account",
    html,
    inline_images: [
      {
        cid: "hausevo_logo",
        content: HAUSEVO_LOGO_BASE64,
        mime_type: "image/jpeg",
      },
    ],
  }).catch((err) => console.error("[LoginEmail] Error sending email:", err));

  return NextResponse.json({ message: "2FA verified." });
}
