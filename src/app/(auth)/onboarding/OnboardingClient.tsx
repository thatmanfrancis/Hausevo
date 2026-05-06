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

const LANDLORD_NEXT_STEPS = [
  "Complete your profile with contact details",
  "List your first property with photos and pricing",
  "Get your property verified by our team",
  "Start receiving applications from verified tenants",
];

const ARTISAN_NEXT_STEPS = [
  "Complete your profile with your trade and skills",
  "Add your service area and availability",
  "Get your identity verified for a trusted badge",
  "Start receiving job requests from landlords and tenants",
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

  const totalSteps = role === "TENANT" ? 4 : 3;

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
          ...(role === "TENANT" && {
            lga: lga || undefined,
            maxBudget: budget || undefined,
            propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
          }),
        }),
      });
      if (role === "LANDLORD") router.push("/landlord/dashboard");
      else if (role === "ARTISAN") router.push("/artisan/dashboard");
      else router.push("/properties");
    } catch {
      setLoading(false);
    }
  }

  // ── Step 0: Role confirmation ────────────────────────────────────────────

  if (step === 0) {
    const roles = [
      {
        key: "TENANT",
        label: "Tenant",
        description: "I'm looking for a place to rent",
        Icon: TenantIcon,
      },
      {
        key: "LANDLORD",
        label: "Landlord",
        description: "I have properties to list and rent out",
        Icon: LandlordIcon,
      },
      {
        key: "ARTISAN",
        label: "Artisan",
        description: "I offer repair and maintenance services",
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
            Welcome to Shack, {userName}
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
            Here&apos;s how to get started on Shack
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
            Verify your identity
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Build trust with a verified badge
          </p>

          {/* Info card */}
          <div className="rounded-2xl border border-zinc-200 bg-[#f5f5f5] p-5 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Free NIN Verification
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-4">
              We use your National Identification Number (NIN) to verify your identity.
              This is completely free and takes less than a minute.
            </p>
            <ul className="flex flex-col gap-2">
              {[
                "Your data is encrypted and never shared",
                "Verification adds a trusted badge to your profile",
                "You can skip this and verify later from your dashboard",
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
              {loading ? "Setting up…" : "Finish setup →"}
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

  // ── Step 3: Tier selection (TENANT only) ─────────────────────────────────

  const tier0Features = [
    { label: "Browse all properties", included: true },
    { label: "Save favourites", included: true },
    { label: "Chat with landlords", included: true },
    { label: "Apply for properties", included: false },
  ];

  const tier1Features = [
    { label: "Everything in Tier 0", included: true },
    { label: "Apply for properties", included: true },
    { label: "Verified badge", included: true },
    { label: "ShackScore visible", included: true },
  ];

  const tierButtonLabel = selectedTier === 1
    ? "Continue to payment →"
    : "Start browsing for free →";

  return (
    <div className="w-full max-w-md">
      <StepDots total={totalSteps} current={3} />
      <div className="bg-white rounded-2xl border border-zinc-200 p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Step 4 of {totalSteps}
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
          You&apos;re almost set
        </h1>
        <p className="text-sm text-zinc-400 mb-8">
          Choose how you want to use Shack
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
            onClick={() => setStep(2)}
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
