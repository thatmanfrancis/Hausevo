import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/*
  GET /api/guarantor/[token]
  Public route — no login required.
  Returns the guarantor record with tenant name + property info.
  Used by the public acknowledgment page.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const guarantor = await prisma.guarantor.findUnique({
    where: { token },
    select: {
      id: true,
      fullName: true,
      relationship: true,
      status: true,
      isEmergency: true,
      acknowledgedAt: true,
      user: {
        select: { fullName: true },
      },
      application: {
        select: {
          property: {
            select: { title: true, address: true, lga: true },
          },
        },
      },
    },
  });

  if (!guarantor) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  return NextResponse.json({ guarantor });
}

/*
  POST /api/guarantor/[token]
  Public route — no login required.
  Body: { action: "acknowledge" | "decline" }
  Updates the guarantor record.
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action !== "acknowledge" && action !== "decline") {
    return NextResponse.json(
      { error: "action must be 'acknowledge' or 'decline'." },
      { status: 400 }
    );
  }

  const guarantor = await prisma.guarantor.findUnique({
    where: { token },
    select: { id: true, status: true },
  });

  if (!guarantor) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  if (guarantor.status !== "PENDING") {
    return NextResponse.json(
      { message: "This link has already been used.", status: guarantor.status },
      { status: 200 }
    );
  }

  // Capture IP from headers
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : null;

  const updated = await prisma.guarantor.update({
    where: { token },
    data: {
      status: action === "acknowledge" ? "ACKNOWLEDGED" : "DECLINED",
      acknowledgedAt: new Date(),
      ipAddress: ip,
    },
    select: { status: true },
  });

  return NextResponse.json({ status: updated.status });
}
