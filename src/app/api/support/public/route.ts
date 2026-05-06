import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/support/public
  Public contact form — no auth required.
  Rate-limited to prevent spam.

  Body: { fullName, email, subject, message }
*/
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowSeconds: 300 });
  if (limited) return limited;

  const body = await req.json();
  const { fullName, email, subject, message } = body;

  if (!fullName || !email || !subject || !message) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // In production: send email via Resend/Nodemailer/etc.
  // For now, log it and return success so the form works.
  console.log("[Contact Form]", { fullName, email, subject, message: message.slice(0, 100) });

  return NextResponse.json({ message: "Message received. We'll be in touch within 24 hours." });
}
