import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      roles: true,
      verificationTier: true,
      isVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      bankAccounts: {
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
          isDefault: true,
          isVerified: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return <ProfileClient user={user} />;
}
