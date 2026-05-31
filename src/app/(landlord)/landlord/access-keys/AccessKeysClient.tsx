"use client";

import { useState } from "react";

type AccessKey = {
  id: string; key: string; expiresAt: Date; isUsed: boolean;
  redeemedBy: string | null; redeemedAt: Date | null; createdAt: Date;
  receiptUrl: string | null; notes: string | null;
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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Portfolio Management</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Access Keys</h1>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-full bg-zinc-900 text-white px-6 py-3 text-sm font-bold hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 border border-zinc-900 disabled:opacity-50"
        >
          {generating ? "Securing Key…" : "+ Generate Key"}
        </button>
      </div>

      {/* Premium Explanation Box */}
      <div className="relative rounded-2xl bg-zinc-900 p-8 text-white overflow-hidden border border-zinc-800">
        <div className="absolute inset-0 shack-shimmer opacity-10" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            How it works
          </p>
          <h2 className="text-xl font-bold mb-3 tracking-tight">Delegated Listing Control</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Empower trusted family members or local scouts to list properties on your behalf without handing over account credentials. Every key used generates a digital handover receipt stored in your <span className="text-white font-bold underline underline-offset-4 decoration-emerald-500/50">Hausevo Vault</span> for full audit transparency.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-700 animate-pulse">{error}</div>
      )}

      {keys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-16 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">No active keys</h3>
          <p className="text-sm text-zinc-500 mb-8 max-w-xs">Start building your delegated management team by generating your first secure access key.</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-full bg-zinc-900 text-white px-8 py-4 text-sm font-bold hover:bg-zinc-800 transition-all border border-zinc-900"
          >
            Create First Key
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {keys.map((k) => {
            const expired = isExpired(k.expiresAt);
            const status = k.isUsed ? "used" : expired ? "expired" : "active";
            const statusCls = {
              used:    "bg-emerald-100 text-emerald-700",
              expired: "bg-zinc-100 text-zinc-500",
              active:  "bg-blue-50 text-blue-700",
            }[status];

            return (
              <div key={k.id} className="group flex items-center gap-6 px-6 py-6 hover:bg-zinc-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-base font-extrabold font-mono text-zinc-900 tracking-wider bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-200">
                      {k.key}
                    </code>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusCls}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {formatDate(k.createdAt)}
                    </div>
                    {!k.isUsed && (
                      <div className={`flex items-center gap-1.5 ${expired ? "text-red-400" : ""}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Expires {formatDate(k.expiresAt)}
                      </div>
                    )}
                    {k.property && (
                      <div className="flex items-center gap-1.5 text-zinc-900">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        {k.property.title}
                      </div>
                    )}
                  </div>
                </div>
                
                {status === "active" ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(k.key, k.id)}
                    className={`shrink-0 rounded-full border px-6 py-2.5 text-xs font-bold transition-all ${
                      copiedId === k.id
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                    }`}
                  >
                    {copiedId === k.id ? "Copied ✓" : "Copy Key"}
                  </button>
                ) : status === "used" && k.receiptUrl ? (
                  <button className="shrink-0 rounded-full bg-zinc-100 px-6 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-all border border-zinc-200">
                    View Receipt
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
