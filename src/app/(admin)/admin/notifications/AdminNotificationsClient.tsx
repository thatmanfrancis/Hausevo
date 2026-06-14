"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string | Date;
};

type Props = {
  notifications: Notification[];
  unreadCount: number;
  totalNotifications: number;
  totalPages: number;
  currentPage: number;
};

function typeIcon(type: string) {
  switch (type) {
    case "DISPUTE_UPDATE":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      );
    case "DOC_VERIFIED":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
        </svg>
      );
    case "REWARD_PAID":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      );
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      );
  }
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 7) return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

export default function AdminNotificationsClient({ notifications, unreadCount, totalNotifications, totalPages, currentPage }: Props) {
  const router = useRouter();
  const [list, setList] = useState(notifications);
  const [unread, setUnread] = useState(unreadCount);
  const [markingAll, setMarkingAll] = useState(false);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setList((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((p) => Math.max(0, p - 1));
  }

  async function markAllRead() {
    setMarkingAll(true);
    await fetch("/api/notifications/read-all", { method: "POST" });
    setList((p) => p.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    setMarkingAll(false);
  }

  function goToPage(p: number) { router.push(`/admin/notifications?page=${p}`); }

  return (
    <div className="flex flex-col gap-4">
      {unread > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-zinc-200 px-5 py-3">
          <p className="text-sm text-zinc-700">
            <span className="font-bold text-zinc-900">{unread}</span> unread notification{unread !== 1 ? "s" : ""}
          </p>
          <button type="button" onClick={markAllRead} disabled={markingAll}
            className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-1.5 text-xs font-bold hover:border-zinc-400 transition-colors disabled:opacity-50">
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-900">No notifications</p>
            <p className="text-xs text-zinc-400 mt-1">Platform alerts will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {list.map((n) => (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) markRead(n.id); if (n.actionUrl) router.push(n.actionUrl); }}
                className={`flex items-start gap-4 p-5 cursor-pointer transition-colors ${n.isRead ? "bg-white hover:bg-zinc-50" : "bg-emerald-50/30 hover:bg-emerald-50/50"}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.isRead ? "bg-zinc-100 text-zinc-400" : "bg-emerald-100 text-emerald-600"}`}>
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-bold ${n.isRead ? "text-zinc-700" : "text-zinc-900"}`}>{n.title}</p>
                    {!n.isRead && <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 mt-1.5" />}
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Always-visible pagination */}
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-semibold">{totalNotifications} total · Page {currentPage} of {Math.max(totalPages, 1)}</p>
          <div className="flex items-center gap-1">
            <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-xs font-bold text-zinc-600 px-2">{currentPage} / {Math.max(totalPages, 1)}</span>
            <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
