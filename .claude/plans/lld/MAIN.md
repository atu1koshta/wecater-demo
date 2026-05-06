# LLD Planning — WeCater Marketplace MVP

## Context

HLD `marketplace-mvp-hld.md` is locked and authoritative. Cross-cutting LLD-00 (`lld/00-conventions.md`) defines DB / outbox / auth / error / audit / uploads / testing patterns inherited by every subsequent LLD.

The current repo is a Next.js 14 buyer prototype (chat, optimizer, cart, profile, wallet) with mock data. No backend, DB, auth, or service modules exist. All backend modules in HLD Part 4 (A–M) are net-new.

Goal of this plan: define the full LLD doc set we will produce *before* implementation. Each LLD doc fixes the schema, routes, events, errors, and service interface for one HLD module group. Implementation starts only after a doc is reviewed and locked.

Decisions made up-front (this plan):
- **Granularity**: 18 LLD docs, one per module group. Clear ownership, parallel reviewable.
- **Open decisions** (D1 charge type, D7 delivered actor, D8 cashback vs discount, D9 profile gate, auth-hold expiry): write each LLD with a stated **happy-path assumption** at the top. Revisit when the decision lands.
- **CR backend `/internal/*` contract**: owns its own LLD-17, drafted in parallel with CR team.
- **D8 specifically**: LLD-07/10/11 stub `earn_rate_x` semantics with TODO until D8 + CR rewards engine spec aligns.

---

## Happy-Path Assumptions (declared at top of each affected LLD)

| Decision | Assumption to use while writing | Doc(s) carrying assumption header |
|---|---|---|
| D1 Stripe charge type | **Destination charges with `transfer_data.destination` + `application_fee_amount`** | 09, 11 |
| D7 Delivered actor | **Rob-only marks DELIVERED** (Sally has no DELIVERED button) | 08, 11, 12 |
| D8 Cashback vs discount | **Cashback %** — Rob sets `earn_rate_pct`, MP snapshots in quote, CR computes Bites accrual | 07, 10, 11 (stub until D8/CR lock) |
| D9 Profile required | **Required at signup, gated by FF `profile_wizard_required=true`** | 01, 06 |
| Auth-hold expiry | **Option A — restrict advance booking to <7 days in MVP**; no re-auth Inngest job | 07, 08, 09 |

If a real decision later contradicts an assumption, the affected LLD is re-opened — not the implementation. That is the point of writing LLDs first.

---

## LLD Doc Set (18 docs, after `00-conventions.md`)

All paths under `.claude/plans/lld/`. HLD module letters reference HLD Part 4.

| # | File | HLD modules | Required sections | Depends on | Weight |
|---|---|---|---|---|---|
| 01 | `01-auth-orgs.md` | A — `auth`, `orgs`, `marketplace-authz`, `verticals` (loader only) | Tables (`auth_accounts`, `auth_magic_links`, `auth_revoked_jti`, `orgs_organizations`, `orgs_members`); Auth.js v5 magic-link (Sally + Rob + Founder); JWT issuance per `00 §5.5`; `enforceTokenType` middleware; account creation on first login; org bootstrap; **permission/action catalog seed (Action enum, owner of registry — see Cross-Doc §3.4)**; `authzService.can()` impl; pack-contributed roles wiring; magic-link rate limit; revocation/logout | 00 | M |
| 02 | `02-verticals-packs.md` | A — `verticals` (deep) | VerticalPack TS schema (single source of truth, `packages/verticals/types.ts`); pack file layout (`packages/verticals/pharma_rep/index.ts` — roles, `aiTools[]`, `memoryPredicates[]`, `visibilityMode`, `complianceTracking`, copy variants); seed `pharma_rep` content; loader; runtime resolver via `organizations.vertical_pack_id`; explicit ban on `if (pack === 'pharma_rep')` (lint + test); how each downstream module reads it | 01 | S |
| 03 | `03-restaurants-tiers-ingestion.md` | B — `restaurants`, `tiers`, `ingestion`, `ezcater-gate`, `dietary` (supply side) | Tables (`cat_restaurants`, `cat_tiers`, `cat_dietary_tags`, `cat_restaurant_dietary`, `cat_ingestion_runs`, `prospecting.pro_restaurants` separate schema per `00 §2.9`); `cr_store_id` FK pattern + CR `GET /internal/stores/:id` consumer; tier capability registry; IngestionAdapter interface + MVP `manual_ops` adapter; ezCater isolation enforcement (schema + role + lint + runtime guard); `RestaurantActivated` outbox payload; service interface | 01, 02 | L |
| 04 | `04-menus-dietary.md` | B — `menus`, `dietary` (matching) | Tables (`menu_menus`, `menu_items`, `menu_modifier_groups`, `menu_modifier_options`, `menu_versions`); versioning (orders pin old version); `price_cents` per `00 §2.10.4`; per-field `provenance` JSONB per `00 §2.11`; modifier price-delta math; service interface (`getMenuForCart`, `pinVersionToOrder`); `CatalogUpdated` outbox; dietary tag matching | 03 | M |
| 05 | `05-search-ranker-surfacing.md` | C — `search`, `ranker`, `surfacing` | Typesense schema + index doc; outbox-driven indexer (consumer of `RestaurantActivated`, `CatalogUpdated`); SQL fallback per HLD Part 11; OptimizerMode registry; seed `smart` mode scoring formula (math in code, not LLM); L-4 surfacing rules (T1 priority, max 1 T3, urgency routing); `ranker.search()` service; `kill_tier3_visibility` FF integration (fail-closed) | 03, 04 | M |
| 06 | `06-recipients-memory.md` | D — `recipients`, `memory`, `notes`, `learning` (stub only) | Tables (`crm_recipients`, `crm_memory_entries`, `crm_notes`, `crm_dietary_entries`); K-1 wizard data model + completion-% computation; K-2 told-memory `(subject, predicate, object, source, confidence)`; `memoryPredicates[]` filtered by VP; `visibilityMode: owner_only` enforced at service layer; learning-worker seam (Phase 2 — outbox event hook only, no consumer) | 01, 02 | M |
| 07 | `07-occasions-cart-pricing.md` | E — `occasions`, `cart`, `pricing`, `promotions` (MP wrapper) | Tables (`ord_occasions`, `ord_cart_drafts`, `ord_cart_lines`, `ord_per_person_overrides`, `ord_price_quotes`, `ord_price_components`); pricing-core package shape (shared client/server, server canonical); 300ms debounce; quote freshness (`expires_at` 15min); `estimated_bites` snapshot rule from `00 §2.10.5`; promo-code application server-side; per-person overrides; service interface | 04, 05, 06, 10 | L |
| 08 | `08-orders-state-machine.md` | E — `orders` | Tables (`ord_orders`, `ord_order_events`); Postgres enum `order_status` per `00 §2.6`; full state machine spec (REQUESTED→ACCEPTED→DELIVERED→PAID + REJECTED/CANCELLED/ESCALATED/CAPTURE_FAILED); transition guards; outbox event matrix per transition; Inngest SLA timer + escalation; force-transition (admin) with audit log; transactional pattern | 07, 09, 12 | L |
| 09 | `09-payments-payouts.md` | F — `payments`, `payouts`; Stripe webhooks | Tables (`pay_payment_intents`, `pay_customers`, `pay_payouts`, `pay_stripe_connect_accounts`); auth-hold on REQUESTED; capture on DELIVERED; `application_fee_amount` = platform fee only (Guardrail #6); transfer to Rob Connect; webhook handlers (`payment_intent.*`, `charge.captured`, `transfer.*`, `account.updated`, `capability.updated`, `payout.failed`); idempotency by Stripe `event.id` per `00 §5.7`; CAPTURE_FAILED handling; <7-day advance-booking validation (Option A) | 08 | XL |
| 10 | `10-rewards-client.md` | G — `rewards-client`, `redemption-client` (HTTP clients only, no math) | `rew_wallet_cache` table (60s TTL projection per `00 §2.10.4`); CR HTTP client (`GET /internal/wallet/balance`, `POST /internal/wallet/redeem`); circuit breaker + cached-fallback per HLD Part 11; **`OrderPaid` payload contract — primitives only, NO `earned_bites` (lint + schema test per `00 §2.10.7`)**; copy enforcement ("Bites" not "cashback") at service edge; cart-preview service interface | 08, 17 | M |
| 11 | `11-rob-portal.md` | J — `partner-auth`, `onboarding`, `stripe-connect`, `settings`, `accept-console` | Partner-token JWT shape (`restaurant_id` only); B-2 Stripe Connect Express onboarding + bank-verification edge cases; B-6 e-sign participation agreement (audit log row, timestamp, IP, user-agent per `00 §12`); B-3 settings (earn_rate %, lead time, delivery radius, hours, accepting toggle); B-4 mobile-first accept console; SMS + browser push integration; CR `POST /internal/stores` integration | 01, 03, 09, 12, 17 | XL |
| 12 | `12-notifications.md` | K — `sms`, `email`, `templates` | Tables (`ntf_notification_log`, `ntf_template_versions`); Twilio A2P 10DLC sender config + toll-free fallback; Resend transactional config; vertical-aware template versioning (pack-scoped variants); notification map per HLD §K (every order state → who, channel, template); SMS-only fallback path; outbox consumer pattern | 02, 08 | M |
| 13 | `13-ai-concierge.md` | H — `ai-gateway`, `concierge`, `tool-registry`, `context-assembler` | Tables (`ai_chat_threads`, `ai_chat_messages`); Anthropic SDK wrapper, model-agnostic config; SSE streaming endpoint contract; tool-registry filtered by VP `aiTools[]`; per-tool `assertCan(principal, action)`; **math-in-code rule** — every tool delegates to deterministic service method; `OrderContext` shape (computed on demand, never persisted); 7 MVP tools (`open_recipient_profile`, `search_restaurants`, `build_cart`, `estimate_bites`, `place_order`, `request_quote`, `redeem_bites`); circuit-breaker fallback (search-only mode) | 03, 04, 05, 06, 07, 08, 10 | L |
| 14 | `14-tier3-funnel.md` | I — `synthesis`, `validator-ui`, `quotes`, `leads`, `outreach`, `phone-reveal`, `t3-to-t1`, `86d-detector` | Tables (`syn_drafts`, `syn_field_provenance`, `lead_quote_requests`, `lead_quote_replies`, `lead_restaurant_leads`, `lead_outreach_log`, `lead_phone_reveals`); L-1 dual-mode pipeline (T1 vs T3 framing, validator post-check on framing); L-2 validator UI checklist; L-5/L-6 outreach with shared sending infra + domain warmup (Week 3); L-7 SPF/DKIM/DMARC notes; L-9 phone reveal + tap-to-call event; L-12/13 tier transition with timestamped consent (audit log); L-14 86'd detector run **before** validator UI; PDF generation via S3/R2 signed URLs per `00 §13` | 02, 03, 12 | XL |
| 15 | `15-admin-ops.md` | L — `admin` | Routes (order ops by state, ESCALATED queue, force-transition with audit, Sally view, restaurant view, lead pipeline view); G-4 alerting hooks (ESCALATED, Rob no-show, zero orders Week 6-7, Sentry spike); admin token issuance; CAPTURE_FAILED manual-retry path | 08, 09, 11, 14 | M |
| 16 | `16-analytics-flags.md` | M — PostHog events + flags + A/B | J-1 event taxonomy (every event from HLD §M); `evnt_outbox` → PostHog consumer; client-side capture allowlist; J-2 dashboards spec (3 funnels); J-3 A/B `tier3_card_variant` user-scoped via PostHog hash; FF registry with kill-switch defaults per `00 §11`; `flags.ts` API contract | 01, 05, 08 | S |
| 17 | `17-cr-internal-contract.md` | Cross-cuts B/G — full `/internal/*` surface MP↔CR | Typed contract for `/internal/stores`, `/internal/wallet/balance`, `/internal/wallet/redeem`, `/internal/accounting/order_paid_consumed`, `/internal/accounting/bites_credited`; service-JWT HMAC auth + rotation; `OrderPaid` event consumer requirements (CR side); error envelope; SLA + caching expectations; daily reconciliation contract per `00 §2.10.8` | 03, 10 (consumers) — drafted with CR team in parallel | L |
| 18 | `18-frontend-mapping.md` | Part 7 + cross-cuts — three apps + packages | Migration plan from current `app/(shell)/{chat,optimizer,profile,wallet,cart}` + `src/components/*` into `apps/buyer` / `apps/partner` / `apps/admin` + `packages/{ui,pricing-core,types,ai-tools,verticals,flags,logger}`; BFF route layout (`app/api/*` → WeCater API mapping); SSE wiring for concierge; Stripe Elements integration; **what stays Next.js BFF vs WeCater API** decision per route group; component-to-route ownership matrix | 01–13 | M |

---

## Dependency Graph

```
                    00 (conventions — landed)
                          │
                          ▼
                   01 (auth-orgs)
                  /       │      \
                 ▼        ▼       ▼
              02(VP)   17(CR-internal — parallel w/ CR team)
                 │         │
        ┌────────┼─────────┘
        ▼        ▼
   03 (restaurants/tiers/ingestion + ezcater-gate)
        │
        ▼
   04 (menus/dietary)
        │
        ├──────────────► 05 (search/ranker/surfacing)
        │                       │
        ▼                       │
   06 (recipients/memory) ──────┤
        │                       │
        └──────► 07 (cart/pricing) ◄── 10 (rewards-client) ◄── 17
                       │                  │
                       ▼                  │
                  08 (orders) ◄───────────┘
                  /    │    \
                 ▼     ▼     ▼
            09(pay) 12(ntf) 16(analytics)
                 │
                 ▼
            11 (Rob portal) ◄── 12, 09, 17
                 │
                 ▼
            13 (AI concierge) — lights after 07/08/10
                 │
                 ▼
            14 (Tier 3 funnel) — parallel after 03+12
                 │
                 ▼
            15 (admin) — after 08, 09, 11, 14
                 │
                 ▼
            18 (frontend mapping) — last
```

**Critical path**: 00 → 01 → 03 → 04 → 07 → 08 → 09 → 11. LLD-09 is heaviest doc on critical path.

**Parallelizable**:
- 02 + 17 immediately after 01
- 05 + 06 after 04
- 12 + 16 after 08
- 14 in parallel with 11 once 03 + 12 land

---

## Cross-Doc Concerns (lock once, reference everywhere)

### 3.1 Outbox event catalog
Extends `00-conventions §3` with the catalog table. Add as `§3.6`:

| Event | Producer | Payload owner doc | Consumers |
|---|---|---|---|
| `OrderRequested` | orders | 08 | Inngest (SLA), PostHog (16) |
| `OrderAccepted` | orders | 08 | Notifications (12), PostHog (16) |
| `OrderDelivered` | orders | 08 | Payments (09 — capture trigger), PostHog (16) |
| `OrderPaid` | orders | 08 + payload contract in 10 | **CR (17)**, PostHog (16), learning-worker (Phase 2 stub in 06) |
| `OrderRejected` / `OrderCancelled` / `OrderEscalated` / `OrderCaptureFailed` | orders | 08 | Notifications (12), Admin alerting (15), PostHog (16) |
| `RestaurantActivated` | restaurants | 03 | Search index sync (05), PostHog (16) |
| `CatalogUpdated` | menus | 04 | Search index sync (05) |
| `ConsentCaptured` | onboarding (Rob) | 11 | Audit log (same tx), PostHog (16) |
| `TierStateTransitioned` | restaurants/synthesis | 14 | Audit log, PostHog (16) |

### 3.2 Service-interface registry
All `*Service` TS shapes live in `packages/types/services/{module}.ts`. Each LLD's "Service Interface" section is the spec; `packages/types` is the implementation. No service exposes Prisma models (`00 §4`).

### 3.3 VerticalPack config schema
**LLD-02 owns.** Schema, runtime loader, seed `pharma_rep`. Every consumer (06, 12, 13, authz in 01) imports from `packages/verticals/types.ts` — never redefines.

### 3.4 Permission / action catalog
**LLD-01 owns** the `Action` string-literal union: `'orders:read' | 'orders:create' | 'orders:accept' | 'menu:edit' | 'recipients:read' | 'wallet:redeem' | 'admin:force_transition' | …`. Subsequent LLDs declare which actions their routes/tools require, but the enum lives in 01. Adding action = PR to 01 + consuming LLD. No string-action fallback.

### 3.5 CR `/internal/*` contract
**LLD-17 only.** Domain LLDs (03, 10) reference; do not redefine. Owns route signatures, JWT auth, error envelope, `OrderPaid` consumer requirements, reconciliation endpoints. Sign-off by CR eng lead is gating for LLD-09/10/11.

### 3.6 Frontend ↔ backend mapping
**LLD-18 owns.** Lands last (route names finalize during 01–13).

---

## Phasing (8-week MVP)

| Week | Lock these LLDs | Why |
|---|---|---|
| **1 — foundation** | 00 (done), **01, 02, 17** | Auth + JWT + VP + CR contract upstream of everything. 17 in parallel with CR team. |
| **2 — catalog + commerce skeleton** | **03, 04, 05, 16** | Restaurants + menus + search + analytics taxonomy. PostHog from Day 1 mandate. |
| **3 — commerce flow** | **06, 07, 08** + Stripe Connect spike feeding 09 | Cart + orders + recipients. Concurrent Stripe Connect spike. |
| **4 — payments + Rob + notif** | **09, 10, 11, 12** | Heaviest week. D1/D8/auth-hold need real answers by now (or assumptions hold). |
| **5 — AI + Tier 3** | **13, 14** | Concierge needs commerce; Tier 3 needs catalog + outreach infra. |
| **6 — ops + frontend** | **15, 18** | Admin console + monorepo migration. |
| **7–8 — buffer** | Re-cuts | Polish, integration tests, redo any LLD broken by Stripe-spike findings. |

**Lazy candidates** (small MVP scope, can stub-then-fill): 02, 16, 15, 18.
**Cannot be lazy**: 09, 14, 17.

---

## What NOT to Include in LLD

- Detailed Tailwind component styling — `packages/ui` source + Storybook
- Individual button-level UI — LLD-18 lists routes; component breakdown stays in code
- Exhaustive copy text — LLD-12 specifies template versions + pack-scoping; copy iterates post-MVP
- Stripe Elements style customization — config, not architecture
- Re-litigating HLD Part 9 guardrails — LLDs *enforce* via tests/lint, never debate
- Redefining JWT shape, error codes, money columns, ezCater isolation, outbox table — `00` is canonical
- MP-side Bites earn math — Guardrail #6 + `00 §2.10` forbid
- CR-side internals (reward engine, ledger schema, Amazon GC fulfillment) — separate CR repo LLDs
- A2P 10DLC registration paperwork — operational
- Detailed Sentry/OpenTelemetry exporter config — `00 §8` covers
- Demo-component-by-component migration diff — LLD-18 owns the *mapping* only

---

## Critical Files

- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/marketplace-mvp-hld.md` — authoritative HLD
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/00-conventions.md` — cross-cutting (extend with §3.6 outbox catalog)
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/docs/inferences/INFERENCES.md` — requirements ground truth
- Existing demo (`app/(shell)/*`, `src/components/*`, `src/types/*`) — frontend reuse target for LLD-18

---

## Verification

LLD set is correct when:

1. **Coverage** — every HLD Part 4 module (A–M) appears in exactly one LLD's "HLD modules covered" column. No gaps, no overlaps.
2. **Convention compliance** — no LLD redefines anything in `00-conventions`. Spot check: search each LLD for "money", "JWT", "outbox table", "error code" — should reference `00`, not redefine.
3. **Dependency consistency** — no LLD references a table/event/service from a doc not in its `Depends on` column.
4. **Guardrail enforcement** — search each LLD for HLD Part 9 guardrail items (math-in-code, tier-as-flag, no `pack === 'pharma_rep'`, ezCater isolation, auth-hold timing, Bites obligation owner, Bites copy, A/B user-scoped, PostHog Day 1, outbox per state change, source provenance per field, participation-agreement timestamp, FF fail-closed, Stripe webhook idempotent, structured logging, JWT `token_type`). Each guardrail must be enforced (test/lint/schema constraint) somewhere.
5. **Open-decision discipline** — each affected LLD opens with the assumption header; no LLD silently chooses an option without flagging.
6. **Cross-doc concerns** — outbox catalog, action enum, VP schema, CR contract each live in exactly one doc, with all consumers referencing.

End-to-end check: walking the HLD §Verification flow (Sally magic-link → profile → "Usual for Tuesday team" → cart → checkout → REQUESTED → Rob accepts → DELIVERED → PAID → Bites SMS → redemption → Founder ops view) must touch only LLDs in the set, and every step must have its data model + route + event defined in some LLD.
