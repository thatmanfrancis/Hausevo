"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ActionModal from "../components/ActionModal";
import { updateTransactionStatus, grantFreePass, searchUsersForFreePass } from "../actions";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  description: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
};

type Props = {
  transactions: Transaction[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  successVolume: number;
  pendingVolume: number;
};

const TYPE_BADGES: Record<string, string> = {
  RENT: "bg-blue-50 text-blue-700 border border-blue-100",
  SERVICE: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  VERIFICATION: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  REFUND: "bg-amber-50 text-amber-700 border border-amber-100",
  DEPOSIT: "bg-purple-50 text-purple-700 border border-purple-100",
  MOVE: "bg-sky-50 text-sky-700 border border-sky-100",
  REWARD: "bg-amber-50 text-amber-700 border border-amber-100",
  REPAIR: "bg-orange-50 text-orange-700 border border-orange-100",
  COMMISSION: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  BOND_CONTRIBUTION: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  CAUTION_DEPOSIT: "bg-purple-50 text-purple-700 border border-purple-100",
  MORTGAGE_REPAYMENT: "bg-blue-50 text-blue-700 border border-blue-100",
  MANAGEMENT_FEE: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  MILESTONE_PAYMENT: "bg-teal-50 text-teal-700 border border-teal-100",
  LEASE_PAYMENT: "bg-blue-50 text-blue-700 border border-blue-100",
};

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  FAILED: "bg-red-50 text-red-700 border border-red-100",
  ESCROW: "bg-amber-50 text-amber-700 border border-amber-100",
  LOCKED: "bg-zinc-100 text-zinc-500 border border-zinc-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentsListClient({
  transactions,
  totalPages,
  currentPage,
  totalCount,
  successVolume,
  pendingVolume,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [type, setType] = useState(searchParams.get("type") || "");

  // Free Pass Modal State
  const [isFreePassOpen, setIsFreePassOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [freePassReason, setFreePassReason] = useState("");
  const [submittingFreePass, setSubmittingFreePass] = useState(false);

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

  // Autocomplete User Search for Free Pass
  useEffect(() => {
    if (userSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsersForFreePass(userSearchQuery);
        if (res.success && res.users) {
          setSearchResults(res.users);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [userSearchQuery]);

  const handleFilterChange = (key: string, value: string) => {
    router.push(`${pathname}?${createQueryString({ [key]: value, page: 1 })}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page })}`);
  };

  const handleGrantFreePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please search and select a user first.");
      return;
    }
    setSubmittingFreePass(true);
    try {
      const res = await grantFreePass(selectedUser.id, freePassReason);
      if (res.success) {
        toast.success(`Free pass granted to ${selectedUser.fullName}!`);
        setIsFreePassOpen(false);
        setSelectedUser(null);
        setUserSearchQuery("");
        setFreePassReason("");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to grant free pass.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmittingFreePass(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Payments & Transactions</h1>
          <p className="text-sm text-zinc-400 mt-1">Monitor payments, audit ledgers, and grant free passes.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFreePassOpen(true)}
            className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Grant Free Pass
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Transactions</p>
          <p className="text-2xl font-extrabold text-zinc-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Successful Volume</p>
          <p className="text-2xl font-extrabold text-emerald-600">{formatNaira(successVolume)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pending Volume</p>
          <p className="text-2xl font-extrabold text-amber-500">{formatNaira(pendingVolume)}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search reference, description, payer name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 transition-colors text-zinc-800 placeholder-zinc-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none text-zinc-700"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleFilterChange("status", e.target.value);
            }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="ESCROW">Escrow</option>
          </select>
          <select
            className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none text-zinc-700"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              handleFilterChange("type", e.target.value);
            }}
          >
            <option value="">All Types</option>
            <option value="RENT">Rent</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="VERIFICATION">Verification</option>
            <option value="MOVE">Move</option>
            <option value="REWARD">Reward</option>
            <option value="REPAIR">Repair</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Payer</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reference & Date</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900">{t.user.fullName}</span>
                      <span className="text-xs text-zinc-400 font-medium">{t.user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-extrabold text-zinc-900">
                      {formatNaira(t.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${TYPE_BADGES[t.type] || "bg-zinc-100 text-zinc-600 border border-zinc-200"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-semibold text-zinc-700">{t.reference}</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_BADGES[t.status] || "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View details eye icon */}
                      <Link
                        href={`/admin/payments/${t.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                        title="View payment details"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>

                      {/* Quick success action if PENDING */}
                      {t.status === "PENDING" && (
                        <>
                          <ActionModal
                            title="Approve Transaction"
                            description={`Mark reference ${t.reference} as successful? This will update wallets and dependencies.`}
                            triggerLabel="Approve"
                            triggerClass="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            action={() => updateTransactionStatus(t.id, "SUCCESS")}
                          />
                          <ActionModal
                            title="Fail Transaction"
                            description={`Mark reference ${t.reference} as failed?`}
                            triggerLabel="Fail"
                            triggerClass="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            action={() => updateTransactionStatus(t.id, "FAILED")}
                            destructive
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="py-20 text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <p className="mt-4 text-sm font-bold text-zinc-500">No payments found</p>
            <p className="text-xs text-zinc-400">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination — always visible even if limit has not been met */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500">
            {totalCount} total · Page {currentPage} of {Math.max(totalPages, 1)}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-xs font-bold text-zinc-600 px-2">{currentPage} / {Math.max(totalPages, 1)}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grant Free Pass Modal */}
      {isFreePassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900">Grant Free Pass</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Fully verify a user (Tier 2), mark verification bundle paid, and grant 1-year Premium Vault storage.
              </p>
            </div>

            <form onSubmit={handleGrantFreePassSubmit} className="flex flex-col gap-4">
              {/* User Search Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Search User</label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{selectedUser.fullName}</p>
                      <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs font-semibold text-red-500 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type name or email to search..."
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:border-zinc-400 transition-colors text-zinc-800 placeholder-zinc-400"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                    {searching && (
                      <span className="absolute right-3 top-3 flex h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-zinc-50 max-h-48 overflow-y-auto">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setSearchResults([]);
                              setUserSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors flex flex-col"
                          >
                            <span className="text-xs font-bold text-zinc-800">{u.fullName}</span>
                            <span className="text-[10px] text-zinc-400">{u.email} {u.verificationBundlePaid ? "(Voucher Paid)" : ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reason Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reason / Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complimentary verification voucher"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:border-zinc-400 transition-colors text-zinc-800 placeholder-zinc-400"
                  value={freePassReason}
                  onChange={(e) => setFreePassReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFreePassOpen(false);
                    setSelectedUser(null);
                    setUserSearchQuery("");
                    setFreePassReason("");
                  }}
                  disabled={submittingFreePass}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFreePass || !selectedUser || !freePassReason.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingFreePass ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    "Grant Pass"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
