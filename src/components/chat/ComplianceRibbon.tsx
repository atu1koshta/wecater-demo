"use client";

import { cn } from "@/lib/cn";
import type { ContextCompliance } from "@/types";

export function ComplianceRibbon({
  compliance,
  onTap,
}: {
  compliance: ContextCompliance;
  onTap: () => void;
}) {
  const projected = compliance.projected ?? compliance.ytdSpend;
  const pct = Math.min((projected / compliance.threshold) * 100, 100);
  const willCross = projected > compliance.threshold;
  const willApproach = projected > compliance.threshold * 0.9 && !willCross;

  const colorClass = willCross ? "text-danger" : willApproach ? "text-warning" : "text-success";
  const bgClass = willCross
    ? "bg-danger-light border-danger/20"
    : willApproach
      ? "bg-warning-light border-warning/20"
      : "bg-success-light border-success/20";
  const fillClass = willCross ? "bg-danger" : willApproach ? "bg-warning" : "bg-success";
  const statusLabel = willCross ? "⚠️ Over" : willApproach ? "Tight" : "✓ Safe";

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        "lg:hidden w-full flex items-center gap-2.5 h-9 px-3.5 shrink-0 border-b text-left",
        bgClass,
      )}
    >
      <span className="text-sm">⚖️</span>
      <div className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden">
        <span className={cn("text-[11px] font-bold shrink-0", colorClass)}>
          {compliance.physician}
        </span>
        <span className="text-[11px] text-ink-secondary font-mono shrink-0">
          ${compliance.ytdSpend} → ${projected.toFixed(2)}
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden max-w-[80px] bg-current/20">
          <div className={cn("h-full rounded-full", fillClass)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={cn("text-[11px] font-semibold shrink-0 whitespace-nowrap", colorClass)}>
        {statusLabel}
      </span>
    </button>
  );
}
