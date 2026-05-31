"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/app/components/AuthCard";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus("success");
          setMessage("Your email has been verified. You can now log in.");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An unexpected error occurred.");
      });
  }, [token]);

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center py-4">
        {/* Icon */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-full mb-5 ${
          status === "loading" ? "bg-zinc-100" :
          status === "success" ? "bg-emerald-50" : "bg-red-50"
        }`}>
          {status === "loading" && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
          {status === "success" && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {status === "error" && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
        </div>

        <h2 className="text-xl font-extrabold text-zinc-900 mb-2">
          {status === "loading" ? "Verifying..." :
           status === "success" ? "Email verified!" : "Verification failed"}
        </h2>

        <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-xs">
          {message}
        </p>

        {status === "success" && (
          <Link
            href="/auth/login"
            className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
          >
            Log in to Hausevo
          </Link>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/auth/login"
              className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors text-center"
            >
              Go to Login
            </Link>
            <Link
              href="/auth/register"
              className="w-full rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors text-center"
            >
              Create new account
            </Link>
          </div>
        )}
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthCard>
        <div className="flex items-center justify-center py-12">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
      </AuthCard>
    }>
      <VerifyContent />
    </Suspense>
  );
}
