import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/artisan/profile
  Create an artisan profile. Adds ARTISAN role to the user.
  Requires: active session

  Body: { category, safetyBond? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await prisma.artisanProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already have an artisan profile." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { category, safetyBond = 0 } = body;

  const validCategories = [
    "PLUMBER", "ELECTRICIAN", "AC_TECHNICIAN", "CARPENTER",
    "PAINTER", "CLEANER", "SECURITY", "GENERAL",
  ];

  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  // Create profile and add ARTISAN role in one transaction
  const [profile] = await prisma.$transaction([
    prisma.artisanProfile.create({
      data: {
        userId: session.user.id,
        category,
        safetyBond: Number(safetyBond),
      },
      select: {
        id: true, category: true, safetyBond: true,
        rating: true, isVetted: true,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { roles: { push: "ARTISAN" } },
    }),
  ]);

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "ArtisanProfile",
      entityId: profile.id,
      after: { category, safetyBond },
      req,
    }),
    notify(
      session.user.id,
      "Artisan profile created",
      `Your ${category.toLowerCase()} profile has been submitted for vetting. We'll notify you once approved.`,
      "SYSTEM",
      { artisanProfileId: profile.id }
    ),
  ]);

  return NextResponse.json({ profile }, { status: 201 });
}

/*
  GET /api/artisan/profile
  Get own artisan profile.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.artisanProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, category: true, safetyBond: true,
      rating: true, isVetted: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "No artisan profile found." }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

/*
  PATCH /api/artisan/profile
  Update own artisan profile category or safety bond.
  Requires: active session + ARTISAN role
*/
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.artisanProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "No artisan profile found." }, { status: 404 });
  }

  const body = await req.json();
  const { category, safetyBond } = body;

  const updated = await prisma.artisanProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(category && { category }),
      ...(safetyBond !== undefined && { safetyBond: Number(safetyBond) }),
    },
    select: {
      id: true, category: true, safetyBond: true, rating: true, isVetted: true,
    },
  });

  await audit({
    actorId: session.user.id,
    action: "UPDATE",
    entity: "ArtisanProfile",
    entityId: profile.id,
    before: { category: profile.category, safetyBond: profile.safetyBond },
    after: { category: updated.category, safetyBond: updated.safetyBond },
    req,
  });

  return NextResponse.json({ profile: updated });
}
