import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ServicesClient from "./ServicesClient";

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [requests, tenancy] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { tenantId: session.user.id },
      select: {
        id: true,
        category: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        property: { select: { id: true, title: true, lga: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenancy.findUnique({
      where: { tenantId: session.user.id },
      select: { id: true, propertyId: true },
    }),
  ]);

  return <ServicesClient requests={requests} hasTenancy={!!tenancy} />;
}
