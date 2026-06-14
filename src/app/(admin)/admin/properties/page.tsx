import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActionModal from "../components/ActionModal";
import { approveProperty, flagProperty } from "../actions";

export default async function AdminPropertiesPage({
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

  const [totalProperties, properties] = await Promise.all([
    prisma.property.count({ where: whereClause }),
    prisma.property.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        address: true,
        lga: true,
        listingType: true,
        status: true,
        pricePerYear: true,
        totalPackage: true,
        createdAt: true,
        landlord: { select: { fullName: true, isVerified: true } },
        _count: { select: { vaultItems: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalProperties / limit);

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    AVAILABLE: "bg-emerald-100 text-emerald-700",
    RENTED: "bg-blue-100 text-blue-700",
    MAINTENANCE: "bg-purple-100 text-purple-700",
    FLAGGED: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Properties</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">All Listings</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalProperties.toLocaleString()} listings found.</p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["ALL", "PENDING", "AVAILABLE", "RENTED", "FLAGGED"].map((s) => (
            <Link 
              key={s} 
              href={`/admin/properties?filter=${s}`}
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
        <Link
          href="/admin/properties/new"
          className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Listing
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Landlord</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Price</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/landlord/properties/${p.id}`} className="text-sm font-bold text-zinc-900 hover:underline truncate max-w-[180px] block">
                      {p.title}
                    </Link>
                    <p className="text-xs text-zinc-400">{p.lga}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-zinc-700 font-semibold">{p.landlord.fullName}</p>
                    {p.landlord.isVerified && (
                      <span className="text-[9px] font-bold text-emerald-600">✓ Verified</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                      {p.listingType}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${statusColors[p.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-zinc-600 font-semibold whitespace-nowrap">
                    {formatNaira(p.pricePerYear)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/properties/${p.id}`}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
                      >
                        View
                      </Link>
                      {p.status === "PENDING" && (
                        <ActionModal
                          title="Approve Property"
                          description={`Make "${p.title}" available to tenants?`}
                          triggerLabel="Approve"
                          triggerClass="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          action={approveProperty.bind(null, p.id)}
                        />
                      )}
                      {p.status !== "FLAGGED" && (
                        <ActionModal
                          title="Flag Property"
                          description={`Flag "${p.title}"? It will be hidden from search until reviewed.`}
                          triggerLabel="Flag"
                          triggerClass="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          action={flagProperty.bind(null, p.id)}
                          destructive
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">
                    No properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Always-visible pagination */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-semibold">{totalProperties} total · Page {page} of {Math.max(totalPages, 1)}</p>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={`/admin/properties?filter=${filter}&page=${page - 1}`}
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
              <Link href={`/admin/properties?filter=${filter}&page=${page + 1}`}
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
