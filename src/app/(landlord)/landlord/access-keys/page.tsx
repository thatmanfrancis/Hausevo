import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AccessKeysClient from "./AccessKeysClient";

export default async function AccessKeysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const keys = await prisma.accessKey.findMany({
    where: { issuerId: session.user.id },
    select: {
      id: true, key: true, expiresAt: true, isUsed: true,
      redeemedBy: true, redeemedAt: true, createdAt: true,
      property: { select: { id: true, title: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AccessKeysClient keys={keys as any} />;
}
