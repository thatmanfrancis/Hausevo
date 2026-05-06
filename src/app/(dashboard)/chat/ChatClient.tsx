"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type Participant = { id: string; fullName: string };

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: Participant;
};

type Room = {
  id: string;
  isIdentityRevealed: boolean;
  property: { id: string; title: string; lga: string; listingType: string };
  participants: Participant[];
  messages: Message[];
};

type Props = {
  rooms: Room[];
  activeRoom: Room | null;
  userId: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const LISTING_BADGE: Record<string, string> = {
  RENT: "bg-blue-50 text-blue-700",
  SALE: "bg-emerald-50 text-emerald-700",
  SHORTLET: "bg-amber-50 text-amber-700",
  LEASE: "bg-purple-50 text-purple-700",
};

// ── Room list item ─────────────────────────────────────────────────────────

function RoomItem({ room, active, userId, onClick }: { room: Room; active: boolean; userId: string; onClick: () => void }) {
  const other = room.participants.find((p) => p.id !== userId);
  const lastMsg = room.messages[0];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
        active ? "bg-zinc-50 border-l-2 border-zinc-900" : "hover:bg-zinc-50 border-l-2 border-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
        {other ? initials(other.fullName) : "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-zinc-900 truncate">
            {room.isIdentityRevealed ? (other?.fullName ?? "Unknown") : "Anonymous"}
          </p>
          {lastMsg && <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(lastMsg.createdAt)}</span>}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{room.property.title}</p>
        {lastMsg && (
          <p className="text-xs text-zinc-400 truncate mt-0.5">{lastMsg.content}</p>
        )}
      </div>
    </button>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function Bubble({ msg, isOwn, revealed }: { msg: Message; isOwn: boolean; revealed: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-bold mb-1">
          {revealed ? initials(msg.sender.fullName) : "?"}
        </div>
      )}
      <div className={`max-w-[72%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isOwn && revealed && (
          <span className="text-[10px] font-bold text-zinc-400 px-1">{msg.sender.fullName}</span>
        )}
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isOwn
            ? "bg-zinc-900 text-white rounded-br-sm"
            : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm"
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-zinc-400 px-1">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ChatClient({ rooms: initialRooms, activeRoom: initialActive, userId }: Props) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  const [active, setActive] = useState<Room | null>(initialActive);
  const [messages, setMessages] = useState<Message[]>(initialActive?.messages ?? []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!initialActive);
  const [revealing, setRevealing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only auto-scroll if user is already near the bottom
  function scrollToBottomIfNeeded(force = false) {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "instant" : "smooth" });
    }
  }

  // Scroll to bottom on initial load only
  useEffect(() => {
    scrollToBottomIfNeeded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // Poll for new messages every 3s — only scroll if user is near bottom
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/chat/${active.id}/messages?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        scrollToBottomIfNeeded(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  function openRoom(room: Room) {
    setActive(room);
    setMessages(room.messages);
    setShowSidebar(false);
    router.replace(`/chat?room=${room.id}`, { scroll: false });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !input.trim() || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: userId, fullName: "You" },
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottomIfNeeded(true);

    try {
      const res = await fetch(`/api/chat/${active.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data.message : m));
        // Update room list preview
        setRooms((prev) => prev.map((r) =>
          r.id === active.id ? { ...r, messages: [data.message] } : r
        ));
      }
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  const other = active?.participants.find((p) => p.id !== userId);
  const displayName = active?.isIdentityRevealed ? (other?.fullName ?? "Landlord") : "Anonymous";

  async function handleReveal() {
    if (!active) return;
    setRevealing(true);
    try {
      const res = await fetch(`/api/chat/${active.id}/reveal`, { method: "PATCH" });
      if (res.ok) {
        setActive((prev) => prev ? { ...prev, isIdentityRevealed: true } : prev);
        setRooms((prev) => prev.map((r) => r.id === active.id ? { ...r, isIdentityRevealed: true } : r));
      }
    } catch {
      // Silent fail
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-zinc-200 overflow-hidden">

      {/* ── Sidebar: room list ── */}
      <div className={`${showSidebar ? "flex" : "hidden"} md:flex flex-col w-full md:w-72 shrink-0 border-r border-zinc-100`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-extrabold text-zinc-900">Messages</h2>
          <span className="text-xs font-bold text-zinc-400">{rooms.length}</span>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-700 mb-1">No conversations yet</p>
              <p className="text-xs text-zinc-400 mb-4">Start a chat from a property listing</p>
              <Link href="/properties" className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors">
                Browse properties
              </Link>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                active={active?.id === room.id}
                userId={userId}
                onClick={() => openRoom(room)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat thread ── */}
      <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}>
        {active ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
              {/* Back button (mobile) */}
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-500"
                aria-label="Back to conversations"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                {active.isIdentityRevealed && other ? initials(other.fullName) : "?"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900">{displayName}</p>
                <Link
                  href={`/properties/${active.property.id}`}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors truncate block"
                >
                  {active.property.title} · {active.property.lga}
                </Link>
              </div>

              {/* Listing type badge */}
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${LISTING_BADGE[active.property.listingType] ?? "bg-zinc-100 text-zinc-600"}`}>
                {active.property.listingType.charAt(0) + active.property.listingType.slice(1).toLowerCase()}
              </span>

              {/* Reveal identity button */}
              {!active.isIdentityRevealed && (
                <button
                  type="button"
                  onClick={handleReveal}
                  disabled={revealing}
                  title="Reveal identities"
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-zinc-700 mb-1">Start the conversation</p>
                  <p className="text-xs text-zinc-400">Ask about the property, arrange a viewing, or negotiate terms.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.sender.id === userId}
                    revealed={active.isIdentityRevealed}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Anonymous notice */}
            {!active.isIdentityRevealed && (
              <div className="mx-4 mb-2 rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p className="text-xs text-zinc-500">
                  Chat is anonymous. Identities are revealed when both parties agree.
                </p>
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </>
        ) : (
          /* No active room — desktop empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-base font-extrabold text-zinc-900 mb-1">Select a conversation</p>
            <p className="text-sm text-zinc-400">Choose a chat from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
