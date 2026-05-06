import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/user/notification-preferences
  Returns the logged-in user's notification preferences.
  Creates defaults if none exist yet.
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ preferences: prefs });
}

/*
  PATCH /api/user/notification-preferences
  Updates one or more notification preference toggles.

  Body: { rentReminders?, applicationUpdates?, matchingProperties?, platformAnnouncements? }
*/
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { rentReminders, applicationUpdates, matchingProperties, platformAnnouncements } = body;

  // At least one field must be provided
  const hasUpdate = [rentReminders, applicationUpdates, matchingProperties, platformAnnouncements]
    .some((v) => typeof v === "boolean");

  if (!hasUpdate) {
    return NextResponse.json(
      { error: "Provide at least one preference to update." },
      { status: 400 }
    );
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...(typeof rentReminders === "boolean" && { rentReminders }),
      ...(typeof applicationUpdates === "boolean" && { applicationUpdates }),
      ...(typeof matchingProperties === "boolean" && { matchingProperties }),
      ...(typeof platformAnnouncements === "boolean" && { platformAnnouncements }),
    },
    update: {
      ...(typeof rentReminders === "boolean" && { rentReminders }),
      ...(typeof applicationUpdates === "boolean" && { applicationUpdates }),
      ...(typeof matchingProperties === "boolean" && { matchingProperties }),
      ...(typeof platformAnnouncements === "boolean" && { platformAnnouncements }),
    },
  });

  return NextResponse.json({ preferences: prefs });
}
