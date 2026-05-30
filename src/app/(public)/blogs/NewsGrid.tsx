"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
};

// ── Modal ──────────────────────────────────────────────────────────────────

function NewsModal({
  item,
  onClose,
}: {
  item: NewsItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {item.source}
              </span>
              {item.pubDate && (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="text-[10px] text-zinc-400">
                    {formatDate(item.pubDate)}
                  </span>
                </>
              )}
            </div>
            <p className="text-base font-extrabold text-zinc-900 leading-snug">
              {item.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {item.description ? (
            <p className="text-sm text-zinc-600 leading-relaxed mb-6">
              {item.description}
            </p>
          ) : (
            <p className="text-sm text-zinc-400 italic mb-6">
              No preview available for this article.
            </p>
          )}

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Read full article
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Grid ───────────────────────────────────────────────────────────────────

export default function NewsGrid({ news }: { news: NewsItem[] }) {
  const [selected, setSelected] = useState<NewsItem | null>(null);

  if (news.length === 0) return null;

  return (
    <>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Housing News
          </p>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(item)}
              className="group bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-3 hover:border-zinc-400 transition-colors text-left"
            >
              {/* Source + date */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {item.source}
                </span>
                {item.pubDate && (
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                    {formatDate(item.pubDate)}
                  </span>
                )}
              </div>

              {/* Title */}
              <p className="text-sm font-bold text-zinc-900 leading-snug group-hover:text-zinc-600 transition-colors flex-1">
                {item.title}
              </p>

              {/* Excerpt */}
              {item.description && (
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              )}

              {/* Read cue */}
              <div className="pt-2 border-t border-zinc-100 flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-zinc-700 transition-colors">
                Read more
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-x-0.5 transition-transform"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-zinc-400 mt-4">
          News sourced from BusinessDay NG. Content belongs to respective publishers.
        </p>
      </div>

      {/* Modal */}
      {selected && (
        <NewsModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
