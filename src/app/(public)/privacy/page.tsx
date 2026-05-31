import type { Metadata } from "next";
import BackButton from "@/app/components/BackButton";

export const metadata: Metadata = {
  title: "Privacy Policy — Hausevo",
  description: "How Hausevo collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-400 mb-10">Last updated: May 5, 2026</p>

      <div>

        <Section title="1. Who We Are">
          <p>
            Hausevo ("we", "us", "our") is a property technology platform operating in Nigeria.
            We are committed to protecting your personal data in accordance with the Nigeria Data
            Protection Act (NDPA) 2023 and applicable regulations.
          </p>
          <p>
            Data Controller: Hausevo Technologies Ltd, Lagos, Nigeria.
            Contact: <a href="mailto:privacy@hausevo.com.ng" className="text-zinc-900 font-semibold underline underline-offset-2">privacy@hausevo.com.ng</a>
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p><strong>Account data:</strong> Full name, email address, phone number, password hash.</p>
          <p><strong>Identity verification:</strong> NIN (masked after verification), BVN reference (masked), selfie biometric data processed by Dojah — we do not store raw biometric images.</p>
          <p><strong>Property data:</strong> Listing details, deed documents, images uploaded by landlords.</p>
          <p><strong>Usage data:</strong> Pages visited, search queries, device type, IP address, browser.</p>
          <p><strong>Financial data:</strong> Wallet transactions, bank account details (account number and name only — no card data).</p>
          <p><strong>Communications:</strong> Chat messages between users on the platform.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul>
            <li>To create and manage your account.</li>
            <li>To verify your identity and prevent fraud.</li>
            <li>To match tenants with suitable properties.</li>
            <li>To process payments and wallet transactions.</li>
            <li>To send transactional notifications (rent reminders, application updates).</li>
            <li>To improve the platform through analytics.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <ul>
            <li><strong>Contract:</strong> Processing necessary to provide our services.</li>
            <li><strong>Legal obligation:</strong> KYC/AML compliance under Nigerian law.</li>
            <li><strong>Legitimate interests:</strong> Fraud prevention, platform security.</li>
            <li><strong>Consent:</strong> Marketing communications (you can opt out at any time).</li>
          </ul>
        </Section>

        <Section title="5. Data Sharing">
          <p>We share your data only with:</p>
          <ul>
            <li><strong>Dojah</strong> — KYC verification (NIN/BVN lookup, selfie matching).</li>
            <li><strong>Paystack</strong> — Payment processing.</li>
            <li><strong>AWS / Cloudinary</strong> — Document and image storage.</li>
            <li><strong>Landlords</strong> — Your verified name and Hausevo Score when you apply for a property.</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="6. Data Retention">
          <ul>
            <li>Account data: retained for the life of your account + 2 years after deletion.</li>
            <li>KYC records: retained for 5 years as required by Nigerian financial regulations.</li>
            <li>Chat messages: retained for 2 years.</li>
            <li>Audit logs: retained for 7 years.</li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
          <p>Under the NDPA 2023, you have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data (subject to legal retention requirements).</li>
            <li>Object to processing for marketing purposes.</li>
            <li>Data portability — receive your data in a machine-readable format.</li>
          </ul>
          <p>
            To exercise these rights, email{" "}
            <a href="mailto:privacy@hausevo.com.ng" className="text-zinc-900 font-semibold underline underline-offset-2">privacy@hausevo.com.ng</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We use industry-standard security measures including encryption at rest and in transit,
            bcrypt password hashing, and role-based access controls. No system is 100% secure —
            if you suspect a breach, contact us immediately.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            We use cookies for authentication sessions and analytics. See our{" "}
            <a href="/cookies" className="text-zinc-900 font-semibold underline underline-offset-2">Cookie Policy</a>{" "}
            for details.
          </p>
        </Section>

        <Section title="10. Changes">
          <p>
            We may update this policy periodically. Material changes will be communicated via email.
            Continued use of the platform constitutes acceptance.
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
      <div className="space-y-3 text-sm text-zinc-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-zinc-800">
        {children}
      </div>
    </div>
  );
}
