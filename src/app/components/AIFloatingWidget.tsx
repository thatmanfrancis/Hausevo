"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
};

type HistoryItem = { role: "user" | "model"; text: string };

// ── Suggestions ────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "When is my next rent due?",
  "What is my Hausevo Score?",
  "Show properties in Yaba under ₦1m",
  "How do I improve my Hausevo Score?",
  "Explain my tenancy status",
  "How does verification work?",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
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

// ── AI icon ────────────────────────────────────────────────────────────────

function AIIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 3C12 3 13.2 7.8 15.5 10.5C17.8 13.2 22 12 22 12C22 12 17.8 12.8 15.5 15.5C13.2 18.2 12 22 12 22C12 22 10.8 18.2 8.5 15.5C6.2 12.8 2 12 2 12C2 12 6.2 11.2 8.5 8.5C10.8 5.8 12 3 12 3Z" />
      <path d="M19 3C19 3 19.6 5 20.5 5.9C21.4 6.8 23 7 23 7C23 7 21.4 7.2 20.5 8.1C19.6 9 19 11 19 11C19 11 18.4 9 17.5 8.1C16.6 7.2 15 7 15 7C15 7 16.6 6.8 17.5 5.9C18.4 5 19 3 19 3Z" opacity="0.7" />
    </svg>
  );
}

// ── Markdown renderer (** ** and * * → bold) ──────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  // Split on **bold** or *bold* patterns, preserving the delimiters
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={i} className="font-bold">{part.slice(1, -1)}</strong>;
    }
    // Preserve newlines
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>{line}{j < arr.length - 1 ? <br /> : null}</span>
    ));
  });
}

// ── Bubble ─────────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mb-1">
          <AIIcon size={12} />
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-zinc-900 text-white rounded-br-sm"
              : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm"
          }`}
        >
          {isUser ? msg.text : renderMarkdown(msg.text)}
        </div>
        <span className="text-[10px] text-zinc-400 px-1">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Date divider ───────────────────────────────────────────────────────────

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-zinc-100" />
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-zinc-100" />
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────

export default function AIFloatingWidget({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Last 20 messages as Gemini history
  const history: HistoryItem[] = messages.slice(-20).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    text: m.text,
  }));

  // Load persisted history on first open
  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai/history");
      if (res.ok) {
        const data = await res.json();
        setMessages(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            text: m.text,
            createdAt: new Date(m.createdAt),
          }))
        );
      }
    } catch {
      // Non-critical — start fresh
    } finally {
      setLoadingHistory(false);
      setHistoryLoaded(true);
    }
  }, [historyLoaded]);

  useEffect(() => {
    if (open) {
      loadHistory();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, loadHistory]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
        // Show the retryAfter countdown if rate limited
        if (res.status === 429 && data.retryAfter) {
          setError(`Slow down a bit — you can send another message in ${data.retryAfter}s.`);
        } else {
          setError(data.error ?? "Something went wrong.");
        }
        setLoading(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant" as const,
          text: data.reply,
          createdAt: new Date(),
        },
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    await fetch("/api/ai/history", { method: "DELETE" });
    setMessages([]);
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

  // Group messages by date for dividers
  const grouped: { divider?: string; msg?: Message }[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const dateStr = msg.createdAt.toDateString();
    if (dateStr !== lastDate) {
      grouped.push({ divider: formatDateDivider(msg.createdAt) });
      lastDate = dateStr;
    }
    grouped.push({ msg });
  }

  const isEmpty = messages.length === 0 && !loadingHistory;
  const firstName = userName.split(" ")[0];

  return (
    <>
      {/* ── Floating button ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI Assistant"
        className={`fixed bottom-[104px] right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
          open
            ? "bg-zinc-700 scale-95"
            : "bg-zinc-900 hover:bg-zinc-700 hover:scale-105"
        }`}
      >
        {open ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <AIIcon size={24} />
        )}
      </button>

      {/* ── Modal panel ── */}
      {open && (
        <>
          {/* Backdrop — mobile only */}
          <div
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed bottom-44 right-4 sm:bottom-24 sm:right-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-96 h-[460px] sm:h-[520px] bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 shrink-0">
                <AIIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-zinc-900 leading-none">Hausevo AI</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Powered by Google Gemini</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-400">Online</span>
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    title="Clear chat history"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-pulse" />
                    Loading your conversation history…
                  </div>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div>
                    <p className="text-sm font-extrabold text-zinc-900 mb-1">
                      Hey {firstName} 👋
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-[220px]">
                      Ask me anything about your tenancy, properties, or the Lagos market.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-white hover:text-zinc-900 transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {grouped.map((item, i) =>
                    item.divider ? (
                      <DateDivider key={`d-${i}`} label={item.divider} />
                    ) : item.msg ? (
                      <Bubble key={item.msg.id} msg={item.msg} />
                    ) : null
                  )}
                  {loading && (
                    <div className="flex items-end gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mb-1">
                        <AIIcon size={12} />
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-100 px-3 py-3 shrink-0">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything…"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors max-h-24 overflow-y-auto"
                  style={{ lineHeight: "1.5" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
