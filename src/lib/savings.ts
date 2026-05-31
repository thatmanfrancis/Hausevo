/**
 * savings.ts
 * Secure transaction helper for contributing to a JointSavings pool.
 *
 * Enforces:
 * - Pool must be ACTIVE
 * - Contributor must be a member of the pool
 * - Amount must be positive
 * - Contribution cannot exceed the remaining target (safety threshold)
 */

import prisma from "@/lib/prisma";

export interface ContributeResult {
  success: boolean;
  newAmount?: number;
  message?: string;
}

/**
 * Contribute `amount` (₦) from `userId` into `jointSavingsId`.
 * Runs inside a Prisma $transaction for atomicity.
 */
export async function contributeToSavingsPool(
  userId: string,
  jointSavingsId: string,
  amount: number
): Promise<ContributeResult> {
  if (!amount || amount <= 0) {
    return { success: false, message: "Contribution amount must be greater than zero." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch pool with member check
      const pool = await tx.jointSavings.findUnique({
        where: { id: jointSavingsId },
        include: {
          members: { where: { id: userId }, select: { id: true } },
        },
      });

      if (!pool) {
        throw new Error("Savings pool not found.");
      }

      if (pool.status !== "ACTIVE") {
        throw new Error(`Cannot contribute to a ${pool.status.toLowerCase()} pool.`);
      }

      if (pool.members.length === 0) {
        throw new Error("You are not a member of this savings pool.");
      }

      // 2. Safety threshold — cannot overshoot target
      const remaining = pool.targetAmount - pool.currentAmount;
      if (amount > remaining) {
        throw new Error(
          `Contribution of ₦${amount.toLocaleString("en-NG")} exceeds remaining target of ₦${remaining.toLocaleString("en-NG")}.`
        );
      }

      // 3. Create contribution ledger entry
      await tx.savingsContribution.create({
        data: {
          amount,
          userId,
          jointSavingsId,
        },
      });

      // 4. Increment pool balance
      const updated = await tx.jointSavings.update({
        where: { id: jointSavingsId },
        data: {
          currentAmount: { increment: amount },
          // Auto-complete if target reached
          status:
            pool.currentAmount + amount >= pool.targetAmount ? "COMPLETED" : "ACTIVE",
        },
      });

      return updated.currentAmount;
    });

    return { success: true, newAmount: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Contribution failed.";
    return { success: false, message };
  }
}
