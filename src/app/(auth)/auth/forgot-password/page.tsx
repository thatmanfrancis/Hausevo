"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard, AuthHeading, AuthInput, AuthButton, AuthError, AuthSuccess } from "@/app/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess("If that email exists, a reset link is on its way. Check your inbox.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeading
        title="Reset your password"
        subtitle="Enter your email and we'll send you a reset link"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthError message={error} />
        <AuthSuccess message={success} />

        {!success && (
          <>
            <AuthInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
            <div className="mt-2">
              <AuthButton loading={loading} label="Send reset link" loadingLabel="Sending..." />
            </div>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Remember it?{" "}
        <Link href="/auth/login" className="font-bold text-zinc-900 hover:underline underline-offset-2">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
