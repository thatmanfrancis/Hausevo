import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination";
import ActionModal from "../components/ActionModal";
import { closeTicket } from "../actions";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const filter = params?.filter || "OPEN";
  const limit = 20;
  const skip = (page - 1) * limit;

  const whereClause = filter === "ALL" ? {} : { status: filter as any };

  const [totalTickets, tickets] = await Promise.all([
    prisma.supportTicket.count({ where: whereClause }),
    prisma.supportTicket.findMany({
      where: whereClause,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Support</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Support Tickets</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalTickets.toLocaleString()} support tickets found.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
          <Link 
            key={s} 
            href={`/admin/support?filter=${s}`}
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
                    <p className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{t.subject}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(t.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
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
                  <td className="px-5 py-3 text-sm text-zinc-600 font-semibold">
                    {t._count.messages}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status !== "CLOSED" && (
                        <ActionModal
                          title="Close Ticket"
                          description={`Are you sure you want to forcefully close this support ticket?`}
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
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">
                    No support tickets found.
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
