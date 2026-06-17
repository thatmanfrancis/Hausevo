import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { handleSplitPhoneNumberDetection } from "@/lib/chat-security";

/*
  GET /api/chat/:id/messages
  Get messages for a chat room.
  Requires: active session + must be a participant

  Query params: page, limit
*/
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id: chatId } = await params;
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const skip = (page - 1) * limit;

  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatId },
    select: { participants: { select: { id: true } } },
  });

  if (!chatRoom) {
    return NextResponse.json({ error: "Chat room not found." }, { status: 404 });
  }

  const isParticipant = chatRoom.participants.some((p) => p.id === userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { chatId },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      select: {
        id: true, content: true, createdAt: true,
        sender: { select: { id: true, fullName: true } },
      },
    }),
    prisma.message.count({ where: { chatId } }),
  ]);

  return NextResponse.json({
    messages,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

/*
  POST /api/chat/:id/messages
  Send a message in a chat room.
  Requires: active session + must be a participant

  Body: { content }
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

  const { id: chatId } = await params;

  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatId },
    select: {
      participants: { select: { id: true, fullName: true } },
      isIdentityRevealed: true,
    },
  });

  if (!chatRoom) {
    return NextResponse.json({ error: "Chat room not found." }, { status: 404 });
  }

  const isParticipant = chatRoom.participants.some((p) => p.id === userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message content is required." }, { status: 400 });
  }

  // Intercept and blur/mask any phone number sharing (including split messages)
  const { processedContent } = await handleSplitPhoneNumberDetection(
    chatId,
    userId,
    content.trim()
  );

  const message = await prisma.message.create({
    data: { chatId, senderId: userId, content: processedContent },
    select: {
      id: true, content: true, createdAt: true,
      sender: { select: { id: true, fullName: true } },
    },
  });

  // Notify the other participant(s)
  const others = chatRoom.participants.filter((p) => p.id !== userId);
  const senderName = chatRoom.isIdentityRevealed
    ? message.sender.fullName
    : "Someone";

  await Promise.all(
    others.map((p) =>
      notify(
        p.id,
        "New message",
        `${senderName}: ${processedContent.slice(0, 80)}${processedContent.length > 80 ? "…" : ""}`,
        "SYSTEM",
        { chatId, messageId: message.id }
      )
    )
  );

  return NextResponse.json({ message }, { status: 201 });
}
