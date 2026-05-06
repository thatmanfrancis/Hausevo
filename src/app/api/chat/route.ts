import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/chat
  Start or retrieve a chat room for a property.
  Requires: active session

  Body: { propertyId }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { propertyId } = body;

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required." }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  // Landlord cannot chat with themselves
  if (property.landlordId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot start a chat on your own listing." },
      { status: 400 }
    );
  }

  // Check if a chat room already exists between this user and this property
  const existing = await prisma.chatRoom.findFirst({
    where: {
      propertyId,
      participants: { some: { id: session.user.id } },
    },
    include: {
      participants: { select: { id: true, fullName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true },
      },
    },
  });

  if (existing) {
    return NextResponse.json({ chatRoom: existing });
  }

  // Create new chat room with both the tenant and landlord as participants
  const chatRoom = await prisma.chatRoom.create({
    data: {
      propertyId,
      participants: {
        connect: [{ id: session.user.id }, { id: property.landlordId }],
      },
    },
    include: {
      participants: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ chatRoom }, { status: 201 });
}

/*
  GET /api/chat
  List all chat rooms the logged-in user is part of.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const chatRooms = await prisma.chatRoom.findMany({
    where: { participants: { some: { id: session.user.id } } },
    include: {
      property: { select: { id: true, title: true, lga: true } },
      participants: { select: { id: true, fullName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true, sender: { select: { id: true, fullName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ chatRooms });
}
