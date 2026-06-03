import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/*
  POST /api/wallet/topup/inline-verify
  Called by WalletClient after PaystackPop.onSuccess fires.
  Verifies the transaction with Paystack, credits the wallet.

  Body: { reference }
  Returns: { newBalance }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { reference } = await req.json();
  if (!reference) {
    return NextResponse.json({ error: "Reference is required." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Payment not configured." }, { status: 503 });
  }

  // Verify with Paystack
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  const data = await verifyRes.json();

  if (!verifyRes.ok || !data.status || data.data?.status !== "success") {
    console.error("[InlineVerify] Failed:", data);
    return NextResponse.json(
      { error: "Payment not confirmed. If you were charged, contact support." },
      { status: 402 }
    );
  }

  const tx = data.data;
  const amountKobo: number = tx.amount;
  const amountNaira = amountKobo / 100;
  // userId comes from metadata — support both direct key and Paystack custom_fields format
  const userId: string = tx.metadata?.userId ?? session.user.id;

  // Security: ensure the userId in metadata matches the session user
  if (!userId || userId !== session.user.id) {
    return NextResponse.json({ error: "Payment user mismatch." }, { status: 403 });
  }

  // Idempotency — skip if already processed
  const existing = await prisma.transaction.findFirst({ where: { reference } });
  if (existing) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    return NextResponse.json({ newBalance: user?.walletBalance ?? 0, alreadyProcessed: true });
  }

  // Credit wallet atomically
  const [updatedUser, txRecord] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amountNaira } },
      select: { walletBalance: true },
    }),
    prisma.transaction.create({
      data: {
        userId,
        amount: amountNaira,
        type: "DEPOSIT",
        status: "SUCCESS",
        reference,
        description: `Wallet top-up via Paystack`,
        netAmount: amountNaira,
        shackFee: 0,
        metadata: {
          paystackRef: reference,
          channel: tx.channel ?? "paystack",
          paidAt: tx.paid_at,
        },
      },
    }),
  ]);

  // Audit — visible to both user's transaction history and admin audit log
  await audit({
    actorId: userId,
    action: "PAYMENT",
    entity: "Transaction",
    entityId: txRecord.id,
    after: {
      type: "DEPOSIT",
      amountNaira,
      reference,
      channel: tx.channel ?? "paystack",
      newBalance: updatedUser.walletBalance,
    },
    req,
  });

  return NextResponse.json({ newBalance: updatedUser.walletBalance });
}
