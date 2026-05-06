import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ReferralsClient from "./ReferralsClient";

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [referralCode, referrals, scoutRewards] = await Promise.all([
    prisma.referralCode.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, code: true, usedCount: true, createdAt: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: session.user.id },
      select: {
        id: true,
        rewardPaid: true,
        createdAt: true,
        referee: { select: { id: true, fullName: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scoutReward.findMany({
      where: { redeemerId: session.user.id },
      select: {
        id: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        property: { select: { id: true, title: true, lga: true, status: true } },
        accessKey: { select: { key: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ReferralsClient
      referralCode={referralCode ?? null}
      referrals={referrals}
      scoutRewards={scoutRewards}
    />
  );
}
