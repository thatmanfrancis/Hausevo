import type { Metadata } from "next";
import BackButton from "@/app/components/BackButton";

export const metadata: Metadata = {
  title: "Cookie Policy — Shack",
  description: "How Shack uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Cookie Policy</h1>
      <p className="text-sm text-zinc-400 mb-10">Last updated: May 5, 2026</p>

      <div>

        <Section title="What Are Cookies?">
          <p>
            Cookies are small text files stored on your device when you visit a website. They help
            the site remember your preferences and understand how you use it.
          </p>
        </Section>

        <Section title="Cookies We Use">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 pr-4 font-bold text-zinc-700">Cookie</th>
                  <th className="text-left py-2 pr-4 font-bold text-zinc-700">Type</th>
                  <th className="text-left py-2 font-bold text-zinc-700">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <CookieRow name="next-auth.session-token" type="Essential" purpose="Keeps you logged in securely. Expires when you sign out or after 30 days." />
                <CookieRow name="next-auth.csrf-token" type="Essential" purpose="Prevents cross-site request forgery attacks." />
                <CookieRow name="shack_geolocation" type="Functional" purpose="Stores your detected location (LGA + state) for 6 hours to avoid re-asking for GPS permission on every visit. Stored in localStorage, not a cookie." />
                <CookieRow name="_vercel_analytics" type="Analytics" purpose="Anonymous usage analytics via Vercel. No personal data collected." />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Essential Cookies">
          <p>
            Essential cookies are required for the platform to function. They cannot be disabled.
            These include your authentication session token and CSRF protection token.
          </p>
        </Section>

        <Section title="Functional Cookies">
          <p>
            Functional cookies remember your preferences to improve your experience — such as your
            last searched location. You can clear these via your browser settings at any time.
          </p>
        </Section>

        <Section title="Analytics">
          <p>
            We use anonymous analytics to understand how users navigate the platform. No personally
            identifiable information is collected. You can opt out by enabling "Do Not Track" in
            your browser.
          </p>
        </Section>

        <Section title="Managing Cookies">
          <p>
            You can control cookies through your browser settings. Note that disabling essential
            cookies will prevent you from logging in. To clear all Shack cookies:
          </p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy → Clear browsing data → Cookies</li>
            <li><strong>Firefox:</strong> Settings → Privacy → Cookies and Site Data → Clear Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Questions about our cookie use? Email{" "}
            <a href="mailto:privacy@shack.ng" className="text-zinc-900 font-semibold underline underline-offset-2">
              privacy@shack.ng
            </a>.
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

function CookieRow({ name, type, purpose }: { name: string; type: string; purpose: string }) {
  const typeColor =
    type === "Essential" ? "bg-zinc-100 text-zinc-700" :
    type === "Functional" ? "bg-blue-50 text-blue-700" :
    "bg-amber-50 text-amber-700";

  return (
    <tr>
      <td className="py-2.5 pr-4 font-mono text-xs text-zinc-800 align-top">{name}</td>
      <td className="py-2.5 pr-4 align-top">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColor}`}>
          {type}
        </span>
      </td>
      <td className="py-2.5 text-zinc-500 align-top">{purpose}</td>
    </tr>
  );
}
