"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  AuthCard, AuthHeading, AuthInput, AuthButton, AuthError, AuthDivider,
} from "@/app/components/AuthCard";

type LoginStep = "credentials" | "twoFactor";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  
  // Credentials step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 2FA step — userId is stored from the credentials response
  const [userId, setUserId] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState(["", "", "", "", "", ""]);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First check credentials via our custom endpoint
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid email or password. Check your credentials and try again.");
        setLoading(false);
        return;
      }

      // If 2FA is required, move to 2FA step
      if (data.requires2FA) {
        setUserId(data.userId);
        setStep("twoFactor");
        setLoading(false);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      // No 2FA required — complete sign in via NextAuth
      const authRes = await signIn("credentials", { 
        redirect: false, 
        email, 
        password 
      });

      if (authRes?.error) {
        setError("Login failed. Please try again.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setTwoFactorError("");

    const code = twoFactorCode.join("");

    try {
      // Verify the 2FA code against userId (no session yet)
      const res = await fetch("/api/auth/2fa/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });

      if (!res.ok) {
        const data = await res.json();
        setTwoFactorError(data.error ?? "Invalid code. Please try again.");
        setVerifying(false);
        setTwoFactorCode(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      // 2FA verified — now complete the NextAuth sign in
      const authRes = await signIn("credentials", { 
        redirect: false, 
        email, 
        password 
      });

      if (authRes?.error) {
        setTwoFactorError("Login failed. Please try again.");
        setVerifying(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setTwoFactorError("Network error. Please try again.");
      setVerifying(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newCode = [...twoFactorCode];
    newCode[index] = digit;
    setTwoFactorCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    // Backspace on empty field moves to previous
    if (e.key === "Backspace" && !twoFactorCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    const newCode = [...twoFactorCode];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setTwoFactorCode(newCode);

    // Focus the next empty field or the last field
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  }

  // ── Credentials step ───────────────────────────────────────────────────

  if (step === "credentials") {
    return (
      <AuthCard>
        <AuthHeading
          title="Welcome back"
          subtitle="Log in to your Shack account"
        />

        <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
          <AuthError message={error} />

          <AuthInput
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50"
            />
          </div>

          <div className="mt-2">
            <AuthButton loading={loading} label="Log in" loadingLabel="Logging in..." />
          </div>
        </form>

        <AuthDivider />

        {/* Google OAuth — wired when Google credentials are set */}
        <button
          type="button"
          disabled={loading || googleLoading}
          onClick={() => {
            setGoogleLoading(true);
            signIn("google", { callbackUrl: "/dashboard" });
          }}
          className="w-full flex items-center justify-center gap-2.5 rounded-full border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?{" "}
          <Link href="/auth/register" className="font-bold text-zinc-900 hover:underline underline-offset-2">
            Create one
          </Link>
        </p>
      </AuthCard>
    );
  }

  // ── 2FA step ───────────────────────────────────────────────────────────

  return (
    <AuthCard>
      <AuthHeading
        title="Two-factor authentication"
        subtitle="Enter the 6-digit code from your authenticator app"
      />

      <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-5">
        {twoFactorError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {twoFactorError}
          </div>
        )}

        {/* 6-digit code input */}
        <div className="flex justify-center gap-2">
          {twoFactorCode.map((digit, index) => (
            <input
              key={index}
              ref={(el: any) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(index, e)}
              onPaste={index === 0 ? handleCodePaste : undefined}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              disabled={verifying}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <AuthButton 
            loading={verifying} 
            label="Verify & log in" 
            loadingLabel="Verifying..." 
          />
          
          <button
            type="button"
            disabled={verifying}
            onClick={() => {
              setStep("credentials");
              setTwoFactorCode(["", "", "", "", "", ""]);
              setTwoFactorError("");
            }}
            className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
          >
            ← Back to login
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
        <p className="text-xs text-zinc-500">
          <span className="font-bold text-zinc-700">Tip:</span> Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code shown for Shack.
        </p>
      </div>
    </AuthCard>
  );
}
