"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Inline modifier picker. Renders as a pill with the current value(s); clicking
 * opens a dropdown with options. Supports single- and multi-select. Locked
 * variant disables editing and shows a small lock glyph.
 */
export function ModifierChip({
  groupName,
  value,
  options,
  multi = false,
  onChange,
  locked = false,
}: {
  groupName: string;
  value: string | string[];
  options: string[];
  multi?: boolean;
  onChange: (v: string | string[]) => void;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const display = Array.isArray(value)
    ? value.length === 0
      ? "—"
      : value.length === 1
        ? value[0]
        : `${value[0]} +${value.length - 1}`
    : value || "—";

  const toggle = (opt: string) => {
    if (multi && Array.isArray(value)) {
      const has = value.includes(opt);
      onChange(has ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange(opt);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => !locked && setOpen((o) => !o)}
        disabled={locked}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-colors",
          locked
            ? "bg-surface-border-light text-ink-tertiary border-surface-border-light cursor-not-allowed"
            : open
              ? "bg-brand-light text-brand-dark border-brand"
              : "bg-surface text-ink-secondary border-surface-border hover:border-brand",
        )}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-tertiary">
          {groupName}
        </span>
        <span className="font-medium text-ink">{display}</span>
        {locked ? (
          <span className="text-[10px]">🔒</span>
        ) : (
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
            strokeWidth={2}
          />
        )}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 min-w-[140px] bg-surface-raised border border-surface-border rounded-lg shadow-md py-1 animate-fadeIn">
          {options.map((opt) => {
            const selected = Array.isArray(value)
              ? value.includes(opt)
              : value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors",
                  selected
                    ? "bg-brand-light text-brand-dark"
                    : "hover:bg-surface text-ink",
                )}
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded grid place-items-center border",
                    selected
                      ? "bg-brand border-brand text-ink-inverse"
                      : "border-surface-border-strong",
                  )}
                >
                  {selected && <Check className="h-2 w-2" strokeWidth={3} />}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
