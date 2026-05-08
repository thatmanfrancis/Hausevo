import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalProperties,
    activeTenancies,
    pendingProperties,
    openTickets,
    openJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.tenancy.count({ where: { status: "ACTIVE" } }),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.maintenanceJob.count({ where: { status: "OPEN" } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, fullName: true, email: true, roles: true, createdAt: true },
  });

  const recentProperties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, lga: true, status: true, listingType: true, createdAt: true },
  });

  const stats = [
    { label: "Total Users", value: totalUsers, color: "bg-blue-50 text-blue-700", href: "/admin/users" },
    { label: "All Properties", value: totalProperties, color: "bg-zinc-50 text-zinc-700", href: "/admin/properties" },
    { label: "Active Tenancies", value: activeTenancies, color: "bg-emerald-50 text-emerald-700", href: "/admin/tenancies" },
    { label: "Pending Review", value: pendingProperties, color: "bg-amber-50 text-amber-700", href: "/admin/properties" },
    { label: "Open Tickets", value: openTickets, color: "bg-red-50 text-red-700", href: "/admin/audit" },
    { label: "Open Jobs", value: openJobs, color: "bg-purple-50 text-purple-700", href: "/admin/maintenance" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Shack Admin</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Platform Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Real-time snapshot of the Shack ecosystem.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-2xl p-5 ${s.color} hover:opacity-80 transition-opacity`}>
            <p className="text-3xl font-extrabold">{s.value.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Users</p>
            <Link href="/admin/users" className="text-xs font-bold text-zinc-500 hover:text-zinc-900">View all →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{u.fullName}</p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                  {u.roles[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Listings</p>
            <Link href="/admin/properties" className="text-xs font-bold text-zinc-500 hover:text-zinc-900">View all →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentProperties.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                <div>
                  <p className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{p.title}</p>
                  <p className="text-xs text-zinc-400">{p.lga} · {p.listingType}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                  p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                  p.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" :
                  "bg-zinc-100 text-zinc-500"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
