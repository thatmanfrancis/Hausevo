import type { Metadata } from "next";
import BackButton from "@/app/components/BackButton";

export const metadata: Metadata = {
  title: "Terms & Conditions — Shack",
  description: "Read Shack's terms and conditions for using our property platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Terms & Conditions</h1>
      <p className="text-sm text-zinc-400 mb-10">Last updated: May 5, 2026</p>

      <div className="prose-shack">

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Shack ("the Platform"), you agree to be bound by these Terms and
            Conditions. If you do not agree, please do not use the Platform. These terms apply to all
            users including tenants, landlords, artisans, and visitors.
          </p>
        </Section>

        <Section title="2. About Shack">
          <p>
            Shack is a Nigerian property technology platform that connects verified landlords with
            prospective tenants. We operate on a no-agent, no-markup model — all listings are
            submitted directly by property owners or their authorised representatives.
          </p>
          <p>
            Shack is not a real estate agent, broker, or property manager. We provide a marketplace
            and verification infrastructure. Any tenancy agreement is directly between the landlord
            and tenant.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <ul>
            <li>You must be at least 18 years old to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You must provide accurate and truthful information during registration and verification.</li>
            <li>Shack reserves the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </Section>

        <Section title="4. Identity Verification">
          <p>
            To apply for properties, users must complete identity verification (NIN + biometric selfie
            + BVN). This is a one-time fee of ₦1,500. Verification data is processed securely via our
            KYC partner (Dojah) and is never sold to third parties.
          </p>
          <p>
            Basic NIN verification (Tier 0) is free and allows browsing. Full verification (Tier 1)
            is required to submit rental applications.
          </p>
        </Section>

        <Section title="5. Listings & Property Data">
          <ul>
            <li>Landlords are solely responsible for the accuracy of their listings.</li>
            <li>Shack verifies deed documents and price claims but does not guarantee property condition.</li>
            <li>Listings found to contain false information will be removed and the account suspended.</li>
            <li>Shack reserves the right to remove any listing at its discretion.</li>
          </ul>
        </Section>

        <Section title="6. Payments & Wallet">
          <p>
            Shack operates a wallet system for service fees. Wallet top-ups are processed via
            Paystack. Shack does not hold rent payments — all rent is paid directly between tenant
            and landlord unless an escrow arrangement is explicitly agreed.
          </p>
          <p>
            Verification fees (₦1,500) are non-refundable once the verification process has been
            initiated.
          </p>
        </Section>

        <Section title="7. Scout Programme">
          <p>
            Users who submit verified property listings on behalf of landlords (via Access Keys) are
            eligible for scout rewards of ₦2,000–₦3,000 per verified listing. Rewards are paid to
            the bank account on file after admin verification. Fraudulent submissions will result in
            account termination and forfeiture of rewards.
          </p>
        </Section>

        <Section title="8. Prohibited Conduct">
          <ul>
            <li>Submitting false, misleading, or duplicate listings.</li>
            <li>Impersonating a landlord or property owner.</li>
            <li>Using the platform to facilitate illegal transactions.</li>
            <li>Scraping, crawling, or automated access without written permission.</li>
            <li>Harassing other users via the chat system.</li>
          </ul>
        </Section>

        <Section title="9. Dispute Resolution">
          <p>
            Shack provides a dispute resolution mechanism for tenancy-related disagreements. Disputes
            must be raised within 30 days of the triggering event. Shack's decision in disputes is
            final for platform-related matters but does not constitute legal advice or a binding
            legal ruling.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            Shack is not liable for any loss arising from reliance on listing information, failed
            tenancy agreements, property damage, or disputes between users. Our maximum liability to
            any user is limited to the fees paid to Shack in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>
            We may update these terms at any time. Continued use of the Platform after changes
            constitutes acceptance. Material changes will be communicated via email or in-app
            notification.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes
            shall be subject to the exclusive jurisdiction of Nigerian courts.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@shack.ng" className="text-zinc-900 font-semibold underline underline-offset-2">
              legal@shack.ng
            </a>
            .
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-extrabold text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
