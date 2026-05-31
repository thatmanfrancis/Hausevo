"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type ReferralCode = {
  id: string;
  code: string;
  usedCount: number;
  createdAt: Date;
} | null;

type Referral = {
  id: string;
  rewardPaid: boolean;
  createdAt: Date;
  referee: { id: string; fullName: string; createdAt: Date };
};

type ScoutReward = {
  id: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  property: { id: string; title: string; lga: string; status: string };
  accessKey: { key: string };
};

type Props = {
  referralCode: ReferralCode;
  referrals: Referral[];
  scoutRewards: ScoutReward[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const REWARD_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700" },
  SUCCESS:   { label: "Paid",      cls: "bg-emerald-50 text-emerald-700" },
  COMPLETED: { label: "Paid",      cls: "bg-emerald-50 text-emerald-700" },
  FAILED:    { label: "Failed",    cls: "bg-red-50 text-red-700" },
  ESCROW:    { label: "In Escrow", cls: "bg-blue-50 text-blue-700" },
};

// ── Main component ─────────────────────────────────────────────────────────

export default function ReferralsClient({ referralCode: initialCode, referrals, scoutRewards }: Props) {
  const [code, setCode] = useState(initialCode);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"referrals" | "scout">("referrals");

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/referrals", { method: "POST" });
      const data = await res.json();
      if (res.ok) setCode(data.referralCode);
    } catch {
      // Silent fail
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalScoutEarnings = scoutRewards
    .filter((r) => r.status === "SUCCESS" || r.status === "COMPLETED")
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingScoutEarnings = scoutRewards
    .filter((r) => r.status === "PENDING" || r.status === "ESCROW")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Earn</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Referrals & Scout Rewards</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Referrals</p>
          <p className="text-2xl font-extrabold text-zinc-900">{referrals.length}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">people referred</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Scout Earned</p>
          <p className="text-2xl font-extrabold text-zinc-900">{formatNaira(totalScoutEarnings)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">from listings</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Pending</p>
          <p className="text-2xl font-extrabold text-zinc-900">{formatNaira(pendingScoutEarnings)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">awaiting verification</p>
        </div>
      </div>

      {/* Referral code card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Your Referral Code</p>

        {code ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-5 py-4 text-center">
                <p className="text-2xl font-extrabold text-zinc-900 tracking-widest font-mono">
                  {code.code}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`rounded-xl border px-4 py-4 text-sm font-bold transition-colors ${
                  copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Used {code.usedCount} time{code.usedCount !== 1 ? "s" : ""}</span>
              <span>Generated {formatDate(code.createdAt)}</span>
            </div>
            <p className="text-xs text-zinc-500">
              Share this code with friends. When they sign up using it, you both benefit.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <p className="text-sm text-zinc-500 mb-4">
              Generate your unique referral code and start earning when friends join Hausevo.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate my code"}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {(["referrals", "scout"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
              tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t === "referrals" ? `Referrals (${referrals.length})` : `Scout Rewards (${scoutRewards.length})`}
          </button>
        ))}
      </div>

      {/* Referrals list */}
      {tab === "referrals" && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-900 mb-1">No referrals yet</p>
              <p className="text-xs text-zinc-400">Share your code to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                      {r.referee.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{r.referee.fullName}</p>
                      <p className="text-xs text-zinc-400">Joined {formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    r.rewardPaid ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {r.rewardPaid ? "Reward paid" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scout rewards list */}
      {tab === "scout" && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {scoutRewards.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-900 mb-1">No scout rewards yet</p>
              <p className="text-xs text-zinc-400 mb-4">Submit a property listing using an access key to earn rewards</p>
              <Link
                href="/scout"
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
              >
                Submit a listing →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {scoutRewards.map((r) => {
                const s = REWARD_STATUS[r.status] ?? { label: r.status, cls: "bg-zinc-100 text-zinc-600" };
                return (
                  <div key={r.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <Link
                          href={`/properties/${r.property.id}`}
                          className="text-sm font-bold text-zinc-900 hover:underline underline-offset-2 truncate"
                        >
                          {r.property.title}
                        </Link>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-1">{r.property.lga} · Key: {r.accessKey.key}</p>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span>Submitted {formatDate(r.createdAt)}</span>
                        {r.amount > 0 && (
                          <span className="font-bold text-zinc-700">{formatNaira(r.amount)}</span>
                        )}
                        {r.paidAt && <span>Paid {formatDate(r.paidAt)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
