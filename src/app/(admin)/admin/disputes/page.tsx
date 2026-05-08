import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination";
import ResolveDisputeModal from "../components/ResolveDisputeModal";

export default async function AdminDisputesPage({
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

  const [totalDisputes, disputes] = await Promise.all([
    prisma.dispute.count({ where: whereClause }),
    prisma.dispute.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        status: true,
        description: true,
        resolution: true,
        createdAt: true,
        raisedBy: { select: { fullName: true, email: true, roles: true } },
        against: { select: { fullName: true, email: true, roles: true } },
        property: { select: { title: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalDisputes / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Disputes</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Dispute Management</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalDisputes.toLocaleString()} disputes found.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "OPEN", "RESOLVED"].map((s) => (
          <Link 
            key={s} 
            href={`/admin/disputes?filter=${s}`}
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

      <div className="flex flex-col gap-4">
        {disputes.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    d.status === "OPEN" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {d.status}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                    {d.type}
                  </span>
                  <span className="text-xs text-zinc-400 ml-2">
                    {new Date(d.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                
                <div className="bg-zinc-50 p-4 rounded-xl mb-4 text-sm text-zinc-700 border border-zinc-100">
                  <p className="font-bold text-zinc-900 mb-1">Complaint:</p>
                  {d.description}
                </div>

                <div className="flex gap-8 text-sm">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Raised By</p>
                    <p className="font-semibold text-zinc-900">{d.raisedBy.fullName}</p>
                    <p className="text-xs text-zinc-500">{d.raisedBy.roles[0]}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Against</p>
                    <p className="font-semibold text-zinc-900">{d.against.fullName}</p>
                    <p className="text-xs text-zinc-500">{d.against.roles[0]}</p>
                  </div>
                  {d.property && (
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Property</p>
                      <p className="font-semibold text-zinc-900">{d.property.title}</p>
                    </div>
                  )}
                </div>

                {d.resolution && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-900">
                    <p className="font-bold mb-1">Resolution:</p>
                    {d.resolution}
                  </div>
                )}
              </div>
              
              <div className="shrink-0 flex flex-col gap-2">
                {d.status === "OPEN" && <ResolveDisputeModal disputeId={d.id} />}
              </div>
            </div>
          </div>
        ))}
        {disputes.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <p className="text-sm font-bold text-zinc-400">No disputes found.</p>
          </div>
        )}
      </div>

      <Pagination totalPages={totalPages} />
    </div>
  );
}
