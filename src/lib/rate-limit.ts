import { NextRequest, NextResponse } from "next/server";

/*
  Simple in-memory rate limiter.
  Keyed by IP address. Resets on server restart.
  For production, swap the store for Redis.
*/

interface RateLimitEntry {
  count: number;
  resetAt: number; // unix ms
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  // Max requests allowed in the window
  limit: number;
  // Window duration in seconds
  windowSeconds: number;
}

/**
 * Returns a 429 response if the IP has exceeded the limit, otherwise null.
 * Usage: const limited = rateLimit(req, { limit: 5, windowSeconds: 60 });
 *        if (limited) return limited;
 */
export function rateLimit(
  req: NextRequest,
  { limit, windowSeconds }: RateLimitOptions
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${req.nextUrl.pathname}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request in this window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  entry.count += 1;
  return null;
}
