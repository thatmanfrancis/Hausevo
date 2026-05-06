import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VerificationClient from "./VerificationClient";

export default async function VerificationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      verificationTier: true,
      walletBalance: true,
      verificationBundlePaid: true,
    },
  });

  if (!user) redirect("/auth/login");

  return (
    <VerificationClient
      fullName={user.fullName}
      verificationTier={user.verificationTier}
      walletBalance={user.walletBalance}
      verificationBundlePaid={user.verificationBundlePaid}
    />
  );
}
