import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/properties/:id/viewing
  Tenant requests a property viewing.
  Notifies the landlord and opens a chat room so they can coordinate.
  Requires: active session

  Body: { preferredDate?, message? }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(req, { limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id: propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, status: true, landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.landlordId === session.user.id) {
    return NextResponse.json({ error: "You cannot request a viewing of your own property." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { preferredDate, message } = body;

  const tenant = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true },
  });

  // Ensure a chat room exists between tenant and landlord for this property
  let chatRoom = await prisma.chatRoom.findFirst({
    where: {
      propertyId,
      participants: { some: { id: session.user.id } },
    },
    select: { id: true },
  });

  if (!chatRoom) {
    chatRoom = await prisma.chatRoom.create({
      data: {
        propertyId,
        participants: {
          connect: [{ id: session.user.id }, { id: property.landlordId }],
        },
      },
      select: { id: true },
    });
  }

  // Send a viewing request message in the chat
  const dateText = preferredDate
    ? ` I'm available on ${new Date(preferredDate).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}.`
    : "";
  const customMsg = message ? ` ${message}` : "";
  const chatContent = `Hi, I'd like to schedule a viewing for this property.${dateText}${customMsg}`;

  await prisma.message.create({
    data: {
      chatId: chatRoom.id,
      senderId: session.user.id,
      content: chatContent,
    },
  });

  // Notify the landlord
  await notify(
    property.landlordId,
    "Viewing request",
    `${tenant?.fullName ?? "A tenant"} wants to view "${property.title}".${dateText} Reply in chat to confirm.`,
    "TENANCY_UPDATE",
    { propertyId, chatRoomId: chatRoom.id }
  );

  return NextResponse.json({
    message: "Viewing request sent. The landlord will respond in chat.",
    chatRoomId: chatRoom.id,
  }, { status: 201 });
}
