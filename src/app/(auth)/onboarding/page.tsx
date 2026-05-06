import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // If already onboarded, skip to dashboard
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      roles: true,
      fullName: true,
      wishlist: { select: { lga: true, maxBudget: true } },
    },
  });

  if (user?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <OnboardingClient
      userName={user?.fullName?.split(" ")[0] ?? ""}
      currentRole={(user?.roles?.[0] as string) ?? "TENANT"}
      currentLga={user?.wishlist?.lga ?? ""}
    />
  );
}
