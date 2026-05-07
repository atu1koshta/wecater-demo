# Plan — Write `lld/01-auth.md` (rename from `01-auth-orgs.md`)

## Context

`marketplace-mvp-hld.md` locked. `lld/MAIN.md` queues LLD-01 as foundation. HLD originally said "Auth.js v5 magic-link", but existing CR backend uses Keycloak as IdP + SoT for users. After 5 rounds of clarifying questions, IdP and session model resolved. Org concept dropped from MVP — buyers are standalone accounts.

This plan describes what `lld/01-auth.md` will commit to. Filename rename from `01-auth-orgs.md` reflects org dropping.

---

## Architectural Commitments (locked)

| # | Commitment |
|---|---|
| 1 | **KC is SoT** for users, identity, sessions, refresh. Reuses existing 3 KC clients (Customer→buyer / Restaurant→partner / Admin→admin). |
| 2 | **CR `accounts` is SoT for account records.** MP has no `auth_accounts` table. MP calls CR API to ensure accounts. |
| 3 | **MP issues its own short-lived access JWT** (RS256, 1h) with own key. Different `iss`, different `aud`, different signing key from KC. MP services validate MP JWT via MP JWKS only — KC not in hot path. |
| 4 | **No MP refresh JWT, no MP refresh table, no Redis blocklist.** Client holds opaque `kc_refresh_token` HttpOnly cookie. On expiry, MP `/auth/refresh` calls KC `refresh_token` grant → re-mint MP JWT. KC owns rotation, reuse-detection, revocation. Logout calls KC end-session. Residual risk: MP JWT valid up to 1h after KC logout (TTL window). |
| 5 | **Org concept dropped from MVP.** No `orgs_organizations`, no `orgs_members`. Sally = standalone account. JWT `org: null` for buyers. VP attaches to account, not org. Phase-2 LLD introduces orgs when B2B enterprise lands. Recipients/memory (LLD-06) re-key from `(organization_id, owner_account_id)` → `account_id`. |
| 6 | **MP↔CR `/internal/*` reuses existing `middlewares/internalAuth.js`.** LLD-17 documents the scheme. |
| 7 | **JWT shape** = `00 §5.5` amended:<br>add `kc_sub`, `vp_id`, `pack_roles`, `restaurant_id`<br>drop `vp: string[]` view-permissions array — `can()` resolves actions live from static role map (Option Y)<br>drop "30d refresh" — KC owns refresh<br>drop revocation-blocklist note. |
| 8 | **Action enum lives in LLD-01 (Cross-Doc §3.4).** String-literal union. `can(principal, action)` pure, no DB. Static `role→actions` map; pack-contributed roles via VP loader (LLD-02 contract). `'*'` sentinel allowed only on `admin`. Forbid `if (pack === '...')` (lint + grep). |

---

## MP-Side Tables (minimum)

Two tables. Schema details fixed at LLD-write time; columns below are the *required* set.

### `auth_account_settings`
MP-side per-account state keyed by `cr_account_id BIGINT` (no DB FK — cross-service). Required columns:
- `cr_account_id` (PK)
- `vp_id` (nullable text — VerticalPack id)
- `pack_roles` (text array — usually empty)
- `last_login_at`
- `status` (active | locked | disabled)
- `created_at`, `updated_at`

Not an account record. CR-side fields (email, owner_type, kc_sub) fetched via CR `/internal/accounts/:id`, cached short-TTL in Redis.

### Magic-link / credential store
**Open at dev time:** if MVP login flow is magic-link (current INFERENCES B-1, C-1), MP needs a single-use nonce table. If MVP uses KC's native login UI / password / OAuth-only, this table is unnecessary.

If magic-link via Resend ships: `auth_magic_links` with `(token_hash BYTEA UNIQUE, email, expires_at, consumed_at, ...)`. Single-use enforced atomically by `UPDATE … RETURNING`. Plaintext token never stored.

**Trade-off to decide at LLD time:**
- Magic-link via MP + Resend → MP owns email template, rate-limit, lockout. KC realm doesn't need email config.
- KC-native magic-link → KC owns email + flow. MP gets KC OIDC token via standard authorization-code grant. Less MP code, less control over UX/branding.
- Password / KC login UI → simplest. Current HLD INFERENCES (B-1, C-1) leans magic-link, but not strict.

LLD-01 will pick one and lock; this plan deliberately leaves the choice open.

---

## Token Flow (locked at architecture level)

```
Login                      MP-specific (magic-link OR KC-native — TBD)
    └→ identity proof ─────────────────────────────────────────────┐
                                                                    ▼
Consume / Callback     1. CR /internal/accounts/ensure → cr_account_id, kc_sub
                       2. KC token-exchange (RFC 8693) → KC access + kc_refresh_token
                       3. MP verify KC access via KC JWKS
                       4. MP upsert auth_account_settings (vp_id default for buyers)
                       5. Mint MP JWT (RS256, 1h, MP iss/aud/key)
                       6. Return MP JWT in body + kc_refresh_token cookie

Authed request         Authorization: Bearer <MP JWT>
                       MP validates via MP JWKS only. KC not touched.

Refresh                MP /auth/refresh → KC refresh_token grant → re-mint MP JWT.
                       KC rotates kc_refresh_token; MP relays cookie.

Logout                 MP /auth/logout → KC end-session. Cookie cleared.
                       MP JWT remains valid until exp (≤1h).
```

Two issuers, two keys, two audiences. MP services trust MP key only.

---

## Routes (minimum surface)

| Route | Purpose |
|---|---|
| `POST /auth/login` | Initiate login. Shape depends on login choice (magic-link → email; password → credentials; OIDC redirect → callback URL). TBD at LLD time. |
| `GET /auth/callback` or `GET /auth/consume` | Complete login. Performs token-exchange saga + mints MP JWT. Sets kc_refresh_token cookie. |
| `POST /auth/refresh` | Re-mint MP JWT via KC refresh_token grant. Rotates cookie. |
| `POST /auth/logout` | KC end-session + clear cookie. |
| `GET /auth/me` | Return principal: account, role, token_type, vp_id, pack_roles, profile_wizard_required. |

No `/orgs/*` routes. Phase-2 when org concept returns.

Error codes per `00 §5.2` envelope. Auth-specific codes added: `KC_UNAVAILABLE`, `CR_UNAVAILABLE`, `KC_REFRESH_INVALID|REVOKED`, plus login-flow-specific (e.g. `MAGIC_LINK_*` if magic-link path picked).

---

## Middleware Stack (per `00 §5.4`)

```
attachTraceId → validateJWT → enforceTokenType → loadPrincipal → rateLimit → requireAction → handler
```

- `validateJWT`: decode header (kid) → MP JWKS verify → check iss/aud/exp. **No Redis check** (KC owns revocation).
- `enforceTokenType(['buyer'|'partner'|'admin'])`: per-route policy. Rejects mismatched tokens with 403. Cheaper than `loadPrincipal`, runs before it.
- `loadPrincipal`: SELECT `auth_account_settings`. Attach `req.principal`. Status check (locked → 403).
- `requireAction(action)`: thin wrapper around `assertCan(principal, action)`.

JWT signing: RS256, key from env, kid header for rotation, JWKS published at `/.well-known/jwks.json`.

---

## Action Enum + `can()` (Cross-Doc §3.4 owner)

`Action` is a string-literal union (~85 actions in MVP across all LLDs 01–18). LLD-01 catalogs the full union grouped by module. PR to LLD-01 = adding actions.

- Static `role→actions` map in `STATIC_ROLE_ACTIONS: Record<StaticRole, readonly Action[]>`. Snapshot-tested.
- `admin` uses `'*'` sentinel (lint-restricted).
- Pack-contributed roles via VP `roles[]` (LLD-02 contract). MVP `pharma_rep` contributes zero — wiring exists, empty array.
- `can(p, action)`: pure, sync, no DB. Resolution = static map ∪ pack roles.
- `assertCan(p, a)`: throws `ForbiddenError` (`00 §6.1`).

RouteSpec config-object pattern: every route declares `requiredAction: Action`. Boot-time enumerator asserts presence — no route ships without one.

**Open at dev time:**
- Per-action role assignments (which actions does `sally` get? which `rob`?) — driven by route-level needs from each LLD. Final list assembled when LLDs 02–18 lock their routes.
- Audit-on-FORBIDDEN policy (selective per-route flag vs blanket).

---

## CR-Side Asks (LLD-17 owns spec)

1. `POST /internal/accounts/ensure { email }` — idempotent create-or-fetch. Returns `{ cr_account_id, kc_sub, owner_type, role }`.
2. `GET /internal/accounts/:id` — read, MP cache 60s.
3. KC realm config: per-stage env, MP service-account client `wecater-mp` with `token-exchange` permission on 3 clients (RFC 8693), `scope=offline_access`.
4. KC `end-session` endpoint accessible to MP for logout.
5. `middlewares/internalAuth.js` scheme spec (LLD-17).

CR self-provisions accounts on KC `user.created` event-listener (preferred) OR MP calls `ensure` endpoint synchronously (fallback). Pick at LLD time with CR team.

---

## Cross-Doc Amendments (delivered with LLD-01)

- `lld/00-conventions.md §5.5` — JWT claims: add `kc_sub`, `vp_id`, `pack_roles`, `restaurant_id`; drop `vp: string[]`; drop "30d refresh"; drop revocation-blocklist note.
- `lld/MAIN.md` row 01 — drop "Auth.js v5", drop `auth_refresh_tokens / auth_revoked_jti / orgs_*` from tables list. Mark org module Phase-2.
- `lld/MAIN.md` row 06 (recipients) — re-key from `(organization_id, owner_account_id)` to `account_id`.
- `marketplace-mvp-hld.md` — Part 3 auth wording, Part 4 §A `auth`/`orgs` rows, Part 4 §D recipients keying, Part 6 ownership table, Part 12 divergence row.

---

## Trade-offs Left Open for Dev Time

| Open question | Trade-off summary |
|---|---|
| Login flow (magic-link vs KC-native vs password) | Magic-link = MP UX control + nonce table. KC-native = least code, KC realm config dependency. Pick at LLD time. |
| CR account provisioning (event-listener vs sync `ensure` endpoint) | Listener = decoupled, eventual. Sync = predictable + loud failure. Pick with CR team. |
| Rate-limit thresholds + lockout policy | Tune from staging traffic. Defaults proposed at LLD time. |
| Audit-on-FORBIDDEN scope (selective vs blanket) | Selective = low signal, low cost. Blanket = forensic value at write cost. Default selective; expand if attack patterns emerge. |
| Magic-link sender (Resend vs Twilio + SMS) | If magic-link path picked. Resend (email) primary; SMS fallback per HLD §K. |
| Sally signup — self-serve vs Founder-invite | Self-serve = product-led. Invite-only = curated cohort. INFERENCES leans self-serve; finalize at LLD time. |

Each is a real choice; none unblock LLD-01 architecture commitments above.

---

## Critical Files

- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/MAIN.md`
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/00-conventions.md` (must amend §5.5)
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/marketplace-mvp-hld.md` (must amend Part 3, 4§A/D, 6, 12)
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/marketplace-architecture-lld-hld.md` §1.1, §6.9, §7.1 (KC topology reference)
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/docs/inferences/INFERENCES.md`
- `/Users/atulkoshta/workspace/catering-rewards/projects/wecater/wecater-demo-full/.claude/plans/lld/17-cr-internal-contract.md` (CR-side asks land here)

---

## Verification

LLD-01 doc correct + complete when:

1. Every commitment above translates to a section in LLD-01 (tables, routes, middleware, action enum, can(), CR asks, amendments).
2. Action enum exhaustive against all 17 other LLDs' planned routes.
3. Guardrails #2 (`tier_id===1`), #3 (`pack==='pharma_rep'`), #16 (token_type at middleware) each cite enforcement.
4. End-to-end token-flow narrative traceable: login → consume → KC token-exchange → MP JWT → authed request → refresh → logout.
5. Cross-doc amendments staged in same PR.

E2E test (`tests/e2e/auth-roundtrip.spec.ts`): Sally login → consume → CR `/internal/accounts/ensure` stub → KC token-exchange stub (returns OIDC + kc_refresh_token signed by stub JWKS) → MP mints JWT → `/auth/me` returns `vp_id:'pharma_rep'`, `org:null` → authed `/orders` succeeds → wrong-token-type cross-test passes → `/auth/refresh` rotates → logout calls KC end-session → next refresh → 401.
