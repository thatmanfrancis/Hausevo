import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitByKey } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

/*
  POST /api/ai/chat
  Gemini-powered AI assistant with live user data context.
  Requires: active session

  Body: { message: string, history?: { role: "user"|"model", text: string }[] }
  Returns: { reply: string }
*/

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per 2 minutes per IP
  const ipLimited = rateLimit(req, { limit: 5, windowSeconds: 120 });
  if (ipLimited) return ipLimited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit: 5 requests per 2 minutes per user (catches VPN bypasses)
  const userLimited = rateLimitByKey(`ai:${userId}`, { limit: 5, windowSeconds: 120 });
  if (userLimited) return userLimited;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant is not configured yet." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { message, history = [] } = body as {
    message: string;
    history: { role: "user" | "model"; text: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // ── Fetch user context from DB ─────────────────────────────────────────
  const [user, tenancy, applications, savedProperties, transactions, marketStats] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          fullName: true,
          roles: true,
          verificationTier: true,
          walletBalance: true,
          onboardingCompleted: true,
          shackScore: {
            select: {
              score: true,
              onTimePayments: true,
              latePayments: true,
              disputesRaised: true,
              completedTenancies: true,
            },
          },
          wishlist: {
            select: { lga: true, maxBudget: true, minBedrooms: true, isActive: true },
          },
        },
      }),

      prisma.tenancy.findUnique({
        where: { tenantId: userId },
        select: {
          status: true,
          startDate: true,
          endDate: true,
          cautionDeposit: true,
          savingsGoal: true,
          currentSaved: true,
          property: {
            select: {
              title: true,
              address: true,
              lga: true,
              pricePerYear: true,
              rentFrequency: true,
            },
          },
          rentSchedules: {
            where: { status: "PENDING" },
            select: { dueDate: true, amount: true, status: true },
            orderBy: { dueDate: "asc" },
            take: 3,
          },
          agreement: {
            select: { status: true, tenantSigned: true, ownerSigned: true },
          },
        },
      }),

      prisma.tenancyApplication.findMany({
        where: { tenantId: userId },
        select: {
          status: true,
          createdAt: true,
          property: { select: { title: true, lga: true, pricePerYear: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      prisma.savedProperty.findMany({
        where: { tenantId: userId },
        select: {
          property: {
            select: { title: true, lga: true, pricePerYear: true, status: true },
          },
        },
        take: 5,
      }),

      prisma.transaction.findMany({
        where: { userId },
        select: { type: true, amount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      prisma.property.groupBy({
        by: ["lga"],
        where: { status: "AVAILABLE" },
        _count: { id: true },
        _avg: { pricePerYear: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
    ]);

  // ── Build system prompt with live data ─────────────────────────────────
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemPrompt = `You are the Shack AI Assistant — a smart, friendly housing advisor built into the Shack platform, Nigeria's verified property marketplace. You help tenants and landlords navigate renting in Lagos and Nigeria.

Today is ${today}.

## About the user you're talking to

Name: ${user?.fullName ?? "Unknown"}
Roles: ${user?.roles?.join(", ") ?? "TENANT"}
Verification tier: ${user?.verificationTier ?? 0} (0 = basic NIN only, 1 = full KYC with BVN + selfie — required to apply for properties)
Wallet balance: ₦${(user?.walletBalance ?? 0).toLocaleString("en-NG")}
Onboarding completed: ${user?.onboardingCompleted ? "Yes" : "No"}

## ShackScore
${
  user?.shackScore
    ? `Score: ${user.shackScore.score}/850
On-time payments: ${user.shackScore.onTimePayments}
Late payments: ${user.shackScore.latePayments}
Disputes raised: ${user.shackScore.disputesRaised}
Completed tenancies: ${user.shackScore.completedTenancies}`
    : "No ShackScore yet — user hasn't completed any tenancies on the platform."
}

## Current tenancy
${
  tenancy
    ? `Property: ${tenancy.property.title}
Address: ${tenancy.property.address}, ${tenancy.property.lga}
Annual rent: ₦${tenancy.property.pricePerYear.toLocaleString("en-NG")}
Rent frequency: ${tenancy.property.rentFrequency}
Tenancy status: ${tenancy.status}
Start: ${new Date(tenancy.startDate).toLocaleDateString("en-NG")}
End: ${new Date(tenancy.endDate).toLocaleDateString("en-NG")}
Caution deposit: ₦${tenancy.cautionDeposit.toLocaleString("en-NG")}
Savings goal: ₦${tenancy.savingsGoal.toLocaleString("en-NG")} (saved so far: ₦${tenancy.currentSaved.toLocaleString("en-NG")})
Agreement status: ${tenancy.agreement?.status ?? "None"} (tenant signed: ${tenancy.agreement?.tenantSigned ? "Yes" : "No"}, owner signed: ${tenancy.agreement?.ownerSigned ? "Yes" : "No"})
Upcoming rent payments: ${
      tenancy.rentSchedules.length > 0
        ? tenancy.rentSchedules
            .map(
              (s) =>
                `₦${s.amount.toLocaleString("en-NG")} due ${new Date(s.dueDate).toLocaleDateString("en-NG")} (${s.status})`
            )
            .join(", ")
        : "None pending"
    }`
    : "No active tenancy — user is not currently renting through Shack."
}

## Recent applications
${
  applications.length > 0
    ? applications
        .map(
          (a) =>
            `- ${a.property.title} (${a.property.lga}) — ₦${a.property.pricePerYear.toLocaleString("en-NG")}/yr — Status: ${a.status}`
        )
        .join("\n")
    : "No applications yet."
}

## Saved properties
${
  savedProperties.length > 0
    ? savedProperties
        .map(
          (s) =>
            `- ${s.property.title} (${s.property.lga}) — ₦${s.property.pricePerYear.toLocaleString("en-NG")}/yr — ${s.property.status}`
        )
        .join("\n")
    : "No saved properties."
}

## Wishlist preferences
${
  user?.wishlist?.isActive
    ? `LGA preference: ${user.wishlist.lga ?? "Any"}
Max budget: ${user.wishlist.maxBudget ? `₦${user.wishlist.maxBudget.toLocaleString("en-NG")}/yr` : "Not set"}
Min bedrooms: ${user.wishlist.minBedrooms ?? "Not set"}`
    : "No active wishlist."
}

## Recent wallet transactions
${
  transactions.length > 0
    ? transactions
        .map(
          (t) =>
            `- ${t.type}: ₦${t.amount.toLocaleString("en-NG")} (${t.status}) — ${new Date(t.createdAt).toLocaleDateString("en-NG")}`
        )
        .join("\n")
    : "No recent transactions."
}

## Live market data — available properties by LGA
${
  marketStats.length > 0
    ? marketStats
        .map(
          (m) =>
            `- ${m.lga}: ${m._count.id} available, avg ₦${Math.round(m._avg.pricePerYear ?? 0).toLocaleString("en-NG")}/yr`
        )
        .join("\n")
    : "No market data available."
}

## Platform knowledge

**Verification tiers:**
- Tier 0 (free): Basic NIN verification — can browse and save properties
- Tier 1 (₦1,500 one-time): NIN + BVN + biometric selfie — required to apply for properties, unlocks ShackScore visibility

**Fees on Shack:**
- Zero agent fees. Ever.
- ₦1,500 one-time verification fee (Tier 1)
- No caution deposit held by Shack — paid directly to landlord

**ShackScore:** Nigeria's first rental credit score (0–850). Built from payment history, clean exits, dispute record, and verification tier. Higher score = better chances with landlords.

**Scout Programme:** Users can earn ₦2,000–₦3,000 per verified listing by submitting properties on behalf of landlords using an Access Key.

**Listing types:** RENT, SALE, LEASE, SHORTLET

**Rent frequencies:** ANNUALLY (most common in Lagos), BIANNUALLY, QUARTERLY, MONTHLY

## Your behaviour

- Be warm, direct, and practical — like a knowledgeable friend who knows Lagos housing
- Always use the user's real data when answering questions about their situation
- When asked about properties, reference the live market data above
- Give specific, actionable advice — not generic platitudes
- Use Nigerian context: mention LGAs, Naira amounts, Lagos-specific norms
- If you don't know something specific, say so clearly and suggest where to find it
- Keep responses concise but complete — no unnecessary padding
- Format with bullet points or short paragraphs, not walls of text
- Never make up property listings or invent data not in the context above`;

  // ── Build Gemini request ───────────────────────────────────────────────
  const contents = [
    // Inject history
    ...history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    // Current message
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const geminiBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  // ── Call Gemini ────────────────────────────────────────────────────────
  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[AI] Gemini error:", geminiRes.status, errText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I couldn't generate a response. Please try again.";

    // ── Persist both messages (fire-and-forget) ────────────────────────
    prisma.aIMessage.createMany({
      data: [
        { userId, role: "user", text: message.trim() },
        { userId, role: "assistant", text: reply },
      ],
    }).catch(() => {/* non-critical */});

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[AI] Fetch error:", err);
    return NextResponse.json(
      { error: "AI service timed out. Please try again." },
      { status: 504 }
    );
  }
}
