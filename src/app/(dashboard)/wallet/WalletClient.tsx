"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  description: string | null;
  metadata: unknown;
  createdAt: Date;
};

type Props = {
  user: {
    walletBalance: number;
    verificationBundlePaid: boolean;
  };
  transactions: Transaction[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Type badge styles ──────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  RENT: "bg-blue-50 text-blue-700",
  SERVICE: "bg-zinc-100 text-zinc-600",
  VERIFICATION: "bg-emerald-50 text-emerald-700",
  REFUND: "bg-amber-50 text-amber-700",
  DEPOSIT: "bg-purple-50 text-purple-700",
  MOVE: "bg-sky-50 text-sky-700",
  REWARD: "bg-amber-50 text-amber-700",
  REPAIR: "bg-orange-50 text-orange-700",
  COMMISSION: "bg-zinc-100 text-zinc-600",
  BOND_CONTRIBUTION: "bg-indigo-50 text-indigo-700",
  CAUTION_DEPOSIT: "bg-purple-50 text-purple-700",
  MORTGAGE_REPAYMENT: "bg-blue-50 text-blue-700",
  MANAGEMENT_FEE: "bg-zinc-100 text-zinc-600",
  MILESTONE_PAYMENT: "bg-teal-50 text-teal-700",
  LEASE_PAYMENT: "bg-blue-50 text-blue-700",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  ESCROW: "bg-amber-50 text-amber-700",
  LOCKED: "bg-zinc-100 text-zinc-500",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_STYLES[type] ?? "bg-zinc-100 text-zinc-600";
  const label = type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600";
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WalletClient({ user, transactions }: Props) {
  const [balance, setBalance] = useState(user.walletBalance);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState("");

  async function handleTopUp() {
    setTopUpLoading(true);
    setTopUpMsg("");
    try {
      const res = await fetch("/api/dev/topup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.newBalance);
        setTopUpMsg(`₦5,000 added! New balance: ${formatNaira(data.newBalance)}`);
      } else {
        setTopUpMsg(data.error ?? "Top-up failed.");
      }
    } catch {
      setTopUpMsg("Network error.");
    } finally {
      setTopUpLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Finance
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Wallet</h1>
      </div>

      {/* 1. Balance card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Available Balance
        </p>
        <p className="text-4xl font-extrabold text-zinc-900 mb-5">
          {formatNaira(balance)}
        </p>
        <button
          type="button"
          onClick={handleTopUp}
          disabled={topUpLoading}
          className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {topUpLoading ? "Adding…" : "Top up ₦5,000 (dev)"}
        </button>
        {topUpMsg && (
          <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${
            topUpMsg.includes("added") ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-700"
          }`}>
            {topUpMsg}
          </div>
        )}
      </div>

      {/* 3. Quick actions */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {!user.verificationBundlePaid && (
            <Link
              href="/tenant/verification"
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Upgrade to Tier 1
            </Link>
          )}
          <Link
            href="/properties"
            className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            View properties
          </Link>
        </div>
      </div>

      {/* 2. Transaction history */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Transaction History
        </p>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {transactions.map((tx) => {
              const isCredit = tx.type === "REFUND" || tx.type === "REWARD";
              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <TypeBadge type={tx.type} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">
                        {tx.description ?? tx.reference}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isCredit ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatNaira(Math.abs(tx.amount))}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
