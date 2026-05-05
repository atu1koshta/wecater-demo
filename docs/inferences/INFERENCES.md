# WeCater Engineering Inferences

Key decisions and constraints extracted from product docs. Engineers read this before building.

---

## MVP Definition

**Done = zero founder intervention on this path:**

> Pharma rep in Phoenix → opens wecater.ai on phone → creates team profile in 30 seconds → types natural-language request → sees 3-5 options (Tier 1 bookable + Tier 3 quote-request) → books via Stripe OR sends Tier 3 inquiry → tracked through delivery → earns personal cashback → redeems Amazon gift card.

Instrumentation is not optional — every hypothesis is measured via PostHog events from Day 1.

---

## End-to-End Flow

### Tier 1 (bookable order)

```
Sally                          WeCater                        Rob
─────                          ───────                        ───
Opens wecater.ai on phone
Magic-link signup          →   user + empty profile created
First-run team profile     →   headcount, dietary, address,
wizard                         budget stored
Types prompt               →   LLM extracts constraints
                               + merges team profile context
Reviews parsed fields
Sees ranked results        →   Tier 1 priority, max 1 Tier 3
                               Chatbot applies surfacing rules
Picks Tier 1 → checkout    →   Stripe PaymentIntent (AUTH-HOLD)
                               order = REQUESTED
                           →   SMS + browser push         →   Receives SMS
                                                              Opens accept console
                           ←   order = ACCEPTED           ←   Accepts
SMS "Confirmed"
                               [delivery day]
                           ←   order = DELIVERED          ←   Marks delivered
                               Stripe capture + transfer
                               Rewards credited
SMS "$X earned personally"
Opens wallet → redeems     →   Amazon gift card emailed
```

### Tier 3 — Non-urgent (>24hr lead time)

```
Sally                          WeCater                        Rob
─────                          ───────                        ───
Taps "Send my request"     →   Structured email generated
                               (order context + WeCater
                               intro + sign-up CTA)
                           →   Email sent to restaurant   →   Receives inquiry email
                               Sally gets copy                May respond directly to
                               Tracked: open, click,          Sally (leakage accepted)
                               Rob response                   OR signs up with WeCater
```

### Tier 3 — Urgent (<24hr lead time)

```
Sally                          WeCater                        Rob
─────                          ───────                        ───
Taps "Call directly"       →   Phone number revealed
                               Modal: "Also email them?"
  Yes                      →   Same email flow above
  No                       →   Phone only
tap-to-call event tracked
```

### Order State Machine

```
REQUESTED → ACCEPTED → DELIVERED → PAID
               │
          (timeout / no accept)
               ↓
          ESCALATED → founder intervention
```

> Payment: auth-hold at checkout. Captured only on DELIVERED. Never before.

---

## Tier System

| Tier | What | MVP? |
|------|------|------|
| Tier 1 | Full partners, Stripe Connect, real bookable orders | Yes — target 12-15 |
| Tier 2 | Olo/Toast/MonkeyMedia agentic checkout | **NO — Phase 2 only** |
| Tier 3 | Public listings, synthesized data, quote-request/phone flow | Yes — 800-1500 listings |

**Tier 3 sub-segments:**

| Segment | Criteria | Sales priority | Outreach copy |
|---------|----------|---------------|---------------|
| 3a | NOT on ezCater | Higher | No ezCater mention |
| 3b | ON ezCater | Lower | Acknowledges ezCater relationship |

**Auto-detect:** restaurant absent from ezCater prospecting DB → Tier 3a. Present → Tier 3b.

**Critical constraints:**
- ezCater prospecting DB is segregated — never flows to user-facing product
- Tier assignment cross-references it internally only
- Tier 3 visibility in UI controlled by PostHog feature flag (can toggle without deploy)

---

## Data Ingestion Modes

| # | Mode | Trigger | Sources | Owner | Story |
|---|------|---------|---------|-------|-------|
| 1 | Scheduled multi-source scraper | Cron job | ezCater (prospecting only), Olo, Toast, MonkeyMedia, Google Business, Yelp, restaurant own sites | Pritish | A-1 |
| 2 | LLM extraction from scraped data | Post-scrape | Normalized from mode 1 | Pritish | A-2 |
| 3 | Menu PDF upload | Rob onboarding (no public menu) | Rob-provided PDF | Pritish | A-5 |
| 4 | Tier 1 ezCater-sourcing (Option 2) | Rob shares ezCater URL on onboarding call (explicit consent) | Rob's ezCater listing + own site + Google + Yelp | Pritish+Atul | L-12/L-13 |
| 5 | Rob-declines-ezCater fallback | Rob declines mode 4 | Own site + PDF + verbal dictation + Excel/Google Sheet | Atul | L-15 |
| 6 | Async image population | Post-onboarding | Rob upload + Google Business/Yelp + AI-generated for gaps | Pritish+Atul | L-14 |

**ezCater data rule:** modes 1 and 4 touch ezCater data. Mode 1 output → segregated prospecting DB only. Mode 4 → requires Rob's timestamped recorded consent before pull.

---

## Epic B — Rob Onboarding & Accept Console

**Outcome:** Rob goes from cold invite → Stripe-connected → listing approved → live on platform → can accept orders from phone browser.

### Flow

```
Founder triggers invite
        ↓
Rob receives SMS + email magic link (B-1)
        ↓
Rob clicks link → onboarding flow opens
        ↓
Rob e-signs participation agreement (B-6)        ← load-bearing legally
[MFN warranty + standing authority + delisting clause]
        ↓
Rob completes Stripe Connect Express setup (B-2)  ← ⚠ biggest risk (edge cases)
[bank verification, identity check]
        ↓
Rob configures catering settings (B-3)
[cashback% OR discount%, lead time, delivery radius, hours, accepting toggle]
        ↓
WeCater builds listing via synthesis pipeline (L-1/L-13)
Rob reviews + approves listing (L-2 validator UI)
        ↓
Rob clicks ToS clickwrap (B-7)
        ↓
Rob is LIVE — Tier 1 partner
        ↓
New order arrives → Rob gets SMS + browser push
Rob opens accept console on phone (B-4)
Rob accepts within SLA window (B-5)
        ↓
Order = ACCEPTED  [if timeout → ESCALATED → founder ops]
```

### Focus areas (highest risk)

**⚠ B-2 Stripe Connect Express** — spike in Week 1. Bank verification + identity checks have real edge cases. If this slips, no Rob can go live. Nothing else matters until this is resolved.

**⚠ B-6 participation agreement** — not a checkbox. Timestamp + record consent moment. This is what makes Option 2 (ezCater pull) legally defensible. Missing this = legal exposure.

**⚠ B-4 accept console** — Rob is in a kitchen or on the road. Must be mobile-first, not desktop with mobile fallback. Acceptance UX failure = orders stuck in REQUESTED.

### Key constraints
- Rob does NOT set pricing — parity enforced via audit against Rob's own site
- Rob picks cashback % OR discount % — not both (D8, decision pending end Week 2)
- No automated dispute handling in MVP — founder ops console handles all escalations

---

## Epic C — Sally Experience (16 SP)

**Outcome:** Sally signs up, builds team profile, types natural-language request, gets ranked options, adds to cart, checks out via Stripe, tracks order status.

### Flow

```
Sally opens wecater.ai on phone
        ↓
Magic-link auth (C-1)
        ↓
First-run team profile wizard (K-1)               ← ⚠ critical path
[headcount, dietary restrictions, delivery address, budget]
        ↓
Types prompt (C-2 search UI)
e.g. "Usual for Tuesday team" / uses structured filters
        ↓
LLM extracts constraints (C-3)                    ← Pritish
+ merges team profile context
Sally reviews + confirms parsed fields
        ↓
Recommendation engine ranks options (C-4)         ← Pritish
[Tier 1 priority, dietary fit score, budget match]
        ↓
Sally picks restaurant → AI cart builder (C-5)    ← Pritish
[auto-builds cart from menu + team profile + constraints]
[post-validation: dietary conflicts flagged]
        ↓
Sally edits cart if needed (C-6)
        ↓
Sally checks out (C-7)
→ Stripe PaymentIntent (AUTH-HOLD)
→ order = REQUESTED
        ↓
Sally views order status page (C-8)
[tracks REQUESTED → ACCEPTED → DELIVERED]
```

### Focus areas (highest risk)

**⚠ C-3 + C-4 AI extraction + ranking** — quality here = match rate (L-6 target ≥60%). Low match rate = Sally doesn't order = MVP fails. Dietary accuracy is non-negotiable (pharma reps face professional consequences from dietary failures).

**⚠ C-5 AI cart builder** — math in code, narration in LLM. Dietary fit scoring + item selection must be deterministic. LLM only writes the cart summary prose.

**⚠ Team profile (K-1) is upstream of everything** — if Sally skips profile wizard, C-3/C-4/C-5 have no context. Profile completion must be ≥70% (D9: required vs skippable — decision pending end Week 2).

### Key constraints
- Mobile-first — all Sally UI built for phone first
- Dietary conflict override rate target ≤15% (quality signal)
- `complianceTracking: boolean` on profile model — pharma-only features gate on this flag

---

## Epic D — Order Lifecycle & State Machine (7 SP)

**Outcome:** Every order transitions correctly from creation → payment. Backbone all other epics depend on.

### State machine

```
REQUESTED → ACCEPTED → DELIVERED → PAID
               │
          (timeout / no accept)
               ↓
          ESCALATED → founder ops console
```

### Components

**D-1 Order state machine + transitions (Atul)** — every transition fires: correct notification (Epic F) + Sally status page update (C-8) + correct Stripe action (D-3).

**D-2 Scheduled jobs worker — Inngest (Pritish):**
- Accept SLA timeout → auto-escalate
- Auth-hold expiry monitoring
- Delivery reminder to Rob
- All time-based state transitions

**D-3 Payment capture on delivery (Atul):**
```
DELIVERED event
    → Stripe capture fires
    → Transfer to Rob's Connect Express account
    → Rewards accrual triggered (Epic E)
```
Never capture before DELIVERED.

### Focus areas (highest risk)

**⚠ Auth-hold expiry** — Stripe auth holds expire ~7 days. Order placed far in advance + Rob marks delivered after expiry = capture fails. Resolve before building D-3: either re-authorize before expiry OR restrict how far out orders can be placed in MVP. Raise with Preet.

---

## Epic E — Rewards Accrual & Native Redemption (11 SP)

**Outcome:** Sally earns Bites on every paid order, sees wallet balance, redeems via three routes. Rob funds his own earn rate via escrow.

### Key rules
- Currency = **Bites**. 100 Bites = $1. Never use "cashback" in UI.
- Bites credited on `PAID` event (D-3 triggers E-1)
- Rob sets earn rate: 1X–15X. Rob funds his own rate via pre-funded escrow (see below).
- One universal Bites wallet per Sally. Per-restaurant earn tracked invisibly — never shown to Sally.
- Welcome 2X bonus on first order — accelerates second order (HYP-5)
- Breakage target 12–25% — unredeemed Bites = margin WeCater keeps. Don't build anything that reduces breakage artificially.
- **Math always in code** — accrual calc, redemption value, Restaurant Boost forecast all deterministic. LLM never touches numbers.

### Redemption routes

| Route | Value | Floor |
|-------|-------|-------|
| Amazon gift card | 1X (100 Bites = $1) | None |
| WeCater catering credit | 1.2X kicker (250 Bites = $3) | ≥2,500 Bites required |
| Restaurant Boost | Co-funded deferred loyalty | Phase 2 / surfaces at checkout only |

### Pre-funded escrow (BITES-3)

Rob sets a high earn rate (e.g. 15X). Before that rate goes live, Rob deposits funds upfront to cover projected Bites liability.

```
Sally places $100 order at Rob's 15X rate
    → 1,500 Bites earned = $15 liability
    → $15 already in Rob's escrow before order happened
    → WeCater pays out from escrow, not own pocket
```

**Implementation constraint:** Rob's `accepting` toggle (B-3) must block if escrow balance is insufficient to cover projected earn at his set rate. Never let Rob go live at high earn rate with empty escrow.

### Funding flow
```
Sally checkout → Stripe PaymentIntent
    → DELIVERED → Stripe capture
    → WeCater takes platform fee (application fee via E-4)
    → Portion of fee funds rewards pool
    → Transfer remainder to Rob's Connect Express account
    → Bites credited to Sally wallet (E-1)
    → CateringRewards backend sync (E-5)
```

CR backend is source of truth for wallet balance.

---

## Epic F — SMS + Email Notifications (5 SP)

**Outcome:** Sally and Rob get notified at every order state transition. No silent state changes.

### Notification map

| Event | Sally | Rob |
|-------|-------|-----|
| REQUESTED | — | SMS + browser push |
| ACCEPTED | SMS "Confirmed" | — |
| DELIVERED | SMS "$X earned personally" | — |
| ESCALATED | — | Founder (Slack/email via G-4) |

### Components
- **F-1** Twilio SMS + A2P 10DLC registration (Pritish) — register in Week 0, approval takes time. Toll-free fallback if delayed.
- **F-2** Email transactional — SendGrid/Postmark (Atul) — **triage candidate**, cut to SMS-only if behind at Week 4.
- **F-3** Notification templates per state transition (Pritish)

### Key constraint
A2P 10DLC registration must happen Week 0 (founder task). Engineering cannot send SMS without approved registration. Twilio delays kill the notification layer.

---

## Epic G — Founder Ops Console (5 SP)

**Outcome:** Founder can see + intervene on any order, restaurant, or Sally. Zero automated dispute handling in MVP — everything escalated lands here.

### Components

**G-1** Admin auth + dashboard shell — founder-only role, separate from Sally/Rob flows.

**G-2 Order management (most critical)** — view all orders by state, manually force-accept/cancel/override. ESCALATED orders (Rob no-show) land here.

**G-3** Restaurant + Sally list/detail — tier, status, order history, team profile, Tier 3 requests. Used to troubleshoot onboarding + activation.

**G-4** Alerting (Slack + email) — triggers on: ESCALATED order, Rob no-show, zero orders Week 6-7, Sentry error spike.

### Not in scope
- Self-serve dispute resolution
- Automated refund flows
- Multi-admin roles
- Analytics (that's PostHog / Epic J)

---

## Epic H — ACP Product Feed Stub (2 SP) — Atul

Single API endpoint returning Tier 1 restaurant + menu data in ACP-compatible format. Stub only — not a full integration.

**First triage candidate.** Cut at Week 4 if behind. Zero user-facing impact. Phase 2 restores it cheaply.

---

## Epic J — Analytics & Instrumentation (3 SP) — Atul

**Outcome:** PostHog live from Day 1. Every hypothesis measurable. No data = no Phase 2 decisions.

**J-1 PostHog event taxonomy** — fire events on every meaningful action:
- Sally: signup, profile created, prompt submitted, results viewed, cart built, checkout completed
- Orders: every state transition (REQUESTED → ACCEPTED → DELIVERED → PAID)
- Rewards: Bites earned, wallet opened, redemption completed
- Tier 3: card viewed, email sent, phone tapped, variant tagged

**J-2 Funnel dashboards** — pre-built for Monday review:
- Sally signup → first order (target ≥30%)
- Tier 3 card view → action rate
- Tier 3 inquiry → Tier 1 conversion

**J-3 A/B experiment framework** — PostHog feature flags for Tier 3 card depth test:
- 50/50 split, deterministic by Sally `user_id` hash
- Variant persists across sessions
- Every Tier 3 event tagged with variant
- Primary metric: action rate (phone tap OR email send) per card view

---

## Epic K — Concierge Foundation (9 SP)

**Outcome:** Sally has persistent dietary memory, team profile context, and personal rewards UX visible from Session 1.

**K-1 + K-2 + K-3 are effectively P0. Do not defer.**

**K-1 Team profile wizard (3 SP) — Atul**
- Captures: headcount, dietary restrictions, delivery address, budget
- Upstream of C-3, C-4, C-5 — without it, AI has no context, results are generic
- Must complete in 30 seconds
- D9 pending (required vs skippable) — if skippable and Sally skips, match rate collapses
- Profile completion target ≥70%

**K-2 Dietary memory engine (3 SP) — Pritish**
- Pharma reps currently use spreadsheets to track physician dietary needs — this replaces that
- Wrong dietary match = physician complaint = professional consequence for pharma rep
- Stickiest retention mechanism — Sally won't re-enter data elsewhere once it's here
- Dietary tags from A-2 feed this engine → feeds C-4 ranking + C-5 cart validation

**K-3 Personal rewards separation UX (2 SP) — Atul**
- Bites framed as rebate not income (IRS compliance — IRS Announcement 2002-18)
- Copy must be legally correct across: header badge, checkout, wallet, SMS, redemption
- Visible differentiator from ezCater in first session
- `complianceTracking: boolean` on profile model gates pharma-only features

**K-4 Concierge analytics events (1 SP) — Pritish**
- Triage candidate #3 — cut at Week 4 if behind
- Measures which concierge features drive retention for Phase 2 decisions

---

## Epic L — Shared Synthesis Pipeline + Tier 3 Lead Generation (23 SP)

**Outcome:** Restaurant listings exist (Tier 1 approved, Tier 3 public). Sally sees Tier 3 options. Sally can send inquiry or tap-to-call. Rob receives warm leads. Tier 3 → Tier 1 conversion mechanism works.

### MVP done checklist for Epic L

| Story | Required | Notes |
|-------|----------|-------|
| L-1 Shared synthesis pipeline | ✅ | Foundation — nothing works without it |
| L-2 Tier 1 validator review UI | ✅ | No Tier 1 goes live without human approval |
| L-3 Tier 3 public display + A/B | ✅ | Sally must see Tier 3 cards |
| L-4 Chatbot surfacing rules | ✅ | Controls what Sally sees and when |
| L-5 Rob heads-up email | ✅ | Supply funnel trigger |
| L-6 Sally quote-request + email | ✅ | Core Tier 3 action path |
| L-7 Email infrastructure | ✅ | L-5 + L-6 both depend on it |
| L-8 Sales rep dashboard | ❌ | Triage candidate #1 — cut first |
| L-9 Phone-reveal + tap-to-call | ✅ | Urgent Tier 3 path |
| L-10 Urgent-order labeling | ✅ | UX safety for <24hr orders |
| L-11 A/B experiment config | ✅ | HYP-4 measured here |
| L-12 Tier 3→Tier 1 transition + ezCater URL capture | ✅ | Conversion mechanism |
| L-13 Sync synthesis during onboarding | ✅ | Rob sees listing built live on call |
| L-14 Async image population + 86'd detection | ✅ | Listing quality gate |
| L-15 Rob-declines fallback | ✅ | Handles Rob who won't share ezCater URL |

---

### L-1: Shared AI synthesis pipeline (3 SP) — Pritish

Single pipeline, two output modes from same input sources:

```
Input sources
[Google Business + Yelp + restaurant own-website]
[+ ezCater data — Tier 3b only, OR Tier 1 with Rob consent]
        ↓
LLM synthesis
        ↓
    ┌─────────────────────────┬──────────────────────────┐
    │ Tier 1 mode             │ Tier 3 mode              │
    │ Assertive content       │ Tentative content        │
    │ Pending Rob approval    │ Public display ready     │
    │ → L-2 validator UI      │ → 3d-minimal / enhanced  │
    └─────────────────────────┴──────────────────────────┘
```

Source provenance logged per field. Pass-rate target ≥85% for Tier 1.

---

### L-2: Tier 1 internal validator review UI (2 SP) — Pritish

Human validator (Preet/sales rep) reviews AI draft before go-live:

```
L-1 Tier 1 draft
    ↓
Validator reviews each field [source provenance visible]
    ↓
Validator checklist:
  ✓ Prices match Rob's onboarding call
  ✓ Dietary tags accurate
  ✓ No ezCater-branded items (ezBox etc.)
  ✓ No 86'd items (on ezCater, absent on own site)
  ✓ No verbatim ezCater copy
    ↓
Approve → listing live as Tier 1
```

Quarterly re-audit: pipeline re-scrapes Rob's own site, flags pricing drift → back to validator.

---

### L-3: Tier 3 public display + A/B variants (2 SP) — Atul

| Variant | Content |
|---------|---------|
| 3d-minimal (A) | Name, address, distance, rating, cuisine, price band ($/$$/$$$), generic labels, CTAs |
| 3d-enhanced (B) | Everything in A + match commentary + call-prep guidance + tentative representative offerings + P4 pricing band |

Tentative framing mandatory in both variants. "May offer", "reportedly serves" — never assertive.

---

### L-4: Chatbot surfacing rules (1 SP) — Pritish

```
Tier 1 prioritized always
Max 1 Tier 3 per chatbot response

Surface Tier 3 when ANY of:
  - < N good Tier 1 matches
  - Tier 3 scores ≥15% higher than lowest Tier 1
  - Sally query has unmet constraint (e.g. no Tier 1 Indian)

Urgency routing:
  < 24hr lead time → phone CTA dominant
  > 24hr lead time → email-quote prominent
```

---

### L-5: Proactive Rob heads-up email (1 SP) — Pritish

Sent when restaurant first appears as Tier 3 listing:
- **Tier 3a copy:** no ezCater mention
- **Tier 3b copy:** acknowledges existing ezCater relationship
- Explicit opt-out link
- Tracked: open, click, reply

---

### L-6: Sally quote-request + email (2 SP) — Pritish

```
Sally taps "Send my request"
    → Structured email generated
      [Sally's order context + WeCater intro + Rob sign-up CTA]
    → Sent to restaurant via L-7 infra
    → Sally gets copy
    → Tracked: open, click, Rob response
```

Leakage (Rob responds directly to Sally, bypasses WeCater) = accepted in MVP. Track analytically.

---

### L-7: Rob outreach email infrastructure (2 SP) — Pritish

Shared sending infra for L-5 + L-6:
- Dedicated sender domain + SPF/DKIM/DMARC
- Sending warmup schedule (build domain reputation)
- CAN-SPAM compliance: sender ID, unsubscribe, no misleading subjects
- Opt-out management

Build as shared service — not two separate email implementations.

---

### L-9: Phone-reveal + tap-to-call + dual-channel modal (1 SP) — Atul

```
Sally taps "Call directly"
    → Phone number revealed
    → Modal: "Also email them? They'll have context when you call."
        Yes → L-6 email flow triggered
        No  → phone only
    → tap-to-call event tracked regardless
```

---

### L-12/L-13: Tier 3 → Tier 1 conversion (3 SP) — Pritish + Atul

```
Rob onboarding call
    → Rob shares ezCater URL (explicit, timestamped, recorded consent)
    → Consent tied to participation agreement (B-6)
    → tier_state: Tier3 → Tier1_draft in DB (transition logged)
    → L-13: sync synthesis triggered (Rob watches progress live)
      [pulls ezCater + own-site + Google + Yelp]
      [status UI: "Building your menu..."]
    → Output → L-2 validator review UI
```

---

### L-14: Async image population + 86'd detection (3 SP) — Pritish + Atul

Runs post-onboarding via Inngest job:
- Image sourcing: Rob upload → Google Business/Yelp → AI-generated for gaps
- **86'd item detection:** item on ezCater but absent on own-site → flagged before Rob review
- **Brand blocklist + LLM classifier:** detects "ezBox", ezCater-branded packages → removed before Rob review

Must run BEFORE L-2 review UI. Rob must never see unfiltered ezCater content.

---

### L-15: Rob-declines-ezCater fallback (1 SP) — Atul

If Rob declines to share ezCater URL:
- Fallback sources: own-website + PDF + verbal dictation + Excel/Google Sheet upload
- Excel/Sheet template provided with column headers
- Parsed into normalized menu schema via L-1 pipeline

---

### HLD/LLD — must-know before starting

**1. One pipeline, two modes — design first**
L-1 is the foundation. Mode flag (`tier1` | `tier3`) must be explicit. Same infra, different output contracts. Two separate pipelines = doubled maintenance. Get this right before anything else.

**2. Source provenance is a DB schema requirement**
Every output field needs `source: string` stored alongside value. Not a JSON blob — a proper column. Validator UI reads it per field. Legal defensibility depends on it.

**3. Tentative framing is a pipeline CONTRACT**
Tier 3 mode must enforce "may offer / reportedly serves" — never assertive. Build post-generation validator that checks framing before storing output. Don't rely on prompt instructions alone — LLMs drift.

**4. ezCater data isolation enforced in code**
Pipeline checks: Tier 3b → ezCater input allowed. Tier 1 → ezCater input blocked UNLESS `rob_ezcater_consent: true` (L-12). Conditional data access rule. Not a convention.

**5. Sync vs async synthesis — two invocation modes, one core**
- L-13 (sync): onboarding call, Rob watches. Must be <60s. Prioritize speed.
- L-14 (async): Inngest job, post-call. Speed not critical.
Design pipeline to support both from same core.

**6. A/B variant is user-scoped, not session-scoped**
`hash(user_id) % 2` → variant. Persists across devices and sessions. Implement at auth layer, not cookie.

**7. Email infra is shared (L-7)**
L-5 and L-6 use same sending infra. Build once as shared service. Domain warmup = Week 3 minimum — start early or L-5/L-6 hit spam folders.

**8. Tier state machine is auditable**
`tier`, `tier_3_subsegment`, `tier_state` are DB fields. Transitions write to audit log — not field overwrites. Every Tier 3 → Tier 1 transition must be traceable with timestamp + consent reference.

**9. 86'd detection + brand blocklist run before L-2**
Detection must complete before listing enters validator UI. If ezCater-branded items slip through to Rob review, Rob sees garbage and trust collapses. Blocklist match + LLM classifier both must pass as pre-publish gate.
