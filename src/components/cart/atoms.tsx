"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Persona } from "@/types";

export function CountUp({
  value,
  duration = 700,
  format = (v: number) => Math.round(v).toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{format(display)}</span>;
}

export function Bar({
  pct,
  fillClass,
  bgClass = "bg-surface-border-light",
  height = 6,
}: {
  pct: number;
  fillClass: string;
  bgClass?: string;
  height?: number;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div
      className={cn("rounded-full overflow-hidden", bgClass)}
      style={{ height }}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          fillClass,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const PERSONA_OPTS: { id: Persona; icon: string; label: string }[] = [
  { id: "ea", icon: "📋", label: "EA" },
  { id: "pharma", icon: "🏥", label: "Pharma rep" },
];

/** Two-state segmented toggle: EA / Pharma rep. */
export function PersonaToggle({
  persona,
  onChange,
}: {
  persona: Persona;
  onChange: (p: Persona) => void;
}) {
  return (
    <div className="flex p-[3px] bg-surface rounded-lg border border-surface-border">
      {PERSONA_OPTS.map((opt) => {
        const on = persona === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-3 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all whitespace-nowrap",
              on
                ? "bg-surface-raised text-ink shadow-xs"
                : "bg-transparent text-ink-tertiary hover:text-ink",
            )}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
