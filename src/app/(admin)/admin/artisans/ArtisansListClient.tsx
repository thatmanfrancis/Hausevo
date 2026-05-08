"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Artisan = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  artisanProfile: {
    id: string;
    category: string;
    isVetted: boolean;
    jobsCompleted: number;
    bondAccumulated: number;
    rating: number;
  } | null;
};

type Props = {
  artisans: Artisan[];
  totalPages: number;
  currentPage: number;
  categories: string[];
};

export default function ArtisansListClient({ artisans, totalPages, currentPage, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      
      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get("q") || "")) {
        router.push(`${pathname}?${createQueryString({ q: search, page: 1 })}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, pathname, router, createQueryString, searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    router.push(`${pathname}?${createQueryString({ [key]: value, page: 1 })}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page })}`);
  };

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  }

  const vettedCount = artisans.filter(a => a.artisanProfile?.isVetted).length;
  const pendingCount = artisans.filter(a => a.artisanProfile && !a.artisanProfile.isVetted).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Artisans</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and vet service professionals on the platform.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full border border-zinc-200">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-600">{vettedCount} Vetted</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full border border-zinc-200">
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-zinc-600">{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search artisans by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleFilterChange("category", e.target.value);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
          <select
            className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleFilterChange("status", e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="vetted">Vetted</option>
            <option value="pending">Pending</option>
            <option value="unprofiled">No Profile</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Artisan</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Jobs</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Earnings</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rating</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {artisans.map((artisan) => (
                <tr key={artisan.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900">{artisan.fullName}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{artisan.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {artisan.artisanProfile ? (
                      <span className="text-xs font-semibold text-zinc-600 px-2 py-1 bg-zinc-100 rounded-md">
                        {artisan.artisanProfile.category.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-400 italic">No Profile</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      artisan.artisanProfile?.isVetted 
                        ? "bg-emerald-50 text-emerald-700" 
                        : artisan.artisanProfile 
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}>
                      {artisan.artisanProfile?.isVetted ? "VETTED" : artisan.artisanProfile ? "PENDING" : "INCOMPLETE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-700">
                    {artisan.artisanProfile?.jobsCompleted ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900">
                    {formatNaira(artisan.artisanProfile?.bondAccumulated ?? 0)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-zinc-900">
                        {artisan.artisanProfile?.rating.toFixed(1) ?? "N/A"}
                      </span>
                      {artisan.artisanProfile && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/artisans/${artisan.artisanProfile?.id || "create?userId=" + artisan.id}`}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      {artisan.artisanProfile ? "Details →" : "Create Profile →"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {artisans.length === 0 && (
          <div className="py-20 text-center">
            <svg className="mx-auto h-12 w-12 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-4 text-sm font-bold text-zinc-500">No artisans matching your search</p>
            <p className="text-xs text-zinc-400">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold bg-white hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold bg-white hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
