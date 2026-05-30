"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
};

type Props = {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    roles: string[];
    verificationTier: number;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: Date;
    bankAccounts: BankAccount[];
  };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function primaryRole(roles: string[]) {
  if (roles.includes("ADMIN")) return "Admin";
  if (roles.includes("LANDLORD")) return "Landlord";
  if (roles.includes("ARTISAN")) return "Artisan";
  return "Tenant";
}

function maskAccount(accountNumber: string) {
  return "****" + accountNumber.slice(-4);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function VerificationBadge({ tier }: { tier: number }) {
  if (tier === 0)
    return (
      <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-500">
        Basic
      </span>
    );
  if (tier === 1)
    return (
      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
        Verified
      </span>
    );
  return (
    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
      Gold
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ProfileClient({ user }: Props) {
  const [fullName, setFullName] = useState(user.fullName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to save changes. Please try again.");
      } else {
        setSaveSuccess("Changes saved successfully.");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Account
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Profile</h1>
      </div>

      {/* 1. Profile header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xl font-extrabold">
            {initials(user.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-extrabold text-zinc-900">{user.fullName}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                {primaryRole(user.roles)}
              </span>
              <VerificationBadge tier={user.verificationTier} />
            </div>
          </div>
          <div className="shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Member since
            </p>
            <p className="text-sm font-bold text-zinc-700 mt-0.5">
              {new Date(user.createdAt).toLocaleDateString("en-NG", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Edit profile form */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">
          Edit Profile
        </p>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="phoneNumber"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {saveSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
              {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Verification status */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Verification
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <VerificationBadge tier={user.verificationTier} />
              <span className="text-sm font-bold text-zinc-900">
                Tier {user.verificationTier}
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              {user.verificationTier === 0
                ? "Verify your identity to unlock applications and higher trust."
                : user.verificationTier === 1
                ? "You can apply for properties and access standard features."
                : "Full access — all platform features unlocked."}
            </p>
          </div>
          {user.verificationTier === 0 ? (
            <Link
              href="/tenant/verification"
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors whitespace-nowrap"
            >
              Upgrade to Tier 1 (₦1,500)
            </Link>
          ) : (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-sm font-bold text-emerald-700 whitespace-nowrap">
              Fully verified ✓
            </span>
          )}
        </div>
      </div>

      {/* 4. Bank accounts */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Bank Accounts
          </p>
          <Link
            href="/wallet#bank-accounts"
            className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            Add bank account
          </Link>
        </div>
        {user.bankAccounts.length === 0 ? (
          <p className="text-sm text-zinc-500">No bank accounts linked yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {user.bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-bold text-zinc-900 text-sm">{account.bankName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {maskAccount(account.accountNumber)} · {account.accountName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {account.isDefault && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                      Default
                    </span>
                  )}
                  {account.isVerified && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Security */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Security
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-zinc-900 text-sm">
              Two-Factor Authentication
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {user.twoFactorEnabled
                ? "2FA is currently enabled on your account."
                : "Add an extra layer of security to your account."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user.twoFactorEnabled && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Enabled
              </span>
            )}
            <Link
              href="/security/2fa"
              className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
            >
              {user.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
