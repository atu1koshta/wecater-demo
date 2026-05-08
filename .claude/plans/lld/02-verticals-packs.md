# LLD-02 — Verticals & Packs

**Depends on:** LLD-00 (conventions), LLD-01 (auth-orgs — for `orgs_organizations.vertical_pack_id` and JWT `vp` field)  
**Feeds into:** LLD-03 (restaurant tier capabilities), LLD-06 (recipients/memory predicates), LLD-07 (cart/pricing promo gating), LLD-12 (notification templates), LLD-13 (AI concierge tool-registry)  
**Weight:** S — TypeScript-only, no new DB tables  
**Status:** DRAFT

---

## Happy-Path Assumptions

| Decision | Assumption used here |
|---|---|
| `vp` JWT field shape | `vp: string[]` carries pack IDs — `vp[0]` = primary pack (single-pack MVP, array for Phase 2 multi-pack) |
| D9 profile gate | Required at signup gated by FF `profile_wizard_required=true` (from MAIN.md happy-path; Decision Register D9 = "skippable" — flag to Atul before finalizing LLD-06) |
| Pack granularity | One pack per org for MVP (`orgs_organizations.vertical_pack_id TEXT NOT NULL DEFAULT 'pharma_rep'`) |

---

## 1. Purpose

A **VerticalPack** is a configuration object — not a DB row — that controls what an org's members can see, which AI tools they get, which memory predicates are tracked, and which copy variants are shown. It is the *only* mechanism for vertical-specific behavior. **No code may branch on a pack ID string directly** (see §7).

MVP has one pack: `pharma_rep` (pharmaceutical sales representative). The architecture must support adding `event_planner`, `office_admin`, etc. without touching existing pack code.

---

## 2. File Layout

```
packages/
  verticals/
    types.ts              ← single source of truth for VerticalPack interface
    registry.ts           ← pack registry + loader
    index.ts              ← public re-export
    pharma_rep/
      index.ts            ← pharma_rep pack definition
      copy.ts             ← copy variants (separated for i18n-readiness)
```

All packs live under `packages/verticals/{pack_id}/index.ts`. Adding a new vertical = add a new folder, register in `registry.ts`. Zero changes elsewhere.

---

## 3. TypeScript Types (`packages/verticals/types.ts`)

```typescript
// Memory predicate IDs — must stay in sync with LLD-06 crm_memory_entries.predicate enum
export type MemoryPredicate =
  | 'dietary_preference'
  | 'allergy'
  | 'team_size_typical'
  | 'cuisine_preference'
  | 'budget_per_person'
  | 'do_not_repeat_restaurant'
  | 'order_frequency'       // learned only, no UI entry
  | 'last_ordered_at';      // learned only, no UI entry

// Visibility scope for recipient profiles
export type VisibilityMode = 'owner_only' | 'org_shared';

// Copy variants — all user-facing strings sourced from here, never hardcoded in components
export interface PackCopy {
  recipientLabel: string;       // "recipient" | "client" | "team"
  recipientLabelPlural: string;
  orderLabel: string;           // "catering order" | "team lunch"
  budgetLabel: string;          // "Budget per person" | "Per-head budget"
  onboardingTitle: string;      // wizard H1
  onboardingSubtitle: string;
  emptyRecipientsPrompt: string;
}

// The full pack definition — all fields required, no optional escape hatches
export interface VerticalPack {
  /** Matches orgs_organizations.vertical_pack_id — never change after seeding */
  id: string;

  /** Human-readable name for admin UI only */
  displayName: string;

  /**
   * Whether the AI concierge is enabled for this vertical.
   * LLD-13 (ai-concierge) owns which specific tools are available and how they are
   * configured — that is NOT this module's concern. This flag is the on/off gate.
   * When false, the concierge endpoint returns 403 before any LLM call.
   */
  conciergeEnabled: boolean;

  /**
   * Memory predicates the CRM memory worker will track for this vertical.
   * Worker ignores predicate strings not in this list.
   */
  memoryPredicates: MemoryPredicate[];

  /**
   * Recipient profile visibility.
   * owner_only: Sally sees only her own recipients — not visible to org colleagues.
   * org_shared: all org members see all recipients.
   */
  visibilityMode: VisibilityMode;

  /**
   * Gates pharma-compliance features:
   * - K-3 aggregate spend PDF reports
   * - "Sunshine Act" disclosure copy in order confirmation emails
   * - Spend-cap enforcement per HCP (future Phase 2)
   * When false, these routes/components are unreachable even if user navigates directly.
   */
  complianceTracking: boolean;

  /** All user-facing copy for this vertical. Never put copy in component files. */
  copy: PackCopy;
}
```

---

## 4. `pharma_rep` Pack Definition

### `packages/verticals/pharma_rep/copy.ts`

```typescript
import type { PackCopy } from '../types';

export const pharmaRepCopy: PackCopy = {
  recipientLabel: 'recipient',
  recipientLabelPlural: 'recipients',
  orderLabel: 'catering order',
  budgetLabel: 'Budget per person',
  onboardingTitle: 'Who are you ordering for?',
  onboardingSubtitle: 'Add a recipient to save their dietary preferences and order history.',
  emptyRecipientsPrompt: 'Add your first recipient to get started.',
};
```

### `packages/verticals/pharma_rep/index.ts`

```typescript
import type { VerticalPack } from '../types';
import { pharmaRepCopy } from './copy';

export const pharmaRepPack: VerticalPack = {
  id: 'pharma_rep',
  displayName: 'Pharmaceutical Sales Rep',

  // Pharma reps get full concierge access; LLD-13 defines the tool list
  conciergeEnabled: true,

  // Predicates the memory worker tracks for pharma_rep orgs
  // 'order_frequency' and 'last_ordered_at' are learned-only (no K-1 wizard entry)
  memoryPredicates: [
    'dietary_preference',
    'allergy',
    'team_size_typical',
    'cuisine_preference',
    'budget_per_person',
    'do_not_repeat_restaurant',
    'order_frequency',
    'last_ordered_at',
  ],

  // Pharma reps own their recipient relationships — not visible to colleagues
  visibilityMode: 'owner_only',

  // Sunshine Act compliance features enabled for all pharma rep orgs
  complianceTracking: true,

  copy: pharmaRepCopy,
};
```

---

## 5. Registry & Loader (`packages/verticals/registry.ts`)

```typescript
import type { VerticalPack } from './types';
import { pharmaRepPack } from './pharma_rep';

// Register packs here — never anywhere else
const REGISTRY: Readonly<Record<string, VerticalPack>> = {
  [pharmaRepPack.id]: pharmaRepPack,
} as const;

export class PackNotFoundError extends Error {
  constructor(packId: string) {
    super(`VerticalPack not found: '${packId}'. Check registry.ts.`);
    this.name = 'PackNotFoundError';
  }
}

/**
 * Load a VerticalPack by ID.
 * Throws PackNotFoundError if the ID is not registered.
 * Never returns undefined — callers must not default silently.
 */
export function loadPack(packId: string): VerticalPack {
  const pack = REGISTRY[packId];
  if (!pack) throw new PackNotFoundError(packId);
  return pack;
}

/** All registered pack IDs — used by admin UI and migrations validation */
export function listPackIds(): string[] {
  return Object.keys(REGISTRY);
}
```

---

## 6. Runtime Resolver — How Modules Access the Pack

### 6.1 JWT → Pack resolution

`orgs_organizations.vertical_pack_id` is written at org creation (seeded by LLD-01 org-bootstrap). It is included in the JWT as `vp: [packId]` (array, first element = primary pack).

Middleware in the API service resolves once per request:

```typescript
// src/middleware/resolve-pack.ts
import { loadPack } from '@wecater/verticals';
import type { Request, Response, NextFunction } from 'express';

export function resolvePack(req: Request, _res: Response, next: NextFunction): void {
  const packId = req.auth?.vp?.[0];     // req.auth set by JWT middleware upstream
  if (!packId) {
    // Token has no vp claim — this is a service token or admin token; pack = null
    req.pack = null;
    return next();
  }
  req.pack = loadPack(packId);           // throws PackNotFoundError if unknown
  next();
}

// Type augmentation — add to src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      pack: import('@wecater/verticals').VerticalPack | null;
    }
  }
}
```

### 6.2 How downstream modules consume `req.pack`

Each module reads **properties**, never the pack ID:

```typescript
// ✅ Correct — branch on capability
if (req.pack?.complianceTracking) {
  await attachSunshineActDisclosure(order);
}

// ✅ Correct — concierge gate (LLD-13 handles tool filtering internally)
if (!req.pack?.conciergeEnabled) return res.status(403).json({ error: 'CONCIERGE_DISABLED' });

// ✅ Correct — enforce visibility
if (req.pack?.visibilityMode === 'owner_only') {
  query.where.owner_account_id = req.auth.sub;
}

// ❌ BANNED — branching on pack ID string (lint rule will fail CI)
if (req.pack?.id === 'pharma_rep') { ... }
```

### 6.3 Server Components / Next.js BFF

For Next.js App Router Server Components, pack is resolved from the session token:

```typescript
// src/lib/get-pack.ts (server-only)
import 'server-only';
import { auth } from '@/auth';
import { loadPack } from '@wecater/verticals';

export async function getPack() {
  const session = await auth();
  const packId = session?.user?.vp?.[0];
  if (!packId) return null;
  return loadPack(packId);
}
```

Usage in a Server Component:

```typescript
const pack = await getPack();
return <RecipientList copy={pack?.copy} visibilityMode={pack?.visibilityMode} />;
```

---

## 7. Lint Rule — Ban Pack ID Comparisons

**The ESLint rule** lives at `eslint-rules/no-pack-id-comparison.js`. It fails CI on any string comparison involving a registered pack ID literal.

```javascript
// eslint-rules/no-pack-id-comparison.js
'use strict';

const KNOWN_PACK_IDS = ['pharma_rep', 'event_planner', 'office_admin']; // keep in sync

module.exports = {
  meta: {
    type: 'problem',
    messages: {
      noPackIdComparison:
        "Do not compare pack IDs directly ('{{ id }}'). " +
        'Branch on pack capability properties instead (e.g. pack.complianceTracking). ' +
        'See LLD-02 §7.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' && KNOWN_PACK_IDS.includes(node.value)) {
          const parent = node.parent;
          if (
            parent.type === 'BinaryExpression' &&
            (parent.operator === '===' || parent.operator === '!==')
          ) {
            context.report({
              node,
              messageId: 'noPackIdComparison',
              data: { id: node.value },
            });
          }
        }
      },
    };
  },
};
```

Register in `.eslintrc.js`:

```javascript
module.exports = {
  plugins: ['./eslint-rules'],
  rules: {
    './eslint-rules/no-pack-id-comparison': 'error',
  },
};
```

---

## 8. Tests

### 8.1 Pack contract tests (`packages/verticals/__tests__/pack-contract.test.ts`)

```typescript
import { listPackIds, loadPack } from '../registry';
import type { MemoryPredicate } from '../types';

const VALID_PREDICATES: MemoryPredicate[] = [
  'dietary_preference', 'allergy', 'team_size_typical', 'cuisine_preference',
  'budget_per_person', 'do_not_repeat_restaurant', 'order_frequency', 'last_ordered_at',
];

describe('VerticalPack contract', () => {
  const packIds = listPackIds();

  it('has at least one registered pack', () => {
    expect(packIds.length).toBeGreaterThan(0);
  });

  it.each(packIds)('pack %s passes schema contract', (id) => {
    const pack = loadPack(id);
    expect(pack.id).toBe(id);
    expect(typeof pack.displayName).toBe('string');
    expect(typeof pack.complianceTracking).toBe('boolean');
    expect(typeof pack.conciergeEnabled).toBe('boolean');
    expect(['owner_only', 'org_shared']).toContain(pack.visibilityMode);

    // All memoryPredicates must be valid — validated against LLD-06 predicate enum
    pack.memoryPredicates.forEach(pred => {
      expect(VALID_PREDICATES).toContain(pred);
    });

    // Copy completeness
    expect(typeof pack.copy.recipientLabel).toBe('string');
    expect(pack.copy.recipientLabel.length).toBeGreaterThan(0);
  });

  it('pharma_rep has complianceTracking=true', () => {
    expect(loadPack('pharma_rep').complianceTracking).toBe(true);
  });

  it('pharma_rep has conciergeEnabled=true', () => {
    expect(loadPack('pharma_rep').conciergeEnabled).toBe(true);
  });

  it('pharma_rep has owner_only visibility', () => {
    expect(loadPack('pharma_rep').visibilityMode).toBe('owner_only');
  });

  it('throws PackNotFoundError for unknown pack ID', () => {
    expect(() => loadPack('unknown_vertical')).toThrow('PackNotFoundError');
  });
});
```

### 8.2 Lint rule test (`eslint-rules/__tests__/no-pack-id-comparison.test.js`)

```javascript
const { RuleTester } = require('eslint');
const rule = require('../no-pack-id-comparison');

const tester = new RuleTester({ parserOptions: { ecmaVersion: 2020 } });

tester.run('no-pack-id-comparison', rule, {
  valid: [
    { code: `if (pack.complianceTracking) {}` },
    { code: `if (pack.visibilityMode === 'owner_only') {}` },
    { code: `const id = 'pharma_rep';` },               // assignment, not comparison
  ],
  invalid: [
    {
      code: `if (pack.id === 'pharma_rep') {}`,
      errors: [{ messageId: 'noPackIdComparison' }],
    },
    {
      code: `if (req.pack?.id !== 'pharma_rep') {}`,
      errors: [{ messageId: 'noPackIdComparison' }],
    },
  ],
});
```

---

## 9. DB — No New Tables

Verticals are config, not DB rows. The only DB touch is `orgs_organizations.vertical_pack_id TEXT NOT NULL DEFAULT 'pharma_rep'` — owned by LLD-01. Prisma schema entry lives in `prisma/schema-orgs.prisma`.

**Validation at org creation (LLD-01 responsibility):**

```typescript
// Called in org-bootstrap service (LLD-01)
import { loadPack } from '@wecater/verticals';

function validatePackId(packId: string): void {
  loadPack(packId); // throws if invalid — prevents bad data at write time
}
```

---

## 10. Public Package Exports (`packages/verticals/index.ts`)

```typescript
export type { VerticalPack, MemoryPredicate, VisibilityMode, PackCopy } from './types';
export { loadPack, listPackIds, PackNotFoundError } from './registry';
export { pharmaRepPack } from './pharma_rep';
```

Import path everywhere: `import { loadPack } from '@wecater/verticals'` (alias configured in `tsconfig.json` and `package.json` workspace).

---

## 11. How Each Downstream Module Reads the Pack

| Module | What it reads | Where |
|---|---|---|
| LLD-06 recipients/memory | `pack.memoryPredicates` — filter which predicates the K-1 wizard shows | `crm.service.ts` memory-worker + wizard UI |
| LLD-06 recipients/visibility | `pack.visibilityMode` — `WHERE owner_account_id = $1` if `owner_only` | `recipients.service.ts` query builder |
| LLD-07 cart/promotions | `pack.complianceTracking` — block promos that violate Sunshine Act limits (Phase 2) | `pricing-core` promo-gate |
| LLD-12 notifications | `pack.copy` — template copy variants (SMS + email subject lines) | `ntf` template resolver |
| LLD-13 concierge | `pack.conciergeEnabled` — gate check before any LLM call; 403 if false | concierge route handler |
| LLD-13 concierge/context-assembler | `pack.complianceTracking` — appends compliance context when true (exact prompt shape is LLD-13's concern) | `context-assembler.ts` |

---

## 12. Open Decisions

| # | Decision | Blocker | Action |
|---|---|---|---|
| VP-1 | `vp` JWT field = `[packId]` assumed here. LLD-01 must confirm shape when issuing tokens. | LLD-01 write | Confirm with Atul before LLD-13 is written |
| VP-2 | D9 profile gate conflict (MAIN.md = required, Decision Register = skippable). Affects `visibilityMode` behavior when recipient_id is null. | Decision Register | Flag to Atul; LLD-06 must handle null `recipient_id` gracefully |
| VP-3 | When a second pack (`event_planner`) is added: does an org get ONE pack (MVP assumption) or can members have different packs? | Phase 2 planning | Architecture supports array today; org-level assignment is the MVP constraint |
| VP-4 | `PackNotFoundError` at middleware — should it 500 or 401? Current choice: 500 (server misconfiguration, not user error). Revisit if packs become user-selectable. | LLD-01 error catalog | Atul to confirm in LLD-01 |
