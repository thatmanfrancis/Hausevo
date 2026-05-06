import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TenantDashboard from "./TenantDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      roles: true,
      fullName: true,
      verificationTier: true,
      walletBalance: true,
      shackScore: { select: { score: true } },
      applications: {
        select: {
          id: true, status: true, createdAt: true,
          property: {
            select: {
              id: true, title: true, address: true, lga: true, pricePerYear: true,
              listingType: true,
              images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      savedProperties: {
        select: {
          id: true,
          property: {
            select: {
              id: true, title: true, address: true, lga: true, pricePerYear: true,
              listingType: true, metadata: true,
              images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      },
      notifications: {
        where: { isRead: false },
        select: { id: true, title: true, body: true, type: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      tenancy: {
        select: {
          id: true, status: true, startDate: true, endDate: true,
          property: { select: { id: true, title: true, address: true, lga: true } },
        },
      },
    },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  // Role-based redirect for non-tenants
  const roles = user.roles ?? [];
  if (roles.includes("ADMIN")) redirect("/admin/dashboard");
  if (roles.includes("LANDLORD")) redirect("/landlord/dashboard");
  if (roles.includes("ARTISAN")) redirect("/artisan/dashboard");

  // Tenant dashboard
  return <TenantDashboard user={user as any} session={session} />;
}
