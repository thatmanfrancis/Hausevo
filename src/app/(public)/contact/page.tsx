import type { Metadata } from "next";
import BackButton from "@/app/components/BackButton";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Shack",
  description: "Get in touch with the Shack team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Contact Us</h1>
      <p className="text-sm text-zinc-400 mb-10">
        We're building something important. We'd love to hear from you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <ContactCard
          icon={<MailIcon />}
          label="General Enquiries"
          value="hello@shack.ng"
          href="mailto:hello@shack.ng"
        />
        <ContactCard
          icon={<MailIcon />}
          label="Support"
          value="support@shack.ng"
          href="mailto:support@shack.ng"
        />
        <ContactCard
          icon={<MailIcon />}
          label="Legal & Privacy"
          value="legal@shack.ng"
          href="mailto:legal@shack.ng"
        />
        <ContactCard
          icon={<LocationIcon />}
          label="Office"
          value="Lagos, Nigeria"
          href="https://maps.google.com/?q=Lagos,Nigeria"
        />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-2">
          Send us a message
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          For faster support, use the in-app support ticket system if you have an account.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex items-start gap-4 bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-400 transition-colors group"
    >
      <span className="text-zinc-400 group-hover:text-zinc-700 transition-colors mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-zinc-800">{value}</p>
      </div>
    </a>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
