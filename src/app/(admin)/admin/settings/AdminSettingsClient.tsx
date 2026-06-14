"use client";

import { useState } from "react";
import Link from "next/link";

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
  };
  notificationPreferences: NotificationPreferences;
};

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: (v: boolean) => void; loading: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} onClick={() => !loading && onChange(!enabled)} disabled={loading}
      className={`relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-wait ${enabled ? "bg-zinc-900" : "bg-zinc-200"}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function AdminSettingsClient({ user, notificationPreferences }: Props) {
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationPreferences);
  const [savingPref, setSavingPref] = useState<string | null>(null);

  async function handlePhoneSave(e: React.FormEvent) {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneMsg(null);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPhoneMsg({ type: "error", text: d.error ?? "Failed to update phone number." });
      } else {
        setPhoneMsg({ type: "success", text: "Phone number updated." });
      }
    } catch {
      setPhoneMsg({ type: "error", text: "Network error. Please try again." });
    } finally { setPhoneSaving(false); }
  }

  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSavingPref(key);
    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) setPrefs((p) => ({ ...p, [key]: !value }));
    } catch {
      setPrefs((p) => ({ ...p, [key]: !value }));
    } finally { setSavingPref(null); }
  }

  const NOTIFICATION_ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: "platformAnnouncements", label: "Platform announcements", description: "News and updates from Hausevo" },
    { key: "applicationUpdates", label: "Application updates", description: "Status changes on tenant applications" },
    { key: "rentReminders", label: "Rent reminders", description: "Reminders for upcoming rent due dates" },
    { key: "matchingProperties", label: "Matching properties", description: "Properties that match saved wishlists" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Admin</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Settings</h1>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Account</p>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Full Name</label>
            <input type="text" value={user.fullName} readOnly
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 outline-none cursor-not-allowed" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email Address</label>
            <input type="email" value={user.email} readOnly
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 outline-none cursor-not-allowed" />
            <p className="text-xs text-zinc-400">Contact support to change your email address.</p>
          </div>
          <form onSubmit={handlePhoneSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adminPhone" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Phone Number</label>
              <input id="adminPhone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            </div>
            {phoneMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm border ${phoneMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                {phoneMsg.text}
              </div>
            )}
            <div>
              <button type="submit" disabled={phoneSaving}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {phoneSaving ? "Saving…" : "Update phone"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Security</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-900">Two-Factor Authentication</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {user.twoFactorEnabled ? "2FA is currently enabled on your account." : "Add an extra layer of security to your account."}
            </p>
          </div>
          <Link
            href="/security/2fa"
            className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors shrink-0"
          >
            {user.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
          </Link>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Notifications</p>
        <div className="flex flex-col divide-y divide-zinc-100">
          {NOTIFICATION_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-bold text-zinc-900">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
              </div>
              <Toggle enabled={prefs[item.key]} onChange={(val) => handleToggle(item.key, val)} loading={savingPref === item.key} />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy links */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Privacy</p>
        <div className="flex flex-col gap-3">
          <Link href="/privacy" className="flex items-center justify-between text-sm font-bold text-zinc-700 hover:text-zinc-900 transition-colors">
            Privacy Policy
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <div className="h-px bg-zinc-100" />
          <Link href="/terms" className="flex items-center justify-between text-sm font-bold text-zinc-700 hover:text-zinc-900 transition-colors">
            Terms of Service
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
