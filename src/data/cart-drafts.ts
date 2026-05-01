import type { CartLine, Persona } from "@/types";

/**
 * Smart-default starting carts. Keyed by persona+restaurant so the cart
 * builder can switch between Pita Jungle / Barrio Queen and EA / Pharma
 * scenarios without losing user-friendly mixes (vegetarian splits, halal,
 * shared starters, etc.).
 */
const PITA_EA: CartLine[] = [
  {
    id: "line-1",
    itemId: "power-bowl",
    qty: 8,
    basePrice: 14.5,
    modifiers: {
      base: "Quinoa",
      protein: "Chicken",
      sauce: "Tzatziki",
      toppings: ["Cucumber", "Tomato", "Feta"],
    },
    appliesTo: "8 omnivores",
  },
  {
    id: "line-2",
    itemId: "med-bowl",
    qty: 4,
    basePrice: 13.5,
    modifiers: {
      base: "Quinoa",
      protein: "Falafel",
      sauce: "Tahini",
      toppings: ["Cucumber", "Tomato", "Olives"],
    },
    appliesTo: "4 vegetarians (Maria's bowl: feta removed for vegan)",
    perPersonOverrides: [
      { individual: "Maria C", removed: ["Feta"], reason: "vegan" },
    ],
  },
  {
    id: "line-3",
    itemId: "shawarma-wrap",
    qty: 2,
    basePrice: 12.95,
    modifiers: { spice: "Mild" },
    appliesTo: "2 wraps for variety",
  },
  {
    id: "line-4",
    itemId: "hummus-platter",
    qty: 1,
    basePrice: 8.95,
    modifiers: {},
    appliesTo: "Shared starter",
  },
];

const PITA_PHARMA: CartLine[] = [
  {
    id: "line-1",
    itemId: "power-bowl",
    qty: 9,
    basePrice: 14.5,
    modifiers: {
      base: "Quinoa",
      protein: "Chicken",
      sauce: "Tzatziki",
      toppings: ["Cucumber", "Tomato", "Feta"],
    },
    appliesTo: "9 omnivores (including 2 halal)",
  },
  {
    id: "line-2",
    itemId: "med-bowl",
    qty: 3,
    basePrice: 13.5,
    modifiers: {
      base: "Greens",
      protein: "Falafel",
      sauce: "Tahini",
      toppings: ["Cucumber", "Tomato", "Olives"],
    },
    appliesTo: "3 vegetarians (greens base for 2 GF needs)",
  },
  {
    id: "line-3",
    itemId: "greek-salad",
    qty: 2,
    basePrice: 10.95,
    modifiers: { addProtein: "Chicken" },
    appliesTo: "2 GF lunches",
  },
  {
    id: "line-4",
    itemId: "hummus-platter",
    qty: 1,
    basePrice: 8.95,
    modifiers: {},
    appliesTo: "Shared starter",
  },
];

const BARRIO_EA: CartLine[] = [
  {
    id: "line-1",
    itemId: "taco-bar",
    qty: 10,
    basePrice: 14.95,
    modifiers: { protein: "Carnitas", tortilla: "Mixed" },
    appliesTo: "10 omnivores",
  },
  {
    id: "line-2",
    itemId: "burrito-bowl",
    qty: 4,
    basePrice: 13.5,
    modifiers: { protein: "Veggie", rice: "Cilantro lime", beans: "Black" },
    appliesTo: "4 vegetarian/vegan",
  },
  {
    id: "line-3",
    itemId: "guacamole",
    qty: 1,
    basePrice: 18.0,
    modifiers: {},
    appliesTo: "Shared starter",
  },
];

export const INITIAL_CARTS: Record<Persona, Record<string, CartLine[]>> = {
  ea: {
    "pita-jungle": PITA_EA,
    "barrio-queen": BARRIO_EA,
  },
  pharma: {
    "pita-jungle": PITA_PHARMA,
    "barrio-queen": BARRIO_EA,
  },
};
