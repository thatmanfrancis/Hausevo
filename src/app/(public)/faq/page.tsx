"use client";

import { useState } from "react";
import BackButton from "@/app/components/BackButton";
import Link from "next/link";

// ── Data ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is Hausevo?",
        a: "Hausevo is a Nigerian property platform that connects verified landlords directly with tenants — no agents, no markups. Every listing is submitted by the property owner and verified by our team.",
      },
      {
        q: "Is Hausevo free to use?",
        a: "Browsing and saving properties is completely free. To apply for a property, you need to complete identity verification — this is done with your NIN and is free. No fees, no BVN, no selfie required.",
      },
      {
        q: "Which cities does Hausevo cover?",
        a: "We launched in Lagos and are expanding to Abuja, Port Harcourt, Ibadan, and other major Nigerian cities. If you're a landlord outside Lagos, you can still list — we'll verify and activate your listing as we expand.",
      },
    ],
  },
  {
    category: "Verification",
    items: [
      {
        q: "Why do I need to verify my identity?",
        a: "Verification protects both tenants and landlords. It confirms that the person applying for a property is who they say they are, and it builds your Hausevo Score — a trust signal that landlords use when reviewing applications.",
      },
      {
        q: "How does verification work?",
        a: "Just enter your 11-digit National Identification Number (NIN). We verify it against NIMC records via Dojah, a licensed KYC provider. If the name on your NIN matches your account name, you're verified instantly. No selfie, no BVN, no fees.",
      },
      {
        q: "Is my NIN data safe?",
        a: "Yes. We never store your full NIN — only a masked reference (e.g. 1234*******). Verification is processed by Dojah, a licensed KYC provider. Your NIN is used only for the one-time identity check.",
      },
      {
        q: "My NIN name doesn't match my account name. What do I do?",
        a: "Make sure your account name matches your NIN exactly — including spelling and order of names. You can update your profile name in Settings. If the issue persists, contact our support team.",
      },
    ],
  },
  {
    category: "For Tenants",
    items: [
      {
        q: "How do I apply for a property?",
        a: "Complete identity verification (free, just your NIN), then click 'Apply Now' on any listing. Your Hausevo Score and verified profile are shared with the landlord. You'll be notified when they respond.",
      },
      {
        q: "What is Hausevo Score?",
        a: "Hausevo Score is Nigeria's first rental credit score. It's built from your payment history, clean tenancy exits, and dispute record on the platform. A higher score improves your chances with landlords.",
      },
      {
        q: "Can I join a waitlist for a rented property?",
        a: "Yes. If a property is currently rented, you can join the waitlist. When it becomes available again, waitlisted tenants are notified in order of position.",
      },
      {
        q: "What is the Vault?",
        a: "The Vault is your personal document storage on Hausevo. Store your tenancy agreements, receipts, inspection reports, and identity documents securely. Verified documents strengthen your profile.",
      },
    ],
  },
  {
    category: "For Landlords",
    items: [
      {
        q: "How do I list my property?",
        a: "Create a landlord account, complete verification, then click 'Add Listing'. Upload photos, set your price, and submit. Our team will verify the deed and price before the listing goes live.",
      },
      {
        q: "What is the Scout Programme?",
        a: "If you're not on the platform yet, you can give a trusted person an Access Key. They submit the listing on your behalf and earn a ₦2,000–₦3,000 reward once it's verified. No agent fees, no percentage cuts.",
      },
      {
        q: "How does Hausevo prevent agent markup?",
        a: "Every listing price is verified against the landlord's stated price. We contact landlords directly to confirm. Listings with inflated prices are flagged and removed.",
      },
      {
        q: "Can I delegate property management?",
        a: "Yes. You can assign a caretaker or property manager to handle tenant communications, maintenance requests, and artisan coordination — with granular permission controls.",
      },
    ],
  },
  {
    category: "Payments",
    items: [
      {
        q: "How does the wallet work?",
        a: "Your Hausevo wallet holds funds for platform services (boosts, etc.). Top up via Paystack using card, bank transfer, or USSD. Rent payments are made directly between tenant and landlord — Hausevo does not hold rent unless an escrow arrangement is agreed.",
      },
      {
        q: "Are there any verification fees?",
        a: "No. Identity verification is completely free — just your NIN. There are no KYC charges passed on to users.",
      },
    ],
  },
];

// ── Accordion item ─────────────────────────────────────────────────────────

function AccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-colors hover:border-zinc-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-zinc-900">{q}</span>

        {/* +/- box with hover expand transition */}
        <span
          className={`
            shrink-0 flex items-center justify-center
            border rounded-lg leading-none select-none
            transition-all duration-200 ease-in-out
            w-7 h-7 hover:w-9 hover:h-9
            ${
              open
                ? "bg-zinc-900 border-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
            }
          `}
        >
          {open ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 border-t border-zinc-100">
            <p className="text-sm text-zinc-500 leading-relaxed pt-4">{a}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function FAQPage() {
  // Single global open key — "category::question" or null
  const [openKey, setOpenKey] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-sm text-zinc-400 mb-10">
        Can&apos;t find what you&apos;re looking for?{" "}
        <Link
          href="/contact"
          className="text-zinc-900 font-semibold underline underline-offset-2"
        >
          Contact us
        </Link>
        .
      </p>

      <div className="space-y-10">
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">
              {section.category}
            </h2>
            <div className="flex flex-col gap-2">
              {section.items.map((item) => {
                const key = `${section.category}::${item.q}`;
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    open={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
