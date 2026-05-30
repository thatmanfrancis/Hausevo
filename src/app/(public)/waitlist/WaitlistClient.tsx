"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

// ── LGA searchable combobox ────────────────────────────────────────────────

function LGASearch({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = query.trim()
        ? LAGOS_LGAS.filter((l) =>
            l.toLowerCase().includes(query.toLowerCase())
        )
        : LAGOS_LGAS;

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function select(lga: string) {
        onChange(lga);
        setQuery(lga);
        setOpen(false);
    }

    function clear() {
        onChange("");
        setQuery("");
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(""); // clear selection while typing
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search area e.g. Lekki, Yaba…"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
                {/* Clear / chevron */}
                {query ? (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                ) : (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </span>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white rounded-xl border border-zinc-200 shadow-lg max-h-52 overflow-y-auto">
                    {/* Any area option */}
                    <button
                        type="button"
                        onClick={() => { onChange(""); setQuery(""); setOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 font-semibold hover:bg-zinc-50 transition-colors border-b border-zinc-100"
                    >
                        Any area in Lagos
                    </button>

                    {filtered.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-zinc-400">No areas match &ldquo;{query}&rdquo;</p>
                    ) : (
                        filtered.map((l) => (
                            <button
                                key={l}
                                type="button"
                                onClick={() => select(l)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-zinc-50 ${value === l ? "text-zinc-900 bg-zinc-50" : "text-zinc-700"
                                    }`}
                            >
                                {l}
                                {value === l && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline ml-2 text-zinc-900">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const LAGOS_LGAS = [
    "Alimosho", "Ajeromi-Ifelodun", "Kosofe", "Mushin", "Oshodi-Isolo",
    "Ojo", "Ikorodu", "Surulere", "Agege", "Ifako-Ijaiye", "Somolu",
    "Amuwo-Odofin", "Lagos Island", "Eti-Osa", "Badagry", "Apapa",
    "Lagos Mainland", "Ikeja", "Ibeju-Lekki", "Epe",
];

const PERKS = [
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
        text: "Zero agent fees — ever",
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
        text: "Every listing verified before it goes live",
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        text: "Direct contact with landlords — no middlemen",
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        text: "ShackScore — Nigeria's first rental credit score",
    },
];

export default function WaitlistClient({ count }: { count: number }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [lga, setLga] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [position, setPosition] = useState<number | null>(null);
    const [alreadyJoined, setAlreadyJoined] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, role, lga }),
            });

            const data = await res.json();

            if (!res.ok && res.status !== 200) {
                setError(data.error ?? "Something went wrong. Please try again.");
                return;
            }

            setPosition(data.position);
            setAlreadyJoined(data.alreadyJoined ?? false);
            setDone(true);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="flex flex-col gap-16 py-4">
                <div className="max-w-lg mx-auto w-full text-center flex flex-col items-center gap-6 py-12">
                    <BackButton />
                    {/* Success icon */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>

                    <div>
                        <h1 className="text-3xl font-extrabold text-zinc-900 mb-3">
                            {alreadyJoined ? "You're already on the list" : "You're on the list"}
                        </h1>
                        <p className="text-base text-zinc-500 leading-relaxed max-w-sm mx-auto">
                            {alreadyJoined
                                ? "We already have your details. We'll reach out when we launch."
                                : "We'll email you the moment Shack launches publicly. You'll be among the first to get access."}
                        </p>
                    </div>

                    {/* Position badge */}
                    {position && (
                        <div className="bg-white rounded-2xl border border-zinc-200 px-8 py-6 flex flex-col items-center gap-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                Your position
                            </p>
                            <p className="text-5xl font-extrabold text-zinc-900">#{position}</p>
                            <p className="text-xs text-zinc-400 mt-1">
                                {count > 1 ? `${count.toLocaleString()} people ahead of launch` : "First on the list"}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Link
                            href="/properties"
                            className="rounded-full bg-zinc-900 text-white px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition-colors"
                        >
                            Browse properties →
                        </Link>
                        <Link
                            href="/"
                            className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col py-4">
            <BackButton />
            {/* Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Left — copy */}
                <div>

                    <h1 className="text-4xl font-extrabold text-zinc-900 leading-tight mb-4">
                        Renting in Lagos,<br />the way it should be.
                    </h1>
                    <p className="text-lg text-zinc-500 leading-relaxed mb-8">
                        No agents. No markups. Every listing verified directly with the landlord.
                        Join the waitlist and be first in line when we launch.
                    </p>

                    {/* Live count */}
                    {count > 0 && (
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex -space-x-2">
                                {["JA", "FU", "AO"].map((init) => (
                                    <div
                                        key={init}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-bold border-2 border-white"
                                    >
                                        {init}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm font-semibold text-zinc-600">
                                <span className="font-extrabold text-zinc-900">
                                    {count.toLocaleString()}
                                </span>{" "}
                                {count === 1 ? "person" : "people"} already waiting
                            </p>
                        </div>
                    )}

                    {/* Perks */}
                    <div className="flex flex-col gap-3">
                        {PERKS.map((perk, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                                    {perk.icon}
                                </div>
                                <p className="text-sm font-semibold text-zinc-700">{perk.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right — form */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8">
                    <p className="text-base font-extrabold text-zinc-900 mb-1">Reserve your spot</p>
                    <p className="text-sm text-zinc-400 mb-3">
                        Takes 30 seconds. We&apos;ll email you when we launch.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Full name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="Emeka Okafor"
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                            />
                        </div>

                        {/* Role */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                I am a…
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: "TENANT", label: "Tenant" },
                                    { value: "LANDLORD", label: "Landlord" },
                                    { value: "BOTH", label: "Both" },
                                ].map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={`rounded-xl border py-3 text-sm font-bold transition-colors ${role === r.value
                                                ? "bg-zinc-900 border-zinc-900 text-white"
                                                : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                                            }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* LGA (optional) */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                Preferred Area{" "}
                                <span className="normal-case font-semibold text-zinc-300">(optional)</span>
                            </label>
                            <LGASearch value={lga} onChange={setLga} />
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !role}
                            className="rounded-full bg-zinc-900 text-white px-6 py-3.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                        >
                            {submitting ? "Joining…" : "Join the waitlist →"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Stats strip */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { value: "0%", label: "Agent fees" },
                    { value: "100%", label: "Verified listings" },
                    { value: "Lagos", label: "Launching first" },
                    { value: "₦0", label: "Hidden markups" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
                        <p className="text-2xl font-extrabold text-zinc-900 mb-0.5">{s.value}</p>
                        <p className="text-xs font-semibold text-zinc-400">{s.label}</p>
                    </div>
                ))}
            </div> */}

            {/* Already have an account */}
            <div className="bg-zinc-900 rounded-2xl p-8 mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <p className="text-lg font-extrabold text-white mb-1">
                        Already have an account?
                    </p>
                    <p className="text-sm text-zinc-400">
                        The platform is live. Browse verified properties right now.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/auth/login"
                        className="rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors"
                    >
                        Sign in →
                    </Link>
                    <Link
                        href="/properties"
                        className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                    >
                        Browse
                    </Link>
                </div>
            </div>

        </div>
    );
}
