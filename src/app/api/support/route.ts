import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/support
  User opens a support ticket.
  Requires: active session

  Body: { subject, description, priority?, relatedEntity?, relatedEntityId? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { subject, description, priority = "MEDIUM", relatedEntity, relatedEntityId } = body;

  if (!subject || !description) {
    return NextResponse.json(
      { error: "subject and description are required." },
      { status: 400 }
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      priority,
      relatedEntity: relatedEntity ?? null,
      relatedEntityId: relatedEntityId ?? null,
      messages: {
        create: {
          senderId: userId,
          content: description,
        },
      },
    },
    select: {
      id: true, subject: true, status: true, priority: true,
      relatedEntity: true, relatedEntityId: true, createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "CREATE",
      entity: "SupportTicket",
      entityId: ticket.id,
      after: { subject, priority, status: "OPEN" },
      req,
    }),
    notify(
      userId,
      "Support ticket opened",
      `Your ticket "${subject}" has been received. Our team will respond shortly.`,
      "SYSTEM",
      { ticketId: ticket.id }
    ),
  ]);

  return NextResponse.json({ ticket }, { status: 201 });
}

/*
  GET /api/support
  - Regular user: their own tickets
  - Admin: all tickets
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");

  const tickets = await prisma.supportTicket.findMany({
    where: isAdmin ? {} : { userId },
    select: {
      id: true, subject: true, status: true, priority: true,
      relatedEntity: true, relatedEntityId: true, createdAt: true, updatedAt: true,
      assignee: { select: { id: true, fullName: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}
