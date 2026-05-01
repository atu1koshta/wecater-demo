"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ConfirmItem = {
  id: string;
  text: string;
  /** Sub-tone for the item — drives the icon and accent color. */
  tone?: "warning" | "info";
};

/**
 * Small alert area near the hero. Lists open questions the cart still has
 * (e.g. "Confirm Maria's vegan modification" / "Verify halal protein"). User
 * can resolve (✓) or dismiss (✕) each item.
 */
export function ThingsToConfirm({
  items,
  onResolve,
  onDismiss,
}: {
  items: ConfirmItem[];
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 px-3.5 py-3 rounded-xl bg-warning-light border border-warning/30">
      <div className="text-[10px] font-bold text-warning tracking-wider uppercase mb-2 font-display">
        ⚠️ Things to confirm ({items.length})
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-raised border",
              it.tone === "info"
                ? "border-info/30"
                : "border-warning/30",
            )}
          >
            <span className="text-xs">
              {it.tone === "info" ? "ℹ️" : "⚠️"}
            </span>
            <span className="flex-1 text-xs text-ink leading-snug">
              {it.text}
            </span>
            <button
              type="button"
              onClick={() => onResolve(it.id)}
              className="h-6 w-6 rounded grid place-items-center text-success hover:bg-success-light transition-colors"
              aria-label="Resolve"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={() => onDismiss(it.id)}
              className="h-6 w-6 rounded grid place-items-center text-ink-tertiary hover:bg-surface-border-light transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
