import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  PATCH /api/notifications/:id/read
  Mark a single notification as read.
  Requires: active session + must own the notification
*/
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });

  return NextResponse.json({ message: "Marked as read." });
}
