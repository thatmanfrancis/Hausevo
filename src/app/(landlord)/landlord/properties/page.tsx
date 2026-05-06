import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Pending review", cls: "bg-amber-50 text-amber-700" },
  AVAILABLE:   { label: "Available",      cls: "bg-emerald-50 text-emerald-700" },
  RENTED:      { label: "Rented",         cls: "bg-blue-50 text-blue-700" },
  MAINTENANCE: { label: "Maintenance",    cls: "bg-orange-50 text-orange-700" },
  FLAGGED:     { label: "Flagged",        cls: "bg-red-50 text-red-700" },
};

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

export default async function LandlordPropertiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id },
    select: {
      id: true, title: true, address: true, lga: true, status: true,
      pricePerYear: true, listingType: true, deedVerified: true, priceVerified: true,
      createdAt: true,
      images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
      _count: { select: { applications: true, waitlist: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Landlord</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Properties</h1>
        </div>
        <Link
          href="/landlord/properties/new"
          className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
        >
          + Add listing
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No properties yet</p>
          <p className="text-xs text-zinc-400 mb-5">Add your first listing to start receiving applications from verified tenants.</p>
          <Link href="/landlord/properties/new" className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
            Add your first property →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {properties.map((p) => {
            const img = p.images[0]?.url;
            const s = STATUS_CONFIG[p.status] ?? { label: p.status, cls: "bg-zinc-100 text-zinc-600" };
            return (
              <Link
                key={p.id}
                href={`/landlord/properties/${p.id}`}
                className="bg-white rounded-2xl border border-zinc-200 p-5 flex gap-4 hover:border-zinc-300 transition-colors"
              >
                <div className="relative h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
                  {img ? (
                    <Image src={img} alt={p.title} fill className="object-cover" sizes="112px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-bold text-zinc-900 truncate">{p.title}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">{p.address}, {p.lga}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-extrabold text-zinc-900">{formatNaira(p.pricePerYear)}<span className="text-xs font-semibold text-zinc-400">/yr</span></span>
                    {p.deedVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Deed verified
                      </span>
                    )}
                    {p._count.applications > 0 && (
                      <span className="text-xs text-zinc-500">{p._count.applications} application{p._count.applications !== 1 ? "s" : ""}</span>
                    )}
                    {p._count.waitlist > 0 && (
                      <span className="text-xs text-zinc-500">{p._count.waitlist} on waitlist</span>
                    )}
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
