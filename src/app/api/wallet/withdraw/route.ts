import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/*
  POST /api/wallet/withdraw
  User withdraws funds from their wallet to a linked bank account.
  Body: { amount, bankAccountId }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { amount, bankAccountId } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  if (!bankAccountId) {
    return NextResponse.json({ error: "Target bank account is required." }, { status: 400 });
  }

  // 1. Check wallet balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (!user || user.walletBalance < amount) {
    return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 402 });
  }

  // 2. Verify bank account
  const account = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!account || account.userId !== userId) {
    return NextResponse.json({ error: "Bank account not found or access denied." }, { status: 404 });
  }

  // 3. Process withdrawal in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // A. Deduct from wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
        select: { walletBalance: true },
      });

      // B. Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: -amount, // Negative because it's an outflow
          type: "WITHDRAWAL",
          status: "SUCCESS", // In dev we mark as success instantly
          reference: `WDW-${Date.now()}-${userId.slice(-4)}`,
          description: `Withdrawal to ${account.bankName} (${account.accountNumber.slice(-4)})`,
          metadata: {
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
          }
        },
      });

      return { updatedUser, transaction };
    });

    await audit({
      actorId: userId,
      action: "UPDATE",
      entity: "Transaction",
      entityId: result.transaction.id,
      after: { withdrawalAmount: amount, targetAccount: account.accountNumber },
      req,
    });

    return NextResponse.json({
      message: "Withdrawal successful.",
      newBalance: result.updatedUser.walletBalance,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal." }, { status: 500 });
  }
}
