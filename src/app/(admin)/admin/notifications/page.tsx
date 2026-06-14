import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminNotificationsClient from "./AdminNotificationsClient";

const ADMIN_RELEVANT_TYPES = ["SYSTEM", "DISPUTE_UPDATE", "REWARD_PAID", "DOC_VERIFIED", "TENANCY_UPDATE"];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    type: { in: ADMIN_RELEVANT_TYPES as any[] },
  };

  const [totalNotifications, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        isRead: true,
        actionUrl: true,
        createdAt: true,
      },
    }),
  ]);

  const unreadCount = await prisma.notification.count({ where: { ...where, isRead: false } });
  const totalPages = Math.ceil(totalNotifications / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Notifications</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Notifications</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform and system alerts for admin.</p>
      </div>

      <AdminNotificationsClient
        notifications={notifications as any}
        unreadCount={unreadCount}
        totalNotifications={totalNotifications}
        totalPages={totalPages}
        currentPage={page}
      />
    </div>
  );
}
