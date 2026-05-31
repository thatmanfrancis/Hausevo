"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ActionModal from "../components/ActionModal";
import { verifyUser, flagUser } from "../actions";

type User = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
  isVerified: boolean;
  verificationTier: number;
  onboardingCompleted: boolean;
  createdAt: Date | string;
  _count: {
    ownedProperties: number;
    applications: number;
    notifications: number;
  };
};

type Props = {
  users: User[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  verifiedCount: number;
  unverifiedCount: number;
};

export default function UsersListClient({
  users,
  totalPages,
  currentPage,
  totalCount,
  verifiedCount,
  unverifiedCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">User Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage, verify, and monitor users on the platform.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-zinc-400" />
            <span className="text-zinc-600">{totalCount} Total</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-600">{verifiedCount} Verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-zinc-300" />
            <span className="text-zinc-600">{unverifiedCount} Unverified</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-zinc-800 placeholder-zinc-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none text-zinc-700"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              handleFilterChange("role", e.target.value);
            }}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="LANDLORD">Landlord</option>
            <option value="TENANT">Tenant</option>
            <option value="ARTISAN">Artisan</option>
          </select>
          <select
            className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none text-zinc-700"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleFilterChange("status", e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="onboarding">Onboarding</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">User</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Roles</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Properties</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900">{user.fullName}</span>
                      <span className="text-xs text-zinc-500 font-medium">{user.email}</span>
                      {user.phoneNumber && (
                        <span className="text-[10px] text-zinc-400 mt-0.5">{user.phoneNumber}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <span
                          key={r}
                          className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                            r === "ADMIN"
                              ? "bg-zinc-900 text-white"
                              : r === "LANDLORD"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : r === "ARTISAN"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                          user.isVerified
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {user.isVerified ? "Verified" : "Unverified"}
                      </span>
                      {!user.onboardingCompleted && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          Onboarding
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-700">
                    {user._count.ownedProperties}
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400 font-medium">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.isVerified ? (
                        <ActionModal
                          title="Verify User"
                          description={`Are you sure you want to manually verify ${user.fullName}? They will receive a Trusted Badge.`}
                          triggerLabel="Verify"
                          action={() => verifyUser(user.id)}
                        />
                      ) : (
                        <ActionModal
                          title="Revoke Verification"
                          description={`Are you sure you want to revoke ${user.fullName}'s verified status?`}
                          triggerLabel="Revoke"
                          triggerClass="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:border-red-600 hover:text-red-600 hover:bg-red-50/30 transition-colors"
                          action={() => flagUser(user.id)}
                          destructive
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="py-20 text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-sm font-bold text-zinc-500">No users matching your search</p>
            <p className="text-xs text-zinc-400">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination Container (Rendered Unconditionally) */}
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between shadow-sm">
          <p className="text-xs font-semibold text-zinc-500">
            Page {currentPage} of {Math.max(totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-zinc-600 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-zinc-600 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
