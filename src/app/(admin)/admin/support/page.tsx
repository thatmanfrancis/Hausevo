import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActionModal from "../components/ActionModal";
import { closeTicket } from "../actions";
import CreateTicketModal from "./CreateTicketModal";
import SupportSearchInput from "./SupportSearchInput";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; priority?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const filter = params?.filter || "OPEN";
  const priorityFilter = params?.priority || "";
  const q = params?.q?.trim() || "";
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = filter === "ALL" ? {} : { status: filter as any };
  if (priorityFilter) where.priority = priorityFilter as any;
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { user: { fullName: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [totalTickets, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        user: { select: { fullName: true, email: true, roles: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalTickets / limit);

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    CLOSED: "bg-zinc-100 text-zinc-500",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-zinc-100 text-zinc-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-amber-100 text-amber-700",
    URGENT: "bg-red-100 text-red-700",
  };

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { filter, priority: priorityFilter, q, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/support?${p.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Support</p>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900">Support Tickets</h1>
            <p className="text-sm text-zinc-500 mt-1">{totalTickets.toLocaleString()} support tickets found.</p>
          </div>
          <CreateTicketModal />
        </div>
      </div>

      {/* Filters + search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {["ALL","OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map((s) => (
            <Link key={s} href={buildUrl({ filter: s, page: "1" })}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                filter === s ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
              }`}>
              {s.replace("_", " ")}
            </Link>
          ))}
          <div className="w-px bg-zinc-200 mx-1 self-stretch hidden sm:block" />
          {["","LOW","MEDIUM","HIGH","URGENT"].map((p) => (
            <Link key={p} href={buildUrl({ priority: p, page: "1" })}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                priorityFilter === p ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
              }`}>
              {p || "All Priority"}
            </Link>
          ))}
        </div>
        <SupportSearchInput defaultValue={q} filter={filter} priority={priorityFilter} />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Subject</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Priority</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Replies</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-zinc-900 truncate max-w-[180px]">{t.subject}</p>
                    <p className="text-xs text-zinc-400">{new Date(t.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-zinc-700">{t.user.fullName}</p>
                    <p className="text-xs text-zinc-400">{t.user.roles[0]}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[t.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityColors[t.priority] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-600 font-semibold">{t._count.messages}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/support/${t.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                        title="View ticket">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </Link>
                      {t.status !== "CLOSED" && (
                        <ActionModal
                          title="Close Ticket"
                          description="Forcefully close this support ticket?"
                          triggerLabel="Close"
                          action={closeTicket.bind(null, t.id)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">No support tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Always-visible pagination */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-semibold">{totalTickets} total · Page {page} of {Math.max(totalPages, 1)}</p>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={buildUrl({ page: String(page - 1) })}
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
              <Link href={buildUrl({ page: String(page + 1) })}
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
