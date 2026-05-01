"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Animated count-up for the hero number — eases in from 0 to `value`. */
export function CountUp({
  value,
  duration = 1200,
  format = (v: number) => Math.floor(v).toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf = 0;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{format(display)}</span>;
}

/**
 * Inline modifier chip used in the recent activity rows. `tone` controls the
 * color: brand for Welcome, purple for Same-Day/Flash, ink for the base rate.
 */
export type ChipTone = "brand" | "purple" | "ink";

export function ModifierChip({
  label,
  bites,
  tone = "brand",
}: {
  label: string;
  bites: number;
  tone?: ChipTone;
}) {
  const toneClass: Record<ChipTone, string> = {
    brand: "bg-brand/10 text-brand",
    purple: "bg-accent-purple/10 text-accent-purple",
    ink: "bg-ink/10 text-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-[7px] py-0.5 rounded",
        toneClass[tone],
      )}
    >
      ✨ {label}{" "}
      <span className="font-mono font-bold">+{Math.round(bites).toLocaleString()}</span>
    </span>
  );
}

/** Lightweight section label used across the wallet sections. */
export function SectionHeader({
  icon,
  title,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold text-ink font-display tracking-wide uppercase">
          {title}
        </span>
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="text-[11px] text-brand font-semibold hover:text-brand-dark transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/** Radio dot used inside the redemption route buttons. */
export function RouteRadio({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "w-[18px] h-[18px] rounded-full border-2 relative shrink-0 transition-colors",
        selected ? "border-brand" : "border-surface-border",
      )}
    >
      {selected && (
        <div className="absolute inset-[3px] rounded-full bg-brand" />
      )}
    </div>
  );
}
