# LLD-00 — Conventions & Cross-Cutting Patterns

All subsequent LLD files assume these conventions. Do not deviate without updating this doc.

---

## Table of Contents

1. Stack
2. Database conventions (incl. money & accounting, provenance, ezCater isolation, timezone)
3. Outbox pattern (incl. DLQ + event versioning)
4. Service interface pattern
5. API route conventions (incl. JWT claims, idempotency, webhooks, health)
6. Error handling
7. TypeScript conventions
8. Logging, tracing, PII redaction
9. Environment & secrets
10. Module file structure
11. Feature flags
12. Audit log
13. File uploads
14. Testing
15. Open decisions

---

## 1. Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Vercel |
| Runtime | Node.js 26.1.0 — pinned via `.nvmrc` + `package.json` `engines: ">=26.1.0"`. CI fails on mismatch. |
| API | Node.js/Express (standalone WeCater API service) |
| ORM | Prisma 6 (single `prisma/schema.prisma` for MP core today; promote to multi-file via `prismaSchemaFolder` preview when schema crosses ~5 modules). |
| DB | MySQL for MP core (`wecater_core` schema). Postgres remains the target for non-MP services. |
| Background jobs | Inngest |
| Search | Typesense |
| Cache | Redis (Upstash or self-hosted) |

---

## 2. Database Conventions

### 2.1 Table naming

`{module_prefix}_{entity}` — all snake_case.

| Module | Prefix | Example tables |
|---|---|---|
| auth | `auth_` | `auth_accounts`, `auth_magic_links` |
| orgs | `orgs_` | `orgs_organizations`, `orgs_members` |
| restaurants | `cat_` (catalog) | `cat_restaurants`, `cat_tiers` |
| menus | `menu_` | `menu_menus`, `menu_items`, `menu_modifier_groups` |
| dietary | `diet_` | `diet_tags`, `diet_restaurant_tags` |
| recipients | `crm_` | `crm_recipients`, `crm_dietary_entries` |
| memory | `crm_` | `crm_memory_entries` |
| occasions | `ord_` | `ord_occasions` |
| cart | `ord_` | `ord_cart_drafts`, `ord_cart_lines` |
| pricing | `ord_` | `ord_price_quotes`, `ord_price_components` |
| orders | `ord_` | `ord_orders`, `ord_order_events` |
| payments | `pay_` | `pay_payment_intents`, `pay_customers` |
| payouts | `pay_` | `pay_payouts` |
| rewards | `rew_` | `rew_wallet_cache` |
| notifications | `ntf_` | `ntf_notification_log` |
| synthesis | `syn_` | `syn_drafts`, `syn_field_provenance` |
| prospecting | `pro_` | `pro_restaurants` — **separate Postgres schema `prospecting`, isolated DB role (see 2.9)** |
| leads | `lead_` | `lead_restaurant_leads`, `lead_quote_requests` |
| admin | `adm_` | `adm_audit_log` |
| outbox | `evnt_` | `evnt_outbox` |

### 2.2 Standard columns (every table)

```sql
id          UUID          PRIMARY KEY DEFAULT gen_random_uuid()
created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
```

`updated_at` maintained via Prisma middleware (not DB trigger) for portability.

### 2.3 Soft delete

Only on entities where audit trail matters. Use `deleted_at`, never `is_deleted boolean`.

```sql
deleted_at  TIMESTAMPTZ   NULL   -- NULL = active, non-NULL = soft deleted
```

Tables WITH soft delete: `cat_restaurants`, `menu_menus`, `menu_items`, `crm_recipients`, `orgs_organizations`.

Tables WITHOUT (append-only or hard delete): `evnt_outbox`, `ord_order_events`, `adm_audit_log`, `ntf_notification_log`, `ord_cart_drafts` (hard delete on checkout).

### 2.4 Primary keys

UUID v4 everywhere (`gen_random_uuid()`). No exposed auto-increment integers.  
Exception: `cr_store_id` is an integer FK referencing CR backend's MySQL auto-increment — stored as `INTEGER` in MP Postgres.

### 2.5 Foreign keys

Cross-module FKs allowed within same Postgres DB (same schema). No Prisma `@relation` across module schema files — declare FK constraint in SQL only, reference by ID in code.

Cross-service FKs (MP → CR): stored as plain integer/UUID column, no DB-level constraint. Validated at application layer.

### 2.6 Enums

Postgres native enums for state machines. Prisma maps them via `enum`.

```sql
CREATE TYPE order_status AS ENUM (
  'REQUESTED', 'ACCEPTED', 'DELIVERED', 'PAID',
  'CANCELLED', 'REJECTED', 'ESCALATED', 'CAPTURE_FAILED'
);
```

Add values with `ALTER TYPE ... ADD VALUE` — never remove or rename (breaks existing rows).

### 2.7 Indexes

Declare explicitly — never rely on ORM auto-index defaults.  
Every FK column gets an index. Every `WHERE` column in common queries gets an index.  
Partial indexes preferred for soft-delete queries: `WHERE deleted_at IS NULL`.

### 2.8 Migrations

Prisma migrations. Forward-only — never edit a committed migration.  
Naming enforced by Prisma timestamp prefix: `YYYYMMDDHHMMSS_short_description`.  
Destructive operations (drop column, rename) require two-step:
1. Deploy code that stops using column.
2. Next migration drops it.

### 2.9 ezCater data isolation — schema + role enforced

Prospecting data lives in separate Postgres schema, accessed by separate DB role. App layer cannot accidentally join.

```sql
-- Two schemas
CREATE SCHEMA app;          -- main product
CREATE SCHEMA prospecting;  -- ezCater scrape output, internal only

-- Two roles
CREATE ROLE wecater_app;        -- used by API service
CREATE ROLE wecater_prospect;   -- used by ingestion pipeline + sales tooling

GRANT USAGE ON SCHEMA app TO wecater_app;
GRANT USAGE ON SCHEMA prospecting TO wecater_prospect;

-- App role explicitly denied prospecting access
REVOKE ALL ON SCHEMA prospecting FROM wecater_app;
REVOKE ALL ON ALL TABLES IN SCHEMA prospecting FROM wecater_app;
```

API service connects with `wecater_app`. Tier classification logic that needs prospecting cross-reference runs in a separate Inngest worker connected as `wecater_prospect`, writes Tier classification back to `app.cat_restaurants` via internal API.

Convention: any code path touching `prospecting.*` requires `// PROSPECTING-ONLY:` block comment + lint rule (custom ESLint) to prevent accidental import in `src/modules/`.

### 2.10 Money & Accounting — backend authority, MP/CR split

**Rule: all accounting happens server-side. Within server-side, MP and CR own different domains. Never overlap.**

Most load-bearing rule. Misallocation = lawsuits, IRS exposure (K-3 rebate framing), Bites liability mismatch, double-write to ledger.

Per HLD §2 Service Boundary + §6 Data Ownership + §9 Guardrail #6: rewards/redemption/ledger logic lives in CR backend. MP never implements earn or redeem math.

#### 2.10.1 Domain split — who owns what math

| Concern | Owner | Why |
|---|---|---|
| Order pricing (subtotal, tax, delivery fee, tip, discount, total) | **MP** (`pricing` module) | MP owns cart, menu, promo |
| Stripe application fee + transfer amount | **MP** (`payouts` module) | MP holds Stripe Connect destination payment relationship |
| Stripe auth-hold + capture amount | **MP** (`payments` module) | MP owns PaymentIntent lifecycle |
| Bites accrual on `OrderPaid` (earn_rate × subtotal → Bites credited) | **CR backend** (reward engine) | HLD §2: "Reward engine, Bites earn rules, incentive programs, promotion evaluation" |
| Bites redemption value (Amazon 1X, WeCater credit 1.2X kicker) | **CR backend** (wallet) | HLD §2: "Wallet + Bites/points... earn/redeem lifecycle, Amazon GC redemption" |
| Sally wallet balance | **CR backend** (wallet — source of truth) | HLD §6: MP only caches via `rew_wallet_cache` short-TTL |
| Rob's Bites wallet (recharge, auto-recharge, deduction on `OrderPaid`) | **CR backend** entirely | HLD §2 Guardrail #6: "MP never reads or writes Rob's CR wallet" |
| Double-entry ledger | **CR backend** (accounting) | HLD §2: "Accounting (double-entry ledger, journal entries, reconciliation)" |
| Restaurant Boost co-funded forecast | **CR backend** | Phase 2 — registry seam in MP, handler in CR |
| Refund amounts (Stripe-side) | **MP** (initiates) → **CR backend** (ledger reversal) | MP refunds via Stripe, emits event; CR reverses ledger entry |

#### 2.10.2 Where math runs (per layer)

| Layer | MP order pricing? | CR rewards math? | Notes |
|---|---|---|---|
| Frontend (Next.js client) | **NO** | **NO** | Display only. Formats integer minor units → string. Never sums, multiplies, applies %. |
| Frontend (Next.js server / RSC) | **NO** | **NO** | Presentation. Calls MP API. |
| WeCater API service (Express) | **YES** | **NO** | Order pricing, Stripe fees, capture, transfer. Calls CR via `/internal/*` for rewards reads. Never computes Bites accrual. |
| Inngest jobs (MP-side) | **YES** (subset) | **NO** | Auth-hold expiry, capture on DELIVERED, reconciliation. |
| LLM (Anthropic) | **NEVER** | **NEVER** | Prose only. C-3 extracts constraints, C-5 narrates cart summary. Never returns a number used in transaction. Inference §E "math in code, narration in LLM" is hard rule. |
| **CR backend** | **NO** | **YES — source of truth** | Reward engine, Bites earn, redemption, Rob wallet deduction, ledger. Owns all numeric outputs touching wallet. |

#### 2.10.3 Client never sends totals

API rule: state-mutating routes (order creation, redemption, refunds) **ignore client-supplied money fields**. Server recomputes from primitives.

Example — order creation (MP):

```typescript
// REJECTED — never accept these from client
type WrongCreateOrderInput = {
  cartLines: { itemId: string; qty: number; lineTotal_cents: number }[];
  subtotal_cents: number;   // ← client lies
  total_cents: number;      // ← client lies
  estimated_bites: number;  // ← client lies
};

// CORRECT — client sends primitives only
type CreateOrderInput = {
  cartLines: { itemId: string; qty: number; modifierIds: string[] }[];
  tip_cents?: number;       // explicit user input — allowed, server clamps ≥0 and ≤reasonable max
  promoCode?: string;
};

// MP-side resolver — order pricing only
function priceCart(input: CreateOrderInput): PriceQuote {
  // 1. Fetch price_cents per itemId from menu_items (MP DB)
  // 2. Sum line totals
  // 3. Apply tax via tax service
  // 4. Apply delivery fee from restaurant config
  // 5. Apply promo code (validate + redeem-once invariants)
  // 6. Compute application_fee_cents (WeCater platform fee)
  // 7. Compute transfer_amount_cents = total - application_fee
  // 8. Persist ord_price_quotes (immutable). DO NOT compute Bites here.
}
```

Redemption: client says "redeem 5000 Bites for Amazon". MP `redemption-client` proxies to CR `POST /internal/wallet/redeem` with `{accountId, bites: 5000, route: 'amazon'}`. CR computes USD value, fulfills. MP never converts.

#### 2.10.4 Money columns

Never floats. Never `Decimal` (Postgres or JS). Always integer minor units.

| Currency | Column type | Suffix | Examples (which DB) |
|---|---|---|---|
| USD | `INTEGER` | `_cents` | `subtotal_cents`, `tip_cents`, `application_fee_cents`, `transfer_amount_cents` (all MP Postgres) |
| Bites | `INTEGER` | `_bites` | `wallet_balance_bites`, `earned_bites`, `escrow_balance_bites` (all **CR MySQL** — source of truth) |

MP-side Bites columns exist only in two places:
- `ord_price_quotes.estimated_bites` — display estimate, frozen at quote time, never authoritative.
- `rew_wallet_cache.balance_bites` — read-through cache from CR, 60s TTL (HLD §11 fallback policy).

Both flagged in code as estimates. Never used for ledger writes, never compared to CR balance for correctness checks (only reconciliation, see 2.10.7).

Conversion constants in `packages/types/money.ts`:

```typescript
export const BITES_PER_DOLLAR = 100;
export const CENTS_PER_DOLLAR = 100;
export const dollarsToCents = (d: number) => Math.round(d * 100);
export const centsToDollars = (c: number) => c / 100;
```

Display: server returns `{ amount_cents: 1250, currency: 'USD' }`. Client formats `$12.50`. No server-side `$` strings.

#### 2.10.5 Price quote pattern (MP-only, immutable)

Every order references `ord_price_quotes`. Immutable once created. Re-pricing creates new quote, never mutates.

```sql
CREATE TABLE ord_price_quotes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_draft_id         UUID NULL,
  order_id              UUID NULL,            -- set once order created
  subtotal_cents        INTEGER NOT NULL,
  tax_cents             INTEGER NOT NULL,
  delivery_fee_cents    INTEGER NOT NULL,
  tip_cents             INTEGER NOT NULL DEFAULT 0,
  discount_cents        INTEGER NOT NULL DEFAULT 0,
  total_cents           INTEGER NOT NULL,
  application_fee_cents INTEGER NOT NULL,     -- WeCater take
  transfer_amount_cents INTEGER NOT NULL,     -- to Rob's Connect
  earn_rate_x_snapshot  INTEGER NULL,         -- Rob's earn_rate at quote time, frozen for display
  estimated_bites       INTEGER NULL,         -- DISPLAY ONLY — copy of CR's earn formula for cart preview. NEVER source of truth.
  bites_estimate_source TEXT NOT NULL DEFAULT 'cr_formula_snapshot',  -- audit trail for estimate origin
  expires_at            TIMESTAMPTZ NOT NULL, -- 15min staleness guard
  components            JSONB NOT NULL,       -- line-by-line breakdown
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Checkout validates `expires_at > NOW()`. Stale quote → re-price before Stripe PaymentIntent. Prevents drift between cart view and pay.

`estimated_bites` reasoning: HLD §K notification map says SMS on PAID is "$X Bites earned" using cart-time estimate. Real Bites written by CR async; if CR earn rule differs from snapshot (e.g., welcome 2X bonus applied CR-side), CR-side notification correction is Phase 2. Snapshot lives here for SMS template rendering only.

#### 2.10.6 OrderPaid event payload — primitives only

MP outbox emits `OrderPaid` with primitives. **Never includes computed Bites amount.** CR computes accrual from primitives + its own earn rules.

```typescript
// MP emits
type OrderPaidV1 = {
  schemaVersion: 1;
  marketplace_order_id: string;
  account_id: string;        // Sally
  cr_store_id: number;       // Rob's CR store FK
  subtotal_cents: number;    // basis for earn calc — CR multiplies by its rule
  earn_rate_x: number;       // Rob's setting at order time (snapshot for CR audit)
  platform_fee_cents: number;
  is_first_order: boolean;   // welcome 2X bonus context for CR
  paid_at: string;           // ISO
  // NOT INCLUDED: earned_bites, wallet_delta — CR computes
};
```

CR consumes, runs reward engine (campaigns, earn rules, welcome bonus), deducts Rob's CR wallet (auto-recharge if low), credits Sally, writes ledger entry, persists `(marketplace_order_id, ledger_entry_id)` for audit. CR is solely responsible for the Bites number that hits Sally's wallet.

#### 2.10.7 Accounting test gate

Per-side tests, no overlap.

**MP-side PRs (`payments`, `orders`, `pricing`, `payouts`):**
1. Golden-file fixtures for total cart math (subtotal → application_fee → transfer).
2. Property-based: random cart → server total === sum of typed components.
3. Round-trip: dollars → cents → dollars equals input within ±0.
4. `OrderPaid` payload schema test — must NOT contain `earned_bites` or any Bites field. Lint rule plus typed assertion.
5. `redemption-client` + `rewards-client` tests assert HTTP serialization only — no math assertions.

**CR-side PRs (reward engine, wallet, ledger):** owned by CR team, separate test suite. MP integration test stubs CR `/internal/*` with contract fixtures from CR repo.

CODEOWNERS routes MP-side rewards-touching PRs to engineering lead. Any MP code attempting to compute Bites earn = blocked at review.

#### 2.10.8 Reconciliation (daily Inngest job, MP-side)

Daily MP-side job pulls primitives from both sides, compares, alerts on drift.

| Reconciled | MP source | CR source | Drift threshold |
|---|---|---|---|
| Stripe `application_fee` daily total | sum `ord_price_quotes.application_fee_cents` for paid orders | Stripe payouts API | $1 |
| Stripe `transfer` daily total | sum `ord_price_quotes.transfer_amount_cents` | Stripe transfers API | $1 |
| `OrderPaid` events emitted | count from `evnt_outbox` where `event_type='OrderPaid'` | count from CR `/internal/accounting/order_paid_consumed` | 0 (any drop = lost reward) |
| Bites credited (CR side) vs estimated (MP side) | sum `ord_price_quotes.estimated_bites` for paid orders | CR `/internal/accounting/bites_credited` daily total | 100 Bites or 5% (whichever higher) — rule mismatches expected |

Drift over threshold → Founder alert via G-4. Manual investigation. Never auto-correct. MP's `estimated_bites` is never a target — only a tripwire signaling earn rule divergence between MP snapshot and live CR engine.

### 2.11 Source provenance (cross-cutting — synthesis, ingestion)

Any field synthesized from external sources stores provenance. Required on `cat_restaurants`, `menu_items`, `diet_restaurant_tags`, future synthesis outputs.

Pattern: sibling JSONB column per provenance group, not per-field.

```sql
-- Example on menu_items
CREATE TABLE menu_items (
  id           UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price_cents  INTEGER,
  -- ...
  provenance   JSONB NOT NULL DEFAULT '{}'::jsonb
  -- shape: { name: { source, confidence, captured_at }, price_cents: {...}, ... }
);
```

`source` enum: `'ezcater' | 'google_business' | 'yelp' | 'restaurant_site' | 'rob_input' | 'rob_pdf' | 'ai_generated' | 'validator_override'`.  
`confidence` 0.0–1.0.  
`captured_at` ISO timestamp.

Validator UI (L-2) reads `provenance` per field. Re-audit (L-2 quarterly) compares current scrape source vs stored — drift triggers re-review.

### 2.12 Timezone rule

All `TIMESTAMPTZ` stored UTC. Application code uses UTC for SLA computation, cron schedules, expiry checks. User-facing rendering converts to user TZ on the client only. Never store wall-clock strings.

Inngest job schedules expressed in UTC (`cron: '*/5 * * * *'` = UTC). Document timezone-sensitive jobs (delivery reminders) explicitly in job header comment.

---

## 3. Outbox Pattern

### 3.1 Table schema

```sql
CREATE TABLE evnt_outbox (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type  TEXT          NOT NULL,  -- 'order' | 'restaurant' | 'menu' | ...
  aggregate_id    UUID          NOT NULL,  -- entity's PK
  event_type      TEXT          NOT NULL,  -- 'OrderPaid' | 'OrderRequested' | ...
  version         INTEGER       NOT NULL DEFAULT 1,
  payload         JSONB         NOT NULL,
  occurred_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  published_at    TIMESTAMPTZ   NULL,      -- NULL = pending relay
  publish_attempts INTEGER      NOT NULL DEFAULT 0,
  last_error      TEXT          NULL,
  partition_key   TEXT          NOT NULL   -- aggregate_id::text for ordering
);

CREATE INDEX idx_outbox_pending ON evnt_outbox (occurred_at)
  WHERE published_at IS NULL;

CREATE INDEX idx_outbox_partition ON evnt_outbox (partition_key, occurred_at);
```

### 3.2 Write protocol

Business state + outbox row written in **one transaction**. No exceptions.

```typescript
// Pattern every state-transition must follow
await prisma.$transaction([
  prisma.ord_orders.update({ where: { id }, data: { status: 'ACCEPTED' } }),
  prisma.evnt_outbox.create({
    data: {
      aggregate_type: 'order',
      aggregate_id: id,
      event_type: 'OrderAccepted',
      version: 1,
      payload: { orderId: id, restaurantId, acceptedAt: new Date() },
      partition_key: id,
    },
  }),
]);
```

### 3.3 Relay

Inngest cron job polls `evnt_outbox WHERE published_at IS NULL ORDER BY partition_key, occurred_at`.  
Batches by `partition_key` to preserve per-aggregate ordering.  
On successful dispatch: sets `published_at = NOW()`.  
On failure: increments `publish_attempts`, sets `last_error`, retries with backoff (exponential: 30s, 2m, 10m, 1h, 6h, 24h).  
Dead letter after 10 attempts: row moved to `evnt_outbox_dlq` (separate table, same shape + `dlq_reason TEXT`). Founder alert (G-4) fires on insert. `evnt_outbox` polling never scans poison rows again — keeps relay query fast.

### 3.4 Consumer idempotency

Every consumer dedupes by `evnt_outbox.id`. Store `(consumer_id, event_id)` in consumer's own processed-events table. Replay safe.

### 3.5 Event versioning

`version` column bumps on payload shape change. Compatibility rule:

- Producer bumps version on breaking shape change.
- Consumers must accept version `N` and `N-1` simultaneously for one full deploy cycle (≥2 weeks).
- Drop `N-1` only after backlog of unpublished `N-1` events == 0 AND processed-events table cleaned.
- Additive-only changes (new optional field) do NOT bump version.

Event payload types live in `{module}.events.ts`:

```typescript
export type OrderAcceptedV1 = {
  schemaVersion: 1;
  orderId: string;
  restaurantId: string;
  acceptedAt: string;
};

export type OrderAcceptedV2 = {
  schemaVersion: 2;
  orderId: string;
  restaurantId: string;
  acceptedAt: string;
  acceptedBy: string;  // new field, breaking
};

export type OrderAccepted = OrderAcceptedV1 | OrderAcceptedV2;
```

---

## 4. Service Interface Pattern

Modules expose a typed service object. Other modules call the service — never import Prisma models or DB queries directly across module boundaries.

```typescript
// modules/orders/orders.service.ts  — shape every service follows
export type OrdersService = {
  getById(id: string, actorId: string): Promise<Order | null>
  create(input: CreateOrderInput): Promise<Order>
  transition(id: string, event: OrderTransitionEvent, actor: Actor): Promise<Order>
}

export const ordersService: OrdersService = { ... }
```

Rules:
- Service methods are the only cross-module import surface.
- Service methods validate `actor` permissions via `authzService.can()` before any DB op.
- Service methods return domain types (not Prisma raw models).
- **Services do not call Prisma models directly.** Every DB read/write goes through a `*.repository.ts` sibling (see §4.1). A service may grab the `PrismaClient` handle only to pass it (or the `AppContext` carrying it) into a repository call.
- Prisma errors bubble unchanged out of repositories and services. The central error middleware (§6.2) is the single layer that masks driver internals.

### 4.1 Repository pattern

Every table gets a sibling `{table}.repository.ts` colocated with the module that owns it. The repository is the sole owner of Prisma calls against its table.

```typescript
// modules/auth/auth-account-settings.repository.ts
import type { AppContext } from '../composition.js';
import type { PrismaLifecycle } from '../infra/db/prisma.client.js';

export const authAccountSettingsRepo = {
  async upsertOnSignIn(ctx: AppContext, input: { crAccountId: bigint; vpId?: string | null }): Promise<void> {
    const prisma = ctx.services.get<PrismaLifecycle>('prisma').native();
    const now = new Date();
    await prisma.authAccountSetting.upsert({
      where: { crAccountId: input.crAccountId },
      update: { lastLoginAt: now },
      create: { crAccountId: input.crAccountId, vpId: input.vpId ?? null, lastLoginAt: now }
    });
  }
};
```

Repository rules:
- Method names reflect call-site intent, not the SQL verb (`upsertOnSignIn`, not `upsert`).
- No `try`/`catch` for Prisma errors. Let them bubble — `errorHandler` masks at the HTTP boundary.
- Repository methods return domain-shaped data, not raw Prisma row types, when the caller crosses a module boundary. Within the same module a repo may return the Prisma row.
- A repo never calls another repo. Cross-table coordination lives in the service layer.
- Tests for services mock the repository module; tests for repositories hit a real DB (per §14).

---

## 5. API Route Conventions

### 5.1 Route structure

```
/api/v1/{module}/{resource}
/api/v1/{module}/{resource}/:id
/api/v1/{module}/{resource}/:id/{action}   ← for state transitions
```

Examples:
```
POST   /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/accept
POST   /api/v1/orders/:id/deliver
GET    /api/v1/restaurants
GET    /api/v1/restaurants/:id
```

### 5.2 Response envelope

```typescript
// Success
{ data: T, meta?: { cursor?: string, total?: number, trace_id: string } }

// Error
{ error: { code: string, message: string, details?: unknown, trace_id: string } }
```

Every response includes `trace_id` in `meta` (success) or `error` (failure). Support tickets reference it.

Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `IDEMPOTENCY_KEY_REUSED`, `INTERNAL_ERROR`.

### 5.3 Pagination

Cursor-based only. No offset pagination.

```typescript
// Request
GET /api/v1/orders?cursor=<opaque_cursor>&limit=20

// Response meta
{ cursor: { next: string | null, prev: string | null }, total: number }
```

Cursor = base64-encoded `{ id, created_at }` of last item in page.

### 5.4 Auth middleware stack (every request)

```
attachTraceId()         → generate or read X-Trace-Id, attach to req + log context
validateJWT()           → decode + verify signature + check expiry, check jti not revoked
enforceTokenType()      → reject buyer token on partner routes and vice versa
loadPrincipal()         → attach { accountId, orgId, role, vp, tokenType, jti } to req
rateLimit()             → per-account for authed, per-IP for unauthed
```

### 5.5 JWT claims

```typescript
type JwtClaims = {
  sub: string;          // accountId (UUID)
  org: string | null;   // orgId — null for admin/service tokens
  role: 'sally' | 'rob' | 'admin' | 'service';
  token_type: 'buyer' | 'partner' | 'admin' | 'service';
  vp: string[];         // view permissions, e.g. ['orders:read', 'rewards:redeem']
  iat: number;
  exp: number;          // 1hr access token, 30d refresh token
  jti: string;          // UUID, enables revocation via Redis blocklist
};
```

Revocation: `auth_revoked_jti` Redis set, TTL = token exp. `validateJWT` checks set on every request. Logout writes jti.

### 5.6 Idempotency keys

All state-mutating POST/PUT/PATCH routes accept `Idempotency-Key` header. Required for: payment intent creation, order creation, order state transitions, redemptions. Optional but supported elsewhere.

```sql
CREATE TABLE idempotency_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL,
  endpoint        TEXT NOT NULL,             -- 'POST /api/v1/orders'
  key             TEXT NOT NULL,             -- client-supplied
  request_hash    TEXT NOT NULL,             -- sha256(body) — guards against key reuse with different body
  response_status INTEGER NOT NULL,
  response_body   JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  UNIQUE (account_id, endpoint, key)
);

CREATE INDEX idx_idem_expiry ON idempotency_keys (expires_at);
```

Middleware:
1. If row exists + `request_hash` matches → return cached response.
2. If row exists + `request_hash` mismatch → 422 `IDEMPOTENCY_KEY_REUSED`.
3. If absent → execute handler, store result.

Hourly cleanup job purges `expires_at < NOW()`.

### 5.7 Webhooks (Stripe, Twilio)

Separate route prefix: `/webhooks/{provider}`. Skip JWT middleware. Different rules apply.

Pipeline:

```
1. Verify signature (stripe.webhooks.constructEvent / Twilio X-Twilio-Signature)
2. Insert raw payload into evnt_webhook_log (id, provider, event_id, raw_body, received_at, signature_valid)
   ON CONFLICT (provider, event_id) DO NOTHING  -- dedup
3. If row inserted → enqueue Inngest job for processing
4. Return 200 immediately (<5s — providers retry on slow ack)
```

Inngest job reads `evnt_webhook_log`, processes, marks `processed_at`. Failure → retry up to 6 times, then DLQ + alert.

Signature verification failure → log + return 400, never process.

```sql
CREATE TABLE evnt_webhook_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,            -- 'stripe' | 'twilio'
  event_id        TEXT NOT NULL,            -- provider's event id
  event_type      TEXT NOT NULL,            -- 'payment_intent.succeeded' etc
  raw_body        JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ NULL,
  process_error   TEXT NULL,
  UNIQUE (provider, event_id)
);
```

### 5.8 Health & readiness

```
GET /health   → 200 always if process up, body { status: 'ok', version, uptime_s }
GET /ready    → 200 if DB + Redis + Stripe API reachable, else 503
                body { db: 'ok'|'fail', redis: 'ok'|'fail', stripe: 'ok'|'fail' }
```

`/ready` short-circuits in <500ms (cached 10s). Vercel + Inngest poll `/ready`. Founder alerting (G-4) polls every 30s.

---

## 6. Error Handling

### 6.1 Domain error classes

```typescript
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) { super(message) }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} ${id} not found`)
  }
}

export class ForbiddenError extends DomainError {
  constructor(action: string) {
    super('FORBIDDEN', `Not allowed: ${action}`)
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', message)
  }
}

export class ValidationError extends DomainError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', 'Request validation failed', details)
  }
}

export class RateLimitError extends DomainError {
  constructor(retryAfterSeconds: number) {
    super('RATE_LIMITED', 'Too many requests', { retryAfterSeconds })
  }
}

export class IdempotencyKeyReusedError extends DomainError {
  constructor() {
    super('IDEMPOTENCY_KEY_REUSED', 'Idempotency key reused with different request body')
  }
}
```

HTTP status mapping:

| Class | Status |
|---|---|
| `NotFoundError` | 404 |
| `ForbiddenError` | 403 |
| `ValidationError` | 400 |
| `ConflictError` | 409 |
| `IdempotencyKeyReusedError` | 422 |
| `RateLimitError` | 429 (sets `Retry-After` header) |
| Unhandled | 500 + Sentry capture |

### 6.2 Error mapping middleware

Central Express error handler maps `DomainError` subtypes → HTTP status codes. **Raw Prisma errors never reach the client.** Repositories and services do NOT catch them — they bubble up to the middleware, which masks `PrismaClientKnownRequestError`, `PrismaClientValidationError`, etc. to a generic 500/503 response without leaking driver internals. Repositories only translate when the *meaning* of a Prisma error differs from its default mapping (e.g. unique-violation → `ConflictError`); otherwise let it bubble.

---

## 7. TypeScript Conventions

- Strict mode on. No `any`. No `as unknown as T`.
- Domain types defined in `packages/types/` — shared client/server.
- Prisma generated types used inside repositories only — never imported by services, controllers, or routes. Service-layer signatures use domain types; repos translate at the boundary when crossing modules.
- `zod` for all request body validation at route boundary. Schema defined alongside route (or alongside service — wherever the input type lives), imported by route for `.parse()`.
- `Result<T, E>` pattern discouraged — use typed throws for simplicity in MVP.

---

## 8. Logging & Tracing

Every request gets a `trace_id` (UUID) at entry. Propagated to all downstream calls (CR backend HTTP, Stripe, Inngest jobs) via header `X-Trace-Id`.

Structured JSON log format (every log line):

```json
{
  "level": "info",
  "trace_id": "uuid",
  "module": "orders",
  "event": "order.transition",
  "actor_id": "uuid",
  "entity_id": "uuid",
  "duration_ms": 45,
  "ts": "2026-05-06T10:00:00.000Z"
}
```

Log levels: `debug` (dev only), `info` (normal ops), `warn` (degraded path taken), `error` (unhandled exception).  
Sentry captures all `error` level + unhandled promise rejections.

### 8.1 PII redaction

Logger wraps a redactor. Field allowlist approach: log structure declares what's safe, everything else stripped.

Never logged raw:
- email, phone, full name, delivery address, dietary entries (physician dietary memory is sensitive)
- Stripe payment_method tokens, card last4
- JWT tokens, magic link tokens, API keys
- Webhook raw bodies (logged to `evnt_webhook_log` only, never to stdout)

Logged hashed (sha256, first 8 chars):
- Email → `email_hash` for funnel correlation
- Phone → `phone_hash`

Implementation:

```typescript
// packages/logger/redact.ts
const ALWAYS_REDACT = ['email', 'phone', 'address', 'dietary', 'token', 'card', 'ssn'];

export function redact(obj: unknown): unknown {
  // recursive walk, replace matched keys with '[REDACTED]'
  // hashable fields (email, phone) replaced with hash sibling
}
```

Sentry `beforeSend` hook applies same redactor to event payloads.

PostHog events use property allowlist — never auto-spread arbitrary objects into capture.

---

## 9. Environment & Secrets

All secrets via environment variables. Never hardcoded. Never committed.

| Variable group | Example keys |
|---|---|
| DB | `DATABASE_URL` |
| Redis | `REDIS_URL` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SENDER` |
| Anthropic | `ANTHROPIC_API_KEY` |
| CR service | `CR_INTERNAL_BASE_URL`, `CR_SERVICE_JWT_SECRET` |
| PostHog | `POSTHOG_API_KEY` |
| Inngest | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| Typesense | `TYPESENSE_HOST`, `TYPESENSE_API_KEY` |

---

## 10. Module File Structure

```
src/modules/{module-name}/
  {module}.service.ts                 ← service interface + implementation
  {module}.controller.ts              ← HTTP-aware: reads req, writes res, sets cookies
  {module}.routes.ts                  ← Express routes, zod validation
  {module}.types.ts                   ← domain types (re-exported to packages/types)
  {module}.errors.ts                  ← module-specific DomainError subclasses
  {module}.events.ts                  ← outbox emit helpers + event payload types
  {table}.repository.ts               ← one file per table owned by the module
  __tests__/
    {module}.service.test.ts
    {module}.routes.test.ts
    {table}.repository.test.ts
```

Prisma schema layout:

```
prisma/
  schema.prisma                       ← MVP: single file, datasource + generator + every model
  migrations/                         ← prisma migrate dev output, committed
```

Promote to the multi-file layout below once the single file crosses ~5 modules:

```
prisma/schema/
  schema.prisma                       ← datasource + generator + previewFeatures = ["prismaSchemaFolder"]
  {module}.prisma                     ← models for that module — one file per module group
```

Requires Prisma ≥ 5.15 with `prismaSchemaFolder` preview feature when split.

---

## 11. Feature Flags

PostHog feature flags = single source. Server-side eval, never client. Cached 60s per `(flag_key, distinct_id)`.

```typescript
// packages/flags/flags.ts
export const flags = {
  isEnabled(key: FlagKey, ctx: { userId?: string; orgId?: string }): Promise<boolean>
  variant(key: FlagKey, ctx: ...): Promise<string>  // for A/B with named variants
};
```

Rules:
- Never call `flags.isEnabled` inside a DB transaction (network call → holds locks).
- Every flag has `default: false` in code. PostHog outage = feature off.
- Kill-switch flags prefix `kill_*` (e.g. `kill_tier3_visibility`, `kill_stripe_capture`). Default ON, flip OFF to disable.
- A/B variant flags: deterministic hash by `userId`. PostHog handles hashing; never roll own.
- Document every flag in `docs/flags.md` — owner, purpose, removal date.

Flags MVP needs:
- `kill_tier3_visibility` (Tier 3 surfacing in chatbot — L-3, L-4)
- `tier3_card_variant` (A/B 3d-minimal vs 3d-enhanced — L-3, L-11)
- `kill_stripe_capture` (emergency stop on D-3 capture path)
- `kill_outbound_email` (L-5/L-6 emergency stop)
- `profile_wizard_required` (D9 toggle without redeploy)

---

## 12. Audit Log

`adm_audit_log` records actor-driven state changes that need legal/compliance defensibility.

```sql
CREATE TABLE adm_audit_log (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type    TEXT         NOT NULL,   -- 'sally' | 'rob' | 'admin' | 'system'
  actor_id      UUID         NULL,       -- NULL when actor_type = 'system'
  action        TEXT         NOT NULL,   -- 'tier_state.transition' | 'consent.captured' | 'order.force_accept'
  entity_type   TEXT         NOT NULL,   -- 'restaurant' | 'order' | 'agreement'
  entity_id     UUID         NOT NULL,
  before_state  JSONB        NULL,
  after_state   JSONB        NULL,
  metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  trace_id      UUID         NULL,
  ip            INET         NULL,
  user_agent    TEXT         NULL,
  occurred_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON adm_audit_log (entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_actor ON adm_audit_log (actor_id, occurred_at DESC);
```

Append-only. No updates, no deletes. Retention 7 years (legal default).

Mandatory audit-log writes:
- B-6 participation agreement signing (consent capture)
- B-7 ToS clickwrap acceptance
- L-12 ezCater URL consent capture (Rob → Tier 1 transition)
- Tier state transitions (`tier_3` → `tier_1_draft` → `tier_1`)
- G-2 founder force-accept / cancel / override
- Stripe Connect onboarding completion
- Rob `accepting` toggle changes
- Admin role changes

Helper:

```typescript
// shared/audit.ts
export async function audit(args: {
  tx: Prisma.TransactionClient;  // must be in same transaction as state change
  actor: Actor;
  action: string;
  entity: { type: string; id: string };
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

Audit row + business state mutation in same transaction. Same protocol as outbox.

---

## 13. File Uploads

Storage: object storage (Supabase Storage if D2=Supabase, else S3). Files never stored in Postgres.

Upload flow:

```
1. Client requests signed upload URL: POST /api/v1/uploads/sign
   body: { kind: 'menu_pdf' | 'menu_image' | 'menu_excel', filename, content_type, size_bytes }
   server validates kind → returns { upload_url, file_id, expires_in: 900 }
2. Client PUTs file directly to signed URL (15min TTL)
3. Client confirms: POST /api/v1/uploads/:file_id/confirm
4. Server enqueues Inngest job: virus scan (ClamAV) → mark file safe → trigger downstream
   (menu PDF → L-1 synthesis; menu image → image processing; menu excel → L-15 parse)
```

Limits per kind:

| Kind | Max size | Allowed MIME |
|---|---|---|
| menu_pdf | 10 MB | `application/pdf` |
| menu_image | 5 MB | `image/jpeg`, `image/png`, `image/webp` |
| menu_excel | 5 MB | `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| profile_avatar | 2 MB | `image/jpeg`, `image/png` |

```sql
CREATE TABLE upl_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id   UUID NOT NULL,
  kind          TEXT NOT NULL,
  filename      TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL,
  storage_path  TEXT NOT NULL,        -- 'uploads/{kind}/{yyyy}/{mm}/{uuid}.{ext}'
  scan_status   TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'clean'|'infected'|'error'
  scanned_at    TIMESTAMPTZ NULL,
  confirmed_at  TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Files served to clients only via signed download URLs (15min TTL). Never public bucket.

---

## 14. Testing

### 14.1 Test pyramid

- Unit: pure functions, service methods with DB mocked at repository layer. Fast (<5s suite).
- Integration: hit real Postgres + Redis (test instances), Stripe in test mode, Inngest local dev server.
- E2E: Playwright against staging. Smoke flow only — Sally signup → order → delivered → Bites earned.

### 14.2 Test database

Separate DB: `wecater_test`. CI provisions fresh per run via `prisma migrate deploy`.

Per-test isolation: `BEGIN` at test start, `ROLLBACK` at test end. Never shared fixtures across tests. No `truncate-between-tests` strategy — too slow.

```typescript
// __tests__/setup.ts
beforeEach(async () => {
  testTx = await prisma.$begin();
});
afterEach(async () => {
  await testTx.$rollback();
});
```

### 14.3 Inngest jobs

`@inngest/test` with `InngestTestEngine`. Mock external HTTP (Stripe, Twilio, ClamAV, PostHog). Real DB.

### 14.4 What gets tested (MVP gate)

- Order state machine: every transition path + invalid-transition rejection
- Outbox: write happens in transaction, relay marks published
- Idempotency: duplicate POST returns cached response
- Rewards math (E-1): exhaustive — accrual, redemption, escrow deduction
- Stripe webhook signature verify + dedup
- ezCater isolation: app role cannot read prospecting schema (DB-level test)
- Tier 3 → Tier 1 consent transition writes audit log

### 14.5 Coverage policy

No global coverage threshold. Every PR touching `payments`, `orders`, `rewards`, `synthesis` requires test changes — enforced via CODEOWNERS + PR template checklist.

---

## 15. Open Decisions (block specific LLD files)

| Decision | Blocks | Status |
|---|---|---|
| D1 — Stripe Connect charge type (destination vs separate charges+transfers) | `07-payments.md` | Open — end Week 1 spike |
| D2 — Supabase vs Neon | `00-conventions` DB + storage sections | Open — end Week 1 |
| D7 — Who marks delivered (Rob-only vs either) | `06-cart-orders.md` state machine | Open — end Week 3 |
| D8 — Cashback vs discount model | `10-rob-portal.md` settings, **rewards schema (Epic E)** — must lock before E-1 build | Open — end Week 2 |
| D9 — Profile wizard required vs skippable | `01-auth-orgs.md` onboarding flow | Open — end Week 2 |
| Auth-hold expiry (Option A vs B) | `07-payments.md` D-3 capture path | Open — before D-3 build |
