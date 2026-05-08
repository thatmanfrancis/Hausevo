import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination";

export default async function AdminMaintenancePage({
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

  const [totalJobs, jobs] = await Promise.all([
    prisma.maintenanceJob.count({ where: whereClause }),
    prisma.maintenanceJob.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        cost: true,
        createdAt: true,
        updatedAt: true,
        property: { select: { title: true, lga: true } },
        artisan: { select: { fullName: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalJobs / limit);

  const statusColors: Record<string, string> = {
    OPEN: "bg-amber-100 text-amber-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    VERIFIED: "bg-emerald-200 text-emerald-800",
    PAID: "bg-zinc-100 text-zinc-500",
    DISPUTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Maintenance</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Maintenance Jobs</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalJobs.toLocaleString()} total jobs found.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "DISPUTED"].map((s) => (
          <Link 
            key={s} 
            href={`/admin/maintenance?filter=${s}`}
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

      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[job.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-900">{job.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{job.description}</p>
              </div>
              {job.cost && (
                <p className="text-sm font-bold text-zinc-700 whitespace-nowrap">
                  ₦{job.cost.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-50 text-xs text-zinc-400">
              <span>📍 {job.property.title} · {job.property.lga}</span>
              {job.artisan && <span>🔧 {job.artisan.fullName}</span>}
              <span className="ml-auto">{new Date(job.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <p className="text-sm font-bold text-zinc-400">No maintenance jobs found.</p>
          </div>
        )}
      </div>

      <Pagination totalPages={totalPages} />
    </div>
  );
}
