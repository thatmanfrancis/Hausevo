import prisma from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

/*
  Shared helper — create a notification for a user.
  Fire-and-forget: errors are swallowed so they never break the main request.
*/
export async function notify(
  userId: string,
  title: string,
  body: string,
  type: NotificationType,
  metadata?: Prisma.InputJsonValue
) {
  try {
    await prisma.notification.create({
      data: { userId, title, body, type, metadata },
    });
  } catch {
    // Notifications are non-critical — log but don't throw
    console.error("[notify] Failed to create notification:", { userId, type });
  }
}
