import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/admin/support
  Admin lists all support tickets with filters.
  Requires: active session + ADMIN role

  Query params: status?, priority?, assigneeId?, page?, limit?, search?
*/
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!admin?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const assigneeId = searchParams.get("assigneeId") ?? undefined;
  const unassigned = searchParams.get("unassigned") === "true";
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;

  const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  if (priority && !validPriorities.includes(priority)) {
    return NextResponse.json(
      { error: `priority must be one of: ${validPriorities.join(", ")}` },
      { status: 400 }
    );
  }

  const where = {
    ...(status && { status: status as never }),
    ...(priority && { priority: priority as never }),
    ...(assigneeId && { assigneeId }),
    ...(unassigned && { assigneeId: null }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" as const } },
        { user: { fullName: { contains: search, mode: "insensitive" as const } } },
        { user: { email: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      select: {
        id: true, subject: true, status: true, priority: true,
        relatedEntity: true, relatedEntityId: true,
        createdAt: true, updatedAt: true,
        user: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return NextResponse.json({
    tickets,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
