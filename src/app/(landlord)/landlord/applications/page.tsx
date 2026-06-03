import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LandlordApplicationsClient from "./LandlordApplicationsClient";

export default async function LandlordApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const applications = await prisma.tenancyApplication.findMany({
    where: { property: { landlordId: session.user.id } },
    select: {
      id: true, status: true, message: true, rejectionReason: true,
      shackScoreAtApplication: true, createdAt: true, updatedAt: true,
      property: {
        select: {
          id: true, title: true, lga: true, pricePerYear: true,
          images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          // Include tenancy so we know if one already exists for this property
          tenancy: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              cautionDeposit: true,
              savingsGoal: true,
            },
          },
        },
      },
      tenant: {
        select: {
          id: true, fullName: true, email: true, phoneNumber: true,
          verificationTier: true,
          shackScore: { select: { score: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <LandlordApplicationsClient applications={applications as any} />;
}
