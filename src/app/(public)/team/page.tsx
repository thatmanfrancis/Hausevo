export const metadata = {
  title: "Team — Shack",
  description: "Meet the people building Shack.",
};

const TEAM = [
  {
    name: "Adebayo Okonkwo",
    role: "Co-founder & CEO",
    bio: "Former property lawyer turned builder. Spent 8 years watching tenants get exploited by agents and decided to fix it.",
    initials: "AO",
  },
  {
    name: "Chisom Eze",
    role: "Co-founder & CTO",
    bio: "Built fintech infrastructure at two Lagos startups before joining forces to bring transparency to Nigerian real estate.",
    initials: "CE",
  },
  {
    name: "Fatima Aliyu",
    role: "Head of Operations",
    bio: "Runs the verification pipeline and landlord onboarding. Previously at a property management firm in Abuja.",
    initials: "FA",
  },
  {
    name: "Emeka Nwosu",
    role: "Lead Engineer",
    bio: "Full-stack engineer obsessed with performance and clean APIs. Builds the systems that keep Shack running.",
    initials: "EN",
  },
  {
    name: "Ngozi Adeyemi",
    role: "Product Designer",
    bio: "Designs every screen with the tenant in mind. Believes great UX is the best form of trust-building.",
    initials: "NA",
  },
  {
    name: "Tunde Bakare",
    role: "Head of Growth",
    bio: "Grew up in Surulere and knows the Lagos rental market from the inside. Leads our scout and landlord acquisition.",
    initials: "TB",
  },
];

const VALUES = [
  {
    title: "Transparency first",
    body: "No hidden fees, no agent markups. Every price on Shack is what you actually pay.",
  },
  {
    title: "Tenant-centred",
    body: "We built this because we've been tenants. Every decision starts with what's best for the person renting.",
  },
  {
    title: "Verified, not assumed",
    body: "Properties are verified before they go live. Landlords are contacted. Deeds are checked.",
  },
  {
    title: "Built for Nigeria",
    body: "Not a copy of a Western product. Designed for Lagos, for Naira, for the way Nigerians actually rent.",
  },
];

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-16 py-4">

      {/* Hero */}
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">The team</p>
        <h1 className="text-4xl font-extrabold text-zinc-900 leading-tight mb-4">
          We&apos;re fixing renting in Nigeria
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed">
          Shack is a small team of builders, operators, and former tenants who got tired of the broken rental market. We&apos;re starting in Lagos and going everywhere.
        </p>
      </div>

      {/* Values */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">What we believe</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-zinc-200 p-6">
              <p className="text-sm font-extrabold text-zinc-900 mb-2">{v.title}</p>
              <p className="text-sm text-zinc-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">The people</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white text-lg font-extrabold">
                {member.initials}
              </div>
              <div>
                <p className="text-sm font-extrabold text-zinc-900">{member.name}</p>
                <p className="text-xs font-bold text-zinc-400 mt-0.5">{member.role}</p>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Join CTA */}
      <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p className="text-lg font-extrabold text-white mb-1">Want to join us?</p>
          <p className="text-sm text-zinc-400">We&apos;re always looking for people who care about this problem.</p>
        </div>
        <a
          href="/careers"
          className="rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          See open roles →
        </a>
      </div>

      {/* LemonWares credit */}
      <div className="flex items-center justify-center pt-4">
        <a
          href="https://dev.lemonwares.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <span>Built by</span>
          <span className="font-bold text-zinc-600">LemonWares Technologies</span>
        </a>
      </div>

    </div>
  );
}
