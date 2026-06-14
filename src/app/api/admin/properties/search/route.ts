import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  if (!admin?.roles.includes("ADMIN")) return NextResponse.json([], { status: 403 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { lga: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: { id: true, title: true, lga: true },
  });

  return NextResponse.json(properties);
}
