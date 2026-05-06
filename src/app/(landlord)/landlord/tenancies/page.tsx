import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function LandlordTenanciesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const tenancies = await prisma.tenancy.findMany({
    where: { property: { landlordId: session.user.id } },
    select: {
      id: true, status: true, startDate: true, endDate: true,
      cautionDeposit: true, savingsGoal: true, currentSaved: true,
      property: { select: { id: true, title: true, address: true, lga: true } },
      tenant: { select: { id: true, fullName: true, email: true } },
      rentSchedules: {
        select: { id: true, dueDate: true, amount: true, status: true },
        orderBy: { dueDate: "asc" },
      },
      agreement: { select: { status: true, tenantSigned: true, ownerSigned: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    ACTIVE:     { label: "Active",      cls: "bg-emerald-50 text-emerald-700" },
    EXPIRED:    { label: "Expired",     cls: "bg-zinc-100 text-zinc-500" },
    TERMINATED: { label: "Terminated",  cls: "bg-red-50 text-red-700" },
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Landlord</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Tenancies</h1>
      </div>

      {tenancies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No tenancies yet</p>
          <p className="text-xs text-zinc-400 mb-5">Accept an application and create a tenancy to see it here.</p>
          <Link href="/landlord/applications" className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
            View applications →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tenancies.map((t) => {
            const s = STATUS_CONFIG[t.status] ?? { label: t.status, cls: "bg-zinc-100 text-zinc-600" };
            const nextRent = t.rentSchedules.find((r) => r.status === "PENDING");
            const daysLeft = daysUntil(t.endDate);
            const paidCount = t.rentSchedules.filter((r) => r.status === "COMPLETED" || r.status === "SUCCESS").length;

            return (
              <Link
                key={t.id}
                href={`/landlord/tenancies/${t.id}`}
                className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.tenant.fullName}</p>
                    <p className="text-xs text-zinc-500">{t.property.title} · {t.property.lga}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Period</p>
                    <p className="text-xs font-bold text-zinc-700">{formatDate(t.startDate)} – {formatDate(t.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Days left</p>
                    <p className={`text-xs font-bold ${daysLeft <= 30 ? "text-red-600" : "text-zinc-700"}`}>{daysLeft}d</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Next rent</p>
                    {nextRent ? (
                      <p className={`text-xs font-bold ${daysUntil(nextRent.dueDate) <= 7 ? "text-red-600" : "text-zinc-700"}`}>
                        {formatNaira(nextRent.amount)} · {formatDate(nextRent.dueDate)}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-600">All paid ✓</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Agreement</p>
                    <p className="text-xs font-bold text-zinc-700">
                      {t.agreement?.status === "SIGNED" ? "Signed ✓" : `${t.agreement?.tenantSigned ? "1" : "0"}/2 signed`}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
