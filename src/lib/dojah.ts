/**
 * Dojah KYC service wrapper.
 * Docs: https://docs.dojah.io
 *
 * Set DOJAH_APP_ID and DOJAH_SECRET_KEY in your .env file.
 * Sandbox base URL: https://sandbox.dojah.io
 * Production base URL: https://api.dojah.io
 * 
 * Set DOJAH_USE_MOCK=true to use mock data instead of real API calls.
 */

import {
  mockLookupNIN,
  mockVerifyNINWithSelfie,
  mockLookupBVN,
} from "./dojah-mock";

const USE_MOCK = process.env.DOJAH_USE_MOCK === "true";

const BASE_URL = process.env.DOJAH_ENV === "production"
  ? "https://api.dojah.io"
  : "https://sandbox.dojah.io";

const APP_ID = process.env.DOJAH_APP_ID!;
const SECRET_KEY = process.env.DOJAH_SECRET_KEY!;

function headers() {
  return {
    "Content-Type": "application/json",
    "AppId": APP_ID,
    "Authorization": SECRET_KEY,
  };
}

// ─────────────────────────────────────────────
// NIN LOOKUP
// Returns full NIMC record for a given NIN.
// Cost: ~$0.06 per call on starter plan.
// ─────────────────────────────────────────────

export interface NINLookupResult {
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  photo?: string;           // base64 JPEG
  employment_status?: string;
  marital_status?: string;
}

export async function lookupNIN(nin: string): Promise<NINLookupResult> {
  // Use mock data if enabled
  if (USE_MOCK) {
    return mockLookupNIN(nin);
  }

  const res = await fetch(`${BASE_URL}/api/v1/kyc/nin?nin=${encodeURIComponent(nin)}`, {
    method: "GET",
    headers: headers(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "NIN lookup failed.");
  }

  return data.entity as NINLookupResult;
}

// ─────────────────────────────────────────────
// NIN + SELFIE VERIFICATION
// Matches a selfie image against the NIMC photo on file.
// Returns a confidence score and match boolean.
// ─────────────────────────────────────────────

export interface NINSelfieResult {
  nin: string;
  firstname: string;
  surname: string;
  middlename?: string;
  gender?: string;
  birthdate?: string;
  phone?: string;
  photo?: string;           // base64 JPEG from NIMC
  selfie_verification: {
    confidence_value: number; // 0–100
    match: boolean;
  };
}

export async function verifyNINWithSelfie(
  nin: string,
  selfieBase64: string        // strip "data:image/jpeg;base64," prefix before passing
): Promise<NINSelfieResult> {
  // Use mock data if enabled
  if (USE_MOCK) {
    return mockVerifyNINWithSelfie(nin, selfieBase64);
  }

  const res = await fetch(`${BASE_URL}/api/v1/kyc/selfie/nin`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ nin, selfie_image: selfieBase64 }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "NIN selfie verification failed.");
  }

  return data.entity as NINSelfieResult;
}

// ─────────────────────────────────────────────
// BVN LOOKUP
// Returns basic BVN record — useful for Hausevo Score financial signals.
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

export async function lookupBVN(bvn: string): Promise<BVNLookupResult> {
  // Use mock data if enabled
  if (USE_MOCK) {
    return mockLookupBVN(bvn);
  }

  const res = await fetch(`${BASE_URL}/api/v1/kyc/bvn?bvn=${encodeURIComponent(bvn)}`, {
    method: "GET",
    headers: headers(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "BVN lookup failed.");
  }

  return data.entity as BVNLookupResult;
}
