"use client";

import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Score = {
  score: number;
  onTimePayments: number;
  latePayments: number;
  disputesRaised: number;
  disputesLost: number;
  completedTenancies: number;
  lastCalculated: Date | null;
};

type Props = { score: Score };

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreLabel(s: number): { label: string; cls: string; desc: string } {
  if (s >= 750) return { label: "Excellent", cls: "text-emerald-600", desc: "Landlords will prioritise your applications." };
  if (s >= 650) return { label: "Good",      cls: "text-blue-600",    desc: "You're a reliable tenant in the eyes of landlords." };
  if (s >= 500) return { label: "Fair",      cls: "text-amber-600",   desc: "Pay rent on time and avoid disputes to improve." };
  return         { label: "Poor",      cls: "text-red-600",     desc: "Focus on on-time payments to rebuild your score." };
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, (score / 850) * 100);
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = score >= 750 ? "#10b981" : score >= 650 ? "#3b82f6" : score >= 500 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f4f4f5" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold text-zinc-900 leading-none">{score}</span>
        <span className="text-xs font-bold text-zinc-400 mt-1">/ 850</span>
      </div>
    </div>
  );
}

// ── Stat row ───────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  impact,
  positive,
}: {
  label: string;
  value: number;
  impact: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-zinc-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{impact}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-extrabold text-zinc-900">{value}</span>
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${positive ? "bg-emerald-100" : "bg-red-100"}`}>
          {positive ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function HausevoScoreClient({ score }: Props) {
  const { label, cls, desc } = scoreLabel(score.score);

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Never";

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
            Dashboard
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Hausevo Score</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Hausevo Score</h1>
      </div>

      {/* Score card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <ScoreRing score={score.score} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-2xl font-extrabold ${cls}`}>{label}</span>
            </div>
            <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{desc}</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Poor</span>
                <span className="text-zinc-400">Excellent</span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(score.score / 850) * 100}%`,
                    background: score.score >= 750 ? "#10b981" : score.score >= 650 ? "#3b82f6" : score.score >= 500 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>300</span>
                <span>850</span>
              </div>
            </div>
            {score.lastCalculated && (
              <p className="text-xs text-zinc-400 mt-3">
                Last updated {formatDate(score.lastCalculated)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Score Breakdown</p>
        <p className="text-xs text-zinc-500 mb-4">These factors determine your Hausevo Score.</p>

        <StatRow
          label="On-time payments"
          value={score.onTimePayments}
          impact="Each on-time payment boosts your score"
          positive
        />
        <StatRow
          label="Late payments"
          value={score.latePayments}
          impact="Late payments reduce your score significantly"
          positive={false}
        />
        <StatRow
          label="Completed tenancies"
          value={score.completedTenancies}
          impact="Completing a full tenancy adds a major boost"
          positive
        />
        <StatRow
          label="Disputes raised"
          value={score.disputesRaised}
          impact="Raising disputes has a minor negative impact"
          positive={false}
        />
        <StatRow
          label="Disputes lost"
          value={score.disputesLost}
          impact="Losing disputes reduces your score"
          positive={false}
        />
      </div>

      {/* How to improve */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">How to improve</p>
        <div className="flex flex-col gap-3">
          {[
            { tip: "Pay rent on time, every time", detail: "The single biggest factor in your score." },
            { tip: "Complete your tenancy", detail: "Finishing a full tenancy term adds a significant boost." },
            { tip: "Avoid unnecessary disputes", detail: "Only raise disputes when genuinely needed." },
            { tip: "Verify your identity", detail: "Tier 1 verification makes your profile more trustworthy." },
          ].map((item) => (
            <div key={item.tip} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{item.tip}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What it's used for */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">What landlords see</p>
        <p className="text-sm text-zinc-600 leading-relaxed">
          When you apply for a property, your Hausevo Score is shared with the landlord alongside your application. A higher score increases your chances of being accepted — especially for competitive listings.
        </p>
      </div>
    </div>
  );
}
