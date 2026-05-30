# OPay x Google National Innovation Challenge 2026 — Shack Entry Plan

## The Prize
- 🥇 1st: **₦10,000,000** project grant + ₦300k scholarship + mentorship + job placement
- 🥈 2nd: ₦5,000,000 + ₦300k scholarship + fellowship
- 🥉 3rd: ₦3,000,000 + ₦300k scholarship + fellowship

**Application portal:** https://www.opayweb.com/innovation-challenge

---

## Critical Dates

| Date | What |
|------|------|
| May 25, 2026 | Applications opened |
| **June 14, 2026** | **Application deadline — SUBMIT BEFORE THIS** |
| June–August 2026 | Webinars + screening exam (30 questions, 30 mins). Top 10 teams advance |
| August–September 2026 | 6-week virtual bootcamp with OPay experts |
| July–December 2026 | Mentorship, internships, job placements |
| **November 6, 2026** | **Grand Finale** — top 4 teams pitch live to industry leaders + investors |

**Your exams:** June 1 → June 19. Submit by June 14 (during exams). Plan accordingly — finish everything by May 31.

---

## Eligibility Requirements

- ✅ Undergraduate student at a Nigerian tertiary institution
- ✅ Teams of **5 students** (you need 4 more teammates)
- ✅ Minimum CGPA: 2.8/4 (polytechnic) or 3.5/5 / Second Class Upper (university)
- ✅ Must demonstrate **Google Gemini** integration (Canva-Gemini workflow specifically mentioned)
- ✅ Preference for students with financial hardship
- ✅ Nigeria only

---

## Innovation Themes (Shack fits multiple)

| Theme | How Shack fits |
|-------|---------------|
| **Fintech & Digital Payments** | Wallet, Paystack integration, rent payments, ShackScore |
| **Digital Tools for SMEs** | Landlord tools, scout programme, artisan marketplace |
| **AI & Automation for Social Good** | Gemini AI assistant (being built now) |
| **Cybersecurity & Data Protection** | KYC/NIN/BVN verification, identity layer |

**Primary pitch angle:** Fintech + AI for Social Good — solving Nigeria's ₦500bn+ annual agent fee problem with a verified, AI-powered rental platform.

---

## What to Submit

1. **Online application form** — at opayweb.com/innovation-challenge
2. **Project proposal** — PDF, JPEG, or MP4, max 10MB
3. **Academic transcripts** — CGPA proof for all 5 team members

---

## Team Requirements

You need **4 more undergraduate teammates**. Ideal composition:

| Role | What they contribute |
|------|---------------------|
| You (CTO/Lead Dev) | Full-stack platform, Gemini integration |
| Business/Finance student | Market analysis, financial projections, pitch deck |
| Law/Social Science student | Tenancy law angle, social impact narrative |
| Design student | UI/UX, Canva-Gemini workflow (satisfies the requirement) |
| Marketing/Comms student | Presentation, demo video, proposal writing |

---

## The Gemini Integration (Built ✅)

The AI assistant (`/dashboard/ai-assistant`) is the key differentiator for the competition.

### What it does (not just chat):
1. **Pulls your live data** — tenancy status, rent schedule, wallet balance, ShackScore, applications
2. **Property intelligence** — searches available properties by LGA/budget, explains listings
3. **Market insights** — average rents by area, what's overpriced, neighbourhood context
4. **Tenant guidance** — explains verification tiers, how to improve ShackScore, what documents to prepare
5. **Landlord tools** — listing advice, pricing guidance, tenant screening tips
6. **Powered by Google Gemini** — satisfies the competition's AI requirement directly

### Technical stack for the feature:
- `POST /api/ai/chat` — server-side route, calls Gemini API with user context
- Pulls: user profile, tenancy, rent schedule, wallet, ShackScore, saved properties, applications
- Builds a rich system prompt with real data before calling Gemini
- Streams response back to client
- UI: floating assistant widget accessible from dashboard

---

## Build Checklist (Complete by May 31)

### Gemini Integration
- [x] `POST /api/ai/chat` route with data fetching + Gemini call
- [x] `GET /api/ai/context` route — returns user's full context snapshot
- [x] AI Assistant UI component (floating widget on dashboard)
- [x] Dashboard page `/dashboard/ai-assistant`
- [x] Add `GEMINI_API_KEY` to `.env` (get free key at aistudio.google.com)

### Proposal Document (write this)
- [ ] Problem statement: Lagos rental market, agent fees, ₦500bn+ annual extraction
- [ ] Solution: Shack platform overview
- [ ] AI feature: Gemini assistant with live data
- [ ] Impact metrics: tenants saved, fees eliminated, properties verified
- [ ] Team bios (all 5 members)
- [ ] Financial projections (Year 1–3)
- [ ] Demo video (screen recording, max 10MB MP4)

### Canva-Gemini Workflow (for the design student)
- Use Canva's AI features (powered by Gemini) to design the pitch deck
- Screenshot/document the workflow — judges want to see this explicitly
- Include in the proposal

---

## Pitch Narrative (use this framing)

> "Every year, Lagos tenants pay over ₦500 billion in agent fees to middlemen who add zero value. Shack eliminates this with a verified, direct-to-landlord platform — and now, with our Google Gemini-powered AI assistant, every tenant has a personal housing advisor that knows their financial situation, their tenancy status, and the Lagos market in real time. We're not building a product. We're fixing a system that has exploited millions of Nigerians for decades."

**Key numbers to memorise:**
- 10–15% agent fee on every Lagos rental
- ₦1.7m+ to move into an ₦800k/year flat (rent + caution + fees)
- 21 million Lagos residents, majority renters
- ₦1,500 — all a tenant pays on Shack (one-time verification)

---

## After Exams (June 19+)

If you advance past the screening exam:
- Bootcamp: August–September (virtual, manageable alongside work)
- Grand Finale: November 6 — prepare a live pitch + demo
- Keep building: more properties, more users, more data = stronger pitch

---

## Resources

- Competition portal: https://www.opayweb.com/innovation-challenge
- Gemini API (free): https://aistudio.google.com/app/apikey
- Canva AI (for design student): https://www.canva.com/ai-image-generator/
- Guardian Nigeria RSS (blog news): https://guardian.ng/tag/housing-market/feed/
- BusinessDay real estate: https://businessday.ng/real-estate/feed/
