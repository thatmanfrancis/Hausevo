import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminAuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const log = await prisma.auditLog.findUnique({
    where: { id },
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      before: true,
      after: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      actor: { select: { id: true, fullName: true, email: true, roles: true } },
    },
  });

  if (!log) notFound();

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

  function formatJson(val: unknown) {
    if (!val) return null;
    try { return JSON.stringify(val, null, 2); }
    catch { return String(val); }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/audit" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Audit</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Event Detail</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <h1 className="text-2xl font-extrabold text-zinc-900">Audit Event</h1>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${actionColors[log.action] ?? "bg-zinc-100 text-zinc-500"}`}>
            {log.action}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          {new Date(log.createdAt).toLocaleString("en-NG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Event Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: "Action", value: log.action },
            { label: "Entity Type", value: log.entity },
            { label: "Entity ID", value: log.entityId },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{f.label}</p>
              <p className="text-sm font-semibold text-zinc-700 font-mono break-all">{f.value}</p>
            </div>
          ))}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Log ID</p>
            <p className="text-xs font-mono text-zinc-400 break-all">{log.id}</p>
          </div>
        </div>
      </div>

      {/* Actor */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Actor</p>
        {log.actor ? (
          <div className="flex flex-col gap-2">
            <Link href={`/admin/users/${log.actor.id}`} className="text-sm font-bold text-zinc-900 hover:underline">{log.actor.fullName}</Link>
            <p className="text-xs text-zinc-500">{log.actor.email}</p>
            <div className="flex gap-1 flex-wrap">
              {log.actor.roles.map((r) => (
                <span key={r} className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{r}</span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold text-zinc-400">System (no user actor)</p>
        )}
      </div>

      {/* Technical details */}
      {(log.ipAddress || log.userAgent) && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Request Details</p>
          <div className="flex flex-col gap-3">
            {log.ipAddress && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">IP Address</p>
                <p className="text-sm font-mono text-zinc-700">{log.ipAddress}</p>
              </div>
            )}
            {log.userAgent && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">User Agent</p>
                <p className="text-xs font-mono text-zinc-500 break-all leading-relaxed">{log.userAgent}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Before / After diff */}
      {(log.before || log.after) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {log.before && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Before</p>
              <pre className="text-xs font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed bg-zinc-50 rounded-xl p-3">
                {formatJson(log.before)}
              </pre>
            </div>
          )}
          {log.after && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">After</p>
              <pre className="text-xs font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed bg-zinc-50 rounded-xl p-3">
                {formatJson(log.after)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
