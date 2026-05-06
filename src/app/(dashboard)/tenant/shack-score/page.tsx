import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ShackScoreClient from "./ShackScoreClient";

export default async function ShackScorePage() {
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

  // Default score for users with no history
  const data = score ?? {
    score: 500,
    onTimePayments: 0,
    latePayments: 0,
    disputesRaised: 0,
    disputesLost: 0,
    completedTenancies: 0,
    lastCalculated: null,
  };

  return <ShackScoreClient score={data} />;
}
