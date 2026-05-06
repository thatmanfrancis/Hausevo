import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      isRead: true,
      metadata: true,
      createdAt: true,
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return <NotificationsClient notifications={notifications} unreadCount={unreadCount} />;
}
