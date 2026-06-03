import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/wallet/topup
  Generates a reference + returns the public key and user email so the client
  can open the Paystack inline popup directly via @paystack/inline-js.
  No server-side Paystack initialization — the SDK handles that itself.
  Verification happens in /api/wallet/topup/inline-verify after onSuccess fires.

  Body: { amount } — in Naira (e.g. 5000 = ₦5,000)
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount);

  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Minimum top-up is ₦100." }, { status: 400 });
  }

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Payment not configured." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Unique reference — only alphanumeric and - . = are allowed by Paystack
  const reference = `WALLET-${session.user.id.slice(-8).toUpperCase()}-${Date.now()}`;

  return NextResponse.json({
    publicKey,
    email: user.email,
    reference,
    userId: session.user.id,
  });
}
