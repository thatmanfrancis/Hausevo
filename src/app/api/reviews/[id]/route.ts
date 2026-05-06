import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/*
  GET /api/reviews/:id
  View a single review.
  Accessible by anyone authenticated.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reviewer: { select: { id: true, fullName: true } },
      subject: { select: { id: true, fullName: true } },
      property: { select: { id: true, title: true } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  return NextResponse.json({ review });
}

/*
  DELETE /api/reviews/:id
  Delete a review.
  Only the reviewer or an admin can delete.
  Requires: active session
*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, reviewerId: true, subjectId: true, rating: true, propertyId: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isReviewer = review.reviewerId === session.user.id;

  if (!isAdmin && !isReviewer) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });

  await audit({
    actorId: session.user.id,
    action: "DELETE",
    entity: "Review",
    entityId: id,
    before: { reviewerId: review.reviewerId, subjectId: review.subjectId, rating: review.rating },
    req,
  });

  return NextResponse.json({ message: "Review deleted." });
}
