import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/*
  POST /api/ai/property-chat
  Public Gemini chat scoped to a specific property.
  No auth required — works for guests and logged-in users.
  Rate limited by IP: 15 requests per 5 minutes.

  Body: {
    message: string,
    propertyContext: string,       // pre-built context string from the client
    history?: { role: "user"|"model", text: string }[]
  }
  Returns: { reply: string }
*/

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  // Rate limit: 15 per 5 minutes per IP — generous for guests
  const limited = rateLimit(req, { limit: 15, windowSeconds: 300 });
  if (limited) return limited;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 });
  }

  const body = await req.json();
  const { message, propertyContext, history = [] } = body as {
    message: string;
    propertyContext: string;
    history: { role: "user" | "model"; text: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const systemPrompt = `You are a helpful Lagos real estate advisor on Hausevo, Nigeria's verified property platform.
You are answering questions about a specific property. Be concise, honest, and practical.
Use Nigerian context — mention LGAs, Naira amounts, Lagos-specific norms where relevant.
Never make up details not in the property context. If unsure, say so.
Keep responses under 150 words unless the question requires more detail.

Property being discussed:
${propertyContext || "No property context provided."}`;

  const contents = [
    ...history.slice(-8).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: message.trim() }] },
  ];

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[PropertyChat] Gemini error:", geminiRes.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I could not generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[PropertyChat] Error:", err);
    return NextResponse.json(
      { error: "Request timed out. Please try again." },
      { status: 504 }
    );
  }
}
