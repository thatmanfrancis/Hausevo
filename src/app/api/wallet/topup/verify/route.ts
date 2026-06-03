import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/audit";

/*
  GET /api/wallet/topup/verify
  Paystack redirects here after payment with ?reference=xxx&trxref=xxx
  We verify with Paystack, credit the wallet, then redirect user back to /wallet
*/
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/wallet?topup=failed", req.url));
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.redirect(new URL("/wallet?topup=failed", req.url));
  }

  try {
    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const data = await verifyRes.json();

    if (!verifyRes.ok || !data.status || data.data?.status !== "success") {
      console.error("[TopupVerify] Failed:", data);
      return NextResponse.redirect(new URL("/wallet?topup=failed", req.url));
    }

    const tx = data.data;
    const userId: string = tx.metadata?.userId;
    const amountKobo: number = tx.amount;
    const amountNaira = amountKobo / 100;

    if (!userId) {
      return NextResponse.redirect(new URL("/wallet?topup=failed", req.url));
    }

    // Idempotency — check if this reference was already processed
    const existing = await prisma.transaction.findFirst({
      where: { reference },
    });

    if (!existing) {
      // Credit wallet and record transaction atomically
      const [, txRecord] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: amountNaira } },
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
            metadata: { paystackRef: reference, channel: tx.channel },
          },
        }),
      ]);

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
        },
        req,
      });
    }

    return NextResponse.redirect(
      new URL(`/wallet?topup=success&amount=${amountNaira}`, req.url)
    );
  } catch (err) {
    console.error("[TopupVerify] Error:", err);
    return NextResponse.redirect(new URL("/wallet?topup=failed", req.url));
  }
}
