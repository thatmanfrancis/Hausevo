import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ChatClient from "./ChatClient";

// Serialize Dates to ISO strings for client components
function serializeRoom(room: any) {
  return {
    ...room,
    messages: room.messages.map((m: any) => ({
      ...m,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    })),
  };
}

async function getUserRooms(userId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: { participants: { some: { id: userId } } },
    include: {
      property: { select: { id: true, title: true, lga: true, listingType: true } },
      participants: { select: { id: true, fullName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true, content: true, createdAt: true,
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rooms.map(serializeRoom);
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ landlord?: string; property?: string; room?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const userId = session.user.id;

  // ── Case 1: Direct room link (/chat?room=xxx) ──────────────────────────
  if (params.room) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: params.room },
      include: {
        property: { select: { id: true, title: true, lga: true, listingType: true } },
        participants: { select: { id: true, fullName: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true, content: true, createdAt: true,
            sender: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!room || !room.participants.some((p) => p.id === userId)) {
      redirect("/properties");
    }

    const allRooms = await getUserRooms(userId);
    return <ChatClient rooms={allRooms} activeRoom={serializeRoom(room)} userId={userId} />;
  }

  // ── Case 2: Start/open chat from property detail (/chat?property=Y) ──
  if (params.property) {
    const property = await prisma.property.findUnique({
      where: { id: params.property },
      select: { id: true, landlordId: true, title: true },
    });

    if (!property) redirect("/properties");
    if (property!.landlordId === userId) redirect(`/properties/${params.property}`);

    const include = {
      property: { select: { id: true, title: true, lga: true, listingType: true } },
      participants: { select: { id: true, fullName: true } },
      messages: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true, content: true, createdAt: true,
          sender: { select: { id: true, fullName: true } },
        },
      },
    };

    let room = await prisma.chatRoom.findFirst({
      where: {
        propertyId: params.property,
        participants: { some: { id: userId } },
      },
      include,
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          propertyId: params.property,
          participants: {
            connect: [{ id: userId }, { id: property!.landlordId }],
          },
        },
        include,
      });
    }

    const allRooms = await getUserRooms(userId);
    return <ChatClient rooms={allRooms} activeRoom={serializeRoom(room)} userId={userId} />;
  }

  // ── Case 3: Chat inbox (no params) ────────────────────────────────────────
  const allRooms = await getUserRooms(userId);
  return <ChatClient rooms={allRooms} activeRoom={null} userId={userId} />;
}
