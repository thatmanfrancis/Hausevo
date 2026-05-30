import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import WaitlistAdminClient from "./WaitlistAdminClient";

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = 25;
  const skip = (page - 1) * limit;
  const roleFilter = params?.role || "";
  const query = params?.q?.trim() || "";

  const where: any = {};
  if (roleFilter) where.role = roleFilter;
  if (query) {
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { fullName: { contains: query, mode: "insensitive" } },
      { lga: { contains: query, mode: "insensitive" } },
    ];
  }

  const [total, entries, roleCounts] = await Promise.all([
    prisma.launchWaitlist.count({ where }),
    prisma.launchWaitlist.findMany({
      where,
      orderBy: { position: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        lga: true,
        position: true,
        createdAt: true,
      },
    }),
    prisma.launchWaitlist.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const stats = {
    total: await prisma.launchWaitlist.count(),
    tenants: roleCounts.find((r) => r.role === "TENANT")?._count.id ?? 0,
    landlords: roleCounts.find((r) => r.role === "LANDLORD")?._count.id ?? 0,
    both: roleCounts.find((r) => r.role === "BOTH")?._count.id ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin/dashboard"
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
          >
            Admin
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Waitlist
          </p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Launch Waitlist</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {stats.total.toLocaleString()} people waiting for launch.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-zinc-900" },
          { label: "Tenants", value: stats.tenants, color: "text-blue-700" },
          { label: "Landlords", value: stats.landlords, color: "text-emerald-700" },
          { label: "Both", value: stats.both, color: "text-amber-700" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-zinc-200 p-5"
          >
            <p className={`text-2xl font-extrabold ${s.color}`}>
              {s.value.toLocaleString()}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Client — handles broadcast + table */}
      <WaitlistAdminClient
        entries={entries as any}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        roleFilter={roleFilter}
        query={query}
      />
    </div>
  );
}
