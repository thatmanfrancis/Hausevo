export const metadata = {
  title: "Team — Hausevo",
  description: "Meet the people building Hausevo.",
};

const TEAM = [
  {
    name: "Jeremiah Amaukwu",
    role: "Co-founder & CEO",
    bio: "CEO @LemonWares Technologies. Spent 8 years watching tenants get exploited by agents and decided to fix it.",
    initials: "JA",
    socials: {
      x: "https://x.com/lemonwares",
      linkedin: "https://www.linkedin.com/in/jeremiah-amaukwu-758a0b50",
    },
  },
  {
    name: "Francis Uzoigwe",
    role: "Founder & CTO",
    bio: "Built fintech infrastructure at two Lagos startups before joining forces to bring transparency to Nigerian real estate.",
    initials: "FU",
    socials: {
      x: "https://x.com/thatmanfran6ix",
      linkedin: "https://linkedin.com/in/francisuzoigwe",
      instagram: "https://instagram.com/thatmanfran6ix",
    },
  },
  {
    name: "Charles Ezenwa",
    role: "Co-founder & Brand Designer",
    bio: "Crafts Hausevo's visual identity, brand communications, and marketing design. Obsessed with clean grid layouts, modern typography, and pixel-perfect brand consistency.",
    initials: "CE",
    socials: {
      x: "https://x.com/OxCharles0",
      linkedin: "https://www.linkedin.com/in/charles-ezenwa-488167356",
    },
  },
  {
    name: "Joseph Ohere",
    role: "Strategy & Growth",
    bio: "Drives Hausevo's growth and expansion strategies, ensuring we scale thoughtfully and effectively.",
    initials: "JO",
    // socials: {
    //   linkedin: "https://linkedin.com/company/hausevong",
    // },
  },
];

const VALUES = [
  {
    title: "Transparency first",
    body: "No hidden fees, no agent markups. Every price on Hausevo is what you actually pay.",
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
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
          The team
        </p>
        <h1 className="text-4xl font-extrabold text-zinc-900 leading-tight mb-4">
          We&apos;re fixing renting in Nigeria
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed">
          Hausevo is a small team of builders, operators, and former tenants who
          got tired of the broken rental market. We&apos;re starting in Lagos
          and going everywhere.
        </p>
      </div>

      {/* Values */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
          What we believe
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-2xl border border-zinc-200 p-6"
            >
              <p className="text-sm font-extrabold text-zinc-900 mb-2">
                {v.title}
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
          The people
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white text-lg font-extrabold">
                {member.initials}
              </div>
              <div>
                <p className="text-sm font-extrabold text-zinc-900">
                  {member.name}
                </p>
                <p className="text-xs font-bold text-zinc-400 mt-0.5">
                  {member.role}
                </p>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed mb-2">
                {member.bio}
              </p>

              {member.socials && (
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-zinc-100">
                  {member.socials.x && (
                    <a
                      href={member.socials.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      title={`${member.name} on X`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {member.socials.instagram && (
                    <a
                      href={member.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      title={`${member.name} on Instagram`}
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
                      >
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5"
                        />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  )}
                  {member.socials.linkedin && (
                    <a
                      href={member.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      title={`${member.name} on LinkedIn`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Join CTA */}
      <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p className="text-lg font-extrabold text-white mb-1">
            Want to join us?
          </p>
          <p className="text-sm text-zinc-400">
            We&apos;re always looking for people who care about this problem.
          </p>
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
          <span className="font-bold text-zinc-600">
            LemonWares Technologies
          </span>
        </a>
      </div>
    </div>
  );
}
