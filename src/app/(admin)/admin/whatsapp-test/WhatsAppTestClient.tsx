"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  from: "user" | "bot";
  text: string;
  intent?: string;
  latencyMs?: number;
  timestamp: Date;
}

const QUICK_TESTS = [
  { label: "Rent search", text: "Looking for a mini flat in Yaba under 1.5M" },
  { label: "Sale search", text: "I want to buy a 3 bedroom duplex in Lekki for 80M" },
  { label: "Shortlet", text: "Need a shortlet apartment in Victoria Island" },
  { label: "Savings", text: "How much have we saved in our joint pool?" },
  { label: "General", text: "Hello, what is Hausevo and how does it work?" },
  { label: "Fees", text: "Do you charge agent fees?" },
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* WhatsApp-style header */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#128C7E] shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Hausevo</p>
          <p className="text-[10px] text-[#a8d5cf]">AI Property Assistant · Online</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-[#a8d5cf] font-bold">LIVE</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function BotBubble({ message }: { message: Message }) {
  // Render WhatsApp *bold* markdown
  const formatted = message.text
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <div className="flex items-end gap-2 max-w-[85%]">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#075E54] mb-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <div className="rounded-2xl rounded-bl-sm bg-white border border-zinc-100 px-4 py-3 shadow-sm">
          <p
            className="text-sm text-zinc-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        </div>
        <div className="flex items-center gap-2 px-1">
          {message.intent && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
              {message.intent}
            </span>
          )}
          {message.latencyMs !== undefined && (
            <span className="text-[9px] text-zinc-400">
              {message.latencyMs}ms
            </span>
          )}
          <span className="text-[9px] text-zinc-400">
            {message.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] flex flex-col items-end gap-1">
        <div className="rounded-2xl rounded-br-sm bg-[#DCF8C6] px-4 py-3">
          <p className="text-sm text-zinc-800 leading-relaxed">{message.text}</p>
        </div>
        <span className="text-[9px] text-zinc-400 px-1">
          {message.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#075E54]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white border border-zinc-100 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppTestClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "bot",
      text: "👋 *Welcome to the Hausevo WhatsApp Gateway Test Console*\n\nType any message below to simulate what a real WhatsApp user would send. I'll show you exactly what they'd receive back.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("+2348012345678");
  const [loading, setLoading] = useState(false);
  const [rawXml, setRawXml] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      from: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setRawXml(null);

    const start = Date.now();

    try {
      // Simulate Twilio's URL-encoded POST body
      const body = new URLSearchParams({
        Body: text.trim(),
        From: `whatsapp:${phone}`,
      });

      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const latencyMs = Date.now() - start;
      const xml = await res.text();
      setRawXml(xml);

      // Extract message text from TwiML <Message>...</Message>
      const match = xml.match(/<Message>([\s\S]*?)<\/Message>/i);
      let replyText = match?.[1] ?? "No response received.";

      // Unescape XML entities
      replyText = replyText
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');

      // Try to detect intent from the response for the badge
      let intent: string | undefined;
      if (replyText.includes("ZERO AGENT FEES") || replyText.includes("properties")) {
        intent = "PROPERTY_SEARCH";
      } else if (replyText.includes("Savings Pool") || replyText.includes("savings")) {
        intent = "SAVINGS_INQUIRY";
      } else {
        intent = "GENERAL";
      }

      const botMsg: Message = {
        id: crypto.randomUUID(),
        from: "bot",
        text: replyText,
        intent,
        latencyMs,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const botMsg: Message = {
        id: crypto.randomUUID(),
        from: "bot",
        text: "⚠️ *Error*\n\nCould not reach the webhook. Make sure your dev server is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Phone number input */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Simulated sender number
          </p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+2348012345678"
            className="w-full text-sm font-bold text-zinc-900 outline-none bg-transparent placeholder:text-zinc-300"
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
          Active
        </span>
      </div>

      {/* Quick test buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_TESTS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => sendMessage(t.text)}
            disabled={loading}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setMessages([{
              id: "welcome",
              from: "bot",
              text: "👋 *Welcome to the Hausevo WhatsApp Gateway Test Console*\n\nType any message below to simulate what a real WhatsApp user would send.",
              timestamp: new Date(),
            }]);
            setRawXml(null);
          }}
          className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:border-red-200 hover:text-red-500 transition-colors ml-auto"
        >
          Clear
        </button>
      </div>

      {/* Chat window */}
      <PhoneFrame>
        <div className="h-[420px] overflow-y-auto bg-[#ECE5DD] p-4 flex flex-col gap-3">
          {messages.map((msg) =>
            msg.from === "user" ? (
              <UserBubble key={msg.id} message={msg} />
            ) : (
              <BotBubble key={msg.id} message={msg} />
            )
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-zinc-200">
          <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center gap-2 border border-zinc-200">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={loading}
              className="flex-1 text-sm text-zinc-900 outline-none bg-transparent placeholder:text-zinc-400 disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#075E54] text-white hover:bg-[#054d44] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </PhoneFrame>

      {/* Raw TwiML output */}
      {rawXml && (
        <div className="bg-zinc-900 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Raw TwiML Response
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(rawXml)}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
            {rawXml}
          </pre>
        </div>
      )}
    </div>
  );
}
