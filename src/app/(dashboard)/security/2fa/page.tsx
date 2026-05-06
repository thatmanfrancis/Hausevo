import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TwoFactorClient from "./TwoFactorClient";

export default async function TwoFactorPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return <TwoFactorClient user={user} />;
}
