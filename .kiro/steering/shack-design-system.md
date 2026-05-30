---
inclusion: always
---

# Shack Design System

This document captures the exact design patterns used across the Shack platform. Always follow these when building or editing any UI.

## Stack
- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4 (no component library — everything is hand-built)
- Fonts: Nunito (`font-sans`, primary), Pacifico (`font-serif`, display only)
- Icons: inline SVGs only — no icon library imports
- Toasts: `sonner`

## Layout
- Page background: `bg-[#f5f5f5]`
- Content max-width: `max-w-6xl mx-auto px-6 md:px-10 py-8` (public layout)
- Document pages (terms, privacy, faq, cookies): `max-w-3xl mx-auto py-4`
- Full-feature pages (about, team, careers, blog): `flex flex-col gap-16 py-4`

## Color Palette
Monochrome zinc — no gradients anywhere.

| Use | Class |
|-----|-------|
| Page background | `bg-[#f5f5f5]` |
| Card background | `bg-white` |
| Dark section / hero | `bg-zinc-900` |
| Primary text | `text-zinc-900` |
| Secondary text | `text-zinc-500` |
| Muted / labels | `text-zinc-400` |
| Card border | `border border-zinc-200` |
| Hover border | `hover:border-zinc-400` |

Semantic accent colors (badges, states only):
- Emerald: success, verified, guide category
- Amber: warning, market category
- Blue: info, product category
- Red: error, problem states

## Typography

| Element | Classes |
|---------|---------|
| Eyebrow label | `text-xs font-bold uppercase tracking-widest text-zinc-400` |
| Page H1 | `text-3xl font-extrabold text-zinc-900` or `text-4xl font-extrabold text-zinc-900 leading-tight` |
| Section H2 | `text-2xl font-extrabold text-zinc-900` |
| Card title | `text-sm font-extrabold text-zinc-900` |
| Body copy | `text-sm text-zinc-500 leading-relaxed` |
| Small / meta | `text-xs text-zinc-400` |
| Date / last updated | `text-sm text-zinc-400` |

## Cards
```
bg-white rounded-2xl border border-zinc-200 p-5
bg-white rounded-2xl border border-zinc-200 p-6   (larger content)
```
- No box shadows — borders only
- Hover: `hover:border-zinc-400 transition-colors`
- Dark card: `bg-zinc-900 rounded-2xl p-8`

## Buttons
Always `rounded-full`. Never `rounded-lg` or `rounded-md` for CTAs.

| Variant | Classes |
|---------|---------|
| Primary | `rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors` |
| Secondary | `rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors` |
| Ghost | `text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors` |
| Icon button | `flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors` |

## Badges / Pills
```
rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600
rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600
text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full
```

## Section Pattern (full-feature pages)
```tsx
<div>
  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
    Section label
  </p>
  {/* content */}
</div>
```

## Hero Pattern (full-feature pages)
```tsx
<div className="max-w-2xl">
  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Page name</p>
  <h1 className="text-4xl font-extrabold text-zinc-900 leading-tight mb-4">Headline</h1>
  <p className="text-lg text-zinc-500 leading-relaxed">Subtext</p>
</div>
```

## Dark Hero (about page style)
```tsx
<div className="bg-zinc-900 rounded-2xl p-8 md:p-12">
  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Label</p>
  <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4 max-w-2xl">Headline</h1>
  <p className="text-base text-zinc-400 leading-relaxed max-w-xl mb-8">Subtext</p>
</div>
```

## CTA Banner (bottom of pages)
```tsx
<div className="bg-zinc-900 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
  <div>
    <p className="text-lg font-extrabold text-white mb-1">Headline</p>
    <p className="text-sm text-zinc-400 max-w-md">Subtext</p>
  </div>
  <button className="rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0">
    CTA →
  </button>
</div>
```

## Document Page Pattern (terms, privacy, faq, cookies)
```tsx
<div className="max-w-3xl mx-auto py-4">
  <BackButton />
  <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Title</h1>
  <p className="text-sm text-zinc-400 mb-10">Last updated: ...</p>
  {/* sections */}
</div>
```

Section component:
```tsx
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-extrabold text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
```

## Accordion Pattern (FAQ)
- `+`/`-` icon in a square box (`rounded-lg border`)
- Box expands on hover: `w-7 h-7` → `w-9 h-9` with `transition-all duration-200`
- Open state: box fills `bg-zinc-900` with white icon
- Answer animates open with CSS grid trick: `grid-rows-[0fr]` → `grid-rows-[1fr]`

## Grids
- 2-col: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- 3-col: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- 4-col stats: `grid grid-cols-2 sm:grid-cols-4 gap-4`

## Spacing
- Section gap on full-feature pages: `gap-16`
- Card internal padding: `p-5` or `p-6`
- Between cards in a list: `gap-3` or `gap-4`
- Between label and content: `mb-6`

## Animations
- All transitions: `transition-colors` or `transition-all duration-200`
- Arrow hover: `group-hover:translate-x-1 transition-transform inline-block`
- Back button arrow: `group-hover:-translate-x-1 transition-transform duration-150`

## Security / Content Rules
- Never expose internal cookie names, session token names, or auth implementation details in public-facing pages
- Cookie policy should describe cookie *types* (Essential, Functional, Analytics) — not specific cookie names
- No dark mode classes (`dark:`) — the platform is light-mode only
