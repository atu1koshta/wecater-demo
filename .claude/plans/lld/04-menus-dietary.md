# LLD-04 — Menus & Dietary

**Depends on:** LLD-00 (conventions), LLD-03 (cat_restaurants, cat_dietary_tags, ingestion adapter)  
**Feeds into:** LLD-05 (search indexer consumes CatalogUpdated), LLD-07 (cart pricing uses base_price_cents + modifier math), LLD-13 (concierge uses getMenuForCart)  
**Weight:** M  
**Status:** DRAFT

---

## Happy-Path Assumptions

| Decision | Assumption used here |
|---|---|
| Source of menu data | ezCater normalized JSON (scraper output); Tier 1 direct menus are identical schema, source_platform = 'direct' |
| Menu versioning granularity | Full restaurant-menu snapshot on each ingestion run; old item rows soft-deleted, not replaced (upsert) |
| Images | Always null in current data — no image storage in this module; display fallback is SKILL_image-pipeline concern |
| Dietary taxonomy | LLD-03 owns `diet_tags` slug vocabulary; this module owns item-level join table |
| Currency | USD only in MVP; `price_cents` columns always in minor units of account currency |

---

## 1. Data Shape From Source (ezcater normalized JSON)

Before defining tables, the key observations from the actual normalized files:

| Field | Source type | DB type | Transform |
|---|---|---|---|
| `price.basePrice` | float (`14.0`, `6.99`) | `INTEGER` cents | `Math.round(basePrice * 100)` |
| `modifier.price.basePrice` | float or null | `INTEGER` cents | `Math.round(x * 100)` or `0` if null |
| `groupId` | numeric string `"1599202"` | `TEXT` stored as `source_group_id` | Scoped unique constraint per menu |
| `modifierGroupId` | UUID string | `TEXT source_modifier_group_id` | Globally unique, safe to store as-is |
| `modifierId` | UUID string | `TEXT source_modifier_id` | Globally unique, safe to store as-is |
| `maxSelections` | number or `null` | `INTEGER NULL` | Store as-is; **never coerce null→0** |
| `dietaryLabels` | `string[] or null` | join table | Normalize slug via diet_tags vocabulary |
| `tags` | `string[] or null` | `TEXT[]` column | Store raw; index for surfacing |
| `servingSize.amount` | float | `INTEGER` | `Math.round(amount)` |
| `displayOrder` | number or `null` | `INTEGER` DEFAULT 0 | Use 0 when null |
| `images` | always `null` | not stored | No image columns in this module |
| `portions` | always `null` | not stored | Omitted in MVP |
| `defaultSelections` | always `null` | not stored | Individual modifier `isDefault` used instead |
| `appliesTo` | always `null` | not stored | Future modifier scoping — not in MVP |

---

## 2. DB Schema

### 2.1 `menu_menus`

One row per restaurant + platform menu combination. A restaurant can have multiple menus (breakfast, lunch) but in ezCater data typically has one ("catering-menu").

```sql
CREATE TABLE menu_menus (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     UUID          NOT NULL,            -- FK cat_restaurants.id (no DB constraint, cross-module)
  source_menu_id    TEXT          NOT NULL,            -- e.g. "catering-menu" — platform ID
  source_platform   TEXT          NOT NULL,            -- 'ezcater' | 'direct'
  name              TEXT          NOT NULL,
  description       TEXT,
  display_order     INTEGER       NOT NULL DEFAULT 0,
  version           INTEGER       NOT NULL DEFAULT 1,  -- bumped on each full re-ingestion
  ingestion_run_id  TEXT,                              -- scrapeRunId, for audit trail
  scraped_at        TIMESTAMPTZ,
  normalized_at     TIMESTAMPTZ,
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT menu_menus_restaurant_platform_source_unique
    UNIQUE (restaurant_id, source_platform, source_menu_id)
);

CREATE INDEX idx_menu_menus_restaurant ON menu_menus (restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_menus_active ON menu_menus (is_active) WHERE deleted_at IS NULL;
```

### 2.2 `menu_groups`

Sections within a menu (e.g., "Boxed Lunches", "Appetizers", "Beverages").

```sql
CREATE TABLE menu_groups (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id          UUID    NOT NULL,   -- FK menu_menus.id
  source_group_id  TEXT    NOT NULL,   -- e.g. "1599202" — NOT globally unique
  name             TEXT    NOT NULL,
  description      TEXT,
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- source_group_id is only unique within a menu — different restaurants can share IDs
  CONSTRAINT menu_groups_menu_source_unique UNIQUE (menu_id, source_group_id)
);

CREATE INDEX idx_menu_groups_menu ON menu_groups (menu_id);
```

### 2.3 `menu_items`

Individual orderable items. `restaurant_id` is denormalized for efficient single-table filtering.

```sql
CREATE TABLE menu_items (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_group_id        UUID        NOT NULL,   -- FK menu_groups.id
  restaurant_id        UUID        NOT NULL,   -- denormalized from menu_groups → menu_menus
  source_item_id       TEXT        NOT NULL,   -- UUID from ezCater (globally unique)
  name                 TEXT        NOT NULL,
  description          TEXT,
  base_price_cents     INTEGER     NOT NULL,   -- ALWAYS integer cents; Math.round(basePrice * 100)
  serves_count         INTEGER,               -- servingSize.amount rounded; null if not provided
  serves_unit          TEXT,                  -- 'people' | 'servings' — from servingSize.unit
  serves_description   TEXT,                  -- raw "Serves 20 people" — for display
  min_order_quantity   INTEGER     NOT NULL DEFAULT 1,   -- minimumOrder.quantity
  min_order_unit       TEXT,                  -- 'boxes' | 'platters' | 'items' | 'people'
  tags                 TEXT[]      NOT NULL DEFAULT '{}',  -- ["popular","healthy","special"]
  provenance           JSONB       NOT NULL,  -- {source_platform, source_item_id, scraped_at}
  deleted_at           TIMESTAMPTZ,           -- soft delete — set when item removed from menu
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT menu_items_group_source_unique UNIQUE (menu_group_id, source_item_id)
);

CREATE INDEX idx_menu_items_restaurant ON menu_items (restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_group ON menu_items (menu_group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_tags ON menu_items USING GIN (tags);
-- For dietary/price filtering in LLD-05 search
CREATE INDEX idx_menu_items_price ON menu_items (base_price_cents) WHERE deleted_at IS NULL;
```

**Price invariant:** `base_price_cents` is never negative. Modifier options can have `price_delta_cents = 0` (free add-on) or positive (priced add-on). Negative deltas (discounts via modifier) are not in the current data — if they appear, the ingestion adapter must reject them with a validation error and hold for manual review.

### 2.4 `menu_modifier_groups`

Groups of modifier choices on an item (e.g., "Select Protein", "Tell us if you'll need").

```sql
CREATE TABLE menu_modifier_groups (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id             UUID    NOT NULL,   -- FK menu_items.id
  source_modifier_group_id TEXT    NOT NULL,   -- UUID from ezCater
  name                     TEXT    NOT NULL,
  description              TEXT,
  display_order            INTEGER NOT NULL DEFAULT 0,

  -- 'single' = radio (pick one); 'multiple' = checkbox (pick many)
  selection_type           TEXT    NOT NULL CHECK (selection_type IN ('single', 'multiple')),
  is_required              BOOLEAN NOT NULL DEFAULT false,
  min_selections           INTEGER NOT NULL DEFAULT 0,

  -- NULL = unlimited selections allowed. NEVER store 0 — that means "no selections allowed"
  -- which is nonsensical (use is_required=false + min=0 if optional).
  max_selections           INTEGER,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT menu_modifier_groups_item_source_unique
    UNIQUE (menu_item_id, source_modifier_group_id)
);

CREATE INDEX idx_menu_modifier_groups_item ON menu_modifier_groups (menu_item_id);
```

**`max_selections` invariant:** NULL means unlimited. The import must **not** coerce `null → 0`. A `max_selections = 0` must be rejected at import time with a validation error — it is logically impossible to require selections with a max of 0.

### 2.5 `menu_modifier_options`

Individual choices within a modifier group.

```sql
CREATE TABLE menu_modifier_options (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_group_id    UUID    NOT NULL,   -- FK menu_modifier_groups.id
  source_modifier_id   TEXT    NOT NULL,   -- UUID from ezCater
  name                 TEXT    NOT NULL,
  description          TEXT,
  price_delta_cents    INTEGER NOT NULL DEFAULT 0,  -- 0 = free; positive = add-on
  is_default           BOOLEAN NOT NULL DEFAULT false,
  display_order        INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT menu_modifier_options_group_source_unique
    UNIQUE (modifier_group_id, source_modifier_id)
);

CREATE INDEX idx_menu_modifier_options_group ON menu_modifier_options (modifier_group_id);
```

### 2.6 `menu_item_dietary_tags` (junction)

Links items to normalized dietary tags. `diet_tags` table is owned by LLD-03.

```sql
CREATE TABLE menu_item_dietary_tags (
  menu_item_id  UUID NOT NULL,   -- FK menu_items.id
  diet_tag_id   UUID NOT NULL,   -- FK diet_tags.id (LLD-03 table)
  PRIMARY KEY (menu_item_id, diet_tag_id)
);

CREATE INDEX idx_menu_item_dietary_tags_tag ON menu_item_dietary_tags (diet_tag_id);
```

**Dietary label normalization:** The ingestion adapter maps raw strings to slugs:

```typescript
const DIETARY_LABEL_MAP: Record<string, string> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  'gluten-free': 'gluten_free',
  'gluten free': 'gluten_free',
  halal: 'halal',
  kosher: 'kosher',
  'dairy-free': 'dairy_free',
  'nut-free': 'nut_free',
};

function normalizeDietaryLabel(raw: string): string | null {
  return DIETARY_LABEL_MAP[raw.toLowerCase().trim()] ?? null;
}
// Unknown labels → log warning, skip, do NOT create orphan tags
```

---

## 3. Modifier Math

Modifier pricing is arithmetic only — no LLM involvement.

```typescript
/**
 * Compute the total price of a line item including selected modifiers.
 * All values in integer cents. No floats anywhere.
 */
function computeItemLineCents(
  basePriceCents: number,
  selectedModifierOptions: Array<{ priceDeltaCents: number }>,
  quantity: number,
): number {
  const modifierSum = selectedModifierOptions.reduce(
    (sum, opt) => sum + opt.priceDeltaCents,
    0,
  );
  return (basePriceCents + modifierSum) * quantity;
}
```

**Validation at cart add time (LLD-07 responsibility, but rules defined here):**

| Rule | Check |
|---|---|
| Required group must have selections | `is_required = true` AND `selections.length < min_selections` → reject |
| Single-select group max one | `selection_type = 'single'` AND `selections.length > 1` → reject |
| Multi-select max not exceeded | `max_selections IS NOT NULL` AND `selections.length > max_selections` → reject |
| All selected options belong to item | `modifier_option.modifier_group.menu_item_id = item.id` → reject if mismatched |

---

## 4. Menu Versioning

Orders must always reflect what was priced when the order was placed. Menu items can be updated or removed.

**Strategy: snapshot on cart line (not version table)**

When a user adds an item to a cart (LLD-07), the cart line stores:
- `menu_item_id UUID` — FK (nullable — null if item deleted post-order)
- `item_name_snapshot TEXT NOT NULL` — item name at cart-add time
- `unit_price_snapshot_cents INTEGER NOT NULL` — price at cart-add time
- `modifier_selections JSONB NOT NULL` — selected option IDs + names + price deltas at cart-add time

This means historical accuracy is handled by LLD-07 (cart), not by keeping old menu version rows. The menu itself is always the current state.

**Why not a `menu_versions` table?** For MVP with 12-15 Tier 1 restaurants and infrequent manual menu updates, snapshotting on the cart line is simpler, correct, and avoids version explosion. Can add a `menu_versions` table in Phase 2 if we need "see what the menu looked like on date X" audit capability.

**Re-ingestion flow (upsert, not replace):**

```
ingestion run arrives
  → upsert menu_menus (bump version)
  → upsert menu_groups (by menu_id + source_group_id)
  → upsert menu_items (by menu_group_id + source_item_id)
      → update name, description, base_price_cents, tags
  → soft-delete menu_items no longer in source (set deleted_at)
  → upsert menu_modifier_groups (by menu_item_id + source_modifier_group_id)
  → upsert menu_modifier_options (by modifier_group_id + source_modifier_id)
  → replace menu_item_dietary_tags (delete then re-insert)
  → emit CatalogUpdated outbox event
```

**Upsert uses Prisma `upsertMany` or raw SQL `ON CONFLICT DO UPDATE`.**

---

## 5. Outbox Event: `CatalogUpdated`

Emitted in the same transaction as the `menu_menus.version` bump. Consumer: LLD-05 (Typesense indexer).

```typescript
type CatalogUpdatedV1 = {
  schemaVersion: 1;
  restaurant_id: string;       // UUID
  menu_id: string;             // UUID of menu_menus row
  new_version: number;         // bumped version number
  change_type: 'menu_updated' | 'menu_activated' | 'menu_deactivated';
  source_platform: string;     // 'ezcater' | 'direct'
  changed_at: string;          // ISO 8601
};
```

Transaction pattern per LLD-00 §3:

```typescript
await prisma.$transaction([
  prisma.menu_menus.update({
    where: { id: menuId },
    data: { version: { increment: 1 }, updated_at: new Date() },
  }),
  prisma.evnt_outbox.create({
    data: {
      aggregate_type: 'menu',
      aggregate_id: menuId,
      event_type: 'CatalogUpdated',
      version: 1,
      payload: {
        schemaVersion: 1,
        restaurant_id: restaurantId,
        menu_id: menuId,
        new_version: currentVersion + 1,
        change_type: 'menu_updated',
        source_platform: sourcePlatform,
        changed_at: new Date().toISOString(),
      },
      partition_key: restaurantId,
    },
  }),
]);
```

---

## 6. Service Interface

```typescript
// src/modules/menus/menus.service.ts

export interface MenuGroup {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  basePriceCents: number;
  servesCount: number | null;
  servesDescription: string | null;
  minOrderQuantity: number;
  tags: string[];
  dietaryTags: string[];           // slugs: ['vegetarian', 'gluten_free']
  modifierGroups: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;    // null = unlimited — never 0
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDeltaCents: number;         // 0 = free
  isDefault: boolean;
}

export interface MenuForCart {
  menuId: string;
  restaurantId: string;
  version: number;
  name: string;
  groups: MenuGroup[];
}

/** Returns the active menu for a restaurant. Used by concierge + cart builder. */
export async function getMenuForCart(restaurantId: string): Promise<MenuForCart | null>;

/**
 * Validate modifier selections against menu rules.
 * Returns array of validation errors — empty = valid.
 * Called by LLD-07 (cart) before any add-to-cart operation.
 */
export async function validateModifierSelections(
  menuItemId: string,
  selectedOptionIds: string[],
): Promise<string[]>;

/**
 * Upsert a full menu from an ingestion run.
 * Idempotent — safe to call multiple times with same data.
 * Emits CatalogUpdated outbox event if anything changed.
 */
export async function upsertMenuFromIngestion(
  restaurantId: string,
  data: NormalizedMenu,  // matches normalized JSON schema
): Promise<{ menuId: string; version: number; itemsUpserted: number }>;
```

---

## 7. Provenance JSONB Shape

Every `menu_items` row has `provenance JSONB NOT NULL`:

```typescript
type MenuItemProvenance = {
  source_platform: 'ezcater' | 'direct';
  source_item_id: string;       // original platform item ID
  ingestion_run_id: string;     // scrapeRunId
  scraped_at: string;           // ISO 8601
  normalized_at: string;        // ISO 8601
  content_hash?: string;        // for dedup
};
```

This allows debug queries like "which items came from a specific scrape run" and powers the `adm_audit_log` trail when a menu is manually corrected.

---

## 8. Dietary Matching

The service that answers "does this restaurant serve vegetarian food?" for search/ranker (LLD-05):

**Item-level:** `menu_item_dietary_tags` JOIN `diet_tags` WHERE slug = 'vegetarian' — live query.

**Restaurant-level aggregate** (maintained by LLD-03, updated when `CatalogUpdated` fires): `cat_restaurant_dietary_summary` stores pre-computed tag counts per restaurant. LLD-05 reads this for filter performance without joining per-item tables on every search.

Dietary matching rules:
- An item satisfies a dietary requirement if it has ALL the required tags (AND semantics for multi-tag requirement)
- Allergy requirements are strict: item must have the allergy-free tag; absence of the tag is not sufficient to assume safe
- "Vegetarian options available" at restaurant level = `count(vegetarian items) > 0`

---

## 9. Prisma Schema File

Location: `prisma/schema-menus.prisma` (multi-file schema per LLD-00 §10).

```prisma
model menu_menus {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  restaurant_id    String    @db.Uuid
  source_menu_id   String
  source_platform  String
  name             String
  description      String?
  display_order    Int       @default(0)
  version          Int       @default(1)
  ingestion_run_id String?
  scraped_at       DateTime? @db.Timestamptz
  normalized_at    DateTime? @db.Timestamptz
  is_active        Boolean   @default(true)
  deleted_at       DateTime? @db.Timestamptz
  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @default(now()) @db.Timestamptz

  groups           menu_groups[]

  @@unique([restaurant_id, source_platform, source_menu_id])
  @@index([restaurant_id])
  @@map("menu_menus")
}

model menu_groups {
  id               String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  menu_id          String  @db.Uuid
  source_group_id  String
  name             String
  description      String?
  display_order    Int     @default(0)
  created_at       DateTime @default(now()) @db.Timestamptz
  updated_at       DateTime @default(now()) @db.Timestamptz

  menu             menu_menus    @relation(fields: [menu_id], references: [id])
  items            menu_items[]

  @@unique([menu_id, source_group_id])
  @@index([menu_id])
  @@map("menu_groups")
}

model menu_items {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  menu_group_id      String    @db.Uuid
  restaurant_id      String    @db.Uuid
  source_item_id     String
  name               String
  description        String?
  base_price_cents   Int
  serves_count       Int?
  serves_unit        String?
  serves_description String?
  min_order_quantity Int       @default(1)
  min_order_unit     String?
  tags               String[]
  provenance         Json
  deleted_at         DateTime? @db.Timestamptz
  created_at         DateTime  @default(now()) @db.Timestamptz
  updated_at         DateTime  @default(now()) @db.Timestamptz

  group            menu_groups              @relation(fields: [menu_group_id], references: [id])
  modifier_groups  menu_modifier_groups[]
  dietary_tags     menu_item_dietary_tags[]

  @@unique([menu_group_id, source_item_id])
  @@index([restaurant_id])
  @@index([menu_group_id])
  @@map("menu_items")
}

model menu_modifier_groups {
  id                       String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  menu_item_id             String  @db.Uuid
  source_modifier_group_id String
  name                     String
  description              String?
  display_order            Int     @default(0)
  selection_type           String
  is_required              Boolean @default(false)
  min_selections           Int     @default(0)
  max_selections           Int?    // NULL = unlimited
  created_at               DateTime @default(now()) @db.Timestamptz
  updated_at               DateTime @default(now()) @db.Timestamptz

  item    menu_items             @relation(fields: [menu_item_id], references: [id])
  options menu_modifier_options[]

  @@unique([menu_item_id, source_modifier_group_id])
  @@index([menu_item_id])
  @@map("menu_modifier_groups")
}

model menu_modifier_options {
  id                   String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  modifier_group_id    String  @db.Uuid
  source_modifier_id   String
  name                 String
  description          String?
  price_delta_cents    Int     @default(0)
  is_default           Boolean @default(false)
  display_order        Int     @default(0)
  created_at           DateTime @default(now()) @db.Timestamptz
  updated_at           DateTime @default(now()) @db.Timestamptz

  group menu_modifier_groups @relation(fields: [modifier_group_id], references: [id])

  @@unique([modifier_group_id, source_modifier_id])
  @@index([modifier_group_id])
  @@map("menu_modifier_options")
}

model menu_item_dietary_tags {
  menu_item_id String @db.Uuid
  diet_tag_id  String @db.Uuid   // FK diet_tags.id (LLD-03, cross-module — no Prisma relation)

  item menu_items @relation(fields: [menu_item_id], references: [id])

  @@id([menu_item_id, diet_tag_id])
  @@index([diet_tag_id])
  @@map("menu_item_dietary_tags")
}
```

---

## 10. Import Guard: Float→Cents

The single highest-risk operation in this module. Enforce at the ingestion adapter boundary (LLD-03 calls this):

```typescript
/**
 * Convert a float USD price to integer cents.
 * Throws if the value is negative, NaN, or non-finite.
 * NEVER store the float directly — this is the ONLY place conversion happens.
 */
export function usdToCents(usd: number, field: string): number {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new Error(`Invalid price for field '${field}': ${usd}`);
  }
  return Math.round(usd * 100);
}

// Usage at import:
const basePriceCents = usdToCents(item.price.basePrice, `item[${item.itemId}].price.basePrice`);
const deltaCents = item.price ? usdToCents(item.price.basePrice, `modifier[${mod.modifierId}].price`) : 0;
```

---

## 11. Open Decisions

| # | Decision | Blocker | Action |
|---|---|---|---|
| MD-1 | `diet_tags` vocabulary — who defines the canonical slug list and what labels are in scope? "vegetarian", "vegan", "gluten_free" are obvious; "halal", "kosher", "nut_free", "dairy_free" need confirmation. | Preet / product decision | Flag before LLD-03 + this module go to implementation |
| MD-2 | Negative `price_delta_cents` (discount via modifier) — reject or allow? Current choice: reject at import. | Atul (ingestion design) | Confirm in LLD-03 ingestion adapter spec |
| MD-3 | `menu_versions` table for Phase 2 audit capability — out of MVP scope. Cart line snapshot is sufficient for MVP order accuracy. | Phase 2 | Document in `revisit-running-list.md` |
| MD-4 | Multi-menu support per restaurant (breakfast + lunch menus) — schema supports it (`UNIQUE` scoped by `restaurant_id + source_platform + source_menu_id`), but MVP surfacing shows only the active catering menu. | LLD-05 (surfacing logic) | Confirm which menu to surface when multiple exist |
