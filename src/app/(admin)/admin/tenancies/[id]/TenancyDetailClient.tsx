"use client";

import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type RentSchedule = {
  id: string;
  dueDate: string | Date;
  amount: number;
  frequency: string;
  status: string;
  paidAt: string | Date | null;
};

type Person = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isVerified: boolean;
  verificationTier?: number;
  roles: string[];
  walletBalance?: number;
  shackScore?: { score: number } | null;
};

type Tenancy = {
  id: string;
  status: string;
  isJoint: boolean;
  savingsGoal: number;
  currentSaved: number;
  cautionDeposit: number;
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  property: {
    id: string;
    title: string;
    address: string;
    lga: string;
    pricePerYear: number;
    totalPackage: number;
    listingType: string;
    status: string;
    metadata: any;
    landlord: { id: string; fullName: string; email: string; phoneNumber: string | null; isVerified: boolean };
  };
  tenant: Person;
  coTenants: Omit<Person, "walletBalance" | "shackScore" | "verificationTier">[];
  rentSchedules: RentSchedule[];
  agreement: {
    id: string;
    status: string;
    ownerSigned: boolean;
    ownerSignedAt: string | Date | null;
    tenantSigned: boolean;
    tenantSignedAt: string | Date | null;
    createdAt: string | Date;
  } | null;
  conditionReport: {
    id: string;
    type: string;
    notes: string | null;
    claimedAmount: number;
    isAcknowledgedByTenant: boolean;
    isAcknowledgedByOwner: boolean;
    createdAt: string | Date;
  } | null;
  _count: { rentSchedules: number; coTenants: number };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString("en-NG", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

const statusColors: Record<string, string> = {
  ACTIVE:     "bg-emerald-100 text-emerald-700",
  EXPIRED:    "bg-zinc-100 text-zinc-500",
  TERMINATED: "bg-red-100 text-red-700",
};

const scheduleStatusColors: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  SUCCESS:   "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED:    "bg-red-100 text-red-700",
  ESCROW:    "bg-blue-100 text-blue-700",
  LOCKED:    "bg-purple-100 text-purple-700",
};

const agreementStatusColors: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-700",
  SIGNED:     "bg-emerald-100 text-emerald-700",
  EXPIRED:    "bg-zinc-100 text-zinc-500",
  TERMINATED: "bg-red-100 text-red-700",
};

// ── Person card ────────────────────────────────────────────────────────────

function PersonCard({ person, label }: { person: Person | Omit<Person, "walletBalance" | "shackScore" | "verificationTier">; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-extrabold text-zinc-500">{person.fullName.charAt(0)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/admin/users/${person.id}`} className="text-sm font-bold text-zinc-900 hover:underline truncate block">
            {person.fullName}
          </Link>
          <p className="text-xs text-zinc-500 truncate">{person.email}</p>
          {person.phoneNumber && <p className="text-xs text-zinc-400">{person.phoneNumber}</p>}
          <div className="flex gap-1.5 flex-wrap mt-1">
            {person.roles.map((r: string) => (
              <span key={r} className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{r}</span>
            ))}
            {person.isVerified && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
            )}
          </div>
          {"walletBalance" in person && person.walletBalance !== undefined && (
            <p className="text-xs text-zinc-500 mt-1.5">
              Wallet: <span className="font-bold text-zinc-900">{formatNaira(person.walletBalance)}</span>
              {"shackScore" in person && person.shackScore && (
                <span className="ml-2">· Score: <span className="font-bold text-zinc-900">{person.shackScore.score}</span></span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function TenancyDetailClient({ tenancy }: { tenancy: Tenancy }) {
  const meta = tenancy.property.metadata ?? {};
  const savingsPct = tenancy.savingsGoal > 0
    ? Math.min(100, Math.round((tenancy.currentSaved / tenancy.savingsGoal) * 100))
    : 0;

  const paidSchedules    = tenancy.rentSchedules.filter(s => s.status === "SUCCESS" || s.status === "COMPLETED");
  const pendingSchedules = tenancy.rentSchedules.filter(s => s.status === "PENDING");
  const totalDue         = tenancy.rentSchedules.reduce((sum, s) => sum + s.amount, 0);
  const totalPaid        = paidSchedules.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/tenancies" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Tenancies</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Detail</p>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <h1 className="text-2xl font-extrabold text-zinc-900">{tenancy.property.title}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColors[tenancy.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                {tenancy.status}
              </span>
              {tenancy.isJoint && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  Joint · {tenancy._count.coTenants + 1} occupants
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">{tenancy.property.address}, {tenancy.property.lga}</p>
          </div>
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Annual Rent",     value: formatNaira(tenancy.property.pricePerYear) },
          { label: "Caution Deposit", value: formatNaira(tenancy.cautionDeposit) },
          { label: "Savings Goal",    value: formatNaira(tenancy.savingsGoal) },
          { label: "Total Paid",      value: formatNaira(totalPaid) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs font-extrabold text-zinc-900">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Tenancy overview */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tenancy Overview</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: "Start Date",    value: formatDate(tenancy.startDate) },
                { label: "End Date",      value: formatDate(tenancy.endDate) },
                { label: "Duration",      value: (() => {
                    const ms = new Date(tenancy.endDate).getTime() - new Date(tenancy.startDate).getTime();
                    const months = Math.round(ms / (1000 * 60 * 60 * 24 * 30.44));
                    return months >= 12 ? `${Math.round(months / 12)} yr${Math.round(months / 12) !== 1 ? "s" : ""}` : `${months} mo`;
                  })() },
                { label: "Created",       value: formatDate(tenancy.createdAt) },
                { label: "Listing Type",  value: tenancy.property.listingType },
                { label: "Rent Schedules",value: `${paidSchedules.length} / ${tenancy._count.rentSchedules} paid` },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{f.label}</p>
                  <p className="text-sm font-semibold text-zinc-900">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Savings progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Savings Progress</p>
                <p className="text-xs font-bold text-zinc-900">{savingsPct}%</p>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full">
                <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${savingsPct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[10px] text-zinc-400">Saved: <span className="font-bold text-zinc-700">{formatNaira(tenancy.currentSaved)}</span></p>
                <p className="text-[10px] text-zinc-400">Goal: <span className="font-bold text-zinc-700">{formatNaira(tenancy.savingsGoal)}</span></p>
              </div>
            </div>
          </div>

          {/* Occupants */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Occupants {tenancy.isJoint ? `(${tenancy._count.coTenants + 1} total — Joint Tenancy)` : "(Solo Tenancy)"}
            </p>
            <PersonCard person={tenancy.tenant} label="Primary Tenant" />
            {tenancy.coTenants.length > 0 && (
              <>
                <div className="border-t border-zinc-100" />
                {tenancy.coTenants.map((ct, i) => (
                  <PersonCard key={ct.id} person={ct} label={`Co-Tenant ${i + 1}`} />
                ))}
              </>
            )}
          </div>

          {/* Rent schedules */}
          {tenancy.rentSchedules.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Rent Schedules ({tenancy._count.rentSchedules})
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span>Paid: <span className="font-bold text-zinc-900">{formatNaira(totalPaid)}</span></span>
                  <span>Outstanding: <span className="font-bold text-zinc-900">{formatNaira(totalDue - totalPaid)}</span></span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Due Date</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Frequency</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenancy.rentSchedules.map(s => (
                      <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3 text-xs text-zinc-700 font-semibold whitespace-nowrap">
                          {formatDate(s.dueDate)}
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-zinc-900 whitespace-nowrap">
                          {formatNaira(s.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                            {s.frequency}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${scheduleStatusColors[s.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-zinc-400">
                          {s.paidAt ? formatDate(s.paidAt) : <span className="text-zinc-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Right col (1/3) ── */}
        <div className="flex flex-col gap-6">

          {/* Property */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Property</p>
            <Link href={`/admin/properties/${tenancy.property.id}`}
              className="text-sm font-bold text-zinc-900 hover:underline block mb-0.5">
              {tenancy.property.title}
            </Link>
            <p className="text-xs text-zinc-500">{tenancy.property.address}</p>
            <p className="text-xs text-zinc-400">{tenancy.property.lga}, Lagos</p>
            <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-zinc-100">
              {[
                { label: "Listing Type",  value: tenancy.property.listingType },
                { label: "Status",        value: tenancy.property.status },
                { label: "Rent / yr",     value: formatNaira(tenancy.property.pricePerYear) },
                { label: "Bedrooms",      value: meta.bedrooms  != null ? String(meta.bedrooms)  : "—" },
                { label: "Bathrooms",     value: meta.bathrooms != null ? String(meta.bathrooms) : "—" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{f.label}</span>
                  <span className="text-xs font-bold text-zinc-900">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Landlord */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Landlord</p>
            <Link href={`/admin/users/${tenancy.property.landlord.id}`}
              className="text-sm font-bold text-zinc-900 hover:underline block">
              {tenancy.property.landlord.fullName}
            </Link>
            <p className="text-xs text-zinc-500">{tenancy.property.landlord.email}</p>
            {tenancy.property.landlord.phoneNumber && (
              <p className="text-xs text-zinc-400">{tenancy.property.landlord.phoneNumber}</p>
            )}
            {tenancy.property.landlord.isVerified && (
              <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
            )}
          </div>

          {/* Agreement */}
          {tenancy.agreement && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Tenancy Agreement</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Status</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${agreementStatusColors[tenancy.agreement.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {tenancy.agreement.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Landlord signed</span>
                  <span className={`text-xs font-bold ${tenancy.agreement.ownerSigned ? "text-emerald-600" : "text-zinc-400"}`}>
                    {tenancy.agreement.ownerSigned ? (formatDate(tenancy.agreement.ownerSignedAt!)) : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Tenant signed</span>
                  <span className={`text-xs font-bold ${tenancy.agreement.tenantSigned ? "text-emerald-600" : "text-zinc-400"}`}>
                    {tenancy.agreement.tenantSigned ? (formatDate(tenancy.agreement.tenantSignedAt!)) : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Condition report */}
          {tenancy.conditionReport && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Condition Report · {tenancy.conditionReport.type.replace("_", " ")}
              </p>
              <div className="flex flex-col gap-3">
                {tenancy.conditionReport.claimedAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Claimed Amount</span>
                    <span className="text-xs font-bold text-zinc-900">{formatNaira(tenancy.conditionReport.claimedAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Tenant ack.</span>
                  <span className={`text-xs font-bold ${tenancy.conditionReport.isAcknowledgedByTenant ? "text-emerald-600" : "text-zinc-400"}`}>
                    {tenancy.conditionReport.isAcknowledgedByTenant ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Landlord ack.</span>
                  <span className={`text-xs font-bold ${tenancy.conditionReport.isAcknowledgedByOwner ? "text-emerald-600" : "text-zinc-400"}`}>
                    {tenancy.conditionReport.isAcknowledgedByOwner ? "Yes" : "No"}
                  </span>
                </div>
                {tenancy.conditionReport.notes && (
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500 leading-relaxed">{tenancy.conditionReport.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
