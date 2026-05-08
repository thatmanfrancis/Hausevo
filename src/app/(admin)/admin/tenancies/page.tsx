import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination";

export default async function AdminTenanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const filter = params?.filter || "ALL";
  const limit = 20;
  const skip = (page - 1) * limit;

  const whereClause = filter === "ALL" ? {} : { status: filter as any };

  const [totalTenancies, tenancies] = await Promise.all([
    prisma.tenancy.count({ where: whereClause }),
    prisma.tenancy.findMany({
      where: whereClause,
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

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    EXPIRED: "bg-zinc-100 text-zinc-500",
    TERMINATED: "bg-red-100 text-red-700",
  };

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

      <div className="flex gap-2 flex-wrap">
        {["ALL", "ACTIVE", "EXPIRED", "TERMINATED"].map((s) => (
          <Link 
            key={s} 
            href={`/admin/tenancies?filter=${s}`}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
              filter === s 
                ? "bg-zinc-900 text-white border-zinc-900" 
                : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tenant</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Duration</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Savings</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
              </tr>
            </thead>
            <tbody>
              {tenancies.map((t) => {
                const savingsPct = t.savingsGoal > 0 ? Math.min(100, Math.round((t.currentSaved / t.savingsGoal) * 100)) : 0;
                return (
                  <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-zinc-900 truncate max-w-[160px]">{t.property.title}</p>
                      <p className="text-xs text-zinc-400">{t.property.lga}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-zinc-700">{t.tenant.fullName}</p>
                      <p className="text-xs text-zinc-400">{t.tenant.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${statusColors[t.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500">
                      <p>{new Date(t.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}</p>
                      <p>→ {new Date(t.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-24">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 mb-1">
                          <span>{formatNaira(t.currentSaved)}</span>
                          <span>{savingsPct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full">
                          <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${savingsPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.isJoint ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {t.isJoint ? `Joint (${t._count.coTenants + 1})` : "Solo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {tenancies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">
                    No tenancies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalPages={totalPages} />
    </div>
  );
}
