"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const GROUPS: { title: string; icon: string; examples: string[] }[] = [
  {
    title: "Adjust the order",
    icon: "🎯",
    examples: [
      "Make it more keto",
      "Add more variety",
      "Stay under $200 total",
      "Less dairy",
    ],
  },
  {
    title: "Bulk swaps",
    icon: "🔁",
    examples: [
      "Swap 3 chicken for vegetarian",
      "Remove all sides",
      "Replace bowls with wraps",
    ],
  },
  {
    title: "Add or remove",
    icon: "✨",
    examples: ["Add desserts", "Add gluten-free option", "Skip the drinks"],
  },
  {
    title: "Switch context",
    icon: "↔️",
    examples: [
      "Try Barrio Queen instead",
      "Build cart at another restaurant",
      "Compare with Mexican",
    ],
  },
];

/** Right-side slide panel showing example NL prompts grouped by intent. */
export function WhatCanIAskPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-[90] w-[380px] max-w-full bg-surface-raised border-l border-surface-border shadow-[-8px_0_32px_rgba(0,0,0,0.08)] transform transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}
      aria-hidden={!open}
    >
      <div className="px-5 py-4 border-b border-surface-border flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold font-display text-ink">
            What can I ask?
          </h3>
          <p className="text-[11px] text-ink-tertiary leading-snug mt-0.5">
            Chat handles intent · UI handles direct edits
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

      <div className="p-5 overflow-y-auto h-[calc(100%-72px)]">
        <div className="px-3.5 py-3 rounded-xl bg-brand-light border border-dashed border-brand/40 mb-5">
          <div className="text-[11px] font-semibold text-brand-dark mb-1">
            Rule of thumb
          </div>
          <div className="text-[11px] text-ink-secondary leading-relaxed">
            If you&apos;d need 5+ clicks in the UI to express it, type it. If
            it&apos;s one specific change, the UI is faster.
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{g.icon}</span>
                <span className="text-[11px] font-bold text-ink tracking-wider uppercase font-display">
                  {g.title}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {g.examples.map((ex) => (
                  <div
                    key={ex}
                    className="px-3 py-2 rounded-md bg-surface text-[12px] text-ink-secondary font-mono"
                  >
                    &ldquo;{ex}&rdquo;
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
