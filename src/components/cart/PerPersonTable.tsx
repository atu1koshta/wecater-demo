"use client";

import { useMemo } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CartLine, CartProfile, Restaurant } from "@/types";
import { getMenuItem } from "./math";

type Seat = {
  index: number;
  name: string;
  tags: string[];
};

/**
 * Per-individual customization modal. Lists `line.qty` seats with names pulled
 * from `profile.dietaryRestrictions[i].individuals` where applicable, tagged
 * with their restrictions, and shows per-line override info if present.
 */
export function PerPersonTable({
  open,
  line,
  restaurant,
  profile,
  onClose,
  onSave,
}: {
  open: boolean;
  line: CartLine | null;
  restaurant: Restaurant;
  profile: CartProfile;
  onClose: () => void;
  onSave: (opts: { acceptAI: boolean }) => void;
}) {
  const item = line ? getMenuItem(restaurant.id, line.itemId) : null;

  const seats = useMemo<Seat[]>(() => {
    if (!line) return [];
    const veg = profile.dietaryRestrictions.find((d) => d.tag === "Vegetarian");
    const vegan = profile.dietaryRestrictions.find((d) => d.tag === "Vegan");
    const treeNut = profile.dietaryRestrictions.find(
      (d) => d.tag === "Tree nut allergy",
    );

    const list: Seat[] = [];
    for (let i = 0; i < line.qty; i++) {
      let name = `Guest ${i + 1}`;
      const tags: string[] = [];
      if (line.itemId === "med-bowl") {
        name = veg?.individuals?.[i] ?? name;
        if (vegan?.individuals?.includes(name)) tags.push("Vegan");
        if (treeNut?.individuals?.includes(name)) tags.push("Tree nut allergy");
      } else if (line.itemId === "power-bowl") {
        name = treeNut?.individuals?.[i] ?? name;
        if (treeNut?.individuals?.includes(name)) tags.push("Tree nut allergy");
      }
      list.push({ index: i + 1, name, tags });
    }
    return list;
  }, [line, profile]);

  if (!open || !line || !item) return null;

  const overridesByName = new Map(
    (line.perPersonOverrides ?? []).map((o) => [o.individual, o]),
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(20,18,15,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-[880px] max-w-full max-h-[88vh] overflow-y-auto bg-surface-raised rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 flex justify-between items-start gap-3">
          <div>
            <h2 className="text-xl font-semibold font-display text-ink">
              Customize individual orders
            </h2>
            <p className="text-[13px] text-ink-secondary mt-1">
              {line.qty} × {item.name} · profile dietary tags applied automatically
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

        <div className="mx-6 mt-4 px-3.5 py-3 rounded-xl bg-surface border border-surface-border">
          <div className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary mb-1.5 font-display">
            Group default
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(line.modifiers).map(([key, val]) => (
              <span
                key={key}
                className="text-[11px] px-2 py-0.5 rounded-md bg-surface-raised border border-surface-border-light"
              >
                <span className="text-ink-tertiary uppercase tracking-wider mr-1">
                  {key}:
                </span>
                <span className="text-ink font-medium">
                  {Array.isArray(val) ? val.join(", ") : val}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mx-6 mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase">
                <th className="text-left py-2 px-2 w-8">#</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Customizations</th>
                <th className="text-left py-2 px-2">Dietary tags</th>
                <th className="text-left py-2 px-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((seat) => {
                const override = overridesByName.get(seat.name);
                const flagged = seat.tags.length > 0;
                return (
                  <tr
                    key={seat.index}
                    className={cn(
                      "border-t border-surface-border-light",
                      flagged && "bg-warning-light/40",
                    )}
                  >
                    <td className="py-2 px-2 font-mono text-ink-tertiary">
                      {seat.index}
                    </td>
                    <td className="py-2 px-2 font-medium text-ink">
                      {seat.name}
                    </td>
                    <td className="py-2 px-2">
                      {override ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-px rounded bg-accent-purple-light text-accent-purple font-semibold">
                          <Sparkles
                            className="h-2.5 w-2.5"
                            strokeWidth={2.4}
                          />
                          {override.removed?.length
                            ? `Removed: ${override.removed.join(", ")}`
                            : "Customized"}
                          <span className="ml-1 text-ink-tertiary">
                            · {override.reason}
                          </span>
                        </span>
                      ) : (
                        <span className="italic text-ink-tertiary">
                          Group default
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {seat.tags.map((t) => {
                          const isAllergy = t.toLowerCase().includes("allergy");
                          return (
                            <span
                              key={t}
                              className={cn(
                                "text-[10px] px-1.5 py-px rounded font-semibold",
                                isAllergy
                                  ? "bg-danger-light text-danger"
                                  : "bg-warning-light text-warning",
                              )}
                            >
                              {isAllergy ? "⚠️" : "✦"} {t}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-ink-tertiary">
                      {seat.tags.includes("Tree nut allergy") && !override ? (
                        <span className="italic text-warning">
                          AI suggested: separate prep area
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="m-6 px-4 py-3.5 rounded-xl bg-brand-light border border-dashed border-brand/40">
          <div className="flex items-start gap-2">
            <span className="text-base">🤖</span>
            <div className="flex-1">
              <div className="text-xs text-ink leading-relaxed">
                <strong>AI suggests:</strong> Add &ldquo;separate prep area, no
                tree nut contamination&rdquo; to special instructions for the
                tree-nut-allergy bowl{seats.filter((s) =>
                  s.tags.includes("Tree nut allergy"),
                ).length > 1
                  ? "s"
                  : ""}
                .
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSave({ acceptAI: true })}
              className="px-3 py-1.5 rounded-md bg-brand text-ink-inverse text-xs font-semibold hover:bg-brand-dark transition-colors shrink-0"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
