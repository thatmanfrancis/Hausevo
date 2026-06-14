import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TenanciesClient from "./TenanciesClient";

export default async function AdminTenanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const filter = params?.filter || "ALL";
  const q = params?.q?.trim() || "";
  const limit = 20;
  const skip = (page - 1) * limit;

  const baseWhere: any = filter === "ALL" ? {} : { status: filter as any };

  if (q) {
    baseWhere.OR = [
      { tenant: { fullName: { contains: q, mode: "insensitive" } } },
      { tenant: { email: { contains: q, mode: "insensitive" } } },
      { property: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [totalTenancies, tenancies] = await Promise.all([
    prisma.tenancy.count({ where: baseWhere }),
    prisma.tenancy.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        savingsGoal: true,
        currentSaved: true,
        isJoint: true,
        createdAt: true,
        property: { select: { title: true, lga: true } },
        tenant: { select: { fullName: true, email: true } },
        _count: { select: { rentSchedules: true, coTenants: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalTenancies / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancies</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">All Tenancies</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalTenancies.toLocaleString()} tenancy records found.</p>
      </div>

      <TenanciesClient
        tenancies={tenancies as any}
        totalTenancies={totalTenancies}
        totalPages={totalPages}
        currentPage={page}
        currentFilter={filter}
        currentQ={q}
      />
    </div>
  );
}
