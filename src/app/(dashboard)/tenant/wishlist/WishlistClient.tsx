"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Wishlist = {
  lga: string | null;
  maxBudget: number | null;
  minBedrooms: number | null;
  isActive: boolean;
} | null;

type Props = { wishlist: Wishlist };

// ── Lagos LGAs ─────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa",
  "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
  "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
  "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere",
];

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WishlistClient({ wishlist }: Props) {
  const [lga, setLga] = useState(wishlist?.lga ?? "");
  const [maxBudget, setMaxBudget] = useState(wishlist?.maxBudget?.toString() ?? "");
  const [minBedrooms, setMinBedrooms] = useState(wishlist?.minBedrooms?.toString() ?? "");
  const [isActive, setIsActive] = useState(wishlist?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/user/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lga: lga || null,
          maxBudget: maxBudget ? Number(maxBudget) : null,
          minBedrooms: minBedrooms ? Number(minBedrooms) : null,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save. Please try again.");
        return;
      }

      setSuccess("Wishlist saved. You'll be notified when matching properties become available.");
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setSaving(true);
    try {
      await fetch("/api/user/wishlist", { method: "DELETE" });
      setIsActive(false);
      setSuccess("Wishlist deactivated. You won't receive match notifications.");
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Preferences
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Property Wishlist</h1>
      </div>

      {/* Info card */}
      <div className="rounded-2xl bg-zinc-900 p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold mb-0.5">Get notified about matching properties</p>
            <p className="text-xs text-zinc-400">
              Set your preferred location, budget, and bedroom count. When a property matching your criteria becomes available, you&apos;ll get a notification instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Criteria</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">
              {isActive ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isActive ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* LGA */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lga" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Preferred Area (LGA)
            </label>
            <select
              id="lga"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
            >
              <option value="">Any area</option>
              {LAGOS_LGAS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Max budget */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="maxBudget" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Max Budget (₦/year)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
              <input
                id="maxBudget"
                type="number"
                min="0"
                step="50000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="e.g. 1500000"
                className="w-full rounded-xl border border-zinc-200 bg-white pl-8 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
            {maxBudget && Number(maxBudget) > 0 && (
              <p className="text-xs text-zinc-400">{formatNaira(Number(maxBudget))} per year</p>
            )}
          </div>

          {/* Min bedrooms */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Minimum Bedrooms
            </label>
            <div className="flex gap-2">
              {["Any", "1", "2", "3", "4", "5+"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMinBedrooms(opt === "Any" ? "" : opt === "5+" ? "5" : opt)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                    (opt === "Any" && !minBedrooms) || (opt !== "Any" && (opt === "5+" ? minBedrooms === "5" : minBedrooms === opt))
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {success && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save wishlist"}
            </button>
            {wishlist && isActive && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={saving}
                className="text-sm font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Deactivate
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Browse CTA */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-zinc-900">Browse properties now</p>
          <p className="text-xs text-zinc-400 mt-0.5">Don&apos;t wait — explore what&apos;s available today</p>
        </div>
        <Link
          href="/properties"
          className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors whitespace-nowrap"
        >
          Browse →
        </Link>
      </div>
    </div>
  );
}
