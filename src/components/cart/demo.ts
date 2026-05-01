import type { CartLine, CartLineModifiers } from "@/types";
import type { NLPreview } from "./NLEditPreview";

/**
 * Each scripted turn fires when the user clicks Send / a proactive accept.
 * Effects compose: a turn can emit an AI inline message, a direct edit, an
 * NL preview, or trigger UI state changes (per-person modal, compare view,
 * parallel cart, restaurant switch).
 */
export type CartDemoTurn = {
  /** Right-rail input echo. Null on initial state (turn 0). */
  user: string | null;
  /** Inline AI bubble shown above the cart. Null = clear / no message. */
  aiInline?: string | null;
  /** Proactive add-on suggestion shown as a purple dashed pill. */
  proactive?: { text: string; action: string } | null;
  /** Direct line edit. */
  edit?: {
    lineId?: string;
    modifierKey?: string;
    value?: string | string[];
    addLine?: CartLine;
  };
  /** NL preview with diff lines + accept/reject. */
  nlPreview?: NLPreview;
  /** Open per-person modal for line id. */
  showPerPerson?: string;
  /** Add a starter cart at this restaurant. */
  addParallelCart?: string;
  /** Open compare-carts modal. */
  showCompareCarts?: boolean;
  /** Switch to a Tier 3 restaurant (will register with empty cart). */
  switchToRestaurant?: string;
};

const KETO_PREVIEW: NLPreview = {
  command: "make it more keto",
  changes: [
    { kind: "change", text: "Switch all bowls from Quinoa → Greens base (lower carb)" },
    { kind: "remove", text: "Drop the Hummus & Pita platter (high carb)" },
    {
      kind: "add",
      text: "Add 2 Greek Salads with chicken to replace lost portions",
    },
    {
      kind: "change",
      text: "Keep wraps but swap pita to lettuce wrap (note: kitchen instruction)",
    },
  ],
  netCost: "+$8.50",
  netBites: "+85 Bites",
  dietary: "Keto ✓",
};

export const CART_DEMO: CartDemoTurn[] = [
  {
    user: null,
    aiInline:
      "Built your cart based on Marketing Team's profile. 4 vegetarian bowls (Maria's vegan version handled), 8 omnivore bowls, 2 wraps for variety, hummus to share. 7/7 dietary needs covered, $179.85 of $210 budget.",
    proactive: {
      text: "I noticed Marketing Team usually orders dessert. Add Baklava platter for $24?",
      action: "+ Add Baklava",
    },
  },
  {
    user: "Direct UI edit · changed sauce on Power Bowls from Tzatziki → Garlic",
    edit: { lineId: "line-1", modifierKey: "sauce", value: "Garlic" },
  },
  {
    user: "Add Baklava (proactive accept)",
    edit: {
      addLine: {
        id: "line-baklava",
        itemId: "baklava",
        qty: 1,
        basePrice: 24.0,
        modifiers: {} as CartLineModifiers,
        appliesTo: "Shared dessert",
      },
    },
  },
  {
    user: "make it more keto",
    nlPreview: KETO_PREVIEW,
  },
  {
    user: "open per-person customization",
    showPerPerson: "line-2",
  },
  {
    user: "Build cart at Barrio Queen too",
    aiInline:
      "Got it — building parallel cart at Barrio Queen with the same dietary profile. You can compare both before placing.",
    addParallelCart: "barrio-queen",
  },
  {
    user: "Compare what I've built",
    showCompareCarts: true,
  },
  {
    user: "what about Ethiopian?",
    aiInline:
      "No Tier 1 partner restaurants offer Ethiopian in Phoenix yet — but I found one in our discovery catalog that's a strong fit. **Lalibela Kitchen** has a 4.7★ rating, covers your dietary needs, and is in your delivery area. They're not yet partnered, so this would be a quote-based order rather than instant checkout. Want me to put together a request?",
    switchToRestaurant: "lalibela",
  },
];

export const CART_HINTS = [
  "Make it more keto",
  "Stay under $200 total",
  "Add gluten-free desserts",
  "Swap 3 chicken for vegetarian",
  "Try Barrio Queen instead",
];
