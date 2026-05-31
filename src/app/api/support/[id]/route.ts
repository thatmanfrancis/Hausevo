import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/support/:id
  View a ticket and its full message thread.
  Accessible by the ticket owner or an admin.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      assignee: { select: { id: true, fullName: true } },
      messages: {
        select: {
          id: true, content: true, attachments: true, createdAt: true,
          sender: { select: { id: true, fullName: true, roles: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isOwner = ticket.userId === userId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ ticket });
}

/*
  POST /api/support/:id
  Add a reply to a ticket thread.
  Accessible by the ticket owner or an admin.

  Body: { content, attachments? }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { userId: true, subject: true, status: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isOwner = ticket.userId === userId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "This ticket is closed." }, { status: 400 });
  }

  const body = await req.json();
  const { content, attachments } = body;

  if (!content) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: id,
      senderId: userId,
      content,
      attachments: attachments ?? [],
    },
    select: { id: true, content: true, attachments: true, createdAt: true },
  });

  const notifyTarget = isAdmin ? ticket.userId : null;

  await Promise.all([
    isAdmin
      ? prisma.supportTicket.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        })
      : Promise.resolve(),
    notifyTarget
      ? notify(
          notifyTarget,
          "Support reply received",
          `The Hausevo team replied to your ticket "${ticket.subject}".`,
          "SYSTEM",
          { ticketId: id }
        )
      : Promise.resolve(),
    audit({
      actorId: userId,
      action: "UPDATE",
      entity: "SupportTicket",
      entityId: id,
      after: { action: "message_added", isAdmin },
      req,
    }),
  ]);

  return NextResponse.json({ message }, { status: 201 });
}

/*
  PATCH /api/support/:id
  Admin updates ticket status or assigns it.
  Requires: active session + ADMIN role

  Body: { status?, assigneeId? }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { userId: true, subject: true, status: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const body = await req.json();
  const { status, assigneeId } = body;

  const before = { status: ticket.status };

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(assigneeId !== undefined && { assigneeId }),
    },
    select: { id: true, status: true, assigneeId: true, updatedAt: true },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "UPDATE",
      entity: "SupportTicket",
      entityId: id,
      before,
      after: { status: updated.status, assigneeId: updated.assigneeId },
      req,
    }),
    status === "RESOLVED"
      ? notify(
          ticket.userId,
          "Ticket resolved",
          `Your support ticket "${ticket.subject}" has been resolved.`,
          "SYSTEM",
          { ticketId: id }
        )
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ticket: updated });
}
