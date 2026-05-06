import type { Metadata } from "next";
import BackButton from "@/app/components/BackButton";

export const metadata: Metadata = {
  title: "FAQ — Shack",
  description: "Frequently asked questions about Shack — Nigeria's verified property platform.",
};

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is Shack?",
        a: "Shack is a Nigerian property platform that connects verified landlords directly with tenants — no agents, no markups. Every listing is submitted by the property owner and verified by our team.",
      },
      {
        q: "Is Shack free to use?",
        a: "Browsing and saving properties is completely free. To apply for a property, you need to complete identity verification (₦1,500 one-time fee). This covers NIN verification, biometric selfie matching, and BVN financial signal.",
      },
      {
        q: "Which cities does Shack cover?",
        a: "We launched in Lagos and are expanding to Abuja, Port Harcourt, Ibadan, and other major Nigerian cities. If you're a landlord outside Lagos, you can still list — we'll verify and activate your listing as we expand.",
      },
    ],
  },
  {
    category: "Verification",
    items: [
      {
        q: "Why do I need to verify my identity?",
        a: "Verification protects both tenants and landlords. It ensures that the person applying for a property is who they say they are, and it builds your ShackScore — a trust signal that landlords use when reviewing applications.",
      },
      {
        q: "What is Tier 0 vs Tier 1 verification?",
        a: "Tier 0 (free) is basic NIN verification — it lets you browse and save properties. Tier 1 (₦1,500) adds biometric selfie matching and BVN, unlocking the ability to apply for properties and making your ShackScore visible to landlords.",
      },
      {
        q: "Is my NIN and BVN data safe?",
        a: "Yes. We never store your full NIN or BVN — only a masked reference (e.g. 1234*******). Verification is processed by Dojah, a licensed KYC provider. Your biometric selfie is used only for the one-time match and is not retained.",
      },
    ],
  },
  {
    category: "For Tenants",
    items: [
      {
        q: "How do I apply for a property?",
        a: "Complete Tier 1 verification, then click 'Apply Now' on any listing. Your ShackScore and verified profile are shared with the landlord. You'll be notified when they respond.",
      },
      {
        q: "What is ShackScore?",
        a: "ShackScore is Nigeria's first rental credit score. It's built from your payment history, clean tenancy exits, and dispute record on the platform. A higher score improves your chances with landlords.",
      },
      {
        q: "Can I join a waitlist for a rented property?",
        a: "Yes. If a property is currently rented, you can join the waitlist. When it becomes available again, waitlisted tenants are notified in order of position.",
      },
      {
        q: "What is the Vault?",
        a: "The Vault is your personal document storage on Shack. Store your tenancy agreements, receipts, inspection reports, and identity documents securely. Verified documents strengthen your profile.",
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
        q: "How does Shack prevent agent markup?",
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
        a: "Your Shack wallet holds funds for platform services (verification, boosts, etc.). Top up via Paystack. Rent payments are made directly between tenant and landlord — Shack does not hold rent unless an escrow arrangement is agreed.",
      },
      {
        q: "Are verification fees refundable?",
        a: "The ₦1,500 verification fee is non-refundable once the process has been initiated, as it covers the cost of the KYC API calls.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-sm text-zinc-400 mb-10">
        Can't find what you're looking for?{" "}
        <a href="/contact" className="text-zinc-900 font-semibold underline underline-offset-2">
          Contact us
        </a>.
      </p>

      <div className="space-y-10">
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.q} className="bg-white rounded-2xl border border-zinc-200 p-5">
                  <p className="text-sm font-bold text-zinc-900 mb-2">{item.q}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
