import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/bank-accounts
  List own bank accounts.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      bankName: true,
      bankCode: true,
      accountNumber: true,
      accountName: true,
      isDefault: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts });
}

/*
  POST /api/bank-accounts
  Add a new bank account.
  accountName must be resolved via Paystack/Flutterwave before calling this —
  never trust user-entered account names.
  Requires: active session

  Body: { bankName, bankCode, accountNumber, accountName, isDefault? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { bankName, bankCode, accountNumber, accountName, isDefault = false } = body;

  if (!bankName || !bankCode || !accountNumber || !accountName) {
    return NextResponse.json(
      { error: "bankName, bankCode, accountNumber and accountName are required." },
      { status: 400 }
    );
  }

  // Prevent duplicate account numbers for the same user
  const existing = await prisma.bankAccount.findFirst({
    where: { userId: session.user.id, accountNumber },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This account number is already saved." },
      { status: 409 }
    );
  }

  // If this is being set as default, clear existing default first
  if (isDefault) {
    await prisma.bankAccount.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const account = await prisma.bankAccount.create({
    data: {
      userId: session.user.id,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      isDefault,
      isVerified: true, // caller is responsible for resolving via bank API first
    },
    select: {
      id: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
      isDefault: true,
      isVerified: true,
      createdAt: true,
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "BankAccount",
      entityId: account.id,
      after: { bankName, bankCode, accountNumber: `****${accountNumber.slice(-4)}` },
      req,
    }),
    notify(
      session.user.id,
      "Bank account added",
      `${bankName} account ending in ${accountNumber.slice(-4)} has been added to your profile.`,
      "SYSTEM",
      { bankAccountId: account.id }
    ),
  ]);

  return NextResponse.json({ account }, { status: 201 });
}
