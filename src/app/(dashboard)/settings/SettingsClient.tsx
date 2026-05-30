"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type NotificationPreferences = {
  rentReminders: boolean;
  applicationUpdates: boolean;
  matchingProperties: boolean;
  platformAnnouncements: boolean;
};

type Props = {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    twoFactorEnabled: boolean;
    roles: string[];
    onboardingCompleted: boolean;
  };
  notificationPreferences: NotificationPreferences;
};

// ── Toggle component ───────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
  loading,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-wait ${
        enabled ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SettingsClient({ user, notificationPreferences }: Props) {
  // Account settings
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Notification preferences
  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationPreferences);
  const [savingPref, setSavingPref] = useState<string | null>(null);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handlePhoneSave(e: React.FormEvent) {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneSuccess("");
    setPhoneError("");

    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPhoneError(data.error ?? "Failed to update phone number.");
      } else {
        setPhoneSuccess("Phone number updated.");
      }
    } catch {
      setPhoneError("Network error. Please try again.");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    // Optimistic update
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSavingPref(key);

    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        // Revert on failure
        setPrefs((prev) => ({ ...prev, [key]: !value }));
      }
    } catch {
      // Revert on network error
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSavingPref(null);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/user/me", { method: "DELETE" });

      if (res.status === 404 || res.status === 405) {
        setDeleteError(
          "Account deletion is not available via self-service. Please contact support at support@shack.ng."
        );
        setDeleting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Failed to delete account. Contact support.");
        setDeleting(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setDeleteError("Network error. Please try again or contact support.");
      setDeleting(false);
    }
  }

  const NOTIFICATION_ITEMS: {
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }[] = [
    {
      key: "rentReminders",
      label: "Rent reminders",
      description: "Get reminded before rent is due",
    },
    {
      key: "applicationUpdates",
      label: "Application updates",
      description: "Status changes on your applications",
    },
    {
      key: "matchingProperties",
      label: "New matching properties",
      description: "Properties that match your wishlist",
    },
    {
      key: "platformAnnouncements",
      label: "Platform announcements",
      description: "News and updates from Shack",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Account
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Settings</h1>
      </div>

      {/* 1. Account settings */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">
          Account
        </p>
        <div className="flex flex-col gap-5">
          {/* Email — read-only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 outline-none cursor-not-allowed"
            />
            <p className="text-xs text-zinc-400">
              Contact support to change your email address.
            </p>
          </div>

          {/* Phone — editable */}
          <form onSubmit={handlePhoneSave} className="flex flex-col gap-3">
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

            {phoneSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                {phoneSuccess}
              </div>
            )}
            {phoneError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {phoneError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={phoneSaving}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {phoneSaving ? "Saving…" : "Update phone"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Notifications */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Notifications
        </p>
        <div className="flex flex-col divide-y divide-zinc-100">
          {NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-bold text-zinc-900">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
              </div>
              <Toggle
                enabled={prefs[item.key]}
                onChange={(val) => handleToggle(item.key, val)}
                loading={savingPref === item.key}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Privacy */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Privacy
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/privacy"
            className="flex items-center justify-between text-sm font-bold text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            Privacy Policy
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
          <div className="h-px bg-zinc-100" />
          <Link
            href="/terms"
            className="flex items-center justify-between text-sm font-bold text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            Terms of Service
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 4. Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">
          Danger Zone
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-zinc-900 text-sm">Delete Account</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-full border border-red-200 text-red-600 px-5 py-2.5 text-sm font-bold hover:border-red-400 hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-md">
            <h2 className="text-lg font-extrabold text-zinc-900 mb-2">
              Delete your account?
            </h2>
            <p className="text-sm text-zinc-500 mb-5">
              This action is permanent and cannot be undone. All your data — applications, tenancy history, and wallet — will be removed.
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-red-400 transition-colors"
              />
            </div>

            {deleteError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                className="flex-1 rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="flex-1 rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
