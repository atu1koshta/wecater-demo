"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Restaurant } from "@/types";
import type { InitialOrderContext } from "@/data/order-context";
import {
  calculateBites,
  calculateRedemption,
  rationaleFor,
} from "./math";
import type { OptimizerMode } from "./modes";
import { CountUp, MultiplierChip } from "./atoms";

export type Density = "simple" | "detailed";

export function OptionCard({
  restaurant,
  ctx,
  mode,
  position,
  density,
  isTopPick,
  isCompound,
  deltaToBest,
  baseDelayMs = 0,
}: {
  restaurant: Restaurant;
  ctx: InitialOrderContext;
  mode: OptimizerMode;
  position: number;
  density: Density;
  isTopPick: boolean;
  isCompound?: boolean;
  deltaToBest?: number;
  baseDelayMs?: number;
}) {
  const isTier3 = restaurant.tier === 3;
  const calc = useMemo(() => calculateBites(restaurant, ctx), [restaurant, ctx]);
  const redemption = useMemo(() => calculateRedemption(restaurant), [restaurant]);
  const rationale = useMemo(
    () => rationaleFor(restaurant, mode, position, ctx),
    [restaurant, mode, position, ctx],
  );
  const [localExpanded, setLocalExpanded] = useState(false);

  const estimatedBites = useMemo(() => {
    if (!isTier3) return null;
    const subtotal = restaurant.ppEstimate * ctx.headcount;
    return Math.round(subtotal * (restaurant.estimatedBaseRate ?? 5));
  }, [isTier3, restaurant, ctx]);

  const showDetail = density === "detailed" || localExpanded;

  const dietaryBadge =
    restaurant.dietaryFit >= 0.95
      ? {
          label: isTier3 ? "✅ Likely full coverage" : "✅ All dietary met",
          chip: "bg-success-light text-success",
        }
      : restaurant.dietaryFit >= 0.7
        ? { label: "⚠️ Limited options", chip: "bg-warning-light text-warning" }
        : { label: "❌ Dietary gaps", chip: "bg-danger-light text-danger" };

  const sameDayBadge = restaurant.sameDay
    ? {
        label: `⚡ Same-day until ${restaurant.sameDayCutoff}`,
        chip: "bg-info-light text-info",
      }
    : null;

  const total = restaurant.ppEstimate * ctx.headcount;
  const overBudget = total > ctx.budgetTotal;

  return (
    <div
      className={cn(
        "rounded-[14px] overflow-hidden relative transition-all animate-cardIn",
        isTier3
          ? "bg-[#FCFAF7] border-[1.5px] border-dashed border-ink-tertiary/40"
          : isTopPick
            ? "bg-surface-raised border-2 border-brand shadow-[0_8px_24px_rgba(232,106,26,0.18)]"
            : "bg-surface-raised border border-surface-border shadow-xs",
      )}
      style={{ animationDelay: `${baseDelayMs}ms` }}
    >
      {isTier3 ? (
        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-xl bg-surface text-ink-secondary border border-dashed border-ink-tertiary/55 text-[10px] font-bold tracking-wider uppercase font-display flex items-center gap-1">
          📍 Discovery
        </div>
      ) : (
        isTopPick && (
          <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-xl bg-gradient-to-br from-brand to-brand-dark text-ink-inverse text-[10px] font-bold tracking-wider uppercase font-display">
            {mode === "max_bites"
              ? "💎 Max Bites"
              : mode === "max_discount"
                ? "💸 Best Value"
                : "Top Pick"}
          </div>
        )
      )}

      {restaurant.hasFlash && !isTier3 && (
        <div className="px-3.5 py-1.5 bg-gradient-to-r from-danger to-warning text-ink-inverse text-[11px] font-bold tracking-wider flex items-center gap-1.5">
          🔥 FLASH PROMO · 12X Bites until 5pm today only
        </div>
      )}

      <div className={cn("p-4", isTier3 && "opacity-95")}>
        <div className="flex items-start gap-3 mb-2.5">
          <div
            className={cn(
              "h-11 w-11 rounded-xl bg-surface grid place-items-center text-2xl shrink-0 border",
              isTier3
                ? "border-dashed border-ink-tertiary/40 saturate-75"
                : "border-surface-border",
            )}
          >
            {restaurant.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-ink font-display truncate">
              {restaurant.name}
            </div>
            <div className="text-[11px] text-ink-tertiary">{restaurant.cuisine}</div>
            <div className="mt-1 text-xs flex flex-wrap gap-x-1.5 items-center">
              <span className="font-semibold text-ink font-mono">
                {isTier3 && (
                  <span className="text-ink-tertiary font-medium">est. </span>
                )}
                ${restaurant.ppEstimate.toFixed(2)}/pp
              </span>
              <span className="text-ink-tertiary">·</span>
              <span
                className={cn(
                  "font-semibold font-mono",
                  overBudget ? "text-danger" : "text-ink",
                )}
              >
                ${total.toFixed(2)} total
              </span>
              {overBudget && (
                <span className="text-[10px] text-danger font-semibold">
                  over budget
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-md font-semibold",
              dietaryBadge.chip,
            )}
          >
            {dietaryBadge.label}
          </span>
          {sameDayBadge && (
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-md font-semibold",
                sameDayBadge.chip,
              )}
            >
              {sameDayBadge.label}
            </span>
          )}
        </div>

        {isTier3 && (
          <div className="px-2.5 py-2 rounded-lg bg-surface border border-dashed border-ink-tertiary/40 mb-2.5 flex gap-2 items-start">
            <span className="text-sm mt-px">ℹ️</span>
            <div className="flex-1 text-[11px] text-ink-secondary leading-snug">
              <strong className="text-ink">Not yet a WeCater partner.</strong>{" "}
              Available via quote request.{" "}
              {typeof restaurant.sourceData === "string"
                ? restaurant.sourceData
                : `Menu data from ${restaurant.sourceData?.source ?? "Yelp"}`}
            </div>
          </div>
        )}

        {!showDetail && (
          <div
            className={cn(
              "px-3 py-2.5 rounded-[10px] bg-surface flex items-baseline gap-2 mb-2.5",
              isTier3 && "opacity-90",
            )}
          >
            <span className="text-base">{isTier3 ? "🔮" : "🎁"}</span>
            {isTier3 && estimatedBites !== null ? (
              <>
                <span className="text-[11px] text-ink-tertiary italic">Est.</span>
                <span className="text-[22px] font-bold text-ink-secondary font-display tracking-tight">
                  ~<CountUp value={estimatedBites} />
                </span>
                <span className="text-[11px] text-ink-tertiary font-medium">
                  Bites if activated · ≈ ${(estimatedBites / 100).toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[22px] font-bold text-brand font-display tracking-tight">
                  <CountUp value={calc.total} />
                </span>
                <span className="text-xs text-ink-secondary font-medium">
                  Bites · ≈ ${(calc.total / 100).toFixed(2)}
                </span>
                {deltaToBest !== undefined && deltaToBest !== 0 && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] font-semibold font-mono",
                      deltaToBest < 0 ? "text-danger" : "text-success",
                    )}
                  >
                    {deltaToBest > 0 ? "+" : ""}
                    {deltaToBest.toLocaleString()} vs next
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {density === "simple" && (
          <div className="text-xs text-ink-secondary leading-relaxed mb-2.5 italic">
            {isTier3 ? `🔍 ${restaurant.discoveryReason}` : rationale}
          </div>
        )}

        {showDetail && !isTier3 && (
          <div className="animate-fadeIn">
            <div className="p-3 rounded-[10px] bg-surface border border-dashed border-surface-border mb-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase font-display">
                  🎁 You&apos;ll earn
                </span>
                {deltaToBest !== undefined && deltaToBest !== 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold font-mono",
                      deltaToBest < 0 ? "text-danger" : "text-success",
                    )}
                  >
                    {deltaToBest > 0 ? "+" : ""}
                    {deltaToBest.toLocaleString()} vs next best
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <MultiplierChip
                  modifier={{
                    id: "base",
                    label: `Base ${restaurant.baseRate}X`,
                    icon: "📊",
                    bites: calc.baseBites,
                    color: "ink",
                  }}
                  delayMs={baseDelayMs}
                />
                {calc.modifiers.map((m, i) => (
                  <MultiplierChip
                    key={m.id}
                    modifier={m}
                    delayMs={baseDelayMs + (i + 1) * 150}
                  />
                ))}
              </div>
              <div className="flex items-baseline gap-1.5 pt-2 border-t border-surface-border-light">
                <span className="text-[26px] font-bold text-brand font-display tracking-tight">
                  <CountUp value={calc.total} />
                </span>
                <span className="text-xs text-ink-secondary font-medium">
                  Bites · ≈ ${(calc.total / 100).toFixed(2)}
                </span>
                {redemption && (
                  <span className="ml-auto text-[10px] font-bold text-accent-purple font-mono">
                    {redemption.multiplier}X boost back
                  </span>
                )}
              </div>
            </div>

            {redemption && (
              <div className="px-2.5 py-2 rounded-lg bg-accent-purple-light border border-accent-purple/15 flex items-center gap-2 mb-2.5">
                <span className="text-sm">🚀</span>
                <div className="flex-1 text-[11px] text-ink-secondary leading-snug">
                  You have{" "}
                  <strong className="text-accent-purple font-mono">
                    {redemption.bites.toLocaleString()} Bites
                  </strong>{" "}
                  here. Order again next time and they redeem at{" "}
                  <strong className="text-accent-purple">
                    {redemption.multiplier}X = ${redemption.value.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            {isCompound && (
              <div className="px-3 py-2.5 rounded-[10px] mb-2.5 border-[1.5px] border-brand bg-gradient-to-br from-brand/[.06] to-accent-purple/[.06]">
                <div className="text-[10px] font-bold text-brand tracking-wider uppercase mb-1.5">
                  ⚡ Compound play
                </div>
                <div className="text-xs text-ink leading-relaxed space-y-0.5">
                  <div>
                    Apply 4,720 existing Bites at 1.4X ={" "}
                    <strong className="text-accent-purple font-mono">−$66.08</strong>
                  </div>
                  <div>
                    Earn {calc.total.toLocaleString()} new Bites ={" "}
                    <strong className="text-brand font-mono">
                      ${(calc.total / 100).toFixed(2)} value
                    </strong>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-dashed border-brand/30">
                    <strong>
                      Net cost: ${(calc.subtotal - 66.08 - calc.total / 100).toFixed(2)}
                    </strong>{" "}
                    · effective{" "}
                    <strong className="text-success">
                      {Math.round(((66.08 + calc.total / 100) / calc.subtotal) * 100)}%
                      return
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {density === "simple" && !isTier3 && (
          <button
            type="button"
            onClick={() => setLocalExpanded((e) => !e)}
            className="text-brand text-[11px] font-semibold flex items-center gap-1 mb-2.5 hover:text-brand-dark transition-colors"
          >
            {localExpanded ? "Hide breakdown" : "How is this calculated?"}
            <ChevronDown
              className={cn(
                "h-2.5 w-2.5 transition-transform",
                localExpanded && "rotate-180",
              )}
              strokeWidth={2.4}
            />
          </button>
        )}

        <button
          type="button"
          className={cn(
            "w-full px-3.5 py-2.5 rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
            isTier3
              ? "bg-surface-raised text-ink border border-surface-border hover:border-brand"
              : isTopPick
                ? "bg-brand text-ink-inverse hover:bg-brand-dark"
                : "bg-surface text-ink hover:bg-surface-border-light",
          )}
        >
          {isTier3
            ? "📨 Request a quote →"
            : isTopPick
              ? "🍴 Choose this option →"
              : "Select"}
        </button>

        {isTier3 && (
          <div className="mt-1.5 text-[10px] text-ink-tertiary text-center leading-snug">
            We&apos;ll email {restaurant.name.split(" ")[0]} on your behalf. Bites
            earned only after they activate.
          </div>
        )}
      </div>
    </div>
  );
}
