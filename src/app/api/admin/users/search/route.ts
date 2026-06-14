import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  if (!admin?.roles.includes("ADMIN")) return NextResponse.json([], { status: 403 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? undefined;

  if (q.length < 2) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(role ? { roles: { has: role as any } } : {}),
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: { id: true, fullName: true, email: true },
  });

  return NextResponse.json(users);
}
