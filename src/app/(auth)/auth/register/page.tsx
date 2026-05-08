"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthCard, AuthHeading, AuthInput, AuthButton, AuthError, AuthSuccess, AuthDivider,
} from "@/app/components/AuthCard";

const ROLES = [
  {
    value: "TENANT",
    label: "I want to rent or buy a house",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    value: "LANDLORD",
    label: "I want to list my house (Rent or Sale)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    value: "ARTISAN",
    label: "I want to offer services (Repairs, etc.)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState("TENANT");
  const [formData, setFormData] = useState({ fullName: "", email: "", phoneNumber: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, roles: [role] }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess("Account created! Check your email to verify before logging in.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Role selection ─────────────────────────────────────────────
  if (step === "role") {
    return (
      <AuthCard>
        <AuthHeading
          title="Join Shack"
          subtitle="How are you planning to use Shack?"
        />

        <div className="flex flex-col gap-3 mb-8">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                role === r.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              <span className={role === r.value ? "text-white" : "text-zinc-400"}>
                {r.icon}
              </span>
              <span className="text-sm font-bold">{r.label}</span>
              {role === r.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep("details")}
          className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
        >
          Continue →
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-zinc-900 hover:underline underline-offset-2">
            Log in
          </Link>
        </p>
      </AuthCard>
    );
  }

  // ── Step 2: Account details ────────────────────────────────────────────
  if (success) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Check your email</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            We've sent a verification link to <strong className="text-zinc-700">{formData.email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors text-center"
          >
            Go to Login
          </Link>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
              });
            }}
            className="mt-3 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Didn't receive it? Resend
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => setStep("role")}
        className="group mb-6 flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <AuthHeading
        title="Create your account"
        subtitle={`Signing up as a ${role.charAt(0) + role.slice(1).toLowerCase()}`}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthError message={error} />

        <AuthInput
          id="fullName"
          label="Full name"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Emeka Okafor"
          hint="Use your real name — it's matched against your NIN during verification."
        />
        <AuthInput
          id="email"
          label="Email address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />
        <AuthInput
          id="phoneNumber"
          label="Phone number"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="08012345678"
          hint="Nigerian number. Used for account recovery and notifications."
        />
        <AuthInput
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
        />

        <div className="mt-2">
          <AuthButton loading={loading} label="Create account" loadingLabel="Creating account..." />
        </div>

        <p className="text-xs text-zinc-400 text-center leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-zinc-700 underline underline-offset-2">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-zinc-700 underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-bold text-zinc-900 hover:underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
