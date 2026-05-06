"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to /api/support in a future sprint
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-base font-bold text-zinc-900 mb-1">Message sent!</p>
        <p className="text-sm text-zinc-400">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1.5">Full Name</label>
          <input
            type="text"
            required
            placeholder="Emeka Okafor"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1.5">Email</label>
          <input
            type="email"
            required
            placeholder="emeka@example.com"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-zinc-500 mb-1.5">Subject</label>
        <input
          type="text"
          required
          placeholder="What's this about?"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-zinc-500 mb-1.5">Message</label>
        <textarea
          rows={5}
          required
          placeholder="Tell us what's on your mind..."
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
      >
        Send Message
      </button>
    </form>
  );
}
