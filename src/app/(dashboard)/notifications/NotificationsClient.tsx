"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  actionUrl?: string | null;
  metadata: unknown;
  createdAt: Date;
};

type Props = {
  notifications: Notification[];
  unreadCount: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getNotificationIcon(type: string) {
  switch (type) {
    case "PAYMENT":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      );
    case "APPLICATION":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      );
    case "MAINTENANCE":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      );
    case "VERIFICATION":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      );
    case "MESSAGE":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      );
  }
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return new Date(date).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: new Date(date).getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// ── Main component ─────────────────────────────────────────────────────────

export default function NotificationsClient({ notifications, unreadCount: initialUnreadCount }: Props) {
  const router = useRouter();
  const [notificationList, setNotificationList] = useState(notifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  async function handleNotificationClick(id: string, isRead: boolean, actionUrl?: string | null) {
    if (!isRead) {
      await markAsRead(id);
    }
    if (actionUrl) {
      router.push(actionUrl);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotificationList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  }

  async function markAllAsRead() {
    setMarkingAllRead(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotificationList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Updates
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAllRead}
            className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-sm font-bold hover:border-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markingAllRead ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-700">{unreadCount}</span>
            </div>
            <p className="text-sm text-zinc-600">
              You have <span className="font-bold text-zinc-900">{unreadCount}</span> unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Notifications list */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {notificationList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-900 mb-1">No notifications yet</p>
            <p className="text-xs text-zinc-500 text-center max-w-xs">
              When you receive updates about your applications, payments, or messages, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {notificationList.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.actionUrl)}
                className={`w-full flex items-start gap-4 p-5 text-left transition-colors cursor-pointer ${
                  notification.isRead
                    ? "bg-white hover:bg-zinc-50"
                    : "bg-emerald-50/30 hover:bg-emerald-50/50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    notification.isRead
                      ? "bg-zinc-100 text-zinc-400"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p
                      className={`text-sm font-bold ${
                        notification.isRead ? "text-zinc-700" : "text-zinc-900"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">
                    {notification.body}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] font-semibold text-zinc-400">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                    {notification.actionUrl && (
                      <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-1.5 text-[10px] font-bold text-white hover:bg-zinc-800 transition-colors">
                        View More
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notificationList.length > 0 && (
        <p className="text-xs text-zinc-400 text-center">
          Showing the last {notificationList.length} notification{notificationList.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
