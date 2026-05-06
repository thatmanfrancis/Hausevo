import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VaultClient from "./VaultClient";

export default async function VaultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const items = await prisma.vaultItem.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true, title: true, fileUrl: true, category: true,
      propertyId: true, isVerified: true, createdAt: true,
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <VaultClient items={items as any} />;
}
