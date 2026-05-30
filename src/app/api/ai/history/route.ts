import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ONE_YEAR_AGO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

/*
  GET /api/ai/history
  Returns the last 100 AI messages for the current user, up to 1 year old.
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const messages = await prisma.aIMessage.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: ONE_YEAR_AGO() },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, role: true, text: true, createdAt: true },
  });

  return NextResponse.json({ messages });
}

/*
  DELETE /api/ai/history
  Clears all AI messages for the current user.
*/
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await prisma.aIMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
