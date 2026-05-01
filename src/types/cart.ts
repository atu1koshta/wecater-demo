/** Modifier values keyed by modifierGroup.id → option label(s). */
export type CartLineModifiers = Record<string, string | string[]>;

/** Override on a single person within a multi-quantity line. */
export type PerPersonOverride = {
  individual: string;
  removed?: string[];
  added?: string[];
  reason: string;
};

export type CartLine = {
  id: string;
  itemId: string;
  qty: number;
  basePrice: number;
  modifiers: CartLineModifiers;
  /** Free-form description of who this line applies to ("8 omnivores", "Sarah W") */
  appliesTo: string;
  /** Per-person override map for individuals — modifierGroup.id → option label */
  perPerson?: Record<string, CartLineModifiers>;
  /** Per-individual deltas from line modifiers (vegan removes feta, etc.) */
  perPersonOverrides?: PerPersonOverride[];
};

/** Cart-builder persona scenarios. */
export type Persona = "ea" | "pharma";

export type DietaryTag = {
  tag: string;
  count: number;
  source: "told" | "learned";
  individuals?: string[];
};

export type CartProfilePhysician = {
  name: string;
  ytd: number;
  threshold: number;
  attending: boolean;
  perPersonCost: number;
};

/**
 * Profile model used by the cart builder — keyed by persona (EA / Pharma) so
 * the demo can flip between an internal Marketing Team scenario and a pharma
 * rep visit. Distinct from the medical-office Profile in src/types/profile.ts
 * because the cart builder needs delivery address, persona-level budget, and
 * compliance-aware physician tracking.
 */
export type CartProfile = {
  id: string;
  name: string;
  label: string;
  icon: string;
  headcount: number;
  budgetPerPerson: number;
  budgetTotal: number;
  deliveryAddress: string;
  dietaryRestrictions: DietaryTag[];
  complianceTracking: boolean;
  physicians?: CartProfilePhysician[];
  recentRestaurantsByCuisine: Record<string, number>;
};

export type CartTotals = {
  subtotal: number;
  baseBites: number;
  welcomeBonus: number;
  totalBites: number;
};

/** Multi-restaurant cart drafts for parallel comparison. */
export type Carts = Record<string, CartLine[]>;
