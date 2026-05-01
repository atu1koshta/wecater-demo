"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { BitesModifier, ChipColor } from "./math";

export function CountUp({
  value,
  duration = 800,
  format = (v: number) => Math.round(v).toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{format(display)}</span>;
}

const COLOR_CHIP: Record<ChipColor, { bg: string; text: string; ring: string }> = {
  ink: { bg: "bg-ink/10", text: "text-ink", ring: "border-ink/20" },
  brand: { bg: "bg-brand/10", text: "text-brand", ring: "border-brand/20" },
  purple: {
    bg: "bg-accent-purple/10",
    text: "text-accent-purple",
    ring: "border-accent-purple/20",
  },
  danger: { bg: "bg-danger/10", text: "text-danger", ring: "border-danger/20" },
};

/**
 * Multiplier breakdown chip used inside the OptionCard "You'll earn" panel.
 * Animates in with a slight overshoot, staggered by `delay` ms.
 */
export function MultiplierChip({
  modifier,
  delayMs = 0,
}: {
  modifier: BitesModifier;
  delayMs?: number;
}) {
  const c = COLOR_CHIP[modifier.color];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border animate-chipIn",
        c.bg,
        c.ring,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="text-[13px]">{modifier.icon}</span>
      <span className={cn("text-[11px] font-semibold", c.text)}>
        {modifier.label}
      </span>
      {modifier.bites > 0 && (
        <span className={cn("text-[11px] font-bold font-mono", c.text)}>
          +{modifier.bites.toLocaleString()}
        </span>
      )}
    </div>
  );
}

/**
 * Animated cascade visualizing the AI's funnel from the universe (1,247) to
 * the final shortlist. Plays once on mount.
 */
export function FunnelCascade() {
  const stages = [
    { label: "Scanning Phoenix catering partners", value: "1,247", duration: 200 },
    {
      label: "Deliver to 4530 E Shea Blvd Tuesday at noon",
      value: "312",
      duration: 280,
    },
    { label: "Can serve 14 people in your time window", value: "89", duration: 280 },
    { label: "Cover all 7 dietary restrictions", value: "47", duration: 280 },
    { label: "Ranking by Smart score", value: "Top 3", duration: 240 },
  ];

  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= stages.length) return;
    const t = window.setTimeout(
      () => setStage((s) => s + 1),
      stages[stage].duration,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <div className="flex flex-col gap-1.5">
      {stages.slice(0, stage + 1).map((s, i) => {
        const isLast = i === stages.length - 1;
        const isActive = isLast && stage >= i;
        const dimmed = stage > i;
        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 animate-fadeIn",
              dimmed && "opacity-55",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-bold font-mono min-w-[50px] text-right",
                isActive ? "text-brand" : "text-ink-tertiary",
              )}
            >
              {i === 0 ? "" : "→ "}
              {s.value}
            </span>
            <span
              className={cn(
                "text-xs",
                isActive ? "text-ink font-semibold" : "text-ink-secondary",
              )}
            >
              {s.label}
            </span>
            {stage === i && i < stages.length - 1 && (
              <span className="flex gap-0.5 ml-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-[3px] w-[3px] rounded-full bg-brand"
                    style={{
                      animation: `pulse-dot 0.8s ${d * 0.15}s infinite`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>
        );
      })}
      <style jsx>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/** "What Smart mode was hiding" callout shown after the /maximize bites turn. */
export function HiddenInsight() {
  return (
    <div className="mt-2.5 px-3.5 py-3 rounded-xl border border-dashed border-brand/40 bg-gradient-to-br from-brand/5 to-accent-purple/5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">🔍</span>
        <span className="text-[11px] font-bold text-brand tracking-wider uppercase font-display">
          What Smart mode was hiding
        </span>
      </div>
      <p className="text-xs text-ink-secondary leading-relaxed mb-1.5">
        <strong className="text-ink">True Food Kitchen</strong> is running a flash 12X
        promo today only. Smart mode demoted it because it&apos;s not a perfect
        compliance fit (Dr. Patel&apos;s YTD would jump from $68 → $91, still safe
        but tight).
      </p>
      <p className="text-xs text-ink-secondary leading-relaxed">
        For Max Bites, it&apos;s the clear winner.{" "}
        <strong className="text-ink">2,722 Bites</strong> earned (+450 vs Pita
        Jungle, +1,480 vs Smart&apos;s top pick).
      </p>
    </div>
  );
}
