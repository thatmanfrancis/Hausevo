import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

/*
  POST /api/admin/waitlist/broadcast
  Send an email to all or a subset of waitlist members.
  Admin only.

  Body: { subject, body, targetRole: "ALL" | "TENANT" | "LANDLORD" | "BOTH" }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Verify admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });
  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json();
  const { subject, body: messageBody, targetRole, imageUrl } = body;

  if (!subject?.trim() || !messageBody?.trim()) {
    return NextResponse.json(
      { error: "Subject and message body are required." },
      { status: 400 }
    );
  }

  // Fetch recipients
  const where = targetRole && targetRole !== "ALL" ? { role: targetRole } : {};
  const recipients = await prisma.launchWaitlist.findMany({
    where,
    select: { email: true, fullName: true },
    orderBy: { position: "asc" },
  });

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients found." }, { status: 400 });
  }

  // Build email HTML using the broadcast template
  const { renderToStaticMarkup } = require("react-dom/server");
  const React = require("react");
  const { default: WaitlistBroadcastEmail } = require("@/emails/WaitlistBroadcast");
  const { HAUSEVO_LOGO_BASE64 } = require("@/lib/assets");

  let sent = 0;
  let failed = 0;

  // Send in batches of 10 to avoid overwhelming Zeptomail
  const BATCH = 10;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (r) => {
        try {
          const html = `<!DOCTYPE html>${renderToStaticMarkup(
            React.createElement(WaitlistBroadcastEmail, {
              name: r.fullName.split(" ")[0],
              subject: subject.trim(),
              body: messageBody.trim(),
              imageUrl: imageUrl?.trim() || null,
            })
          )}`;
          const result = await sendEmail({
            to: [{ email: r.email, name: r.fullName }],
            subject: subject.trim(),
            html,
            inline_images: [
              {
                cid: "hausevo_logo",
                content: HAUSEVO_LOGO_BASE64,
                mime_type: "image/jpeg",
              },
            ],
          });
          if (result.success) sent++;
          else failed++;
        } catch {
          failed++;
        }
      })
    );
  }

  return NextResponse.json({ sent, failed });
}
