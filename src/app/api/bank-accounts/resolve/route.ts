import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/*
  GET /api/bank-accounts/resolve?account_number=...&bank_code=...
  Resolves an account number to an account name via Paystack.
  Keeps the secret key server-side — never exposed to the client.
  Requires: active session
*/
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("account_number");
  const bankCode = searchParams.get("bank_code");

  if (!accountNumber || !bankCode) {
    return NextResponse.json(
      { error: "account_number and bank_code are required." },
      { status: 400 }
    );
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json(
      { error: "Account number must be exactly 10 digits." },
      { status: 400 }
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey === "sk_test_your_key_here") {
    return NextResponse.json(
      { error: "Bank lookup is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        // Don't cache — always fresh
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok || !data.status) {
      return NextResponse.json(
        { error: data.message ?? "Could not resolve account. Check the details and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach bank verification service. Please try again." },
      { status: 502 }
    );
  }
}
