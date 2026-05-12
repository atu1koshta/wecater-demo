# Plan — Write `lld/03-restaurants-tiers-ingestion.md`

## Context

`marketplace-mvp-hld.md` locked. `lld/MAIN.md` queues LLD-03 as Week-2 catalog skeleton. LLD-00 conventions and LLD-01 auth landed. MP datasource migrated to Postgres (`20260512121507_postgres_migration`) — every Postgres-flavored convention in `00` (`§2.4 gen_random_uuid`, `§2.6 native enums`, `§2.7 partial indexes`, `§2.9 schema + role isolation`, JSONB + GIN) is now in play unchanged.

Scope (HLD Part 4 §B, supply-side): `restaurants`, `tiers`, `ingestion`, `ezcater-gate`, `dietary` (supply-side tagging only). Out of scope: menu content (LLD-04), demand-side dietary matching (LLD-04), synthesis pipeline internals (LLD-14), Rob portal call sites (LLD-11), CR `/internal/*` route signatures (LLD-17), search index (LLD-05).

This plan is about **what LLD-03 will commit to**, not how it will be coded. Each section names a decision, the alternatives, the chosen path, and the reason. Implementation shapes live in the LLD itself.

---

## Decision 1 — `cat_tiers` table or code-only registry?

**MAIN.md row 03** lists `cat_tiers` as an MP table. Two values exist in MVP (`tier_3`, `tier_1` — plus an intermediate `tier_1_draft`). The set grows once Phase-2 introduces `tier_2`.

**Alternatives.** (a) DB table `cat_tiers` with a row per tier plus capability columns, foreign-keyed from `cat_restaurants`. (b) Postgres enum on `cat_restaurants.tier_state` + a TS registry that maps each enum value to a `TierCapabilities` record.

**Choice: (b) — code-only registry, no `cat_tiers` table.** Three reasons. First, MVP capability set is static — `orderable`, `hasMenu`, `payoutsEnabled`, `publiclyListed` — and changing it means a code release anyway (search filters, surfacing rules, payouts gating all reference the same flags). A DB row gives no operational lever. Second, Guardrail #2 forbids `tier_id === 1` literal comparisons; the same enforcement story works on a TS registry with an ESLint rule + snapshot test, and is actually easier to test than the DB equivalent. Third, divergence cost is one Prisma migration (rename `tier_id` → `tier_state`) and a `cross-doc amendment` to MAIN.md.

**Amendment to MAIN.md row 03**: drop `cat_tiers` from the tables list.

---

## Decision 2 — One `tier_state` column or `tier_id` + workflow-state pair?

HLD interchangeably uses `tier_id` (T1/T3 capability key) and `tier_state` (`tier_3 → tier_1_draft → tier_1` workflow). On the row level these are correlated; on the workflow level `tier_1_draft` is the moment Rob has consented but the L-2 validator has not green-lit.

**Choice: single `tier_state` enum column on `cat_restaurants`.** Capability lookup is `tierRegistry.capabilities(tier_state)`. The `tier_1_draft` state has its own capability shape (`hasMenu=true, orderable=false, publiclyListed=false`) — drafts are invisible to buyers, editable by Rob and validator, never billable. Collapsing to one column removes the synchronization problem of keeping `tier_id` and `tier_state` consistent.

`TierStateTransitioned` outbox event carries `from_state`/`to_state` for the few cross-module consumers that care (PostHog, audit log).

---

## Decision 3 — How to physically isolate ezCater data?

`00 §2.9` is Postgres-shaped and lands without rewrite: two schemas (`app`, `prospecting`), two roles (`wecater_app`, `wecater_prospect`), explicit REVOKE on the app role for `prospecting.*`. Migration scripts run as a deploy role with grants on both.

The decision is **how many enforcement layers** to ship.

| Layer | Cost | Failure caught |
|---|---|---|
| RBAC (Postgres roles) | one-time migration | accidental SQL with wrong session role |
| Two Prisma clients (`prisma-app`, `prisma-prospecting`) | one extra slot in composition | wrong-client-at-call-site |
| ESLint custom rule banning `@core/prospecting/*` imports from user-facing modules | one rule file + tests | wrong-module-at-design-time |
| Composition guard — `prisma-prospecting` registered only in Inngest workers, never in API process | one-line check | wrong-process-at-runtime |

**Choice: all four.** Defense in depth is the right move because Guardrail #4 ("ezCater data never reaches user-facing product") is a legal-exposure rule, not a hygiene rule. The marginal cost is one ESLint rule and one extra Prisma client — small. The four layers fail at different times (test, dev, build, boot), so a single skipped layer is not a silent leak. The composition guard is the most important — even if every other check is bypassed, the user-facing API process cannot connect to the prospecting schema because it has no client registered for it.

**Tier-3 sub-segment `3a / 3b` (sales-side metadata: "this restaurant is also on ezCater")** lives in `prospecting.pro_restaurants` only. It is never copied to `app.cat_restaurants`. Sales outreach modules (LLD-14 `outreach`) read prospecting through the `wecater_prospect` role. Surfacing to Sally never depends on it.

---

## Decision 4 — `cr_store_id` shape: CHAR(36), INTEGER, or native UUID?

CR's `restaurant_stores` PK is `DataTypes.CHAR(36)` (Sequelize). Values are UUID strings stored as fixed-length char. Same pattern already in MP at `auth_buyer_settings.cr_account_id` (CHAR(36)). `00 §2.4` exception text predates this and is now stale.

**Alternatives.** (a) `CHAR(36)` — byte-for-byte match with CR. (b) Postgres native `UUID` type — 16 bytes on disk, native operators, but assumes CR always emits a syntactically valid UUID. (c) INTEGER — wrong, CR is not integer-PK'd.

**Choice: `CHAR(36)`.** Match CR exactly. Two reasons. First, no implicit-conversion footgun on joins or lookups — same string comes off the wire, goes into the column, comes back identical. Second, if CR ever emits a non-UUID 36-char value (legacy migration row, manual fixture), native `UUID` rejects insert; `CHAR(36)` accepts it and the row stays in sync with CR. Storage delta (36 bytes vs 16) is negligible at MP scale.

Precedent set: `auth_buyer_settings.cr_account_id` is already `CHAR(36)`. Same shape on `cat_restaurants.cr_store_id` keeps the cross-service id convention consistent.

**`00 §2.4` amendment:** replace "INTEGER exception" wording with "CR external ids are `CHAR(36)`; only MP-owned PKs use `gen_random_uuid()` native UUID." Cross-doc amendment ships with LLD-03.

No LLD-17 confirmation needed — type verified from CR Sequelize model.

**Nullability:** `cr_store_id` is `NULL` for `tier_state = 'tier_3'` rows (discovered restaurants not yet onboarded to CR — CR has no record of them). Populated at Tier-3 → Tier-1-draft transition when MP calls `CrClient.createStore` and stores the returned id. UNIQUE constraint applies only to non-NULL values via partial index: `CREATE UNIQUE INDEX cat_restaurants_cr_store_id_uniq ON app.cat_restaurants (cr_store_id) WHERE cr_store_id IS NOT NULL`.

---

## Decision 5 — Identity + operational state storage: where does what live?

CR SaaS has no marketplace-ordering surface. It owns the restaurant-as-CR-customer relationship: Stripe Connect onboarding, billing, restaurant-side dashboard. It does **not** own anything that drives "can Sally place an order right now." Plus, Tier-3 restaurants have no CR record at all — they are MP-discovered, MP-curated, and only get a CR row at Tier-1 conversion.

This forces a split that the original framing collapsed:

| Field bucket | Examples | SoT | Storage |
|---|---|---|---|
| Identity | `name`, `address`, `geo`, `phone`, `slug` | **MP** | Native columns on `cat_restaurants` |
| Marketplace operational state | `accepting`, `pause_until`, `hours_of_operation`, `delivery_radius_miles` | **MP** | Native columns on `cat_restaurants` |
| Brand | `cuisine_tags`, `price_band`, `description`, `image_urls` | MP | Native columns on `cat_restaurants` |
| Tier | `tier_state` | MP | Native column on `cat_restaurants` |
| Dietary | tag set + per-tag provenance | MP | `cat_restaurant_dietary` join |
| Payouts | `stripe_connect_account_id` | **MP** | Native column; MP runs Stripe-hosted Connect onboarding, receives id via Stripe webhook |
| CR-owned references | `cr_store_id` | CR | Stored locally as ref column; populated at Tier-1-draft conversion; never re-fetched in MVP. Soft link to Rob's CR SaaS account, not payment-critical. |

**Choice: MP-native ownership for identity + operational + brand. No CR read-through cache in MVP.**

Three reasons.

First, **Tier-3 has no CR record** to read from. Whatever scheme covers identity must work for stores CR has never heard of. Native MP columns work uniformly across all tiers.

Second, **CR has no marketplace-ordering data** to be SoT for. The `accepting` flag, hours, pause windows — these are properties of "is this restaurant taking marketplace orders," which is a marketplace concept. CR's restaurant-side dashboard does not toggle them.

Third, **payouts are MP's responsibility**. MP processes marketplace orders, so MP runs Stripe Connect onboarding directly via Stripe-hosted Express flow. `stripe_connect_account_id` arrives via Stripe webhook (Stripe → MP), is stored on `cat_restaurants`, and stays MP-owned. CR is never in the payout path.

Fourth, **the only CR-side data MP holds is the cross-system soft link** — `cr_store_id`, populated at Tier-1-draft conversion. Not payment-critical. Used to reconcile Rob's MP restaurant with his CR SaaS customer account for reporting / cross-product UX. No re-fetch in MVP.

**Conversion flow** (Tier-3 → Tier-1-draft):
```
1. Rob consents in admin route
2. MP calls CrClient.createStore({ name, address, geo, phone }) — idempotency key required
   → returns cr_store_id
3. MP triggers Stripe Connect onboarding via Stripe-hosted Express flow
   → Rob completes bank + identity verification on Stripe-hosted page
   → Stripe fires `account.updated` webhook to MP with stripe_connect_account_id
4. MP UPDATE cat_restaurants SET cr_store_id, stripe_connect_account_id, tier_state = 'tier_1_draft'
5. Outbox: TierStateTransitioned
```

Steps 3 and 4 are async — Rob may complete Stripe onboarding minutes or hours after consent. Tier transition to `tier_1_draft` may happen at step 2 (link to CR done) with `stripe_connect_account_id` filled later by the webhook handler; transition to `tier_1` (orderable) blocks on Stripe account being `charges_enabled = true`.

After this, MP never re-fetches identity or accepting state from CR. Stripe account status changes flow via Stripe webhook (`account.updated`) directly to MP — CR is not involved.

**CR-side identity drift** (CR admin staff edits store name): accepted, no MVP mechanism to flow back. Rare in practice — founder + Rob have no CR admin access in MVP. If it becomes a real problem in Phase-2, MP adds a webhook receiver to sync identity columns. Cost is one route + idempotent UPDATE.

**No HLD §11 wallet pattern here.** Wallet is a live CR-side balance — different beast. Restaurant data MP needs from CR is one soft-link id set once at conversion, not live state.

---

## Decision 6 — Per-field provenance: column-per-field, JSONB blob, or sibling table?

`00 §2.11` mandates per-field provenance. Three shapes.

| Shape | Read cost | Write cost | Schema rigidity |
|---|---|---|---|
| Column per provenance triple (`name_source`, `name_confidence`, `name_captured_at`, ...) | cheap | wide rows | every new synthesized field needs three columns + migration |
| Single JSONB column `{ <field>: {source, confidence, captured_at} }` | cheap (one read) | cheap (one write) | flexible — new field = no migration |
| Sibling table `cat_restaurant_provenance(restaurant_id, field, source, ...)` | needs join | normalized | flexible — new field = no migration |

**Choice: single JSONB column.** Read-and-display in the validator UI (L-2) is the dominant access pattern; the validator reads every provenance entry at once. Filtering or aggregating across provenance is a Phase-2 analytics concern that lives in PostHog, not Postgres. JSONB + the rare GIN index later if needed. Same shape on `cat_restaurant_dietary` (per-tag provenance) and on `menu_items` (LLD-04 owns the same pattern).

**Source enum** (per `00 §2.11`, with `founder_curation` added as cross-doc amendment): `ezcater | google_business | yelp | restaurant_site | founder_curation | rob_input | rob_pdf | ai_generated | validator_override`.

**MVP scope.** The JSONB column ships in MVP to lock the schema and avoid backfilling provenance into existing rows when synthesis lands. MVP-active source values are narrow:

| Source | MVP writer |
|---|---|
| `founder_curation` | Founder enters Tier-3 store via `POST /v1/admin/restaurants` |
| `rob_input` | Rob-confirmed identity at Tier-1-draft conversion (founder enters on Rob's behalf in MVP) |

All other enum values (`ezcater`, `google_business`, `yelp`, `ai_generated`, `validator_override`, ...) are declared in the TS type but never emitted by MVP code. The full enum exists so Phase-2 adapters and the L-2 validator UI can add them without an enum migration.

**Phase-2 enforcement deferred from MVP:**
- Write-time `ezcater`-source rejection on `app.cat_restaurants` — Guardrail #4 is already enforced by the four-layer isolation (Decision 3), no provenance check needed in MVP. Land it with the L-2 validator (LLD-14).
- GIN index on `provenance` — no MVP query reads it. Add when validator UI ships.
- Validator UI display — LLD-14 concern.

`provenance` JSONB on `prospecting.pro_restaurants` may carry any source including `ezcater`. Promotion-time validator (Phase-2, LLD-14) is where `ezcater` source values get stripped or replaced before a row crosses into `app`.

---

## Decision 7 — Where does `evnt_outbox` table land?

`00 §3.1` defines the schema. No migration has emitted it yet. LLD-03 is the first state-changing producer in the LLD order (`RestaurantActivated`, `TierStateTransitioned`).

**Alternatives.** (a) Carve the outbox migration in LLD-03 itself. (b) Defer to LLD-08 (orders) where outbox first earns its keep with high-frequency events. (c) Treat it as foundation infra and add to LLD-00 (a sibling to `idempotency_keys` and `adm_audit_log`).

**Choice: (a) — LLD-03 carves the migration**, paired with a stubbed relay worker (`outbox-relay.worker.ts`) carrying a `// TODO LLD-08: implement Inngest relay loop` marker. Reasons: the producer pattern (`outboxRepo.enqueue(tx, event)` written inside the same transaction as the business mutation) is a contract every later LLD inherits — better to ship it once a single producer exercises it, than to invent it under time pressure when orders lands. The relay loop is decoupled — adding it later does not change the producer contract. A correctness test (`tier_state` transition writes both rows in one transaction) ships in LLD-03 and stays green forever.

**Cross-doc amendment:** `00 §3` adds a note that the migration ships in LLD-03; the relay loop ships in LLD-08.

---

## Decision 8 — IngestionAdapter: interface + many adapters, or service-method-per-source?

HLD Part 4 §B names IngestionAdapter as a "registry-style" extension point — Phase-2 adds `yelp`, `toast`, `monkeymedia`, `ezcater_scrape`. MVP needs only `manual_ops` (founder onboarding).

**Alternatives.** (a) TS interface + DI registry; MVP ships one concrete adapter; Phase-2 PRs add new files only. (b) Single `ingestionService.create()` method that dispatches on `source` enum. (c) No abstraction in MVP — fold `manual_ops` directly into `restaurantsService.create`.

**Choice: (a).** Two reasons. First, INFERENCES says ingestion modes (scheduled scraper, LLM extraction, PDF parser, ezCater URL consent pull, async image population) have radically different I/O profiles — scrapers are scheduled and bulk, PDF parsers are async with file uploads, manual_ops is synchronous. A single dispatching method ends up branching on every field. Second, the interface is small (one method, `ingest`), and adapters can be tested independently of the catalog write path.

**MVP scope:** interface + `manual_ops` adapter. Phase-2 adapters are not stubbed — the interface ships, the concrete classes do not. Adding `yelp` later = one PR adding one file + one DI registration. `cat_ingestion_runs` audit row written by `ingestionService.executeRun(adapter, input, actor)` — adapters never write the audit row directly.

---

## Decision 9 — Restaurant HTTP route surface?

Per `00 §5`, every state-changing route declares a `requiredAction`. The decision is **how minimal to keep the surface**.

| Route | Owner | Justification |
|---|---|---|
| `POST /v1/admin/restaurants` | admin | Founder creates Tier-3 row (identity + brand fields, no `cr_store_id` yet) via ops console (LLD-15) and `manual_ops` ingestion adapter |
| `PATCH /v1/admin/restaurants/:id` | admin | Identity, operational, and brand-field edits (founder corrects typos, toggles `accepting`, sets `pause_until`, updates hours); does NOT mutate `cr_store_id` or `stripe_connect_account_id` after they are set |
| `POST /v1/admin/restaurants/:id/transition-tier` | admin | T3 → T1-draft → T1 progression with audit row + consent reference |
| `GET /v1/admin/restaurants` | admin | Ops list with tier filters |
| `GET /v1/admin/ingestion-runs` | admin | Ingestion audit trail |
| `GET /v1/restaurants/:id` | buyer | Restaurant detail page (CR identity proxied + tier-aware capabilities) |
| `GET /v1/dietary-tags` | buyer | Static tag list for filter chips |

**Not in LLD-03:** public list (Typesense via LLD-05), partner edits (LLD-11), L-2 validator UI (LLD-14). No `POST /v1/restaurants` for Rob — partner-token surface is LLD-11's responsibility.

`Action` enum extensions for LLD-01: `restaurants:create`, `restaurants:read`, `restaurants:read_public`, `restaurants:edit_brand`, `restaurants:transition_tier`, `ingestion:read`, `dietary_tags:read`. Role assignments stay in LLD-01.

---

## Decision 10 — Dietary tag join: many-to-many table or array column?

**Alternatives.** (a) `cat_restaurant_dietary` join table with `(restaurant_id, dietary_tag_id, provenance)`. (b) `cat_restaurants.dietary_tag_ids text[]` array column. (c) Tags as enum on `cat_restaurants` with bit-packed flags.

**Choice: (a) join table.** Per-tag provenance is the load-bearing requirement — each tag assertion comes from a specific source ("ezCater says they offer gluten-free", "Rob confirmed kosher", "AI inferred vegan from menu items") and the validator must inspect each. An array column cannot carry per-element provenance without devolving into a JSONB blob, at which point a join table is simpler and queryable. Plus, demand-side matching (LLD-04) wants reverse lookup ("find restaurants offering kosher") — trivial with an index on `dietary_tag_id`.

`cat_dietary_tags` itself is a small registry table — MVP set of ~10 slugs (`gluten_free`, `kosher`, `vegan`, `halal`, `nut_free`, `dairy_free`, ...). Could be a code-only registry like tiers, but a table costs less than the tier registry argument because (1) the set grows iteratively post-MVP without a release, (2) the FK pattern from the join table needs a real row, (3) admin UI can list/edit tags.

---

## Tables (locked at architecture level — column-level shape at LLD-write time)

### Schema `app`

- **`cat_restaurants`** — UUID PK.
  - **Identity (MP-owned, all tiers):** `name TEXT NOT NULL`; `address_line1 TEXT`; `address_line2 TEXT`; `city TEXT`; `region TEXT`; `postal_code TEXT`; `country_code CHAR(2)`; `geo` (lat/lng pair or PostGIS `POINT` — defer to LLD-05 search needs); `phone TEXT`; `slug TEXT NOT NULL UNIQUE`.
  - **Tier:** `tier_state` Postgres enum (`tier_3 | tier_1_draft | tier_1`); `activated_at TIMESTAMPTZ NULL` (set on transition to `tier_1`).
  - **Marketplace operational state (MP-owned):** `accepting BOOLEAN NOT NULL DEFAULT false` (toggled by admin route, default false; Tier-3 stays false until conversion); `pause_until TIMESTAMPTZ NULL` (temporary closure); `hours_of_operation JSONB NOT NULL DEFAULT '{}'`; `delivery_radius_miles NUMERIC NULL`.
  - **Brand (MP-owned):** `cuisine_tags TEXT[]`; `price_band` enum; `description TEXT`; `image_urls TEXT[]`.
  - **Payouts (MP-owned, set by Stripe Connect onboarding):** `stripe_connect_account_id TEXT NULL` (populated by Stripe `account.updated` webhook); `stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false` (mirrors Stripe account status; gating signal for `tier_3 → tier_1` transition).
  - **CR reference (CR-owned, populated at Tier-1-draft conversion, soft cross-system link only):** `cr_store_id CHAR(36) NULL`.
  - **Synthesis outputs:** `compliance_fit JSONB` (L-14 86'd-detector output); `dietary_fit_summary JSONB` (cached match score); `provenance JSONB NOT NULL DEFAULT '{}'`.
  - **Soft-delete + audit columns** per `00 §2.2 / §2.3`.
  - **Indexes** per `00 §2.7`: partial on `(tier_state) WHERE deleted_at IS NULL`; btree on `slug`; partial unique on `(cr_store_id) WHERE cr_store_id IS NOT NULL`.
- **`cat_dietary_tags`** — UUID PK; `slug` unique; `label`.
- **`cat_restaurant_dietary`** — composite PK `(restaurant_id, dietary_tag_id)`; per-row `provenance` JSONB; reverse index on `dietary_tag_id`.
- **`cat_ingestion_runs`** — UUID PK; `adapter_name`; `restaurant_id` NULL; `status` enum (`pending | succeeded | failed`); `input_summary` JSONB; `output_summary` JSONB; `error`; `started_at`, `completed_at`.
- **`evnt_outbox`** — verbatim from `00 §3.1`.

### Schema `prospecting`

- **`pro_restaurants`** — UUID PK; `source` enum; `external_id`; identity fields (name, address, phone — sales-internal); `tier_3_subsegment` enum (`3a | 3b`); `linked_cat_restaurant_id` UUID NULL (populated post-promotion); `signal_score`; `raw_payload` JSONB; UNIQUE `(source, external_id)`. No outbox in this schema — no user-facing observer ever reads from prospecting.

Audit log writes live in `app.adm_audit_log` (owned by LLD-00) for tier transitions. Same transaction as state mutation, per `00 §12`.

---

## Outbox Catalog (LLD-03's contribution)

| Event | Producer trigger | Payload (primitives only) | Consumers (later LLDs) |
|---|---|---|---|
| `RestaurantActivated` | `tier_state` reaches `tier_1` | `{ restaurantId, cr_store_id, slug, activated_at }` | Search-index sync (LLD-05), PostHog (LLD-16) |
| `TierStateTransitioned` | any `tier_state` change | `{ restaurantId, from_state, to_state, transition_reason, consent_reference?, occurred_at }` | Audit log (same tx), PostHog (LLD-16) |

Per `00 §3.5`, payload TS types are versioned at the producer module. Same-transaction write of business state + outbox row is mandatory.

---

## CR-Side Asks (delivered to LLD-17)

1. `POST /internal/stores` — invoked by MP at Tier-3 → Tier-1-draft conversion. Body carries identity already owned by MP (`name`, `address`, `geo`, `phone`). Idempotency-key required. Returns `{ cr_store_id: CHAR(36) }`. Soft cross-system link only — CR does NOT issue Stripe Connect accounts; MP handles payouts directly via Stripe-hosted Connect onboarding.
2. Service-to-service auth scheme — HMAC service-JWT per HLD §2. Until LLD-17 locks, `CrClient` calls rely on TLS only (consistent with current code).
3. **Phase-2 only:** CR push-notify webhook for CR-admin-side identity edits (if drift becomes a real problem). Hook point on MP side: idempotent `UPDATE cat_restaurants` against matching `cr_store_id`. Not in MVP — no edit path on either side that produces meaningful drift.

**Open scope question for LLD sign-off:** is `cr_store_id` even MVP-relevant? If Rob's CR SaaS subscription is independent of marketplace participation, MP could skip CR integration entirely (no `POST /internal/stores`, no `cr_store_id` column) and run Rob onboarding standalone. Trade-off: loses the cross-system soft link used for cross-product UX / reporting reconciliation. Defer to LLD-11 (Rob portal) for product decision.

**Stripe-side asks (not CR-side):** Stripe Connect Express onboarding flow + `account.updated` webhook receiver. Owned by LLD-09 (payments). LLD-03 declares the columns; LLD-09 wires the webhook handler that writes them.

---

## Cross-Doc Amendments (delivered with LLD-03)

- **`lld/MAIN.md` row 03** — drop `cat_tiers` table; note `evnt_outbox` migration ships here.
- **`lld/MAIN.md` Cross-Doc §3.1 outbox catalog** — confirm payloads for `RestaurantActivated`, `TierStateTransitioned` are owned here.
- **`lld/01-auth-orgs.md` `Action` enum** — append seven actions (see Decision 9). Role assignments: admin all, sally `restaurants:read_public` + `dietary_tags:read`, rob deferred to LLD-11.
- **`lld/00-conventions.md §3.1`** — footnote: outbox table migration emitted in LLD-03; relay loop in LLD-08.
- **`lld/00-conventions.md §2.4`** — replace INTEGER-exception wording: CR external ids are `CHAR(36)` (verified from CR `restaurant_stores` Sequelize model); only MP-owned PKs use `gen_random_uuid()` native UUID.
- **`lld/00-conventions.md §2.11`** — append `founder_curation` to provenance source enum. Used for founder-entered Tier-3 identity in MVP.

No amendment needed to `00 §2.9` — Postgres conventions land unchanged after the migration.

---

## Guardrail Enforcement Map

| Guardrail | Enforcement in LLD-03 |
|---|---|
| #2 — Tier capability = registry flag, never `tier_id === 1` | ESLint rule + snapshot test against `src/restaurants/tier.registry.ts` |
| #4 — ezCater data never reaches user-facing product | Four-layer isolation (Decision 3); composition guard is the irreducible runtime defense |
| #6 — Bites obligation never deducted MP-side | Out of LLD-03 scope, but `OrderPaid` payload contract owned by LLD-10 references `cr_store_id` from this doc |
| #10 — Outbox on every state change | `tier_state` transitions are the only state changes in LLD-03; both transitions emit |
| #11 — Source provenance per field | `provenance` JSONB column on `cat_restaurants` + `cat_restaurant_dietary` |
| #16 — JWT `token_type` enforced at middleware | All admin routes declare `requiredAction`; partner-token rejection at `enforceTokenType` from LLD-01 |

---

## Trade-offs Left Open for Dev Time

| Question | Recommendation |
|---|---|
| `cr_store_id` actual type | Resolved — `CHAR(36)` per CR `restaurant_stores` Sequelize model. `00 §2.4` amended in same PR. |
| Identity / operational state / payouts SoT | Resolved — MP owns identity, operational state, and `stripe_connect_account_id` natively for all tiers. CR holds only `cr_store_id` (soft cross-system link, set once at conversion). No read-through cache in MVP. |
| Stripe Connect account ID source | Resolved — MP runs Stripe-hosted Express Connect onboarding; `account.updated` webhook (Stripe → MP) delivers `stripe_connect_account_id`. CR not involved. LLD-09 owns webhook handler. |
| CR `store.updated` push notification | Resolved — not in MVP. CR-side identity drift accepted (rare, no MVP edit path). Phase-2 only if CR admin edits become real drift driver. |
| `cr_store_id` MVP-relevance | Open — soft link only, MP runs payouts standalone. Defer to LLD-11 product decision; drop column entirely if cross-product UX not needed in MVP. |
| `dietary_fit_summary` recompute trigger | On tier transition + on dietary-tag change. L-1 synthesis recomputes asynchronously. |
| `manual_ops` audit row write — sync or async? | Sync. Founder action; no scale need. |
| Phase-2 adapter packaging — interface stubs vs concrete no-ops | Interface only. Phase-2 PR adds the concrete class. |
| ESLint rule placement | `tooling/eslint-rules/no-prospecting-imports.ts` — same precedent as future custom rules. |

---

## Critical Files

- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/marketplace-mvp-hld.md` — HLD Part 4 §B, §I; Part 6 ownership; Part 9 Guardrails #2, #4, #10, #11
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/00-conventions.md` — Postgres conventions land unchanged; outbox §3 amend footnote
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/01-auth-orgs.md` — extend `Action` enum
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/MAIN.md` — amend row 03
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/docs/inferences/INFERENCES.md` — Tier-3 sub-segment 3a/3b semantics, ingestion modes, L-12/L-13/L-14 hooks
- `/Users/atulkoshta/workspace/catering-rewards/projects/marketplace/core/prisma/schema.prisma` — Postgres-locked since `20260512121507_postgres_migration`
- `/Users/atulkoshta/workspace/catering-rewards/projects/marketplace/core/src/composition.ts` — LLD-03 registers `restaurants`, `ingestion`, `dietaryTags` services; declares but does NOT register `prisma-prospecting` in API process
- `/Users/atulkoshta/workspace/catering-rewards/projects/marketplace/core/src/infra/cr/cr.client.ts` — extend with `getStore(cr_store_id)` after LLD-17 contract lock

---

## Verification

LLD-03 doc correct + complete when:

1. Every decision above translates to a section in the LLD doc with rationale + chosen path.
2. Every table in §"Tables" has column list, indexes, FK shape, soft-delete decision, provenance shape.
3. Tier registry's capability fields cover every consumer call site (search, surfacing, orders, payouts).
4. ezCater isolation: all four layers cited with file or migration target.
5. Outbox: migration listed, producer helper signature locked, transactional test described.
6. Action enum extensions enumerated; every route declares `requiredAction`.
7. CR contract asks enumerated — no LLD-03 column blocks on speculation.
8. Cross-doc amendments staged in the same PR as the LLD-03 doc.

End-to-end test scenario (`tests/e2e/restaurants-tier-transition.spec.ts`):
- Admin creates restaurant (`tier_state=tier_3`) → no `RestaurantActivated` event.
- Admin transitions `tier_3 → tier_1_draft` → audit row + `TierStateTransitioned` outbox row, single transaction.
- Admin transitions `tier_1_draft → tier_1` → audit row + `TierStateTransitioned` + `RestaurantActivated` rows, single transaction.
- `GET /v1/restaurants/:id` returns identity fields proxied from `CrClient.getStore` (cache fills on first call, hit on second).
- Buyer attempt to `POST /v1/admin/restaurants/...` → 403 from `enforceTokenType` (LLD-01).
- ESLint test fixture: an import of `@core/prospecting/*` inside `src/restaurants/*.ts` fails with `no-prospecting-imports`.
- Boot-time: API process starts without `DATABASE_URL_PROSPECTING` (slot not registered); Inngest worker process fails fast if it is unset.
