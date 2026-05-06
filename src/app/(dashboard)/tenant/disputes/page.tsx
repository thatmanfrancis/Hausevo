import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DisputesClient from "./DisputesClient";

export default async function DisputesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const disputes = await prisma.dispute.findMany({
    where: {
      OR: [
        { raisedById: session.user.id },
        { againstId: session.user.id },
      ],
    },
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      evidence: true,
      resolution: true,
      createdAt: true,
      updatedAt: true,
      raisedBy: { select: { id: true, fullName: true } },
      against: { select: { id: true, fullName: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get landlord id from active tenancy for pre-filling the form
  const tenancy = await prisma.tenancy.findUnique({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      property: {
        select: {
          id: true,
          title: true,
          landlordId: true,
          landlord: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  return (
    <DisputesClient
      disputes={disputes}
      userId={session.user.id}
      tenancy={tenancy ?? null}
    />
  );
}
