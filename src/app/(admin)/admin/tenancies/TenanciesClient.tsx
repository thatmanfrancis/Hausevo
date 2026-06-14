"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

type Tenancy = {
  id: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  savingsGoal: number;
  currentSaved: number;
  isJoint: boolean;
  createdAt: string | Date;
  property: { title: string; lga: string };
  tenant: { fullName: string; email: string };
  _count: { rentSchedules: number; coTenants: number };
};

type Props = {
  tenancies: Tenancy[];
  totalTenancies: number;
  totalPages: number;
  currentPage: number;
  currentFilter: string;
  currentQ: string;
};

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-zinc-100 text-zinc-500",
  TERMINATED: "bg-red-100 text-red-700",
};

export default function TenanciesClient({ tenancies, totalTenancies, totalPages, currentPage, currentFilter, currentQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentQ);

  const buildQuery = useCallback((overrides: Record<string, string | number | null>) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, String(v));
    }
    return p.toString();
  }, [searchParams]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== currentQ) {
        router.push(`${pathname}?${buildQuery({ q: search, page: 1 })}`);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [search, currentQ, pathname, router, buildQuery]);

  function goToPage(p: number) {
    router.push(`${pathname}?${buildQuery({ page: p })}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {["ALL", "ACTIVE", "EXPIRED", "TERMINATED"].map((s) => (
            <a
              key={s}
              href={`/admin/tenancies?filter=${s}`}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                currentFilter === s
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
              }`}
            >
              {s}
            </a>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant or property…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900 transition-colors bg-white text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tenant</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Duration</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Savings</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {tenancies.map((t) => {
                const savingsPct = t.savingsGoal > 0 ? Math.min(100, Math.round((t.currentSaved / t.savingsGoal) * 100)) : 0;
                return (
                  <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 max-w-[140px]">
                      <p className="text-xs font-bold text-zinc-900 truncate">{t.property.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{t.property.lga}</p>
                    </td>
                    <td className="px-5 py-3 max-w-[130px]">
                      <p className="text-xs font-semibold text-zinc-700 truncate">{t.tenant.fullName}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{t.tenant.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[t.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[10px] text-zinc-500 whitespace-nowrap">
                      <p>{new Date(t.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}</p>
                      <p>→ {new Date(t.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-20">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 mb-1">
                          <span>{formatNaira(t.currentSaved)}</span>
                          <span>{savingsPct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full">
                          <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${savingsPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${t.isJoint ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {t.isJoint ? `Joint (${t._count.coTenants + 1})` : "Solo"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/tenancies/${t.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                        title="View tenancy details"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {tenancies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">No tenancies found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Always-visible pagination */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-semibold">
            {totalTenancies} total · Page {currentPage} of {Math.max(totalPages, 1)}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-xs font-bold text-zinc-600 px-2">{currentPage} / {Math.max(totalPages, 1)}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
