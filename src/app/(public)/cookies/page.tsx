import type { Metadata } from "next";
import BackButton from "@/app/components/BackButton";

export const metadata: Metadata = {
  title: "Cookie Policy — Hausevo",
  description: "How Hausevo uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
        Cookie Policy
      </h1>
      <p className="text-sm text-zinc-400 mb-10">Last updated: May 5, 2026</p>

      <div>

        <Section title="What Are Cookies?">
          <p>
            Cookies are small text files stored on your device when you visit a
            website. They help the site remember your preferences and understand
            how you use it.
          </p>
        </Section>

        <Section title="Cookies We Use">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 pr-4 font-bold text-zinc-700">Type</th>
                  <th className="text-left py-2 font-bold text-zinc-700">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <CookieRow
                  type="Essential"
                  purpose="Required for authentication and security. These keep your session active and protect against cross-site attacks. Cannot be disabled."
                />
                <CookieRow
                  type="Functional"
                  purpose="Stores your detected location temporarily to avoid re-asking for GPS permission on every visit. Stored in localStorage, not transmitted to our servers."
                />
                <CookieRow
                  type="Analytics"
                  purpose="Anonymous usage data to help us understand how people navigate the platform. No personal information is collected or linked."
                />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Managing Cookies">
          <p>
            You can control cookies through your browser settings. Disabling
            essential cookies will prevent you from logging in. To clear all
            Hausevo cookies:
          </p>
          <ul>
            <li>
              <strong>Chrome:</strong> Settings → Privacy → Clear browsing data → Cookies
            </li>
            <li>
              <strong>Firefox:</strong> Settings → Privacy → Cookies and Site Data → Clear Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
            </li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Questions about our cookie use? Email{" "}
            <a
              href="mailto:privacy@hausevo.com.ng"
              className="text-zinc-900 font-semibold underline underline-offset-2"
            >
              privacy@hausevo.com.ng
            </a>
            .
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-extrabold text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-zinc-800">
        {children}
      </div>
    </div>
  );
}

function CookieRow({ type, purpose }: { type: string; purpose: string }) {
  const typeColor =
    type === "Essential"
      ? "bg-zinc-100 text-zinc-700"
      : type === "Functional"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700";

  return (
    <tr>
      <td className="py-3 pr-4 align-top">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${typeColor}`}
        >
          {type}
        </span>
      </td>
      <td className="py-3 text-zinc-500 align-top leading-relaxed">{purpose}</td>
    </tr>
  );
}
