"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CartLine, CartProfile, Restaurant } from "@/types";
import { calcCartTotals } from "./math";

export type QuoteRequestRecord = {
  ref: string;
  restaurant: string;
  restaurantKey: string;
  sentAt: string;
};

/**
 * Right-rail panel: cart drafts list (with active highlight + Tier 3 dashed
 * variant), optional Quote requests history, Active multipliers (hidden on
 * Tier 3 active restaurants), and a rotating Did-you-know tip.
 */
export function CartSidebar({
  carts,
  restaurants,
  activeKey,
  onSelect,
  onAddBarrio,
  onCompare,
  quoteRequests,
  step,
  isTier3Active,
  activeRestaurantBoost,
  activeRestaurantName,
}: {
  carts: Record<string, CartLine[]>;
  restaurants: Restaurant[];
  activeKey: string;
  onSelect: (key: string) => void;
  onAddBarrio: () => void;
  onCompare: () => void;
  quoteRequests: QuoteRequestRecord[];
  step: number;
  isTier3Active: boolean;
  activeRestaurantBoost?: number;
  activeRestaurantName: string;
}) {
  const entries = Object.entries(carts);
  const hasMultiple = entries.filter(([, l]) => l.length > 0).length >= 2;

  return (
    <aside className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-surface-border bg-surface overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display">
            🛒 Cart drafts ({entries.length})
          </span>
          {hasMultiple && (
            <button
              type="button"
              onClick={onCompare}
              className="text-[11px] text-brand font-semibold hover:text-brand-dark transition-colors"
            >
              Compare carts →
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {entries.map(([key, lines]) => {
            const r = restaurants.find((x) => x.id === key);
            if (!r) return null;
            const isTier3 = r.tier === 3;
            const active = key === activeKey;
            const totals = calcCartTotals(lines, r);

            const minMax = isTier3 && r.estimatedCart
              ? {
                  min: r.estimatedCart.reduce((s, l) => s + l.ppMin, 0) * 14,
                  max: r.estimatedCart.reduce((s, l) => s + l.ppMax, 0) * 14,
                }
              : null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl border transition-all",
                  isTier3
                    ? active
                      ? "bg-warning-light border-dashed border-warning"
                      : "bg-surface-raised border-dashed border-warning/40 hover:border-warning"
                    : active
                      ? "bg-brand-light border-brand"
                      : "bg-surface-raised border-surface-border hover:border-brand",
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-ink truncate">
                        {r.name}
                      </span>
                      {isTier3 && (
                        <span className="text-[9px] px-1 py-px rounded bg-warning text-ink-inverse font-bold tracking-wider">
                          📍 DISCOVERY
                        </span>
                      )}
                      {active && (
                        <span className="text-[9px] px-1 py-px rounded bg-brand text-ink-inverse font-bold tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-secondary truncate">
                      {isTier3
                        ? minMax
                          ? `Est. $${minMax.min.toFixed(0)}–$${minMax.max.toFixed(0)} · quote-only`
                          : "Quote-only"
                        : `${lines.length} line${lines.length === 1 ? "" : "s"} · $${totals.subtotal.toFixed(0)} · ${totals.totalBites.toLocaleString()} Bites`}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {!entries.some(([k]) => k === "barrio-queen") && (
            <button
              type="button"
              onClick={onAddBarrio}
              className="px-3 py-2.5 rounded-xl border border-dashed border-surface-border bg-transparent text-ink-tertiary text-xs flex items-center justify-center gap-1 hover:border-brand hover:text-brand transition-colors"
            >
              <Plus className="h-3 w-3" strokeWidth={2.4} />
              Build cart at another restaurant
            </button>
          )}
        </div>
      </div>

      {quoteRequests.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display mb-3">
            📨 Quote requests ({quoteRequests.length})
          </div>
          <div className="flex flex-col gap-2">
            {quoteRequests.map((q) => (
              <div
                key={q.ref}
                className="px-3 py-2.5 rounded-xl bg-surface-raised border border-surface-border"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px] font-semibold text-ink truncate flex-1">
                    {q.restaurant}
                  </span>
                  <span className="text-[9px] px-1 py-px rounded bg-success text-ink-inverse font-bold tracking-wider">
                    SENT
                  </span>
                </div>
                <div className="text-[11px] text-ink-tertiary font-mono">
                  {q.ref}
                </div>
                <div className="text-[10px] text-ink-tertiary mt-0.5">
                  Awaiting response · ~24h SLA
                </div>
              </div>
            ))}
            <div className="text-[10px] text-ink-tertiary italic px-1 leading-snug">
              You&apos;ll be notified when restaurants respond. Quote history is
              saved to your profile.
            </div>
          </div>
        </div>
      )}

      {!isTier3Active && (
        <div className="px-4 pb-4">
          <div className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display mb-3">
            Active multipliers
          </div>
          <div className="flex flex-col gap-2">
            <MultiplierLine
              icon="🎁"
              label="Welcome 2X"
              desc="All Bites doubled · 18d left"
              tone="brand"
            />
            {activeRestaurantBoost ? (
              <MultiplierLine
                icon="🚀"
                label={`${activeRestaurantName} Boost`}
                desc={`Future redemption at ${activeRestaurantBoost}X`}
                tone="purple"
              />
            ) : null}
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <DidYouKnow step={step} />
      </div>

      <div className="flex-1" />
    </aside>
  );
}

function MultiplierLine({
  icon,
  label,
  desc,
  tone,
}: {
  icon: string;
  label: string;
  desc: string;
  tone: "brand" | "purple";
}) {
  const labelTone = tone === "brand" ? "text-brand" : "text-accent-purple";
  return (
    <div className="px-3 py-2 rounded-xl bg-surface-raised border border-surface-border flex gap-2">
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[11px] font-semibold", labelTone)}>{label}</div>
        <div className="text-[10px] text-ink-secondary leading-snug mt-px">
          {desc}
        </div>
      </div>
    </div>
  );
}

function DidYouKnow({ step }: { step: number }) {
  const message =
    step <= 1
      ? "Direct UI edits commit instantly — no AI loop. Use chat for higher-level intent (\"make it more keto\")."
      : step === 2
        ? "Proactive suggestions are based on this profile's order history. Click + to accept, or ignore — they don't repeat."
        : step === 3
          ? "AI proposes; you approve. Big NL changes always come through a preview banner so nothing gets applied silently."
          : step === 4
            ? "Per-person customization is one click — names and tags are pulled from the active profile."
            : step === 5
              ? "Build parallel carts at multiple restaurants — same dietary profile applies to each."
              : step === 6
                ? "Compare side-by-side: Bites, dietary coverage, variety. Pick a winner without losing the others."
                : "Discovery options (📍 dashed) aren't WeCater partners yet. Send a quote — they activate, you earn.";
  return (
    <div className="px-3 py-2.5 rounded-xl bg-brand-light border border-dashed border-brand/40">
      <div className="text-[10px] font-bold text-brand tracking-wider uppercase mb-1">
        💡 Did you know?
      </div>
      <div className="text-[11px] text-ink-secondary leading-relaxed">
        {message}
      </div>
    </div>
  );
}
