import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LandlordDashboard from "./LandlordDashboard";

export default async function LandlordDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [properties, applications, tenancies, notifications] = await Promise.all([
    prisma.property.findMany({
      where: { landlordId: session.user.id },
      select: {
        id: true, title: true, lga: true, status: true,
        pricePerYear: true, listingType: true,
        images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
        _count: { select: { applications: true, waitlist: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tenancyApplication.findMany({
      where: { property: { landlordId: session.user.id }, status: "PENDING" },
      select: {
        id: true, status: true, createdAt: true,
        property: { select: { id: true, title: true } },
        tenant: { select: { id: true, fullName: true, verificationTier: true, shackScore: { select: { score: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tenancy.findMany({
      where: { property: { landlordId: session.user.id }, status: "ACTIVE" },
      select: {
        id: true, status: true, endDate: true,
        property: { select: { id: true, title: true, lga: true } },
        tenant: { select: { id: true, fullName: true } },
        rentSchedules: {
          where: { status: "PENDING" },
          select: { id: true, dueDate: true, amount: true },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id, isRead: false },
      select: { id: true, title: true, body: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalProperties = await prisma.property.count({ where: { landlordId: session.user.id } });
  const pendingApplications = await prisma.tenancyApplication.count({
    where: { property: { landlordId: session.user.id }, status: "PENDING" },
  });

  return (
    <LandlordDashboard
      properties={properties as any}
      recentApplications={applications as any}
      activeTenancies={tenancies as any}
      notifications={notifications}
      stats={{ totalProperties, pendingApplications, activeTenancies: tenancies.length }}
      landlordName={session.user.name ?? ""}
    />
  );
}
