import { NextRequest, NextResponse } from "next/server";

/*
  Simple in-memory rate limiter.
  Keyed by IP address or any arbitrary string key.
  Resets on server restart.
  For production, swap the store for Redis.
*/

interface RateLimitEntry {
  count: number;
  resetAt: number; // unix ms
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

function buildResponse(entry: RateLimitEntry, limit: number): NextResponse {
  const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
  return NextResponse.json(
    {
      error: `You've sent too many messages. Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} before trying again.`,
      retryAfter,
    },
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

function checkKey(
  key: string,
  { limit, windowSeconds }: RateLimitOptions
): NextResponse | null {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    return buildResponse(entry, limit);
  }

  entry.count += 1;
  return null;
}

/**
 * IP-based rate limiter.
 * Returns a 429 response if the IP has exceeded the limit, otherwise null.
 */
export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return checkKey(`${req.nextUrl.pathname}:ip:${ip}`, options);
}

/**
 * Arbitrary-key rate limiter — use for user ID, session, etc.
 * Returns a 429 response if the key has exceeded the limit, otherwise null.
 *
 * Usage:
 *   const limited = rateLimitByKey(`ai:${userId}`, { limit: 5, windowSeconds: 120 });
 *   if (limited) return limited;
 */
export function rateLimitByKey(
  key: string,
  options: RateLimitOptions
): NextResponse | null {
  return checkKey(key, options);
}
