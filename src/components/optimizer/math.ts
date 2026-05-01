import type { Restaurant } from "@/types";
import type { InitialOrderContext } from "@/data/order-context";
import type { OptimizerMode } from "./modes";

export type ChipColor = "ink" | "brand" | "purple" | "danger";

export type BitesModifier = {
  id: string;
  label: string;
  icon: string;
  bites: number;
  color: ChipColor;
  isFlash?: boolean;
};

export type BitesCalc = {
  subtotal: number;
  baseBites: number;
  modifiers: BitesModifier[];
  total: number;
  baseRate: number;
};

export type RedemptionPreview = {
  bites: number;
  multiplier: number;
  value: number;
};

/** Compute Bites earned by ordering at this restaurant under the given context. */
export function calculateBites(
  r: Restaurant,
  ctx: InitialOrderContext,
): BitesCalc {
  const subtotal = r.ppEstimate * ctx.headcount;
  const rate = r.baseRate ?? 0;
  const baseBites = Math.round(subtotal * rate);

  const modifiers: BitesModifier[] = [];
  if (ctx.welcomeActive && rate > 0) {
    modifiers.push({
      id: "welcome",
      label: "Welcome 2X",
      icon: "🎁",
      bites: baseBites,
      color: "brand",
    });
  }
  if ((r.sameDayBoost ?? 0) > 0 && ctx.isSameDay) {
    const sdBites = Math.round(subtotal * (r.sameDayBoost ?? 0));
    modifiers.push({
      id: "sameday",
      label: `Same-Day +${r.sameDayBoost}X`,
      icon: "⚡",
      bites: sdBites,
      color: "purple",
    });
  }
  if (r.hasFlash) {
    modifiers.push({
      id: "flash",
      label: "Flash 12X (today only)",
      icon: "🔥",
      bites: 0,
      color: "danger",
      isFlash: true,
    });
  }

  const total = baseBites + modifiers.reduce((s, m) => s + m.bites, 0);
  return { subtotal, baseBites, modifiers, total, baseRate: rate };
}

/**
 * "If you redeem your earned-here Bites, here's what they're worth at this
 * restaurant's Boost rate." Returns null when ineligible.
 */
export function calculateRedemption(r: Restaurant): RedemptionPreview | null {
  if (!r.restaurantBoost || r.earnedBites < 1000) return null;
  const value = (r.earnedBites / 100) * r.restaurantBoost;
  return { bites: r.earnedBites, multiplier: r.restaurantBoost, value };
}

/** Composite "Smart" score that balances Bites, dietary fit, variety, compliance. */
export function smartScore(r: Restaurant, ctx: InitialOrderContext): number {
  const bites = calculateBites(r, ctx).total;
  const variety = 1 - r.varietyPenalty;
  return (
    bites * 0.3 +
    r.dietaryFit * 1500 +
    variety * 800 +
    r.complianceFit * 600
  );
}

export function rankBy(
  restaurants: Restaurant[],
  mode: OptimizerMode,
  ctx: InitialOrderContext,
): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    if (mode === "max_bites") {
      return calculateBites(b, ctx).total - calculateBites(a, ctx).total;
    }
    if (mode === "max_discount") {
      const aR = calculateRedemption(a);
      const bR = calculateRedemption(b);
      return (bR?.value ?? 0) - (aR?.value ?? 0);
    }
    if (mode === "speed") {
      return Number(b.sameDay ?? false) - Number(a.sameDay ?? false);
    }
    if (mode === "compliance") return b.complianceFit - a.complianceFit;
    return smartScore(b, ctx) - smartScore(a, ctx);
  });
}

/**
 * One-line rationale shown in Simple density. Calibrated to mode + position so
 * the Top Pick gets a "why this" line and the alternates get a tradeoff line.
 */
export function rationaleFor(
  r: Restaurant,
  mode: OptimizerMode,
  position: number,
  ctx: InitialOrderContext,
): string {
  const calc = calculateBites(r, ctx);
  const overBudget = calc.subtotal > ctx.budgetTotal;
  const overByPp = (calc.subtotal - ctx.budgetTotal) / ctx.headcount;

  if (position === 0) {
    if (r.hasFlash) return "🔥 Flash promo today only — highest Bites";
    if (mode === "max_bites")
      return `Highest Bites · ${r.baseRate}X base + active multipliers`;
    if (mode === "max_discount")
      return "Most discount available with your existing Bites";
    if (mode === "speed")
      return `Available now · order by ${r.sameDayCutoff ?? "cutoff"}`;
    if (mode === "compliance") return "Lowest physician YTD impact";
    return "Best balance: dietary fit, variety, and budget";
  }
  if (overBudget) return `⚠️ Over budget by $${overByPp.toFixed(2)}/pp`;
  if (r.dietaryFit < 0.8) return "Strong taste · limited dietary options";
  if (r.varietyPenalty > 0.3)
    return "Comfort pick · cuisine repeats recently";
  if (r.complianceFit < 0.8) return "High earner · pushes physician YTD";
  return "Solid alternative pick";
}
