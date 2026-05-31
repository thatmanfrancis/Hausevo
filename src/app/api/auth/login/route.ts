import { NextRequest, NextResponse } from "next/server";
import React from "react";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/mail";
import { HAUSEVO_LOGO_BASE64 } from "@/lib/assets";
import LoginAlertEmail from "@/emails/LoginAlert";

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

  // Fire and forget (don't block the response)
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

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
