import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [user, notificationPreferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        twoFactorEnabled: true,
        roles: true,
        onboardingCompleted: true,
        employmentStatus: true,
        profession: true,
        employerName: true,
        monthlyIncome: true,
        guarantors: {
          where: { isEmergency: true },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            relationship: true,
            status: true,
          },
          take: 1,
        },
      },
    }),
    prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    }),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <SettingsClient
      user={user}
      notificationPreferences={notificationPreferences}
    />
  );
}
