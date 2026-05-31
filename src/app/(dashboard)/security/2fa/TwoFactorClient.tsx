"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Props = {
  user: {
    id: string;
    email: string;
    fullName: string;
    twoFactorEnabled: boolean;
  };
};

type SetupStep = "idle" | "scanning" | "verifying" | "done";
type DisableStep = "idle" | "confirming";

// ── Main component ─────────────────────────────────────────────────────────

export default function TwoFactorClient({ user }: Props) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled);

  // Enable flow
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [setupCode, setSetupCode] = useState(["", "", "", "", "", ""]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const setupRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Disable flow
  const [disableStep, setDisableStep] = useState<DisableStep>("idle");
  const [disableCode, setDisableCode] = useState(["", "", "", "", "", ""]);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");
  const disableRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── OTP input helpers ────────────────────────────────────────────────────

  function makeCodeHandlers(
    code: string[],
    setCode: (c: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) {
    function handleChange(index: number, value: string) {
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...code];
      next[index] = digit;
      setCode(next);
      if (digit && index < 5) refs.current[index + 1]?.focus();
    }

    function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }

    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      const next = [...code];
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setCode(next);
      const nextEmpty = next.findIndex((d) => !d);
      refs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();
    }

    return { handleChange, handleKeyDown, handlePaste };
  }

  const setupHandlers = makeCodeHandlers(setupCode, setSetupCode, setupRefs);
  const disableHandlers = makeCodeHandlers(disableCode, setDisableCode, disableRefs);

  // ── Enable: Step 1 — generate QR ────────────────────────────────────────

  async function handleStartSetup() {
    setSetupLoading(true);
    setSetupError("");

    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setSetupError(data.error ?? "Failed to start 2FA setup. Please try again.");
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupStep("scanning");
    } catch {
      setSetupError("Network error. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  }

  // ── Enable: Step 2 — verify code ────────────────────────────────────────

  async function handleVerifySetup(e: React.FormEvent) {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError("");

    const code = setupCode.join("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSetupError(data.error ?? "Invalid code. Please try again.");
        setSetupCode(["", "", "", "", "", ""]);
        setupRefs.current[0]?.focus();
        return;
      }

      setTwoFactorEnabled(true);
      setSetupStep("done");
      setSetupCode(["", "", "", "", "", ""]);
    } catch {
      setSetupError("Network error. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  }

  // ── Disable: confirm with code ───────────────────────────────────────────

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setDisableLoading(true);
    setDisableError("");

    const code = disableCode.join("");

    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDisableError(data.error ?? "Invalid code. Please try again.");
        setDisableCode(["", "", "", "", "", ""]);
        disableRefs.current[0]?.focus();
        return;
      }

      setTwoFactorEnabled(false);
      setDisableStep("idle");
      setDisableCode(["", "", "", "", "", ""]);
      setSetupStep("idle");
      setQrCode("");
      setSecret("");
    } catch {
      setDisableError("Network error. Please try again.");
    } finally {
      setDisableLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/profile"
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Profile
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Security
          </p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">
          Two-Factor Authentication
        </h1>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                twoFactorEnabled
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-zinc-100 border border-zinc-200"
              }`}
            >
              {twoFactorEnabled ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-400"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-bold text-zinc-900 text-sm">
                Two-Factor Authentication
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {twoFactorEnabled
                  ? "Your account is protected with an authenticator app."
                  : "Add an extra layer of security using an authenticator app."}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {twoFactorEnabled ? (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                Enabled
              </span>
            ) : (
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-500">
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ENABLE FLOW ─────────────────────────────────────────────────── */}

      {!twoFactorEnabled && (
        <>
          {/* Step 0: intro / start */}
          {setupStep === "idle" && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                How it works
              </p>
              <ol className="flex flex-col gap-3 mb-6">
                {[
                  "Install an authenticator app like Google Authenticator or Authy on your phone.",
                  "Scan the QR code we generate with your app.",
                  "Enter the 6-digit code from the app to confirm setup.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-zinc-600">{step}</p>
                  </li>
                ))}
              </ol>

              {setupError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-4">
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
                  {setupError}
                </div>
              )}

              <button
                type="button"
                onClick={handleStartSetup}
                disabled={setupLoading}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setupLoading ? "Generating…" : "Set up 2FA"}
              </button>
            </div>
          )}

          {/* Step 1: scan QR */}
          {setupStep === "scanning" && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Step 1 of 2
              </p>
              <p className="font-bold text-zinc-900 text-sm mb-4">
                Scan this QR code with your authenticator app
              </p>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* QR code */}
                <div className="rounded-2xl border border-zinc-200 p-3 bg-white shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    width={180}
                    height={180}
                    className="block"
                  />
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  <p className="text-sm text-zinc-600">
                    Open your authenticator app and scan the QR code. If you
                    can&apos;t scan it, enter the key below manually.
                  </p>

                  {/* Manual entry key */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                      Manual entry key
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-mono text-zinc-700 break-all">
                        {showSecret ? secret : secret.replace(/./g, "•")}
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => !v)}
                        className="rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-bold text-zinc-600 hover:border-zinc-400 transition-colors shrink-0"
                      >
                        {showSecret ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(secret)}
                        className="rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-bold text-zinc-600 hover:border-zinc-400 transition-colors shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSetupStep("verifying")}
                    className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors self-start"
                  >
                    I&apos;ve scanned it →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: verify code */}
          {setupStep === "verifying" && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Step 2 of 2
              </p>
              <p className="font-bold text-zinc-900 text-sm mb-1">
                Enter the 6-digit code from your app
              </p>
              <p className="text-xs text-zinc-500 mb-5">
                Open your authenticator app and enter the code shown for Hausevo.
              </p>

              <form onSubmit={handleVerifySetup} className="flex flex-col gap-4">
                {/* 6-digit code input */}
                <div className="flex justify-center gap-2">
                  {setupCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { setupRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => setupHandlers.handleChange(index, e.target.value)}
                      onKeyDown={(e) => setupHandlers.handleKeyDown(index, e)}
                      onPaste={index === 0 ? setupHandlers.handlePaste : undefined}
                      autoFocus={index === 0}
                      disabled={setupLoading}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 outline-none focus:border-zinc-900 transition-colors disabled:opacity-50"
                    />
                  ))}
                </div>

                {setupError && (
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
                    {setupError}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={setupLoading || setupCode.some((d) => !d)}
                    className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {setupLoading ? "Verifying…" : "Verify & Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupStep("scanning")}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Done */}
          {setupStep === "done" && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-600"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-sm">
                    2FA is now enabled
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Your account is protected. You&apos;ll be asked for a code
                    each time you sign in.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DISABLE FLOW ────────────────────────────────────────────────── */}

      {twoFactorEnabled && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          {disableStep === "idle" && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                2FA is Active
              </p>
              <p className="text-sm text-zinc-600 mb-5">
                Two-factor authentication is currently protecting your account. To disable it, you&apos;ll
                need to confirm with a code from your authenticator app.
              </p>
              <button
                type="button"
                onClick={() => setDisableStep("confirming")}
                className="rounded-full border border-red-200 text-red-600 px-5 py-2.5 text-sm font-bold hover:bg-red-50 transition-colors"
              >
                Disable 2FA
              </button>
            </>
          )}

          {disableStep === "confirming" && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Confirm to disable
              </p>
              <p className="text-sm text-zinc-600 mb-5">
                Enter the current 6-digit code from your authenticator app to
                confirm you want to disable 2FA.
              </p>

              <form onSubmit={handleDisable} className="flex flex-col gap-4">
                {/* 6-digit code input */}
                <div className="flex justify-center gap-2">
                  {disableCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { disableRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => disableHandlers.handleChange(index, e.target.value)}
                      onKeyDown={(e) => disableHandlers.handleKeyDown(index, e)}
                      onPaste={index === 0 ? disableHandlers.handlePaste : undefined}
                      autoFocus={index === 0}
                      disabled={disableLoading}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 outline-none focus:border-zinc-900 transition-colors disabled:opacity-50"
                    />
                  ))}
                </div>

                {disableError && (
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
                    {disableError}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={disableLoading || disableCode.some((d) => !d)}
                    className="rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disableLoading ? "Disabling…" : "Confirm & Disable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisableStep("idle");
                      setDisableCode(["", "", "", "", "", ""]);
                      setDisableError("");
                    }}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Recommended apps
        </p>
        <div className="flex flex-wrap gap-3">
          {["Google Authenticator", "Authy", "Microsoft Authenticator"].map(
            (app) => (
              <span
                key={app}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600"
              >
                {app}
              </span>
            )
          )}
        </div>
      </div>

      {/* Back link */}
      <div>
        <Link
          href="/profile"
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Back to Profile
        </Link>
      </div>
    </div>
  );
}
