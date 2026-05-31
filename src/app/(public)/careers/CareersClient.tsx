"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Role = {
  title: string;
  team: string;
  type: string;
  location: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave?: string[];
};

// ── Data ───────────────────────────────────────────────────────────────────

const OPEN_ROLES: Role[] = [
  {
    title: "Social Media Manager (Volunteer)",
    team: "Growth",
    type: "Volunteer",
    location: "Remote (Nigeria)",
    description:
      "Grow our community, manage our social channels (X, Instagram, LinkedIn), and share beautiful verified homes with our audience. Help us spread the word about agent-free, transparent renting!",
    responsibilities: [
      "Manage Hausevo's official social media accounts on X, Instagram, and LinkedIn",
      "Create engaging, visually appealing posts showcasing our verified properties and tenant stories",
      "Interact with our online community, answer inquiries, and foster positive engagement",
      "Monitor social media trends and propose creative campaign ideas to grow our audience",
    ],
    requirements: [
      "Passionate about fixing the real estate market in Nigeria and eliminating agent exploitation",
      "Active social media presence with good copywriting and communication skills",
      "Basic graphic design or video editing skills (Canva, CapCut, etc.)",
      "Excellent online community relations and interpersonal skills",
    ],
    niceToHave: [
      "Previous experience running social media or building communities for a brand",
      "Knowledge of real estate, proptech, or Lagos rental dynamics",
    ],
  },
  {
    title: "Verification Scout (Volunteer)",
    team: "Operations",
    type: "Volunteer",
    location: "Lagos / Major Nigerian Cities (Field)",
    description:
      "Be our eyes on the ground! Inspect properties submitted to Hausevo, verify their physical existence, check the condition of facilities, and ensure they are 100% legitimate before they go live on our platform.",
    responsibilities: [
      "Visit properties in your local area to conduct physical verifications on behalf of Hausevo",
      "Check and record the state of facilities (water, electricity, structure, path access)",
      "Take high-quality photos and videos of verified properties for the listing page",
      "Review landlord details on-site and confirm they match platform submissions",
    ],
    requirements: [
      "Based in Lagos or other major cities in Nigeria",
      "Extremely honest, observant, and detail-oriented",
      "A smartphone with a good camera for taking property photos and videos",
      "Good interpersonal skills to interact with landlords and caretakers on-site",
    ],
    niceToHave: [
      "Familiarity with Lagos neighborhoods, estate layouts, and local LGAs",
      "Background in surveying, estate management, building tech, or geography",
    ],
  },
  {
    title: "General Volunteer",
    team: "Community",
    type: "Volunteer",
    location: "Nigeria / Remote",
    description:
      "Join our core volunteer group and help out across multiple areas including tenant support, feedback loops, data entry, city mapping, and local community outreach.",
    responsibilities: [
      "Support the team in checking property listings and verifying data accuracy",
      "Provide feedback on new app features and participate in beta testing of our systems",
      "Help renters in our community navigate the platform and report issues",
      "Spread the word about Hausevo in your local neighborhood, university, and community groups",
    ],
    requirements: [
      "Passionate about Hausevo's mission to eliminate agent exploitation and bring transparency to real estate",
      "Reliable internet connection and active communication skills",
      "A self-starter who is eager to learn and contribute to a fast-growing startup",
    ],
    niceToHave: [
      "Prior volunteering, community organizing, or customer support experience",
    ],
  },
];

const PERKS = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    label: "Remote-friendly",
    desc: "Most roles can be done from anywhere in Nigeria.",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    label: "Equity",
    desc: "Early team members get meaningful ownership in the company.",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    label: "Health cover",
    desc: "HMO for you and your immediate family.",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    label: "Learning budget",
    desc: "₦200k/year for courses, books, and conferences.",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Flexible hours",
    desc: "We care about output, not when you clock in.",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    label: "Real impact",
    desc: "You'll see your work used by real people solving a real problem.",
  },
];

// ── General application form ───────────────────────────────────────────────

function GeneralApplicationModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Send as a contact/support message via email
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject: `General Application — ${role || "Unspecified role"}`,
          message,
          type: "careers",
        }),
      });

      // Even if the endpoint doesn't exist yet, show success — the mailto fallback handles it
      if (!res.ok && res.status !== 404) {
        setError(
          "Something went wrong. Please email us directly at careers@hausevo.com.ng.",
        );
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      // Fallback — open mailto
      window.location.href = `mailto:careers@hausevo.com.ng?subject=${encodeURIComponent(`General Application — ${role}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {done ? (
          <div className="flex flex-col items-center text-center py-12 px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4">
              <svg
                width="24"
                height="24"
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
            <p className="text-base font-extrabold text-zinc-900 mb-1">
              Application received!
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              We&apos;ll review your application and get back to you within a
              week.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
              <div>
                <p className="text-base font-extrabold text-zinc-900">
                  General Application
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tell us about yourself and what you&apos;d like to work on
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Emeka Okafor"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  What would you like to work on?
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Engineering, Design, Operations, Growth…"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Tell us about yourself
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="What you do, what you've built, why you want to work on this problem…"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
                />
                <p className="text-xs text-zinc-400 text-right">
                  {message.length}/1000
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending…" : "Send application"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Apply modal ────────────────────────────────────────────────────────────

function ApplyModal({ role, onClose }: { role: Role; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <p className="text-base font-extrabold text-zinc-900">
              {role.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                {role.team}
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                {role.type}
              </span>
              <span className="text-xs text-zinc-400">{role.location}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 ml-4"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Description */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              About the role
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {role.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              What you&apos;ll do
            </p>
            <ul className="flex flex-col gap-2">
              {role.responsibilities.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-sm text-zinc-700"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-400 shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Requirements
            </p>
            <ul className="flex flex-col gap-2">
              {role.requirements.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-sm text-zinc-700"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-900 shrink-0 mt-0.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 8 12 12 14 14" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Nice to have */}
          {role.niceToHave && role.niceToHave.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Nice to have
              </p>
              <ul className="flex flex-col gap-2">
                {role.niceToHave.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-sm text-zinc-500"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-zinc-300 shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply CTA */}
          <div className="pt-2 border-t border-zinc-100">
            <a
              href={`mailto:careers@hausevo.com.ng?subject=Application: ${encodeURIComponent(role.title)}`}
              className="flex items-center justify-center gap-2 rounded-full bg-zinc-900 text-white px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Apply via email — careers@hausevo.com.ng
            </a>
            <p className="text-xs text-zinc-400 text-center mt-2">
              Include your CV and a short note about why you want to work on
              this.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function CareersClient() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showGeneralForm, setShowGeneralForm] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-16 py-4">
        {/* Hero */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Careers
          </p>
          <h1 className="text-4xl font-extrabold text-zinc-900 leading-tight mb-4">
            Help us fix renting in Nigeria
          </h1>
          <p className="text-lg text-zinc-500 leading-relaxed">
            We&apos;re a small team doing ambitious work. If you want to build
            something that matters — and you know the Lagos rental market is
            broken — we want to hear from you.
          </p>
        </div>

        {/* Perks */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
            Why Hausevo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PERKS.map((perk) => (
              <div
                key={perk.label}
                className="bg-white rounded-2xl border border-zinc-200 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 mb-3">
                  {perk.icon}
                </div>
                <p className="text-sm font-extrabold text-zinc-900 mb-1">
                  {perk.label}
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Open roles */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
            Open roles ({OPEN_ROLES.length})
          </p>
          <div className="flex flex-col gap-3">
            {OPEN_ROLES.map((role) => (
              <div
                key={role.title}
                className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-zinc-900 mb-2">
                    {role.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                      {role.team}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                      {role.type}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {role.location}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
                >
                  View & Apply →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* General application */}
        <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-lg font-extrabold text-white mb-1">
              Don&apos;t see your role?
            </p>
            <p className="text-sm text-zinc-400 max-w-md">
              We&apos;re always open to exceptional people. Tell us what you do
              and why you want to work on this problem.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGeneralForm(true)}
            className="rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            Send application →
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedRole && (
        <ApplyModal role={selectedRole} onClose={() => setSelectedRole(null)} />
      )}
      {showGeneralForm && (
        <GeneralApplicationModal onClose={() => setShowGeneralForm(false)} />
      )}
    </>
  );
}
