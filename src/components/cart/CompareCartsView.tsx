"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CartLine, CartProfile, Restaurant } from "@/types";
import { calcCartTotals, getDietaryCoverage, getMenuItem } from "./math";

/**
 * Modal showing every cart drafted this session side-by-side. Each column has
 * a brand-color hero, the active restaurant identity, six comparison rows, and
 * a "Place this order" CTA that returns the selected restaurant key.
 */
export function CompareCartsView({
  carts,
  restaurants,
  profile,
  open,
  onClose,
  onPlaceOrder,
}: {
  carts: Record<string, CartLine[]>;
  restaurants: Restaurant[];
  profile: CartProfile;
  open: boolean;
  onClose: () => void;
  onPlaceOrder: (restaurantKey: string) => void;
}) {
  if (!open) return null;
  const entries = Object.entries(carts).filter(([, lines]) => lines.length > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(20,18,15,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-[1000px] max-w-full max-h-[92vh] overflow-y-auto bg-surface-raised rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 flex justify-between items-start gap-3">
          <div>
            <h2 className="text-xl font-semibold font-display text-ink">
              Compare cart drafts
            </h2>
            <p className="text-[13px] text-ink-secondary mt-1">
              Same dietary profile · {entries.length} options side-by-side
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-surface text-ink-secondary grid place-items-center hover:bg-surface-border-light transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="grid gap-4 p-6"
          style={{
            gridTemplateColumns: `repeat(${Math.max(entries.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {entries.map(([key, lines]) => {
            const restaurant = restaurants.find((r) => r.id === key);
            if (!restaurant) return null;
            const totals = calcCartTotals(lines, restaurant);
            const heroLine = [...lines].sort((a, b) => b.qty - a.qty)[0];
            const heroItem = getMenuItem(restaurant.id, heroLine.itemId);
            const itemCount = lines.reduce((s, l) => s + l.qty, 0);
            const overBudget = totals.subtotal > profile.budgetTotal;
            const coverage = getDietaryCoverage(profile);
            const recentCount =
              profile.recentRestaurantsByCuisine[restaurant.cuisine] ?? 0;

            return (
              <div
                key={key}
                className="rounded-2xl border border-surface-border overflow-hidden bg-surface-raised flex flex-col"
              >
                <div
                  className="relative h-28 px-4 py-3 text-ink-inverse overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${restaurant.brandColor ?? "#1B3A2E"}, ${restaurant.brandColorAccent ?? "#2D5848"})`,
                  }}
                >
                  <div className="absolute -bottom-4 -right-3 text-7xl opacity-30 select-none">
                    {restaurant.icon}
                  </div>
                  <div className="relative z-[1]">
                    <div className="text-[10px] font-bold tracking-widest uppercase opacity-85 font-display">
                      Featured pick
                    </div>
                    <div className="text-sm font-semibold mt-1">
                      {heroLine.qty} × {heroItem?.name ?? heroLine.itemId}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{restaurant.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">
                        {restaurant.name}
                      </div>
                      <div className="text-[11px] text-ink-tertiary truncate">
                        {restaurant.cuisine} · {restaurant.baseRate}X base
                      </div>
                    </div>
                  </div>

                  <ComparisonRow
                    label="Total"
                    value={`$${totals.subtotal.toFixed(2)}`}
                    highlight={!overBudget}
                    accent={overBudget ? "danger" : undefined}
                  />
                  <ComparisonRow
                    label="Per person"
                    value={`$${(totals.subtotal / profile.headcount).toFixed(2)}`}
                  />
                  <ComparisonRow
                    label="Bites earned"
                    value={`${totals.totalBites.toLocaleString()}`}
                    accent="brand"
                  />
                  <ComparisonRow
                    label="Items"
                    value={`${itemCount} portions`}
                  />
                  <ComparisonRow
                    label="Dietary"
                    value={`${coverage.covered}/${coverage.total} covered`}
                    accent="success"
                  />
                  <ComparisonRow
                    label="Variety"
                    value={recentCount >= 8 ? "★★ recent" : "★★★★ fresh"}
                    accent={recentCount >= 8 ? "warning" : "success"}
                  />

                  <button
                    type="button"
                    onClick={() => onPlaceOrder(key)}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-brand text-ink-inverse text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-dark transition-colors"
                  >
                    🍴 Place this order →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  value,
  highlight = false,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: "brand" | "success" | "danger" | "warning";
}) {
  const accentClass =
    accent === "brand"
      ? "text-brand"
      : accent === "success"
        ? "text-success"
        : accent === "danger"
          ? "text-danger"
          : accent === "warning"
            ? "text-warning"
            : "text-ink";
  return (
    <div
      className={cn(
        "flex justify-between items-center px-2.5 py-1.5 rounded-md mb-1",
        highlight ? "bg-success-light" : "bg-surface",
      )}
    >
      <span className="text-[11px] text-ink-secondary">{label}</span>
      <span className={cn("text-xs font-mono font-semibold", accentClass)}>
        {value}
      </span>
    </div>
  );
}
