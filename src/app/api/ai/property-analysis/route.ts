import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 });
  }

  const body = await req.json();
  const { property } = body;

  if (!property?.id) {
    return NextResponse.json({ error: "Property data required." }, { status: 400 });
  }

  const meta = property.metadata ?? {};
  const amenities: string[] = Array.isArray(meta.amenities) ? meta.amenities : [];

  const formatNaira = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  const propertyContext = [
    `Title: ${property.title}`,
    `LGA: ${property.lga}`,
    `Listing type: ${property.listingType}`,
    `Price: ${property.pricePerYear > 0 ? formatNaira(property.pricePerYear) + (property.listingType === "RENT" ? "/yr" : "") : "See sale price in metadata"}`,
    `Property type: ${meta.propertyType ?? "N/A"}`,
    `Bedrooms: ${meta.bedrooms ?? "N/A"}, Bathrooms: ${meta.bathrooms ?? "N/A"}`,
    `Amenities: ${amenities.slice(0, 8).join(", ") || "None listed"}`,
    `Deed verified: ${property.deedVerified ? "Yes" : "No"}`,
    `Price verified: ${property.priceVerified ? "Yes" : "No"}`,
    `Health score: ${property.healthScore ?? "N/A"}/100`,
    `Landlord tier: ${property.landlord?.verificationTier ?? 0}`,
  ].join("\n");

  // Single-turn prompt — the entire response must be one JSON object
  // No system_instruction to maximise compatibility. Everything in one user turn.
  const prompt = `You are a Lagos real estate analyst. Analyse this property and respond with ONLY a JSON object — nothing else, no explanation, no markdown.

Property data:
${propertyContext}

Respond with exactly this JSON structure. Keep ALL string values under 15 words. No apostrophes:
{"score":75,"summary":"One sentence. Two sentences max.","pros":["short pro","short pro","short pro"],"cons":["short con","short con"],"verdict":"One sentence.","priceRating":"Fair","locationRating":"Good"}

Rules:
- score: integer 1-100
- priceRating: Excellent, Fair, Overpriced, or Underpriced
- locationRating: Prime, Good, Average, or Remote
- Lekki/Ikoyi/VI = Prime. Yaba/Surulere/Gbagada = Good. Alimosho/Ikorodu/Badagry = Average
- Output ONLY the JSON — no text before or after`;

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
          topP: 0.8,
        },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini ${geminiRes.status}: ${errText.slice(0, 200)}`);
    }

    const geminiData = await geminiRes.json();
    const raw: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!raw.trim()) {
      throw new Error("Empty response from Gemini");
    }

    // Strip markdown fences if present, then find the JSON object
    const stripped = raw.replace(/```[a-z]*\n?/gi, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("[PropertyAnalysis] Raw response was:", raw.slice(0, 300));
      throw new Error("Gemini did not return a JSON object");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    if (typeof analysis.score !== "number") {
      throw new Error("Invalid analysis schema — missing score");
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[PropertyAnalysis] Error:", err);
    return NextResponse.json(
      { error: "Analysis unavailable right now. Please try again." },
      { status: 502 }
    );
  }
}
