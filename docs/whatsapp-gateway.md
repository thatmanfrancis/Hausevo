# Hausevo WhatsApp Gateway — Architecture Specification

## Overview

A Twilio-powered WhatsApp webhook that routes incoming messages through Gemini 2.5 Flash for intent classification, then queries the Prisma/PostgreSQL database and returns a formatted TwiML response.

**Route:** `POST /api/whatsapp`  
**Trigger:** Twilio WhatsApp sandbox / production number  
**AI Engine:** Gemini 2.5 Flash (via REST API, same pattern as `/api/ai/chat`)

---

## Message Flow

```
WhatsApp User
     │
     ▼
Twilio (parses message, POSTs to webhook)
     │
     ▼
POST /api/whatsapp
  ├── Parse URL-encoded body (Body, From)
  ├── Gemini: Intent Classification
  │     ├── HOUSE_SEARCH  → extract {location, maxBudget, rooms}
  │     ├── SAVINGS_INQUIRY → query JointSavings by phone
  │     └── GENERAL → conversational reply
  ├── Prisma query (property search OR savings lookup)
  ├── Gemini: Format conversational response
  └── Return TwiML XML
     │
     ▼
Twilio → WhatsApp User
```

---

## Intent Scenarios

### Scenario A — House Search
**Trigger phrases:** "looking for", "need a flat", "apartment in", "house in", "mini flat", "self contain", "2 bedroom"

**Gemini extracts:**
```json
{
  "intent": "HOUSE_SEARCH",
  "location": "Yaba",
  "maxBudget": 1500000,
  "rooms": 1
}
```

**DB query:**
```typescript
prisma.property.findMany({
  where: {
    status: "AVAILABLE",
    lga: { contains: location, mode: "insensitive" },
    pricePerYear: { lte: maxBudget }
  },
  take: 3
})
```

**Response format:**
```
🏠 *3 properties found in Yaba under ₦1.5M*

✅ NO AGENT FEES — EVER

1. *Mini Flat, Yaba*
   📍 22 Herbert Macaulay Way
   💰 ₦900,000/yr (Total: ₦950,000)
   🛏 1 bed | 🚿 1 bath
   🔗 hausevo.com/properties/[id]

2. ...

Search more: hausevo.com/properties?lga=Yaba
```

### Scenario B — Savings Inquiry
**Trigger phrases:** "my savings", "rent pool", "joint savings", "how much have we saved"

**DB query:**
```typescript
prisma.jointSavings.findFirst({
  where: {
    members: { some: { phoneNumber: fromNumber } },
    status: "ACTIVE"
  }
})
```

**Response format:**
```
💰 *Your Joint Savings Pool*

Pool: "Yaba Flatmates 2026"
Target: ₦1,200,000
Saved: ₦480,000 (40%)
Target date: Dec 2026
Status: ACTIVE

Top up: hausevo.com/wallet
```

### Scenario C — General
Gemini handles conversationally with Hausevo context injected.

---

## Database Models Added

### JointSavings
Collaborative rent-pooling for co-tenants splitting rent upfront.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| title | String | Pool name |
| targetAmount | Float | Total rent target |
| currentAmount | Float | Amount saved so far |
| targetDate | DateTime | When rent is due |
| status | JointSavingsStatus | ACTIVE / COMPLETED / BROKEN |
| members | User[] | Many-to-many |
| contributions | SavingsContribution[] | Audit ledger |
| createdAt | DateTime | |

### SavingsContribution
Individual deposit audit trail.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| amount | Float | Deposit amount |
| userId | String | FK → User |
| jointSavingsId | String | FK → JointSavings |
| timestamp | DateTime | When deposited |

### DocumentVault
Tenant KYC document tracking (structured alternative to VaultItem for onboarding).

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| userId | String | FK → User |
| docType | DocType enum | NIN / Passport / WorkID / BankStatement |
| status | DocStatus enum | PENDING / VERIFIED / REJECTED |
| fileUrl | String | Cloudinary URL |
| verifiedAt | DateTime? | When admin verified |
| createdAt | DateTime | |

---

## Scout Payout Engine

When admin calls `approveProperty(id)`, the system now runs an atomic `$transaction`:

1. Sets `property.status = "AVAILABLE"`
2. Checks if `property.proxySubmitterId` exists (Scout listing)
3. If yes: increments `User.walletBalance += 5000` for the Scout
4. Creates a `Transaction` record (type: REWARD, amount: 5000)
5. Sends in-app notification to Scout

This replaces the previous simple `prisma.property.update` call.

---

## Environment Variables Required

```env
GEMINI_API_KEY=...          # Already set
TWILIO_AUTH_TOKEN=...       # For webhook signature validation (optional in dev)
NEXT_PUBLIC_APP_URL=...     # Already set — used for property deep links
```

---

## TwiML Response Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    🏠 *Found 2 properties in Surulere*
    ...
  </Message>
</Response>
```

Content-Type: `text/xml`

---

## Security Notes

- Twilio signature validation should be enabled in production (requires `TWILIO_AUTH_TOKEN`)
- Phone numbers from Twilio arrive as `whatsapp:+2348012345678` — strip the `whatsapp:` prefix before DB lookup
- Rate limiting: 10 requests per phone per 5 minutes (prevents abuse)
- No user session required — phone number is the identity anchor
