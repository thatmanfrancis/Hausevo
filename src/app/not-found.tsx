import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Big 404 */}
        <p className="text-8xl font-extrabold text-zinc-200 leading-none mb-6 select-none">404</p>

        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border border-zinc-200 mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Page not found</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          If you think this is a mistake, let us know.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-zinc-900 text-white px-7 py-3 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/properties"
            className="rounded-full border border-zinc-200 text-zinc-700 px-7 py-3 text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            Browse properties
          </Link>
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Need help?{" "}
          <Link href="/contact" className="font-semibold text-zinc-600 hover:text-zinc-900 transition-colors underline underline-offset-2">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
