import type { CartLine, CartProfile, Restaurant } from "@/types";
import { getMenu } from "@/data/menus";

export type CartTotals = {
  subtotal: number;
  baseBites: number;
  welcomeBonus: number;
  totalBites: number;
};

/**
 * Cart totals for a given restaurant — applies the restaurant's base rate and
 * doubles via Welcome 2X (the demo always runs with welcomeActive=true).
 */
export function calcCartTotals(
  cart: CartLine[],
  restaurant: Restaurant | undefined,
): CartTotals {
  const subtotal = cart.reduce((s, line) => s + line.qty * line.basePrice, 0);
  const rate = restaurant?.baseRate ?? 0;
  const baseBites = Math.round(subtotal * rate);
  const welcomeBonus = baseBites; // Welcome 2X
  return {
    subtotal,
    baseBites,
    welcomeBonus,
    totalBites: baseBites + welcomeBonus,
  };
}

export function getMenuItem(restaurantKey: string, itemId: string) {
  return getMenu(restaurantKey)?.items.find((i) => i.id === itemId);
}

export function getDietaryCoverage(profile: CartProfile) {
  const total = profile.dietaryRestrictions.length;
  const covered = profile.dietaryRestrictions.filter(
    (r) => r.count > 0 || r.source === "learned",
  ).length;
  return { total, covered, ratio: covered / Math.max(total, 1) };
}
