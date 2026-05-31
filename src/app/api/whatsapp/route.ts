import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

/*
  POST /api/whatsapp
  Twilio WhatsApp webhook — Gemini 2.5 Flash multi-intent router.

  Twilio sends URL-encoded POST body with:
    Body  — the raw message text
    From  — sender's WhatsApp number e.g. "whatsapp:+2348012345678"

  Returns TwiML XML with Content-Type: text/xml

  Security: Twilio signature validation is enforced in production.
  Set TWILIO_AUTH_TOKEN in your environment to enable it.
  Webhook URL must be set to: https://hausevo.com.ng/api/whatsapp
*/

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const APP_URL = "https://hausevo.com.ng";
const WEBHOOK_URL = "https://hausevo.com.ng/api/whatsapp";

// ── Twilio signature validation ───────────────────────────────────────────────
//
// Algorithm (https://www.twilio.com/docs/usage/webhooks/webhooks-security):
// 1. Take the full webhook URL
// 2. Sort POST params alphabetically by key, append key+value pairs to the URL
// 3. HMAC-SHA1 sign the resulting string with your Auth Token
// 4. Base64-encode the result and compare to X-Twilio-Signature header
//
// In dev (no TWILIO_AUTH_TOKEN set) validation is skipped so curl/test page works.

function validateTwilioSignature(
  authToken: string,
  signature: string,
  params: Record<string, string>
): boolean {
  // Build the string to sign: URL + sorted params concatenated
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((k) => `${k}${params[k]}`).join("");
  const stringToSign = WEBHOOK_URL + paramString;

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(stringToSign, "utf8")
    .digest("base64");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "base64"),
      Buffer.from(signature, "base64")
    );
  } catch {
    return false;
  }
}

// ── TwiML helpers ─────────────────────────────────────────────────────────────

function twiml(message: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Gemini call ───────────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 800, topP: 0.9 },
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Intent classification ─────────────────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for Hausevo, a Nigerian property marketplace covering rentals, sales, leases, and shortlets.
Classify the user's WhatsApp message into exactly one of these intents:
- PROPERTY_SEARCH: user is looking for any kind of property (rent, buy, lease, shortlet)
- SAVINGS_INQUIRY: user is asking about their joint savings pool or rent savings
- GENERAL: anything else (greetings, questions about the platform, etc.)

If the intent is PROPERTY_SEARCH, also extract:
- location: the area/LGA they mentioned (string, or null)
- maxBudget: maximum price in Naira as a number (or null if not mentioned). For sales this could be hundreds of millions.
- rooms: number of bedrooms as a number (0 for self-contain/bedsitter, or null if not mentioned)
- listingType: one of "RENT", "SALE", "LEASE", "SHORTLET" — infer from context. Default to "RENT" if unclear.

Examples of listingType inference:
- "looking for a flat to rent" → RENT
- "I want to buy a duplex" → SALE
- "need a shortlet in VI" → SHORTLET
- "3 bedroom for sale in Lekki" → SALE
- "long lease in Ikoyi" → LEASE
- "mini flat in Yaba under 1.5M" → RENT

Respond ONLY with a raw JSON object — no markdown fences, no explanation. Examples:
{"intent":"PROPERTY_SEARCH","location":"Yaba","maxBudget":1500000,"rooms":1,"listingType":"RENT"}
{"intent":"PROPERTY_SEARCH","location":"Lekki","maxBudget":150000000,"rooms":3,"listingType":"SALE"}
{"intent":"SAVINGS_INQUIRY","location":null,"maxBudget":null,"rooms":null,"listingType":null}
{"intent":"GENERAL","location":null,"maxBudget":null,"rooms":null,"listingType":null}`;

interface IntentResult {
  intent: "PROPERTY_SEARCH" | "SAVINGS_INQUIRY" | "GENERAL";
  location: string | null;
  maxBudget: number | null;
  rooms: number | null;
  listingType: "RENT" | "SALE" | "LEASE" | "SHORTLET" | null;
}

async function classifyIntent(message: string): Promise<IntentResult> {
  try {
    const raw = await callGemini(INTENT_SYSTEM_PROMPT, message);
    const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();
    return JSON.parse(cleaned) as IntentResult;
  } catch {
    return { intent: "GENERAL", location: null, maxBudget: null, rooms: null, listingType: null };
  }
}

// ── Scenario A: Property search (rent, sale, lease, shortlet) ────────────────

const LISTING_TYPE_LABELS: Record<string, { emoji: string; priceLabel: string; verb: string }> = {
  RENT:     { emoji: "🏠", priceLabel: "Annual rent", verb: "rent" },
  SALE:     { emoji: "🏡", priceLabel: "Sale price",  verb: "buy"  },
  LEASE:    { emoji: "🏢", priceLabel: "Lease price", verb: "lease" },
  SHORTLET: { emoji: "🛎️", priceLabel: "Daily rate",  verb: "book" },
};

async function handlePropertySearch(
  intent: IntentResult,
  rawMessage: string
): Promise<string> {
  const listingType = intent.listingType ?? "RENT";
  const labels = LISTING_TYPE_LABELS[listingType] ?? LISTING_TYPE_LABELS.RENT;

  // Build Prisma where clause
  const where: any = {
    status: "AVAILABLE",
    listingType,
  };

  if (intent.location) {
    where.lga = { contains: intent.location, mode: "insensitive" };
  }
  if (intent.maxBudget && intent.maxBudget > 0) {
    where.pricePerYear = { lte: intent.maxBudget };
  }

  const properties = await prisma.property.findMany({
    where,
    take: 3,
    orderBy: [{ healthScore: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      address: true,
      lga: true,
      pricePerYear: true,
      totalPackage: true,
      rentFrequency: true,
      listingType: true,
      metadata: true,
    },
  });

  const locationLabel = intent.location ?? "Lagos";
  const budgetLabel = intent.maxBudget
    ? `₦${intent.maxBudget.toLocaleString("en-NG")}`
    : "any budget";

  const propertyContext =
    properties.length > 0
      ? properties
          .map((p, i) => {
            const meta = p.metadata as any;
            return [
              `${i + 1}. ${p.title}`,
              `   Address: ${p.address}, ${p.lga}`,
              `   ${labels.priceLabel}: ₦${p.pricePerYear.toLocaleString("en-NG")}${listingType === "RENT" ? ` (Total package: ₦${p.totalPackage.toLocaleString("en-NG")})` : ""}`,
              `   Bedrooms: ${meta?.bedrooms ?? "N/A"} | Bathrooms: ${meta?.bathrooms ?? "N/A"}`,
              `   Link: ${APP_URL}/properties/${p.id}`,
            ].join("\n");
          })
          .join("\n\n")
      : "No properties found matching those criteria.";

  const formatPrompt = `You are the Hausevo WhatsApp assistant for Nigerian property — rentals, sales, leases, and shortlets.

User searched for: ${rawMessage}
Listing type: ${listingType} | Location: ${locationLabel} | Budget: ${budgetLabel} | Bedrooms: ${intent.rooms ?? "any"}
Results found: ${properties.length}

Property data:
${propertyContext}

Rules:
- Start with a bold header: "${labels.emoji} X properties to ${labels.verb} in [location]"
- ALWAYS include "✅ *ZERO AGENT FEES — EVER*" near the top
- List each property with ${labels.priceLabel.toLowerCase()}, address, and the direct link
- For SALE listings, mention it's a direct-from-owner price with no agent commission
- End with a browse link: ${APP_URL}/properties?listingType=${listingType}&lga=${encodeURIComponent(intent.location ?? "")}
- Keep it under 400 words, use WhatsApp *bold* formatting
- If no results, suggest broadening the search`;

  try {
    return await callGemini(formatPrompt, "Format the results now.");
  } catch {
    // Plain text fallback
    if (properties.length === 0) {
      return `${labels.emoji} *No ${listingType.toLowerCase()} properties found in ${locationLabel}*\n\n✅ *ZERO AGENT FEES — EVER*\n\nBrowse all listings:\n${APP_URL}/properties?listingType=${listingType}`;
    }
    const lines = [
      `${labels.emoji} *${properties.length} propert${properties.length === 1 ? "y" : "ies"} to ${labels.verb} in ${locationLabel}*`,
      "",
      "✅ *ZERO AGENT FEES — EVER*",
      "",
    ];
    properties.forEach((p, i) => {
      const meta = p.metadata as any;
      lines.push(
        `${i + 1}. *${p.title}*\n📍 ${p.address}\n💰 ₦${p.pricePerYear.toLocaleString("en-NG")}${listingType === "RENT" ? "/yr" : ""}\n🛏 ${meta?.bedrooms ?? "?"} bed | 🚿 ${meta?.bathrooms ?? "?"} bath\n🔗 ${APP_URL}/properties/${p.id}`
      );
    });
    lines.push("", `Browse more: ${APP_URL}/properties?listingType=${listingType}`);
    return lines.join("\n");
  }
}

// ── Scenario B: Savings inquiry ───────────────────────────────────────────────

async function handleSavingsInquiry(phoneNumber: string): Promise<string> {
  // Find user by phone number
  const user = await prisma.user.findFirst({
    where: { phoneNumber },
    select: { id: true, fullName: true },
  });

  if (!user) {
    return `💰 *Joint Savings*\n\nWe couldn't find a Hausevo account linked to this number.\n\nSign up at: ${APP_URL}/auth/register`;
  }

  // Find their active joint savings pool
  const pool = await prisma.jointSavings.findFirst({
    where: {
      status: "ACTIVE",
      members: { some: { id: user.id } },
    },
    select: {
      title: true,
      targetAmount: true,
      currentAmount: true,
      targetDate: true,
      status: true,
    },
  });

  if (!pool) {
    return `💰 *Joint Savings*\n\nHi ${user.fullName}, you don't have an active savings pool yet.\n\nStart one at: ${APP_URL}/wallet`;
  }

  const percent = Math.round((pool.currentAmount / pool.targetAmount) * 100);
  const remaining = pool.targetAmount - pool.currentAmount;
  const targetDateStr = new Date(pool.targetDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return [
    `💰 *Your Joint Savings Pool*`,
    ``,
    `Pool: *${pool.title}*`,
    `Target: ₦${pool.targetAmount.toLocaleString("en-NG")}`,
    `Saved: ₦${pool.currentAmount.toLocaleString("en-NG")} (${percent}%)`,
    `Remaining: ₦${remaining.toLocaleString("en-NG")}`,
    `Target date: ${targetDateStr}`,
    `Status: ${pool.status}`,
    ``,
    `Top up your wallet: ${APP_URL}/wallet`,
  ].join("\n");
}

// ── Scenario C: General ───────────────────────────────────────────────────────

async function handleGeneral(message: string): Promise<string> {
  const systemPrompt = `You are the Hausevo WhatsApp assistant. Hausevo is a Nigerian property marketplace — rentals, sales, leases, and shortlets — that eliminates agent fees entirely.

Key facts:
- Zero agent fees, ever — for rentals AND property sales
- Verified listings only — every property is checked before going live
- Tenants: one-time ₦1,500 verification fee to apply for properties
- Landlords/sellers: list for free, no commission taken
- Browse all properties: ${APP_URL}/properties
- Sign up: ${APP_URL}/auth/register
- Covers: rentals, outright sales, long leases, shortlets

Keep replies short, friendly, and under 200 words. Use WhatsApp *bold* formatting.
If the user wants to search, ask them to describe what they want (area + budget + rent or buy).`;

  try {
    return await callGemini(systemPrompt, message);
  } catch {
    return `👋 *Welcome to Hausevo*\n\nNigeria's verified property marketplace — *zero agent fees, ever.*\n\nRent, buy, lease, or book shortlets — all direct from verified owners.\n\n🔍 Browse properties: ${APP_URL}/properties\n📝 Sign up: ${APP_URL}/auth/register\n\nTell me what you're looking for and I'll find it for you!`;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Read body once — we need it both for validation and parsing
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);

    // ── Twilio signature validation ──────────────────────────────────────────
    // Only enforced when TWILIO_AUTH_TOKEN is set (i.e. production).
    // In dev/test the admin test page and curl work without a token.
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (authToken) {
      const signature = req.headers.get("x-twilio-signature") ?? "";
      if (!signature) {
        console.warn("[WhatsApp] Missing X-Twilio-Signature header — request rejected.");
        return new NextResponse("Forbidden", { status: 403 });
      }

      // Convert URLSearchParams to plain object for validation
      const paramObj: Record<string, string> = {};
      params.forEach((value, key) => { paramObj[key] = value; });

      const valid = validateTwilioSignature(authToken, signature, paramObj);
      if (!valid) {
        console.warn("[WhatsApp] Invalid Twilio signature — possible spoofed request.");
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const body = params.get("Body")?.trim() ?? "";
    const from = params.get("From")?.trim() ?? "";

    if (!body) {
      return twiml("Hi! Send me a message and I'll help you find a home in Lagos. 🏠");
    }

    // Strip "whatsapp:" prefix Twilio prepends
    const phoneNumber = from.replace(/^whatsapp:/i, "");

    // Step 1: Classify intent
    const intent = await classifyIntent(body);

    // Step 2: Route to handler
    let reply: string;

    switch (intent.intent) {
      case "PROPERTY_SEARCH":
        reply = await handlePropertySearch(intent, body);
        break;
      case "SAVINGS_INQUIRY":
        reply = await handleSavingsInquiry(phoneNumber);
        break;
      default:
        reply = await handleGeneral(body);
    }

    return twiml(reply);
  } catch (err) {
    console.error("[WhatsApp] Handler error:", err);
    return twiml(
      "Sorry, something went wrong on our end. Please try again or visit hausevo.com.ng for help."
    );
  }
}

// Twilio also sends GET for webhook validation
export async function GET() {
  return new NextResponse("Hausevo WhatsApp Gateway", { status: 200 });
}
