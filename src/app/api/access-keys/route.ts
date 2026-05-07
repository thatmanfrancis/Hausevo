import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import crypto from "crypto";

/*
  POST /api/access-keys
  Landlord generates a one-time LAG-XXX-XXX key to hand to a trusted person.
  Requires: active session + LANDLORD role

  Body: { expiresInHours? } — defaults to 72 hours
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.includes("LANDLORD")) {
    return NextResponse.json(
      { error: "Only landlords can generate access keys." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const expiresInHours = Number(body.expiresInHours ?? 72);
  const notes = body.notes ? String(body.notes).slice(0, 500) : null;

  const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
  const key = `LAG-${raw.slice(0, 3)}-${raw.slice(3, 6)}`;

  const accessKey = await prisma.accessKey.create({
    data: {
      key,
      issuerId: session.user.id,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      notes,
    },
    select: { id: true, key: true, expiresAt: true, isUsed: true, createdAt: true, notes: true },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "AccessKey",
      entityId: accessKey.id,
      after: { key, expiresInHours, notes },
      req,
    }),
    notify(
      session.user.id,
      "Access key generated",
      `Your key ${key} is valid for ${expiresInHours} hours. Share it with your trusted contact.`,
      "KEY_ISSUED",
      { accessKeyId: accessKey.id }
    ),
  ]);

  return NextResponse.json({ accessKey }, { status: 201 });
}

/*
  GET /api/access-keys
  Landlord views all keys they've issued.
  Requires: active session + LANDLORD role
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const keys = await prisma.accessKey.findMany({
    where: { issuerId: session.user.id },
    select: {
      id: true, key: true, expiresAt: true, isUsed: true,
      redeemedBy: true, redeemedAt: true, receiptUrl: true, notes: true,
      property: { select: { id: true, title: true, status: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}
