import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PaymentsListClient from "./PaymentsListClient";

// Helper to serialize dates for client component
function serializeTransaction(t: any) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
  };
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Verify Admin role
  const adminCheck = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!adminCheck?.roles.includes("ADMIN")) redirect("/dashboard");

  const params = await searchParams;
  const q = params.q || "";
  const status = params.status || "";
  const type = params.type || "";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 10;

  const where: any = {};

  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      {
        user: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  const [transactions, totalCount, successAgg, pendingAgg] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        reference: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const successVolume = successAgg._sum.amount || 0;
  const pendingVolume = pendingAgg._sum.amount || 0;

  return (
    <PaymentsListClient
      transactions={transactions.map(serializeTransaction)}
      totalPages={totalPages}
      currentPage={page}
      totalCount={totalCount}
      successVolume={successVolume}
      pendingVolume={pendingVolume}
    />
  );
}
