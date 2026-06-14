import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [totalLogs, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        actor: { select: { fullName: true, email: true, roles: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalLogs / limit);

  const actionColors: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    LOGIN: "bg-zinc-100 text-zinc-500",
    LOGOUT: "bg-zinc-100 text-zinc-400",
    VERIFY: "bg-emerald-100 text-emerald-700",
    FLAG: "bg-amber-100 text-amber-700",
    APPROVE: "bg-emerald-100 text-emerald-700",
    REJECT: "bg-red-100 text-red-700",
    PAYMENT: "bg-blue-100 text-blue-700",
    ACCESS: "bg-zinc-100 text-zinc-500",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Audit</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Audit Logs</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalLogs.toLocaleString()} total system events.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">When</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actor</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Action</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Entity</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-NG", { 
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" 
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-zinc-700">{log.actor?.fullName ?? "System"}</p>
                    <p className="text-xs text-zinc-400">{log.actor?.roles[0] ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${actionColors[log.action] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-zinc-600">{log.entity}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/audit/${log.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors ml-auto"
                      title="View event details"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">
                    No audit logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Always-visible pagination */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-semibold">{totalLogs} total · Page {page} of {Math.max(totalPages, 1)}</p>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={`/admin/audit?page=${page - 1}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </Link>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 text-zinc-300 cursor-not-allowed">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </span>
            )}
            <span className="text-xs font-bold text-zinc-600 px-2">{page} / {Math.max(totalPages, 1)}</span>
            {page < totalPages ? (
              <Link href={`/admin/audit?page=${page + 1}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 text-zinc-300 cursor-not-allowed">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
