import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import WhatsAppTestClient from "./WhatsAppTestClient";

export default async function WhatsAppTestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });
  if (!user?.roles.includes("ADMIN")) redirect("/dashboard");

  // Pull a few live properties so the tester knows what to search for
  const sampleProperties = await prisma.property.findMany({
    where: { status: "AVAILABLE" },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      lga: true,
      pricePerYear: true,
      listingType: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin/dashboard"
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Admin
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            WhatsApp Gateway
          </p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">WhatsApp AI Gateway</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Simulate incoming WhatsApp messages and preview exactly what users receive.
        </p>
      </div>

      {/* How it works banner */}
      <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">How it works</p>
          <div className="flex flex-col gap-1.5">
            {[
              "Twilio receives the WhatsApp message and POSTs it to /api/whatsapp",
              "Gemini 2.5 Flash classifies intent: property search, savings inquiry, or general",
              "Prisma queries the live database for matching results",
              "Gemini formats a conversational reply — returned as TwiML XML to Twilio",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-2 text-center">
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Webhook URL</p>
            <p className="text-xs font-bold text-emerald-400 font-mono">POST /api/whatsapp</p>
          </div>
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">AI Engine</p>
            <p className="text-xs font-bold text-blue-400">Gemini 2.5 Flash</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Test console — left 2/3 */}
        <div className="lg:col-span-2">
          <WhatsAppTestClient />
        </div>

        {/* Right sidebar — live data hints */}
        <div className="flex flex-col gap-4">
          {/* Intent guide */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Intent Examples
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  intent: "PROPERTY_SEARCH (Rent)",
                  color: "bg-blue-100 text-blue-700",
                  examples: [
                    "Looking for a mini flat in Yaba under 1.5M",
                    "Need a 2 bedroom in Surulere",
                    "Self contain in Ikeja under 600k",
                  ],
                },
                {
                  intent: "PROPERTY_SEARCH (Sale)",
                  color: "bg-emerald-100 text-emerald-700",
                  examples: [
                    "I want to buy a duplex in Lekki for 80M",
                    "3 bedroom for sale in Ikoyi",
                    "House for sale in Ajah under 50M",
                  ],
                },
                {
                  intent: "SAVINGS_INQUIRY",
                  color: "bg-amber-100 text-amber-700",
                  examples: [
                    "How much have we saved so far?",
                    "Check my rent savings",
                    "What's my joint savings balance?",
                  ],
                },
                {
                  intent: "GENERAL",
                  color: "bg-zinc-100 text-zinc-600",
                  examples: [
                    "Hello, what is Hausevo?",
                    "How do I list my property?",
                    "What are your fees?",
                  ],
                },
              ].map((group) => (
                <div key={group.intent}>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${group.color}`}>
                    {group.intent}
                  </span>
                  <ul className="mt-2 flex flex-col gap-1">
                    {group.examples.map((ex) => (
                      <li key={ex} className="text-xs text-zinc-500 leading-relaxed pl-2 border-l border-zinc-100">
                        "{ex}"
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Live properties in DB */}
          {sampleProperties.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Live Listings in DB
              </p>
              <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                Search for these to see real results returned.
              </p>
              <div className="flex flex-col gap-2">
                {sampleProperties.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 py-2 border-b border-zinc-50 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 leading-tight">{p.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{p.lga}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-zinc-700">
                        ₦{(p.pricePerYear / 1_000_000).toFixed(1)}M
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                        p.listingType === "SALE" ? "bg-emerald-100 text-emerald-700" :
                        p.listingType === "SHORTLET" ? "bg-purple-100 text-purple-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {p.listingType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sampleProperties.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Live Listings in DB
              </p>
              <p className="text-xs text-zinc-400">
                No available properties yet. Add some listings to test search results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
