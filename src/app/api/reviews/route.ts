import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/reviews
  Leave a review for a user (landlord, tenant, or artisan).
  Requires: active session

  Body: { subjectId, rating, comment?, propertyId? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { subjectId, rating, comment, propertyId } = body;

  if (!subjectId || !rating) {
    return NextResponse.json(
      { error: "subjectId and rating are required." },
      { status: 400 }
    );
  }

  if (subjectId === session.user.id) {
    return NextResponse.json({ error: "You cannot review yourself." }, { status: 400 });
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
  }

  const subject = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { fullName: true },
  });

  if (!subject) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      reviewerId: session.user.id,
      subjectId,
      rating: ratingNum,
      comment: comment ?? null,
      propertyId: propertyId ?? null,
    },
    select: {
      id: true, rating: true, comment: true, propertyId: true, createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Review",
      entityId: review.id,
      after: { subjectId, rating: ratingNum, propertyId: propertyId ?? null },
      req,
    }),
    notify(
      subjectId,
      "You received a review",
      `Someone left you a ${ratingNum}-star review${comment ? `: "${comment}"` : "."}`,
      "REVIEW_RECEIVED",
      { reviewId: review.id, propertyId: propertyId ?? undefined }
    ),
  ]);

  return NextResponse.json({ review }, { status: 201 });
}
