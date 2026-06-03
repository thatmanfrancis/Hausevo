/**
 * Dojah KYC service wrapper.
 * Docs: https://docs.dojah.io
 *
 * ─── Environment variables ───────────────────────────────────────────────────
 * DOJAH_APP_ID        Your Dojah App ID
 * DOJAH_SECRET_KEY    Your Dojah secret key
 * DOJAH_ENV           "production" → https://api.dojah.io
 *                     anything else → https://sandbox.dojah.io
 * DOJAH_USE_MOCK      "true" → skip Dojah entirely, return fake passing data
 *                     Use this so non-developer testers can complete the flow
 *                     without a real Nigerian NIN.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Mock data (used when DOJAH_USE_MOCK=true) ─────────────────────────────

const MOCK_NIN_RESULTS: Record<string, NINLookupResult> = {
  // Well-known test NINs — name tokens will match any account with similar names
  "00000000000": { first_name: "Test", last_name: "User", middle_name: "Demo" },
  "11111111111": { first_name: "Jane", last_name: "Doe", middle_name: "Mock" },
  "22222222222": { first_name: "John", last_name: "Smith", middle_name: "Test" },
};

/** Generic mock result — returns first/last from the account name so name-match always passes */
function mockNINForName(fullName: string): NINLookupResult {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? "Test",
    last_name: parts[parts.length - 1] ?? "User",
    middle_name: parts.length >= 3 ? parts[1] : undefined,
    gender: "Male",
    date_of_birth: "1990-01-01",
  };
}

// ── Real Dojah config ─────────────────────────────────────────────────────
/*
 * To switch to live Dojah lookups:
 *   1. Set DOJAH_USE_MOCK=false (or remove it) in .env
 *   2. Set DOJAH_ENV=production for live data, or leave unset for sandbox
 *   3. Make sure DOJAH_APP_ID and DOJAH_SECRET_KEY are set
 */

const BASE_URL =
  process.env.DOJAH_ENV === "production"
    ? "https://api.dojah.io"
    : "https://sandbox.dojah.io";

const APP_ID = process.env.DOJAH_APP_ID!;
const SECRET_KEY = process.env.DOJAH_SECRET_KEY!;

function dojahHeaders() {
  return {
    "Content-Type": "application/json",
    AppId: APP_ID,
    Authorization: SECRET_KEY,
  };
}

/**
 * Normalise Dojah error responses — they vary across endpoints:
 *   { error: "message string" }
 *   { error: { message: "..." } }
 *   { message: "..." }
 *   { errors: [{ message: "..." }] }
 */
function extractDojahError(data: Record<string, unknown>, fallback: string): string {
  if (typeof data?.error === "string" && data.error.length) return data.error;
  if (data?.error && typeof (data.error as Record<string, unknown>).message === "string") {
    return (data.error as Record<string, unknown>).message as string;
  }
  if (typeof data?.message === "string" && data.message.length) return data.message;
  if (
    Array.isArray(data?.errors) &&
    typeof (data.errors as Record<string, unknown>[])[0]?.message === "string"
  ) {
    return (data.errors as Record<string, unknown>[])[0].message as string;
  }
  return fallback;
}

// ─────────────────────────────────────────────
// NIN LOOKUP
// ─────────────────────────────────────────────

export interface NINLookupResult {
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  photo?: string;
  employment_status?: string;
  marital_status?: string;
}

export async function lookupNIN(
  nin: string,
  /** Pass the user's full name so mock mode can mirror it for name-match to pass */
  accountFullName?: string
): Promise<NINLookupResult> {
  if (process.env.DOJAH_USE_MOCK === "true") {
    // Simulate a short delay so the UX feels real
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    // Return a predefined result if the NIN is a known test NIN
    if (MOCK_NIN_RESULTS[nin]) return MOCK_NIN_RESULTS[nin];
    // Otherwise mirror the account name so the name-check always passes
    return mockNINForName(accountFullName ?? "Test User");
  }

  // ── Real Dojah call ──────────────────────────────────────────────────────
  const res = await fetch(
    `${BASE_URL}/api/v1/kyc/nin?nin=${encodeURIComponent(nin)}`,
    { method: "GET", headers: dojahHeaders() }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(extractDojahError(data, "NIN lookup failed."));
  }

  return (data?.entity ?? data) as NINLookupResult;
}

// ─────────────────────────────────────────────
// NIN + SELFIE VERIFICATION
// ─────────────────────────────────────────────

export interface NINSelfieResult {
  nin: string;
  firstname: string;
  surname: string;
  middlename?: string;
  gender?: string;
  birthdate?: string;
  phone?: string;
  photo?: string;
  selfie_verification: {
    confidence_value: number;
    match: boolean;
  };
}

export async function verifyNINWithSelfie(
  nin: string,
  selfieBase64: string
): Promise<NINSelfieResult> {
  if (process.env.DOJAH_USE_MOCK === "true") {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
    return {
      nin,
      firstname: "Test",
      surname: "User",
      selfie_verification: { confidence_value: 92, match: true },
    };
  }

  // ── Real Dojah call ──────────────────────────────────────────────────────
  const res = await fetch(`${BASE_URL}/api/v1/kyc/selfie/nin`, {
    method: "POST",
    headers: dojahHeaders(),
    body: JSON.stringify({ nin, selfie_image: selfieBase64 }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(extractDojahError(data, "NIN selfie verification failed."));
  }

  return (data?.entity ?? data) as NINSelfieResult;
}

// ─────────────────────────────────────────────
// BVN LOOKUP
// ─────────────────────────────────────────────

export interface BVNLookupResult {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  gender?: string;
  enrollment_bank?: string;
  enrollment_branch?: string;
  level_of_account?: string;
  nin?: string;
}

export async function lookupBVN(bvn: string, accountFullName?: string): Promise<BVNLookupResult> {
  if (process.env.DOJAH_USE_MOCK === "true") {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    const parts = (accountFullName ?? "Test User").trim().split(/\s+/);
    return {
      first_name: parts[0] ?? "Test",
      last_name: parts[parts.length - 1] ?? "User",
      enrollment_bank: "Mock Bank",
      enrollment_branch: "Test Branch",
      level_of_account: "Level 3",
    };
  }

  // ── Real Dojah call ──────────────────────────────────────────────────────
  const res = await fetch(
    `${BASE_URL}/api/v1/kyc/bvn?bvn=${encodeURIComponent(bvn)}`,
    { method: "GET", headers: dojahHeaders() }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(extractDojahError(data, "BVN lookup failed."));
  }

  return (data?.entity ?? data) as BVNLookupResult;
}
