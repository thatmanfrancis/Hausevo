import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ApplicationsClient from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const applications = await prisma.tenancyApplication.findMany({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      status: true,
      message: true,
      rejectionReason: true,
      shackScoreAtApplication: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          lga: true,
          pricePerYear: true,
          totalPackage: true,
          listingType: true,
          tenancy: {
            select: { id: true }
          },
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = applications.map(app => ({
    ...app,
    tenancyId: app.property.tenancy?.id || null
  }));

  return <ApplicationsClient applications={mapped} />;
}
