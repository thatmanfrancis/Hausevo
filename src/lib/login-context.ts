/**
 * login-context.ts
 * Extracts device, location, IP, and local time from a request.
 * Used to populate login alert emails.
 */

// ── Device detection from User-Agent ──────────────────────────────────────

export function parseDevice(ua: string | null): string {
  if (!ua) return "Unknown Device";

  // OS detection
  let os = "Unknown OS";
  if (/windows nt 10/i.test(ua)) os = "Windows 11/10";
  else if (/windows nt 6\.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6\.1/i.test(ua)) os = "Windows 7";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone/i.test(ua)) {
    const v = ua.match(/os (\d+_\d+)/i);
    os = v ? `iPhone (iOS ${v[1].replace("_", ".")})` : "iPhone";
  } else if (/ipad/i.test(ua)) os = "iPad";
  else if (/android/i.test(ua)) {
    const v = ua.match(/android ([\d.]+)/i);
    os = v ? `Android ${v[1]}` : "Android";
  } else if (/mac os x/i.test(ua)) {
    const v = ua.match(/mac os x ([\d_]+)/i);
    os = v ? `macOS ${v[1].replace(/_/g, ".")}` : "macOS";
  } else if (/linux/i.test(ua)) os = "Linux";

  // Browser detection
  let browser = "Unknown Browser";
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) {
    const v = ua.match(/chrome\/([\d.]+)/i);
    browser = v ? `Chrome ${v[1].split(".")[0]}` : "Chrome";
  } else if (/firefox\//i.test(ua)) {
    const v = ua.match(/firefox\/([\d.]+)/i);
    browser = v ? `Firefox ${v[1].split(".")[0]}` : "Firefox";
  } else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
  }

  return `${browser} on ${os}`;
}

// ── IP extraction ──────────────────────────────────────────────────────────

export function extractIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (client IP)
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "Unknown";
}

// ── IP geolocation (ip-api.com — free, no key, 1000 req/min) ──────────────

interface GeoResult {
  city: string;
  country: string;
  timezone: string;
}

export async function getGeoLocation(ip: string): Promise<GeoResult | null> {
  // Skip lookup for localhost/private IPs
  if (!ip || ip === "Unknown" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=city,country,timezone,status`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success") return null;
    return { city: data.city, country: data.country, timezone: data.timezone };
  } catch {
    return null;
  }
}

// ── Local time formatting ──────────────────────────────────────────────────

export function formatLoginTime(timezone?: string | null): string {
  const tz = timezone && isValidTimezone(timezone) ? timezone : undefined;
  return new Date().toLocaleString("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ── Combined helper ────────────────────────────────────────────────────────

export interface LoginContext {
  device: string;
  location: string;
  time: string;
  ip: string;
}

export async function buildLoginContext(headers: Headers): Promise<LoginContext> {
  const ua = headers.get("user-agent");
  const ip = extractIp(headers);
  const device = parseDevice(ua);

  const geo = await getGeoLocation(ip);

  const location = geo
    ? `${geo.city}, ${geo.country}`
    : ip !== "Unknown"
    ? `IP: ${ip}`
    : "Location unavailable";

  const time = formatLoginTime(geo?.timezone);

  return { device, location, time, ip };
}
