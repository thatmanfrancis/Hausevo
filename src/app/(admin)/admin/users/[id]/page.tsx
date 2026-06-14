import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ActionModal from "../../components/ActionModal";
import { verifyUser, flagUser, softDeleteUser, restoreUser } from "../../actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      roles: true,
      isVerified: true,
      verificationTier: true,
      onboardingCompleted: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      walletBalance: true,
      accumulatedBond: true,
      vaultPremium: true,
      vaultPremiumUntil: true,
      verificationBundlePaid: true,
      twoFactorEnabled: true,
      employmentStatus: true,
      profession: true,
      employerName: true,
      monthlyIncome: true,
      idDocumentUrl: true,
      selfieUrl: true,
      shackScore: { select: { score: true, onTimePayments: true, latePayments: true, disputesRaised: true, completedTenancies: true } },
      _count: {
        select: {
          ownedProperties: true,
          applications: true,
          notifications: true,
          supportTickets: true,
          disputesRaised: true,
          vaultItems: true,
          savedProperties: true,
        },
      },
      ownedProperties: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, lga: true, status: true, listingType: true, createdAt: true },
      },
      tenancy: {
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          property: { select: { title: true, lga: true } },
        },
      },
      applications: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, createdAt: true, property: { select: { title: true } } },
      },
      guarantors: {
        where: { isEmergency: true },
        select: { fullName: true, phone: true, email: true, relationship: true, status: true },
        take: 1,
      },
      artisanProfile: {
        select: { category: true, isVetted: true, rating: true, jobsCompleted: true, bondAccumulated: true, bio: true },
      },
    },
  });

  if (!user) notFound();

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    AVAILABLE: "bg-emerald-100 text-emerald-700",
    RENTED: "bg-blue-100 text-blue-700",
    FLAGGED: "bg-red-100 text-red-700",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    EXPIRED: "bg-zinc-100 text-zinc-500",
    TERMINATED: "bg-red-100 text-red-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    WITHDRAWN: "bg-zinc-100 text-zinc-500",
    REVIEWING: "bg-blue-100 text-blue-700",
  };

  const isDeleted = !!user.deletedAt;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/users" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Users</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate max-w-[140px]">{user.fullName}</p>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-zinc-900">{user.fullName}</h1>
              {isDeleted && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-100 text-red-600">Deleted</span>
              )}
              {user.isVerified && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">{user.email} {user.phoneNumber ? `· ${user.phoneNumber}` : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isDeleted ? (
              <ActionModal
                title="Restore Account"
                description={`Restore ${user.fullName}'s account? They will regain access to the platform.`}
                triggerLabel="Restore Account"
                triggerClass="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors"
                action={restoreUser.bind(null, user.id)}
              />
            ) : (
              <>
                {!user.isVerified ? (
                  <ActionModal
                    title="Verify User"
                    description={`Manually verify ${user.fullName}?`}
                    triggerLabel="Verify"
                    triggerClass="rounded-full border border-emerald-200 text-emerald-600 px-4 py-2 text-xs font-bold hover:bg-emerald-50 transition-colors"
                    action={verifyUser.bind(null, user.id)}
                  />
                ) : (
                  <ActionModal
                    title="Revoke Verification"
                    description={`Revoke ${user.fullName}'s verified status?`}
                    triggerLabel="Revoke"
                    triggerClass="rounded-full border border-zinc-200 text-zinc-600 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors"
                    action={flagUser.bind(null, user.id)}
                    destructive
                  />
                )}
                <ActionModal
                  title="Delete Account"
                  description={`Soft-delete ${user.fullName}'s account? They will lose access but can contact support to restore it.`}
                  triggerLabel="Delete Account"
                  triggerClass="rounded-full border border-red-200 text-red-500 px-4 py-2 text-xs font-bold hover:bg-red-50 transition-colors"
                  action={softDeleteUser.bind(null, user.id)}
                  destructive
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shack Score */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Shack Score</p>
          <p className="text-3xl font-extrabold text-zinc-900">{user.shackScore?.score ?? "N/A"}</p>
          {user.shackScore && (
            <div className="flex gap-3 mt-1 flex-wrap">
              <span className="text-xs text-zinc-500"><span className="font-bold text-emerald-600">{user.shackScore.onTimePayments}</span> on-time</span>
              <span className="text-xs text-zinc-500"><span className="font-bold text-red-500">{user.shackScore.latePayments}</span> late</span>
              <span className="text-xs text-zinc-500"><span className="font-bold">{user.shackScore.completedTenancies}</span> tenancies</span>
            </div>
          )}
        </div>
        {/* Wallet */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Wallet Balance</p>
          <p className="text-2xl font-extrabold text-zinc-900">{formatNaira(user.walletBalance)}</p>
          <p className="text-xs text-zinc-500 mt-1">Bond: {formatNaira(user.accumulatedBond)}</p>
        </div>
        {/* Verification Tier */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verification Tier</p>
          <p className="text-2xl font-extrabold text-zinc-900">Tier {user.verificationTier}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {user.verificationTier === 0 && "No verification"}
            {user.verificationTier === 1 && "ID document verified"}
            {user.verificationTier >= 2 && "Fully verified"}
            {user.verificationBundlePaid && " · Bundle paid"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Properties", value: user._count.ownedProperties },
          { label: "Applications", value: user._count.applications },
          { label: "Vault Items", value: user._count.vaultItems },
          { label: "Support Tickets", value: user._count.supportTickets },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-2xl font-extrabold text-zinc-900">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Profile Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: "Full Name", value: user.fullName },
            { label: "Email", value: user.email },
            { label: "Phone", value: user.phoneNumber ?? "—" },
            { label: "Roles", value: user.roles.join(", ") },
            { label: "Joined", value: new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
            { label: "Last Updated", value: new Date(user.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
            { label: "Onboarding", value: user.onboardingCompleted ? "Completed" : "Incomplete" },
            { label: "2FA", value: user.twoFactorEnabled ? "Enabled" : "Disabled" },
            { label: "Vault Premium", value: user.vaultPremium ? `Yes (until ${user.vaultPremiumUntil ? new Date(user.vaultPremiumUntil).toLocaleDateString("en-NG") : "—"})` : "No" },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{f.label}</p>
              <p className="text-sm font-semibold text-zinc-700">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Employment Info */}
      {(user.employmentStatus || user.profession || user.employerName || user.monthlyIncome) && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Employment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: "Employment Status", value: user.employmentStatus },
              { label: "Profession", value: user.profession },
              { label: "Employer", value: user.employerName },
              { label: "Monthly Income", value: user.monthlyIncome },
            ].filter((f) => f.value).map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-zinc-700">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Artisan Profile */}
      {user.artisanProfile && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Artisan Profile</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Category", value: user.artisanProfile.category },
              { label: "Status", value: user.artisanProfile.isVetted ? "Vetted" : "Pending" },
              { label: "Rating", value: `${user.artisanProfile.rating.toFixed(1)} ★` },
              { label: "Jobs Completed", value: String(user.artisanProfile.jobsCompleted) },
              { label: "Bond Accumulated", value: formatNaira(user.artisanProfile.bondAccumulated) },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-zinc-700">{f.value}</p>
              </div>
            ))}
          </div>
          {user.artisanProfile.bio && (
            <p className="mt-4 text-sm text-zinc-600 leading-relaxed">{user.artisanProfile.bio}</p>
          )}
        </div>
      )}

      {/* Current Tenancy */}
      {user.tenancy && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Current Tenancy</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Property</p>
              <p className="text-sm font-semibold text-zinc-700">{user.tenancy.property.title}</p>
              <p className="text-xs text-zinc-400">{user.tenancy.property.lga}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Status</p>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[user.tenancy.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                {user.tenancy.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Duration</p>
              <p className="text-sm font-semibold text-zinc-700">
                {new Date(user.tenancy.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
                {" → "}
                {new Date(user.tenancy.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      {user.guarantors?.[0] && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Emergency Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Name", value: user.guarantors[0].fullName },
              { label: "Phone", value: user.guarantors[0].phone },
              { label: "Email", value: user.guarantors[0].email ?? "—" },
              { label: "Relationship", value: user.guarantors[0].relationship },
              { label: "Status", value: user.guarantors[0].status },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-zinc-700">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owned Properties */}
      {user.ownedProperties.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Owned Properties ({user._count.ownedProperties})</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {user.ownedProperties.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <Link href={`/admin/properties/${p.id}`} className="text-sm font-bold text-zinc-900 hover:underline">{p.title}</Link>
                  <p className="text-xs text-zinc-400">{p.lga} · {p.listingType}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${statusColors[p.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications */}
      {user.applications.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Applications ({user._count.applications})</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {user.applications.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-zinc-700 truncate">{a.property.title}</p>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${statusColors[a.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deleted notice */}
      {isDeleted && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <p className="text-sm font-bold text-red-700 mb-1">Account Deleted</p>
          <p className="text-xs text-red-600">
            Deleted on {new Date(user.deletedAt!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. The user has lost access to the platform. They can contact support to restore their account.
          </p>
        </div>
      )}
    </div>
  );
}
