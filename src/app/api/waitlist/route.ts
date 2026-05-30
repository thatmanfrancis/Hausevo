import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/mail";

/*
  POST /api/waitlist
  Join the Shack launch waitlist.
  Body: { email, fullName, role, lga? }
*/
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 3, windowSeconds: 60 });
  if (limited) return limited;

  const body = await req.json();
  const { email, fullName, role, lga } = body;

  if (!email || !fullName || !role) {
    return NextResponse.json(
      { error: "Name, email and role are required." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Check if already on waitlist
  const existing = await prisma.launchWaitlist.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    return NextResponse.json(
      {
        alreadyJoined: true,
        position: existing.position,
        message: "You're already on the waitlist!",
      },
      { status: 200 }
    );
  }

  // Get current count for position
  const count = await prisma.launchWaitlist.count();
  const position = count + 1;

  const entry = await prisma.launchWaitlist.create({
    data: {
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      role,
      lga: lga?.trim() || null,
      position,
    },
  });

  // Send confirmation email (fire-and-forget)
  try {
    const { renderToStaticMarkup } = require("react-dom/server");
    const React = require("react");
    const { default: WaitlistConfirmEmail } = require("@/emails/WaitlistConfirm");
    const { SHACK_LOGO_BASE64 } = require("@/lib/assets");

    const html = `<!DOCTYPE html>${renderToStaticMarkup(
      React.createElement(WaitlistConfirmEmail, {
        name: fullName.trim().split(" ")[0],
        position,
        role,
        lga: lga?.trim() || null,
      })
    )}`;

    await sendEmail({
      to: [{ email: entry.email, name: fullName.trim() }],
      subject: "You're on the Shack waitlist 🏠",
      html,
      inline_images: [
        {
          cid: "shack_logo",
          content: SHACK_LOGO_BASE64,
          mime_type: "image/jpeg",
        },
      ],
    });
  } catch {
    // Non-critical — don't fail the request if email fails
  }

  return NextResponse.json({ position, message: "You're on the list!" }, { status: 201 });
}

/*
  GET /api/waitlist/count
  Returns total waitlist count (public).
*/
export async function GET() {
  const count = await prisma.launchWaitlist.count();
  return NextResponse.json({ count });
}
