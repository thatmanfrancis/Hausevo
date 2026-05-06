import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import WalletClient from "./WalletClient";

export default async function WalletPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [user, transactions, bankAccounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        walletBalance: true,
        verificationBundlePaid: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        reference: true,
        description: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.bankAccount.findMany({
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
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  return <WalletClient user={user} transactions={transactions} bankAccounts={bankAccounts} />;
}
