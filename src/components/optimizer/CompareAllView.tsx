"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { Restaurant } from "@/types";
import type { InitialOrderContext } from "@/data/order-context";
import { calculateBites, calculateRedemption } from "./math";

type SortKey = "bites" | "price" | "dietary";

type EnrichedRestaurant = Restaurant & {
  calc: { total: number; subtotal: number };
};

const SORTS: { id: SortKey; label: string }[] = [
  { id: "bites", label: "Bites" },
  { id: "price", label: "Price" },
  { id: "dietary", label: "Dietary" },
];

export function CompareAllView({
  restaurants,
  ctx,
}: {
  restaurants: Restaurant[];
  ctx: InitialOrderContext;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("bites");

  const { tier1, tier3 } = useMemo(() => {
    const enrich = (r: Restaurant): EnrichedRestaurant => {
      if (r.tier === 3) {
        const subtotal = r.ppEstimate * ctx.headcount;
        const total = Math.round(subtotal * (r.estimatedBaseRate ?? 5));
        return { ...r, calc: { subtotal, total } };
      }
      const c = calculateBites(r, ctx);
      return { ...r, calc: { subtotal: c.subtotal, total: c.total } };
    };
    const list = restaurants.map(enrich);
    if (sortBy === "bites") list.sort((a, b) => b.calc.total - a.calc.total);
    else if (sortBy === "price") list.sort((a, b) => a.ppEstimate - b.ppEstimate);
    else if (sortBy === "dietary")
      list.sort((a, b) => b.dietaryFit - a.dietaryFit);
    return {
      tier1: list.filter((r) => r.tier !== 3),
      tier3: list.filter((r) => r.tier === 3),
    };
  }, [restaurants, ctx, sortBy]);

  return (
    <div className="bg-surface-raised rounded-[14px] border border-surface-border overflow-hidden mt-2.5">
      <div className="px-3.5 py-2.5 border-b border-surface-border flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-bold text-ink font-display">
          Your working set · {restaurants.length} options
        </span>
        <div className="flex gap-1">
          {SORTS.map((s) => {
            const on = sortBy === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortBy(s.id)}
                className={cn(
                  "px-2.5 py-0.5 rounded-xl text-[10px] font-semibold border transition-colors",
                  on
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-surface-border bg-surface-raised text-ink-secondary hover:border-surface-border-strong",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <ColumnHeader />

      {tier1.map((r, i) => (
        <Row key={r.id} r={r} index={i} isTier3={false} />
      ))}

      {tier3.length > 0 && (
        <>
          <div className="px-3.5 py-2 border-t border-dashed border-surface-border bg-surface text-[10px] font-bold text-ink-tertiary tracking-wider uppercase flex items-center gap-1.5">
            <span>📍</span>
            <span>Discovery options · not yet partnered · request a quote</span>
          </div>
          {tier3.map((r, i) => (
            <Row key={r.id} r={r} index={i} isTier3 />
          ))}
        </>
      )}
    </div>
  );
}

function ColumnHeader() {
  return (
    <div className="grid grid-cols-[1.5fr_70px_80px_100px_70px_100px] px-3.5 py-2 bg-surface text-[9px] font-bold text-ink-tertiary tracking-wider uppercase">
      <span>Restaurant</span>
      <span className="text-right">$/pp</span>
      <span className="text-right">Total</span>
      <span className="text-right">Bites</span>
      <span className="text-right">Boost</span>
      <span className="text-center">Dietary</span>
    </div>
  );
}

function Row({
  r,
  index,
  isTier3,
}: {
  r: EnrichedRestaurant;
  index: number;
  isTier3: boolean;
}) {
  const dietaryChip =
    r.dietaryFit >= 0.95
      ? "bg-success-light text-success"
      : r.dietaryFit >= 0.7
        ? "bg-warning-light text-warning"
        : "bg-danger-light text-danger";
  return (
    <div
      className={cn(
        "grid grid-cols-[1.5fr_70px_80px_100px_70px_100px] px-3.5 py-2.5 items-center transition-colors hover:bg-surface",
        index > 0 && "border-t border-surface-border-light",
        isTier3 && "opacity-85",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("text-base", isTier3 && "saturate-75")}>{r.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink flex items-center gap-1.5 truncate">
            {r.name}
            {isTier3 && (
              <span className="text-[8px] px-1 py-px rounded bg-surface text-ink-tertiary font-bold tracking-wider uppercase border border-dashed border-ink-tertiary/40">
                DISCOVERY
              </span>
            )}
          </div>
          <div className="text-[10px] text-ink-tertiary truncate">
            {r.cuisine} ·{" "}
            {isTier3 ? `est. ${r.estimatedBaseRate}X` : `${r.baseRate}X base`}
          </div>
        </div>
      </div>
      <span className="text-[11px] text-ink-secondary font-mono text-right">
        {isTier3 && <span className="text-ink-tertiary font-medium">~</span>}$
        {r.ppEstimate.toFixed(2)}
      </span>
      <span className="text-[11px] text-ink font-mono font-semibold text-right">
        ${r.calc.subtotal.toFixed(0)}
      </span>
      <span
        className={cn(
          "text-xs font-mono font-bold text-right",
          isTier3 ? "text-ink-secondary" : "text-brand",
        )}
      >
        {isTier3 && (
          <span className="text-[9px] text-ink-tertiary mr-0.5">~</span>
        )}
        {r.calc.total.toLocaleString()}
      </span>
      <span
        className={cn(
          "text-[10px] font-mono font-bold text-right",
          r.restaurantBoost ? "text-accent-purple" : "text-ink-tertiary",
        )}
      >
        {r.restaurantBoost ? `${r.restaurantBoost}X` : "—"}
      </span>
      <span className="text-center">
        <span
          className={cn(
            "text-[10px] px-1.5 py-px rounded font-semibold",
            dietaryChip,
          )}
        >
          {Math.round(r.dietaryFit * 100)}%
        </span>
      </span>
    </div>
  );
}

/** Lookup helper used by the optimizer to filter the working set. */
export function filterPool(
  restaurants: Restaurant[],
  poolIds: string[],
): Restaurant[] {
  const set = new Set(poolIds);
  return restaurants.filter((r) => set.has(r.id));
}
