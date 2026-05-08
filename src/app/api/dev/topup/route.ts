import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/dev/topup
  DEV ONLY — adds ₦5,000 to the wallet for testing.
  Blocked in production.
*/
export async function POST(req: NextRequest) {
  const isDevBypass = process.env.ENABLE_TEST_TOOLS === "true";
  if (process.env.NODE_ENV === "production" && !isDevBypass) {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const TOPUP_AMOUNT = 5000;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { walletBalance: { increment: TOPUP_AMOUNT } },
    select: { walletBalance: true },
  });

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      amount: TOPUP_AMOUNT,
      shackFee: 0,
      netAmount: TOPUP_AMOUNT,
      type: "DEPOSIT",
      status: "SUCCESS",
      reference: `dev-topup-${session.user.id}-${Date.now()}`,
      description: "Dev top-up (testing)",
    },
  });

  return NextResponse.json({
    message: `₦${TOPUP_AMOUNT.toLocaleString()} added to wallet.`,
    newBalance: user.walletBalance,
  });
}
