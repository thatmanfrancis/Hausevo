"use client";

import { useState, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
};

type HistoryItem = { role: "user" | "model"; text: string };

// ── Suggested prompts ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  "When is my next rent due?",
  "What is my ShackScore and how do I improve it?",
  "Show me available properties in Yaba under ₦1m",
  "What documents do I need to apply for a property?",
  "How does the verification process work?",
  "What's the average rent in Lekki right now?",
  "Explain my tenancy agreement status",
  "How do I earn from the Scout Programme?",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white mb-1">
          {/* Gemini-style spark icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-zinc-900 text-white rounded-br-sm"
              : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm"
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-zinc-400 px-1">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AIAssistantClient({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build history for Gemini (last 10 turns)
  const history: HistoryItem[] = messages.slice(-10).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    text: m.text,
  }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.reply,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl border border-zinc-200 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-extrabold text-zinc-900">Shack AI</p>
          <p className="text-xs text-zinc-400">Powered by Google Gemini · knows your account</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-400">Online</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center gap-6">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
                </svg>
              </div>
              <p className="text-base font-extrabold text-zinc-900 mb-1">
                Hey {userName.split(" ")[0]}, I&apos;m your Shack AI
              </p>
              <p className="text-sm text-zinc-500 max-w-sm">
                I know your tenancy, wallet, ShackScore, and the Lagos property market.
                Ask me anything.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <Bubble key={msg.id} msg={msg} />
            ))}
            {loading && (
              <div className="flex items-end gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white mb-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
                  </svg>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your tenancy, properties, ShackScore…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-zinc-400 mt-2 text-center">
          Shack AI can make mistakes. Verify important information independently.
        </p>
      </div>
    </div>
  );
}
