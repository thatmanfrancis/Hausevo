import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ArtisanDashboardClient from "./ArtisanDashboardClient";

export default async function ArtisanDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [artisanProfile, activeJobs, completedJobs, notifications, transactions] = await Promise.all([
    prisma.artisanProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.maintenanceJob.findMany({
      where: { artisanId: session.user.id, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      include: {
        property: {
          select: { title: true, lga: true, address: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.maintenanceJob.count({
      where: { artisanId: session.user.id, status: "COMPLETED" },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id, isRead: false },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, type: "REPAIR", status: "SUCCESS" },
      select: { amount: true, createdAt: true },
    }),
  ]);

  if (!artisanProfile) {
    redirect("/artisan/profile");
  }

  const totalEarnings = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <ArtisanDashboardClient
      artisanName={session.user.name ?? "Artisan"}
      profile={artisanProfile as any}
      activeJobs={activeJobs as any}
      completedCount={completedJobs}
      totalEarnings={totalEarnings}
      notifications={notifications as any}
    />
  );
}
