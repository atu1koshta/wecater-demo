import type {
  Wallet,
  WalletOrder,
  RestaurantBucket,
  Redemption,
  MonthlyBites,
  RedemptionRoute,
  EzcaterComparison,
} from "@/types";

export const WALLET: Wallet = {
  bites: 27420,
  pendingBites: 1840,
  ytdBitesEarned: 58420,
  ytdBitesRedeemed: 31000,
  totalOrders: 47,
  blendedRate: 6.8,
  welcomeActive: true,
  welcomeDaysRemaining: 18,
  welcomeBonusEarned: 3240,
  welcomeBonusCap: 10000,
};

export const RECENT_ORDERS: WalletOrder[] = [
  {
    id: "O-2841",
    date: "Apr 27",
    office: "Dr. Patel's Cardiology",
    officeIcon: "🫀",
    restaurant: "Barrio Queen",
    icon: "🌮",
    subtotal: 207.0,
    baseRate: 6,
    modifiers: [{ label: "Welcome 2X", bites: 1242 }],
    bitesEarned: 2484,
    actualRate: 12,
    status: "pending",
  },
  {
    id: "O-2837",
    date: "Apr 24",
    office: "Dr. Morrison's Internal Med",
    officeIcon: "🩺",
    restaurant: "Pita Jungle",
    icon: "🥙",
    subtotal: 142.0,
    baseRate: 8,
    modifiers: [{ label: "Welcome 2X", bites: 1136 }],
    bitesEarned: 2272,
    actualRate: 16,
    status: "pending",
  },
  {
    id: "O-2832",
    date: "Apr 22",
    office: "Dr. Patel's Cardiology",
    officeIcon: "🫀",
    restaurant: "Bangkok Garden",
    icon: "🍜",
    subtotal: 198.0,
    baseRate: 5,
    modifiers: [
      { label: "Same-Day +2X", bites: 396 },
      { label: "Welcome 2X", bites: 990 },
    ],
    bitesEarned: 2376,
    actualRate: 12,
    status: "available",
  },
  {
    id: "O-2828",
    date: "Apr 18",
    office: "Westside Oncology",
    officeIcon: "🏥",
    restaurant: "Flower Child",
    icon: "🥗",
    subtotal: 595.0,
    baseRate: 7,
    modifiers: [{ label: "Welcome 2X", bites: 4165 }],
    bitesEarned: 8330,
    actualRate: 14,
    status: "available",
  },
  {
    id: "O-2823",
    date: "Apr 16",
    office: "Dr. Chen's Pediatrics",
    officeIcon: "👶",
    restaurant: "Oregano's Pizza",
    icon: "🍕",
    subtotal: 285.0,
    baseRate: 4,
    modifiers: [],
    bitesEarned: 1140,
    actualRate: 4,
    status: "available",
  },
  {
    id: "O-2819",
    date: "Apr 11",
    office: "Dr. Patel's Cardiology",
    officeIcon: "🫀",
    restaurant: "Pita Jungle",
    icon: "🥙",
    subtotal: 215.0,
    baseRate: 8,
    modifiers: [],
    bitesEarned: 1720,
    actualRate: 8,
    status: "available",
  },
  {
    id: "O-2814",
    date: "Apr 4",
    office: "Sun Valley Family",
    officeIcon: "🌵",
    restaurant: "Bobby Q",
    icon: "🥩",
    subtotal: 88.0,
    baseRate: 3,
    modifiers: [],
    bitesEarned: 264,
    actualRate: 3,
    status: "available",
  },
  {
    id: "O-2810",
    date: "Apr 2",
    office: "Westside Oncology",
    officeIcon: "🏥",
    restaurant: "Curry Corner",
    icon: "🍛",
    subtotal: 525.0,
    baseRate: 6,
    modifiers: [],
    bitesEarned: 3150,
    actualRate: 6,
    status: "available",
  },
];

export const RESTAURANT_BUCKETS: RestaurantBucket[] = [
  { name: "Pita Jungle",   icon: "🥙", earnedBites: 4720, boostMultiplier: 1.4,  boostable: true },
  { name: "Barrio Queen",  icon: "🌮", earnedBites: 3680, boostMultiplier: 1.3,  boostable: true },
  { name: "Flower Child",  icon: "🥗", earnedBites: 8330, boostMultiplier: 1.5,  boostable: true },
  { name: "Bangkok Garden",icon: "🍜", earnedBites: 2840, boostMultiplier: 1.2,  boostable: true },
  { name: "Curry Corner",  icon: "🍛", earnedBites: 3150, boostMultiplier: 0,    boostable: false },
  { name: "Bobby Q",       icon: "🥩", earnedBites: 590,  boostMultiplier: 1.25, boostable: true },
];

export const REDEMPTION_HISTORY: Redemption[] = [
  { date: "Mar 28", bites: 5000, value: 50.0, type: "Amazon gift card",                code: "WCR-X4D-7821" },
  { date: "Feb 15", bites: 6500, value: 65.0, type: "WeCater catering credit · 1.2X",  code: "Used at Pita Jungle" },
  { date: "Jan 8",  bites: 2500, value: 25.0, type: "Amazon gift card",                code: "WCR-V9R-1209" },
];

export const MONTHLY_BITES: MonthlyBites[] = [
  { month: "Nov", value: 3800 },
  { month: "Dec", value: 5200 },
  { month: "Jan", value: 8900 },
  { month: "Feb", value: 7600 },
  { month: "Mar", value: 12400 },
  { month: "Apr", value: 16920 },
];

export const REDEMPTION_ROUTES: RedemptionRoute[] = [
  {
    id: "amazon",
    label: "Amazon gift card",
    multiplier: 1.0,
    minimumBites: 1000,
    description: "Code emailed instantly. 1.0X — 100 Bites = $1.",
  },
  {
    id: "wecater",
    label: "WeCater catering credit",
    multiplier: 1.2,
    minimumBites: 2500,
    description: "1.2X bonus. Use on your next catering order.",
  },
  {
    id: "boost",
    label: "Restaurant Boost",
    multiplier: 1.5, // upper bound; actual varies per restaurant
    minimumBites: 1000,
    description: "Up to 1.5X when redeemed at the restaurant where you earned them.",
  },
];

/** Bites-to-dollar conversion rate. 100 Bites = $1.00 base. */
export const BITES_PER_DOLLAR = 100;

/**
 * Per-route minimum redemption thresholds (in Bites). The 2,500 floor on
 * WeCater catering credit protects the lifecycle margin on the 1.2X kicker
 * (see decisions doc).
 */
export const ROUTE_MIN: Record<"amazon" | "wecater" | "boost", number> = {
  amazon: 1000,
  wecater: 2500,
  boost: 1000,
};

/** Headline comparison shown on the wallet vs. ezCater on equivalent spend. */
export const EZCATER_COMPARISON: EzcaterComparison = {
  wecaterBites: 58420,
  wecaterValue: 584.2,
  ezcaterBitesEquivalent: 14605,
  ezcaterValue: 146.05,
  spread: 438.15,
  spreadPct: 300,
};
