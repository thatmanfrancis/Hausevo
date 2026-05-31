"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Constants ──────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Alimosho", "Ajeromi-Ifelodun", "Kosofe", "Mushin", "Oshodi-Isolo",
  "Ojo", "Ikorodu", "Surulere", "Agege", "Ifako-Ijaiye",
  "Somolu", "Amuwo-Odofin", "Lagos Island", "Eti-Osa", "Badagry",
  "Apapa", "Lagos Mainland", "Ikeja", "Ibeju-Lekki", "Epe",
];

const BUDGET_OPTIONS: { label: string; value: number }[] = [
  { label: "Under ₦500k/yr", value: 500_000 },
  { label: "₦500k–₦1M", value: 1_000_000 },
  { label: "₦1M–₦2M", value: 2_000_000 },
  { label: "₦2M–₦5M", value: 5_000_000 },
  { label: "₦5M–₦10M", value: 10_000_000 },
  { label: "Above ₦10M", value: 99_999_999 },
];

const PROPERTY_TYPES = [
  "Self Contain", "Mini Flat", "2 Bedroom Flat",
  "3 Bedroom Flat", "Bungalow", "Duplex", "Shortlet",
];

const EMPLOYMENT_STATUSES = [
  "Employed", "Self-Employed", "Business Owner", "Student", "Retired", "Other",
];

const INCOME_BRACKETS = [
  "Under ₦100k/mo",
  "₦100k–₦200k",
  "₦200k–₦500k",
  "₦500k–₦1M",
  "Above ₦1M",
];

const RELATIONSHIPS = ["Family", "Employer", "Colleague", "Friend", "Other"];

const LANDLORD_NEXT_STEPS = [
  "Complete your profile so people know who you are",
  "List your property with clear photos and price",
  "Get a 'Verified' badge to get 5x more views (Optional)",
  "Start getting messages from serious tenants",
];

const ARTISAN_NEXT_STEPS = [
  "Complete your profile with your trade and skills",
  "Add where you work and when you're available",
  "Get a 'Verified' badge so customers trust you more",
  "Start getting job requests from landlords and tenants",
];

// ── Props ──────────────────────────────────────────────────────────────────

interface OnboardingClientProps {
  userName: string;
  currentRole: string;
  currentLga: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function TenantIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke={active ? "white" : "currentColor"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LandlordIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke={active ? "white" : "currentColor"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ArtisanIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke={active ? "white" : "currentColor"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isCompleted = i < current;
        return (
          <div
            key={i}
            className={[
              "h-1.5 rounded-full transition-all duration-300",
              isActive ? "w-6 bg-zinc-900" : isCompleted ? "w-3 bg-zinc-400" : "w-3 bg-zinc-200",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OnboardingClient({
  userName,
  currentRole,
  currentLga,
}: OnboardingClientProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState(currentRole);
  const [lga, setLga] = useState(currentLga);
  const [budget, setBudget] = useState<number | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "VERIFYING" | "SUCCESS">("IDLE");
  const [vaultDocUrl, setVaultDocUrl] = useState("");

  // Step 2b: Employment
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [profession, setProfession] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  // Step 2c: Emergency contact
  const [ecFullName, setEcFullName] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [ecEmail, setEcEmail] = useState("");
  const [ecRelationship, setEcRelationship] = useState("");

  const totalSteps = role === "TENANT" ? 6 : 3;

  function togglePropertyType(type: string) {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function finish() {
    setLoading(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          vaultDocUrl: vaultDocUrl || undefined,
          ...(role === "TENANT" && {
            lga: lga || undefined,
            maxBudget: budget || undefined,
            propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
            // Employment profile
            employmentStatus: employmentStatus || undefined,
            profession: profession || undefined,
            employerName: employerName || undefined,
            monthlyIncome: monthlyIncome || undefined,
            // Emergency contact
            emergencyContact:
              ecFullName.trim() && ecPhone.trim()
                ? {
                    fullName: ecFullName.trim(),
                    phone: ecPhone.trim(),
                    email: ecEmail.trim() || undefined,
                    relationship: ecRelationship || "OTHER",
                  }
                : undefined,
          }),
        }),
      });
      
      // Step 1: Verifying
      setLoading(false);
      setStatus("VERIFYING");
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Step 2: Success
      setStatus("SUCCESS");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (role === "LANDLORD") router.push("/landlord/dashboard");
      else if (role === "ARTISAN") router.push("/artisan/dashboard");
      else router.push("/properties");
    } catch {
      setLoading(false);
      setStatus("IDLE");
    }
  }

  // ── Processing & Success views ──────────────────────────────────────────
  if (status !== "IDLE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
          {status === "VERIFYING" ? (
            <>
              <div className="h-20 w-20 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </>
          ) : (
            <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>

        <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-3">
          {status === "VERIFYING" ? "Verifying your details" : "Success! You're verified"}
        </h2>
        <p className="text-base text-zinc-400 max-w-sm leading-relaxed px-6">
          {status === "VERIFYING" 
            ? "We're setting up your secure vault and checking your identity documents. One moment..."
            : "Welcome to Hausevo! Your Trusted Badge is active. Redirecting you to your dashboard now."}
        </p>
      </div>
    );
  }

  // ── Step 0: Role confirmation ────────────────────────────────────────────

  if (step === 0) {
    const roles = [
      {
        key: "TENANT",
        label: "I want a house",
        description: "I'm here to find my next home to rent or buy",
        Icon: TenantIcon,
      },
      {
        key: "LANDLORD",
        label: "I'm a Landlord/Host",
        description: "I want to list my property and find verified tenants",
        Icon: LandlordIcon,
      },
      {
        key: "ARTISAN",
        label: "I'm a Professional",
        description: "I want to provide repair or maintenance services",
        Icon: ArtisanIcon,
      },
    ];

    return (
      <div className="w-full max-w-md">
        <StepDots total={totalSteps} current={0} />
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Step 1 of {totalSteps}
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
            Welcome to Hausevo, {userName}
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Confirm how you&apos;ll be using the platform
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {roles.map(({ key, label, description, Icon }) => {
              const active = role === key;
              return (
                <button
                  key={key}
                  onClick={() => setRole(key)}
                  className={[
                    "flex items-center gap-4 rounded-2xl border p-5 text-left transition-colors",
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400",
                  ].join(" ")}
                >
                  <Icon active={active} />
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${active ? "text-white" : "text-zinc-900"}`}>
                      {label}
                    </p>
                    <p className={`text-xs mt-0.5 ${active ? "text-zinc-300" : "text-zinc-400"}`}>
                      {description}
                    </p>
                  </div>
                  {active && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Location (TENANT) / What's next (LANDLORD/ARTISAN) ───────────

  if (step === 1) {
    if (role === "TENANT") {
      return (
        <div className="w-full max-w-md">
          <StepDots total={totalSteps} current={1} />
          <div className="bg-white rounded-2xl border border-zinc-200 p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Step 2 of {totalSteps}
            </p>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
              Where are you looking?
            </h1>
            <p className="text-sm text-zinc-400 mb-8">
              Help us show you the most relevant listings
            </p>

            {/* LGA dropdown */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Area / LGA
              </label>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              >
                <option value="">Select an LGA</option>
                {LAGOS_LGAS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Budget grid */}
            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Annual Budget
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUDGET_OPTIONS.map((opt) => {
                  const active = budget === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setBudget(active ? null : opt.value)}
                      className={[
                        "rounded-xl border px-4 py-3 text-xs font-semibold transition-colors text-left",
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
              >
                Continue →
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      );
    }

    // LANDLORD / ARTISAN — What happens next
    const nextSteps = role === "LANDLORD" ? LANDLORD_NEXT_STEPS : ARTISAN_NEXT_STEPS;

    return (
      <div className="w-full max-w-md">
        <StepDots total={totalSteps} current={1} />
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Step 2 of {totalSteps}
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
            What happens next
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Here&apos;s how to get started on Hausevo
          </p>

          <ol className="flex flex-col gap-4 mb-8">
            {nextSteps.map((text, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-700 pt-1">{text}</p>
              </li>
            ))}
          </ol>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Property types (TENANT) / Identity (LANDLORD/ARTISAN) ────────

  if (step === 2) {
    if (role === "TENANT") {
      return (
        <div className="w-full max-w-md">
          <StepDots total={totalSteps} current={2} />
          <div className="bg-white rounded-2xl border border-zinc-200 p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Step 3 of {totalSteps}
            </p>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
              What type of property?
            </h1>
            <p className="text-sm text-zinc-400 mb-8">
              Select all that interest you
            </p>

            <div className="grid grid-cols-2 gap-2 mb-8">
              {PROPERTY_TYPES.map((type) => {
                const active = propertyTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => togglePropertyType(type)}
                    className={[
                      "rounded-xl border px-4 py-3 text-xs font-semibold transition-colors text-left",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                    ].join(" ")}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
              >
                Continue →
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => setStep(3)}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      );
    }

    // LANDLORD / ARTISAN — Identity verification
    return (
      <div className="w-full max-w-md">
        <StepDots total={totalSteps} current={2} />
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Step 3 of {totalSteps}
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
            Unlock your Trusted Badge
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Stand out and build instant trust with others
          </p>

          {/* Info card */}
          <div className="rounded-2xl border border-zinc-200 bg-[#f5f5f5] p-5 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Why get verified?
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-4">
              In Nigeria, trust is everything. Users with a <strong>Trusted Badge</strong> get more responses and close deals 5x faster.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {[
                "Instant 'Trusted' badge on your profile",
                "Higher ranking in search results",
                "Tenants/Landlords will feel safe dealing with you",
                "One-time NIN/CAC verification",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 mt-0.5 text-zinc-400"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-zinc-200">
              {/* NIN Input */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                  National Identity Number (NIN)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="Enter your 11-digit NIN"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
                <p className="text-[10px] text-zinc-400 mt-1.5">
                  We use this only for one-time verification. Secure & encrypted.
                </p>
              </div>

              {/* Document Upload */}
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                Upload Proof (NIN Slip or CAC Certificate)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setVaultDocUrl("https://example.com/mock-id.png"); // Mock upload
                  }}
                />
                <div className="w-full rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto text-zinc-400 mb-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    {vaultDocUrl ? "Document Selected ✅" : "Select Document"}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-medium">
                    PDF, JPG, or PNG (Max 5MB)
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-3 italic text-center leading-relaxed">
                This document will be saved in your <strong>Hausevo Vault</strong> so you never have to upload it again.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={finish}
              disabled={loading}
              className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up…" : "Verify & Finish"}
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={finish}
              disabled={loading}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Employment & Profession (TENANT only) ─────────────────────

  if (step === 3 && role === "TENANT") {
    return (
      <div className="w-full max-w-md">
        <StepDots total={totalSteps} current={3} />
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Step 4 of {totalSteps}
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
            Tell us about your work
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Landlords need to know you can afford the rent. This stays private until you apply.
          </p>

          {/* Employment status */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Employment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EMPLOYMENT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setEmploymentStatus(employmentStatus === s ? "" : s)}
                  className={[
                    "rounded-xl border px-4 py-3 text-xs font-semibold transition-colors text-left",
                    employmentStatus === s
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Profession */}
          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Job Title / Profession
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Software Engineer, Trader, Teacher"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {/* Employer name */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Employer / Business Name
            </label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder="e.g. Access Bank, Self-Employed"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {/* Monthly income bracket */}
          <div className="mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Monthly Income Bracket
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INCOME_BRACKETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setMonthlyIncome(monthlyIncome === b ? "" : b)}
                  className={[
                    "rounded-xl border px-4 py-3 text-xs font-semibold transition-colors text-left",
                    monthlyIncome === b
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                  ].join(" ")}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              Continue →
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={() => setStep(4)}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Emergency Contact (TENANT only) ──────────────────────────

  if (step === 4 && role === "TENANT") {
    return (
      <div className="w-full max-w-md">
        <StepDots total={totalSteps} current={4} />
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Step 5 of {totalSteps}
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
            Add an emergency contact
          </h1>
          <p className="text-sm text-zinc-400 mb-2">
            Someone landlords can always reach — like a family member or employer.
          </p>
          <div className="bg-zinc-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-zinc-500 leading-relaxed">
              This helps landlords feel confident renting to you. It’s one of the key
              things that replaces the need for a physical agent.
            </p>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Full Name
              </label>
              <input
                type="text"
                value={ecFullName}
                onChange={(e) => setEcFullName(e.target.value)}
                placeholder="e.g. Ngozi Adeyemi"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Phone Number
              </label>
              <input
                type="tel"
                value={ecPhone}
                onChange={(e) => setEcPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Email Address
              </label>
              <input
                type="email"
                value={ecEmail}
                onChange={(e) => setEcEmail(e.target.value)}
                placeholder="e.g. ngozi@gmail.com"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Relationship
              </label>
              <select
                value={ecRelationship}
                onChange={(e) => setEcRelationship(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              >
                <option value="">Select relationship…</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              Continue →
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={() => setStep(5)}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: Tier selection (TENANT only) ────────────────────────────

  const tier0Features = [
    { label: "Browse all properties", included: true },
    { label: "Save your favorites", included: true },
    { label: "Chat with landlords", included: true },
    { label: "Apply for houses", included: false },
  ];

  const tier1Features = [
    { label: "All Free features", included: true },
    { label: "Apply for houses", included: true },
    { label: "Trusted Badge on profile", included: true },
    { label: "Show your Hausevo Score", included: true },
  ];

  const tierButtonLabel = selectedTier === 1
    ? "Continue to payment →"
    : "Start browsing for free →";

  return (
    <div className="w-full max-w-md">
      <StepDots total={totalSteps} current={5} />
      <div className="bg-white rounded-2xl border border-zinc-200 p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Step 6 of {totalSteps}
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
          You&apos;re almost set
        </h1>
        <p className="text-sm text-zinc-400 mb-8">
          Choose how you want to use Hausevo
        </p>

        {/* Tier selection — clickable cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Tier 0 */}
          <button
            type="button"
            onClick={() => setSelectedTier(0)}
            className={`rounded-2xl p-5 text-left transition-all ${
              selectedTier === 0
                ? "bg-zinc-900 ring-2 ring-zinc-900 ring-offset-2"
                : "bg-zinc-800 opacity-70 hover:opacity-90"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tier 0</p>
              {selectedTier === 0 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <p className="text-lg font-extrabold text-white mb-4">Free</p>
            <ul className="flex flex-col gap-2.5">
              {tier0Features.map(({ label, included }) => (
                <li key={label} className="flex items-center gap-2">
                  {included ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                  <span className={`text-xs ${included ? "text-zinc-300" : "text-zinc-600"}`}>{label}</span>
                </li>
              ))}
            </ul>
          </button>

          {/* Tier 1 */}
          <button
            type="button"
            onClick={() => setSelectedTier(1)}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              selectedTier === 1
                ? "border-zinc-900 bg-white ring-2 ring-zinc-900 ring-offset-2"
                : "border-zinc-200 bg-white hover:border-zinc-400"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tier 1</p>
              {selectedTier === 1 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <p className="text-lg font-extrabold text-zinc-900 mb-4">₦1,500</p>
            <ul className="flex flex-col gap-2.5">
              {tier1Features.map(({ label }) => (
                <li key={label} className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-xs text-zinc-700">{label}</span>
                </li>
              ))}
            </ul>
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setStep(4)}
            className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={finish}
            disabled={loading}
            className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up…" : tierButtonLabel}
          </button>
        </div>
        <div className="text-center">
          <button
            onClick={finish}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
