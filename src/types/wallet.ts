export type WalletOrderStatus = "pending" | "available";

export type OrderModifier = {
  label: string; // "Welcome 2X", "Same-Day +2X", "Flash 12X", etc.
  bites: number;
};

export type WalletOrder = {
  id: string;
  date: string;
  office: string;
  officeIcon: string;
  restaurant: string;
  icon: string;
  subtotal: number;
  baseRate: number;
  modifiers: OrderModifier[];
  bitesEarned: number;
  actualRate: number;
  status: WalletOrderStatus;
};

export type RestaurantBucket = {
  name: string;
  icon: string;
  earnedBites: number;
  boostMultiplier: number; // 0 if not boostable
  boostable: boolean;
};

export type RedemptionRouteId = "amazon" | "wecater" | "boost";

export type Redemption = {
  date: string;
  bites: number;
  value: number;
  type: string;
  code: string;
};

export type MonthlyBites = {
  month: string;
  value: number;
};

export type RedemptionRoute = {
  id: RedemptionRouteId;
  label: string;
  multiplier: number;
  minimumBites: number;
  description: string;
};

export type Wallet = {
  bites: number;
  pendingBites: number;
  ytdBitesEarned: number;
  ytdBitesRedeemed: number;
  totalOrders: number;
  blendedRate: number;
  welcomeActive: boolean;
  welcomeDaysRemaining: number;
  welcomeBonusEarned: number;
  welcomeBonusCap: number;
};

export type EzcaterComparison = {
  wecaterBites: number;
  wecaterValue: number;
  ezcaterBitesEquivalent: number;
  ezcaterValue: number;
  spread: number;
  spreadPct: number;
};
