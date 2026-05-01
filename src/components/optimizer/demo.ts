import type { DemoMode } from "./modes";

/**
 * Scripted optimizer conversation. Each turn fires one user→assistant pair when
 * the user presses Enter / clicks send. Flags drive what extra UI appears
 * around the assistant's reply (compound play, hidden insight, compare table).
 */
export type DemoTurn = {
  user: string;
  aiText: string;
  mode: DemoMode;
  /** Restaurant ids to render as option cards inline below the assistant. */
  options?: string[];
  /** Add the listed options to the running session pool. */
  addToPool?: boolean;
  /** Show the funnel cascade animation while calculating (first turn only). */
  funnel?: boolean;
  /** Show the "Added to working set" pill above the cards. */
  surfaceMore?: boolean;
  /** Show the "What Smart mode was hiding" insight callout. */
  showHiddenInsight?: boolean;
  /** Apply compound-play treatment to the first option card. */
  showCompoundStrategy?: boolean;
  /** Open the full CompareAllView below the bubble. */
  showCompareAll?: boolean;
};

export const OPTIMIZER_DEMO: DemoTurn[] = [
  {
    user: "Order for Dr. Patel's office. Tuesday lunch, 14 people, $15/pp budget.",
    aiText:
      "Loading Dr. Patel's profile — 14 people, 7 dietary restrictions, $210 budget. I scanned every Phoenix catering option that delivers Tuesday at noon and meets your hard constraints. **47 viable matches.** Top 3 below — Smart mode balances Bites earned, dietary fit, variety, and compliance:",
    mode: "smart",
    options: ["barrio-queen", "bobby-q", "flower-child"],
    addToPool: true,
    funnel: true,
  },
  {
    user: "Show me more options — different cuisines",
    aiText:
      "Adding to your working set. Here are 2 more partner options matching your dietary mix, plus 1 discovery option that fills a cuisine gap nothing else covers:",
    mode: "smart",
    options: ["pita-jungle", "curry-corner", "tonys-italian"],
    addToPool: true,
    surfaceMore: true,
  },
  {
    user: "/maximize bites",
    aiText:
      "Re-ranking your working set by Bites earned (Welcome 2X is live for 18 more days). I'm also adding one new partner I held back on — flash promo running today:",
    mode: "max_bites",
    options: ["true-food", "pita-jungle", "flower-child", "barrio-queen"],
    addToPool: true,
    showHiddenInsight: true,
  },
  {
    user: "What about my Pita Jungle Bites? Can I use them on this order?",
    aiText:
      "Yes — and here's a compound play that would have taken you 20 min in a spreadsheet: order Pita Jungle now AND redeem your existing 4,720 Bites. You earn AND discount in the same transaction.",
    mode: "max_discount",
    options: ["pita-jungle"],
    showCompoundStrategy: true,
  },
  {
    user: "Compare what we've seen so far",
    aiText:
      "Here's everything we've considered together this session — sortable by any factor. Discovery options grouped at the bottom.",
    mode: "compare",
    showCompareAll: true,
  },
];

export const OPTIMIZER_PROMPTS = [
  "Order for Dr. Patel's office, Tue lunch, 14 people",
  "/maximize bites",
  "What's the best deal today?",
];
