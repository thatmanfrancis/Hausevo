import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import HausevoScoreClient from "./HausevoScoreClient";

export default async function HausevoScorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const score = await prisma.shackScore.findUnique({
    where: { userId: session.user.id },
    select: {
      score: true,
      onTimePayments: true,
      latePayments: true,
      disputesRaised: true,
      disputesLost: true,
      completedTenancies: true,
      lastCalculated: true,
    },
  });

  // Pass null when no score exists — client shows a clear "not yet established" state
  return <HausevoScoreClient score={score ?? null} />;
}
