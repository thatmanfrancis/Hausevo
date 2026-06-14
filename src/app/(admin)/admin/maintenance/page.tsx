import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MaintenanceClient from "./MaintenanceClient";

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

      <MaintenanceClient
        jobs={jobs as any}
        totalJobs={totalJobs}
        totalPages={totalPages}
        currentPage={page}
        currentFilter={filter}
      />
    </div>
  );
}
