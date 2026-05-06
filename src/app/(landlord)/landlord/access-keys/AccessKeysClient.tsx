"use client";

import { useState } from "react";

type AccessKey = {
  id: string; key: string; expiresAt: Date; isUsed: boolean;
  redeemedBy: string | null; redeemedAt: Date | null; createdAt: Date;
  property: { id: string; title: string; status: string } | null;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function isExpired(d: Date) {
  return new Date(d) < new Date();
}

export default function AccessKeysClient({ keys: initial }: { keys: AccessKey[] }) {
  const [keys, setKeys] = useState(initial);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/access-keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate key.");
        return;
      }
      setKeys((prev) => [{ ...data.accessKey, property: null }, ...prev]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Landlord</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Access Keys</h1>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating…" : "+ Generate key"}
        </button>
      </div>

      {/* What are access keys */}
      <div className="rounded-2xl bg-zinc-900 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">What are access keys?</p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Generate a one-time key (e.g. <span className="font-mono font-bold text-white">LAG-A1B-2C3</span>) and give it to a trusted person — a family member, agent, or scout. They use it to submit a property listing on your behalf. You earn the listing, they earn a scout reward.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {keys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No access keys yet</p>
          <p className="text-xs text-zinc-400 mb-5">Generate a key and share it with someone you trust to submit a listing on your behalf.</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Generate your first key
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {keys.map((k) => {
            const expired = isExpired(k.expiresAt);
            const status = k.isUsed ? "used" : expired ? "expired" : "active";
            const statusCls = {
              used:    "bg-emerald-50 text-emerald-700",
              expired: "bg-zinc-100 text-zinc-500",
              active:  "bg-blue-50 text-blue-700",
            }[status];

            return (
              <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-bold font-mono text-zinc-900">{k.key}</code>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCls}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span>Created {formatDate(k.createdAt)}</span>
                    <span>Expires {formatDate(k.expiresAt)}</span>
                    {k.property && <span className="font-semibold text-zinc-600">{k.property.title}</span>}
                    {k.redeemedAt && <span>Redeemed {formatDate(k.redeemedAt)}</span>}
                  </div>
                </div>
                {status === "active" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(k.key, k.id)}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      copiedId === k.id
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {copiedId === k.id ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
