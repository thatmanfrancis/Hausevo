# Fixes Task List

## 1. PWA Modal — replace house SVG icon with Hausevo logo
- File: `src/components/PWAInstallHandler.tsx`
- The `showPopup` banner has a house SVG in the icon box — replace with `<Image src="/hausevofinal.png" />`

## 2. /properties page flicker — heading changes between "near you" and "in Lagos"
- Root cause: `LocationDetector` sets geo params via URL, causing a re-render after SSR
  which changes `locationSource` from "all" → "geo", flipping the heading
- Fix: On the /properties page, only show location-aware heading when `locationSource === "search"` (user explicitly searched). Never auto-change heading on the listings page based on geo. Geo detection should only affect the homepage.

## 3. Property detail page — AI property analysis panel
- File: `src/app/(public)/properties/[id]/PropertyDetailClient.tsx`
- Add a new section below the 3-column grid: "AI Property Analysis"
- It's a client-side panel that calls a new API endpoint `POST /api/ai/property-analysis`
  with the property data and returns a Gemini-generated score + summary
- Works for both guests and logged-in users (no auth required)
- New API route: `src/app/api/ai/property-analysis/route.ts`

## 4. AI chat bold text rendering — parse * * and ** ** to <strong>
- File: `src/app/components/AIFloatingWidget.tsx`
- The `Bubble` component renders raw text — add a simple inline parser that converts
  `**text**` and `*text*` to `<strong>text</strong>` using dangerouslySetInnerHTML

## 5. Seed file — simplify to 3 demo accounts + 20 properties with Nigerian home images
- One admin (also tenant, landlord, artisan — multi-role)  
- One pure tenant
- One pure landlord
- 20 properties using Unsplash Nigerian-context images (real house photography, not AI)
- Remove the extra 15 tenants + 10 landlords bulk seeding

## 6. Confirm: can a user be an artisan?
- Yes — roles is an array. A user can have ["TENANT", "ARTISAN"] or any combo.
- The seed admin will demonstrate this with all 4 roles.
