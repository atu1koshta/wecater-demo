"use client";

import { Minus, Plus, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CartLine, ModifierGroup, Restaurant } from "@/types";
import { getMenuItem } from "./math";
import { ModifierChip } from "./ModifierChip";

/**
 * Single line in a Tier 1 cart. Supports quantity stepping, modifier
 * editing via chips, and a "Customize individual orders →" affordance for
 * lines with per-person overrides.
 */
export function CartLineItem({
  line,
  restaurant,
  onChange,
  onRemove,
  onCustomizePerPerson,
}: {
  line: CartLine;
  restaurant: Restaurant;
  onChange: (next: CartLine) => void;
  onRemove: () => void;
  onCustomizePerPerson: () => void;
}) {
  const item = getMenuItem(restaurant.id, line.itemId);
  if (!item) return null;

  const lineTotal = line.qty * line.basePrice;
  const lineBites = Math.round(lineTotal * (restaurant.baseRate ?? 0) * 2);
  const containsNuts = item.dietaryFlags?.includes("contains-nuts");
  const overrides = line.perPersonOverrides ?? [];

  const updateModifier = (group: ModifierGroup, value: string | string[]) => {
    onChange({
      ...line,
      modifiers: { ...line.modifiers, [group.id]: value },
    });
  };

  return (
    <div className="bg-surface-raised border border-surface-border rounded-2xl p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-start">
      <div
        className="h-16 w-16 rounded-xl grid place-items-center text-3xl shrink-0"
        style={{
          background: `linear-gradient(135deg, ${restaurant.brandColor ?? "#FEF3EB"}, ${restaurant.brandColorAccent ?? "#F4EFE8"})`,
        }}
      >
        {restaurant.icon}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[15px] font-semibold text-ink font-display">
            {item.name}
          </span>
          <span className="text-[11px] text-ink-tertiary font-mono">
            ${line.basePrice.toFixed(2)} ea
          </span>
          {containsNuts && (
            <span className="text-[10px] px-1.5 py-px rounded bg-danger-light text-danger font-bold tracking-wider">
              CONTAINS NUTS
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-secondary leading-snug mb-2">
          {item.desc}
        </div>

        {item.modifierGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {item.modifierGroups.map((g) => (
              <ModifierChip
                key={g.id}
                groupName={g.name}
                value={line.modifiers[g.id] ?? (g.multi ? [] : "")}
                options={g.options}
                multi={g.multi}
                onChange={(v) => updateModifier(g, v)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <QtyStepper
            qty={line.qty}
            onDec={() =>
              line.qty <= 1 ? onRemove() : onChange({ ...line, qty: line.qty - 1 })
            }
            onInc={() => onChange({ ...line, qty: line.qty + 1 })}
          />
          <span className="text-[11px] text-ink-tertiary">
            👥 {line.appliesTo}
          </span>
          {overrides.length > 0 && (
            <span className="text-[10px] px-1.5 py-px rounded bg-accent-purple-light text-accent-purple font-semibold inline-flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
              {overrides.length} per-person
            </span>
          )}
          <button
            type="button"
            onClick={onCustomizePerPerson}
            className="ml-auto text-[11px] text-brand font-semibold hover:text-brand-dark transition-colors"
          >
            Customize individual orders →
          </button>
        </div>
      </div>

      <div className="text-right shrink-0 flex flex-col gap-1">
        <span className="text-[15px] font-bold font-mono text-ink">
          ${lineTotal.toFixed(2)}
        </span>
        <span className="text-[11px] text-brand font-mono font-semibold">
          {lineBites.toLocaleString()} Bites
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto h-6 w-6 grid place-items-center text-ink-tertiary hover:text-danger transition-colors"
          aria-label="Remove line"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function QtyStepper({
  qty,
  onDec,
  onInc,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="inline-flex items-center border border-surface-border rounded-md bg-surface">
      <button
        type="button"
        onClick={onDec}
        className={cn(
          "h-7 w-7 grid place-items-center hover:bg-surface-border-light transition-colors",
          qty <= 1 && "text-danger",
        )}
        aria-label="Decrement"
      >
        <Minus className="h-3 w-3" strokeWidth={2.4} />
      </button>
      <span className="px-2 text-xs font-mono font-semibold text-ink min-w-[24px] text-center">
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        className="h-7 w-7 grid place-items-center hover:bg-surface-border-light transition-colors"
        aria-label="Increment"
      >
        <Plus className="h-3 w-3" strokeWidth={2.4} />
      </button>
    </div>
  );
}
