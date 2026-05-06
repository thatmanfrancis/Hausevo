import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  PATCH /api/notifications/read-all
  POST  /api/notifications/read-all  (alias — same behaviour)
  Mark all notifications as read for the logged-in user.
  Requires: active session
*/
async function handler() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { count } = await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ message: `${count} notification(s) marked as read.` });
}

export const PATCH = handler;
export const POST = handler;
