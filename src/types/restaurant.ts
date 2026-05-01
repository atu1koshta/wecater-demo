import type { Cuisine, Tier } from "./common";

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  multi?: boolean;
  options: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: string;
  servingSize: number;
  imageUrl?: string;
  modifierGroups: ModifierGroup[];
  dietaryFlags?: string[];
};

export type Tier3SourceData = {
  source: string;
  lastScraped: string;
  menuConfidence: "high" | "medium" | "low";
};

export type Tier3Contact = {
  phone: string;
  email: string;
  website: string;
  address: string;
};

export type Tier3EstimatedItem = {
  id: string;
  desc: string;
  detail: string;
  coverage: string;
  ppMin: number;
  ppMax: number;
};

/** Single restaurant record — shared by optimizer/cart/wallet screens. */
export type Restaurant = {
  id: string;
  name: string;
  icon: string;
  cuisine: Cuisine;
  tier: Tier;

  // Visual / branding (used by cart hero)
  brandColor?: string;
  brandColorAccent?: string;
  brandHeroUrl?: string;
  rating?: number;
  reviewCount?: number;

  // Optimizer scoring fields
  ppEstimate: number;
  dietaryFit: number;       // 0..1
  varietyPenalty: number;   // 0..1
  complianceFit: number;    // 0..1

  // Bites earning (Tier 1 only)
  baseRate?: number;
  restaurantBoost?: number; // 1.0..1.5
  sameDayBoost?: number;
  sameDay?: boolean;
  sameDayCutoff?: string;
  hasFlash?: boolean;
  earnedBites: number;      // user's current accrual at this restaurant

  // Tier 3 (discovery) fields
  estimatedBaseRate?: number;
  discoveryReason?: string;
  sourceData?: string | Tier3SourceData;
  contact?: Tier3Contact;
  quoteResponseHours?: number;
  estimatedCart?: Tier3EstimatedItem[];
};

/** Menu definition — separate so it can be lazy-loaded per restaurant. */
export type Menu = {
  restaurantId: string;
  items: MenuItem[];
};
