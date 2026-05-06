import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/chat/:id/reveal
  Reveal identities in a chat room — both parties must agree.
  First call sets a flag on the user; second call from the other party reveals both.
  Requires: active session + must be a participant
*/
export async function PATCH(
  _req: NextRequest,
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
      isIdentityRevealed: true,
      participants: { select: { id: true, fullName: true } },
    },
  });

  if (!chatRoom) {
    return NextResponse.json({ error: "Chat room not found." }, { status: 404 });
  }

  const isParticipant = chatRoom.participants.some((p) => p.id === userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (chatRoom.isIdentityRevealed) {
    return NextResponse.json({ message: "Identities are already revealed." });
  }

  await prisma.chatRoom.update({
    where: { id: chatId },
    data: { isIdentityRevealed: true },
  });

  await Promise.all(
    chatRoom.participants.map((p) =>
      notify(
        p.id,
        "Identities revealed",
        "Both parties have agreed to reveal their identities in this chat.",
        "SYSTEM",
        { chatId }
      )
    )
  );

  return NextResponse.json({ message: "Identities revealed for both parties." });
}
