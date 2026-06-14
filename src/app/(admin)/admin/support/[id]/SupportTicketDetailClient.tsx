"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminReplyToTicket, adminUpdateSupportTicket, closeTicket } from "../../actions";

type Message = {
  id: string;
  content: string;
  createdAt: string | Date;
  attachments: string[];
  sender: { id: string; fullName: string; roles: string[] };
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  relatedEntity: string | null;
  relatedEntityId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: { id: string; fullName: string; email: string; roles: string[] };
  assignee: { id: string; fullName: string; email: string } | null;
  messages: Message[];
};

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-zinc-100 text-zinc-500",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-zinc-100 text-zinc-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function SupportTicketDetailClient({ ticket, currentAdminId }: { ticket: Ticket; currentAdminId: string }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [messages, setMessages] = useState(ticket.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const res = await adminReplyToTicket(ticket.id, reply.trim());
    if (res.success) {
      setReply("");
      router.refresh();
    }
    setSending(false);
  }

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true);
    await adminUpdateSupportTicket(ticket.id, { status });
    setUpdatingStatus(false);
    router.refresh();
  }

  async function handleClose() {
    await closeTicket(ticket.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-zinc-900 mb-2">{ticket.subject}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${statusColors[ticket.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                {ticket.status}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${priorityColors[ticket.priority] ?? "bg-zinc-100 text-zinc-500"}`}>
                {ticket.priority}
              </span>
              <span className="text-xs text-zinc-400">
                Opened {new Date(ticket.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Status quick-change */}
            {ticket.status !== "CLOSED" && (
              <>
                {["IN_PROGRESS","RESOLVED"].map((s) => (
                  ticket.status !== s && (
                    <button key={s} type="button" onClick={() => handleStatusChange(s)} disabled={updatingStatus}
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50">
                      Mark {s.replace("_", " ")}
                    </button>
                  )
                ))}
                <button type="button" onClick={handleClose}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Submitted By</p>
            <Link href={`/admin/users/${ticket.user.id}`} className="text-sm font-bold text-zinc-900 hover:underline">{ticket.user.fullName}</Link>
            <p className="text-xs text-zinc-400">{ticket.user.email} · {ticket.user.roles[0]}</p>
          </div>
          {ticket.assignee && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Assigned To</p>
              <p className="text-sm font-bold text-zinc-900">{ticket.assignee.fullName}</p>
              <p className="text-xs text-zinc-400">{ticket.assignee.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages thread */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Messages ({ticket.messages.length})
          </p>
        </div>
        <div className="flex flex-col gap-0 max-h-[480px] overflow-y-auto p-5">
          {ticket.messages.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-8">No messages yet.</p>
          )}
          {ticket.messages.map((msg) => {
            const isAdmin = msg.sender.roles.includes("ADMIN");
            return (
              <div key={msg.id} className={`mb-4 flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-[10px] font-bold ${isAdmin ? "text-zinc-400" : "text-zinc-500"}`}>
                      {msg.sender.fullName} · {isAdmin ? "Admin" : msg.sender.roles[0]}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 ${isAdmin ? "text-zinc-500" : "text-zinc-400"}`}>
                    {new Date(msg.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply box */}
        {ticket.status !== "CLOSED" && (
          <form onSubmit={handleReply} className="border-t border-zinc-100 p-4">
            <div className="flex gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
              />
              <button type="submit" disabled={sending || !reply.trim()}
                className="self-end rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
        {ticket.status === "CLOSED" && (
          <div className="border-t border-zinc-100 px-5 py-4">
            <p className="text-xs text-zinc-400 text-center font-semibold">This ticket is closed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
