import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import VaultClient from "./VaultClient";

export default async function LandlordVaultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const vaultItems = await prisma.vaultItem.findMany({
    where: { ownerId: session.user.id },
    include: { property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <VaultClient items={vaultItems} />;
}
