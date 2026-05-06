import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/bank-accounts/:id
  Set an account as default.
  Requires: active session + must own the account

  Body: { isDefault: true }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.bankAccount.findUnique({ where: { id } });

  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const body = await req.json();

  if (body.isDefault === true) {
    await prisma.bankAccount.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.bankAccount.update({
    where: { id },
    data: { isDefault: body.isDefault ?? account.isDefault },
    select: { id: true, bankName: true, accountNumber: true, isDefault: true },
  });

  await audit({
    actorId: session.user.id,
    action: "UPDATE",
    entity: "BankAccount",
    entityId: id,
    before: { isDefault: account.isDefault },
    after: { isDefault: updated.isDefault },
    req,
  });

  return NextResponse.json({ account: updated });
}

/*
  DELETE /api/bank-accounts/:id
  Remove a bank account.
  Requires: active session + must own the account
*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.bankAccount.findUnique({ where: { id } });

  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  await prisma.bankAccount.delete({ where: { id } });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "DELETE",
      entity: "BankAccount",
      entityId: id,
      before: {
        bankName: account.bankName,
        accountNumber: `****${account.accountNumber.slice(-4)}`,
      },
      req,
    }),
    notify(
      session.user.id,
      "Bank account removed",
      `${account.bankName} account ending in ${account.accountNumber.slice(-4)} has been removed.`,
      "SYSTEM",
      { bankAccountId: id }
    ),
  ]);

  return NextResponse.json({ message: "Bank account removed." });
}
