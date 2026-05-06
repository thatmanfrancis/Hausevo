"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthHeading, AuthInput, AuthButton, AuthError, AuthSuccess } from "@/app/components/AuthCard";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError("Invalid or missing reset token."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess("Password updated! Redirecting to login...");
        setTimeout(() => router.push("/auth/login"), 2000);
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
        title="Set new password"
        subtitle="Choose a strong password for your account"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthError message={error} />
        <AuthSuccess message={success} />

        {!success && (
          <>
            <AuthInput
              id="password"
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              hint="Use a mix of letters, numbers, and symbols."
            />
            <AuthInput
              id="confirm"
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
            <div className="mt-2">
              <AuthButton loading={loading} label="Update password" loadingLabel="Updating..." />
            </div>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        <Link href="/auth/login" className="font-bold text-zinc-900 hover:underline underline-offset-2">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-400">Loading...</div>}>
      <ResetContent />
    </Suspense>
  );
}
