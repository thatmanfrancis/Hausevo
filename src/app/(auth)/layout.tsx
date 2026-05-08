import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Minimal header */}
      <header className="w-full bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </span>
            <span className="text-sm font-extrabold tracking-tight text-zinc-900">Shack</span>
          </Link>
          <Link href="/properties" className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors">
            Browse properties →
          </Link>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="py-6 text-center flex flex-col items-center gap-2">
        <p className="text-xs text-zinc-400">
          © {new Date().getFullYear()} Shack Technologies Ltd ·{" "}
          <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
          {" · "}
          <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
        </p>
        <a
          href="https://dev.lemonwares.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          A product of <span className="font-bold">LemonWares Technologies</span>
        </a>
      </footer>
    </div>
  );
}
