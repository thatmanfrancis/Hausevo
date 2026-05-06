import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/scout-rewards/:id
  Admin sets the reward amount and marks it as paid.
  Requires: active session + ADMIN role

  Body: { amount, status: "PENDING" | "SUCCESS" }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { id } = await params;

  const reward = await prisma.scoutReward.findUnique({
    where: { id },
    include: {
      property: { select: { title: true } },
      redeemer: { select: { id: true, fullName: true } },
    },
  });

  if (!reward) {
    return NextResponse.json({ error: "Reward not found." }, { status: 404 });
  }

  const body = await req.json();
  const { amount, status } = body;

  if (amount === undefined && !status) {
    return NextResponse.json(
      { error: "Provide amount and/or status to update." },
      { status: 400 },
    );
  }

  const before = { amount: reward.amount, status: reward.status };

  const updated = await prisma.scoutReward.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(status && { status }),
      ...(status === "SUCCESS" && { paidAt: new Date() }),
    },
    select: { id: true, amount: true, status: true, paidAt: true },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "PAYMENT",
      entity: "ScoutReward",
      entityId: id,
      before,
      after: { amount: updated.amount, status: updated.status },
      req,
    }),
    status === "SUCCESS"
      ? notify(
          reward.redeemerId,
          "Scout reward paid! 🎉",
          `Your ₦${updated.amount.toLocaleString()} reward for submitting "${reward.property.title}" has been paid to your bank account.`,
          "REWARD_PAID",
          { rewardId: id, propertyId: reward.propertyId },
        )
      : amount !== undefined
        ? notify(
            reward.redeemerId,
            "Reward amount set",
            `Your reward for "${reward.property.title}" has been set to ₦${Number(amount).toLocaleString()}. It will be paid once the listing is verified.`,
            "REWARD_PAID",
            { rewardId: id },
          )
        : Promise.resolve(),
  ]);

  return NextResponse.json({ reward: updated });
}
