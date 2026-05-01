"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";

export type TagTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const TONE_CLASSES: Record<TagTone, string> = {
  neutral: "bg-surface-border-light text-ink-secondary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  brand: "bg-brand-light text-brand-dark",
};

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: TagTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-[3px] rounded-md",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function MiniProgress({
  value,
  max,
  label,
  tone = "info",
}: {
  value: number;
  max: number;
  label?: string;
  tone?: "info" | "brand";
}) {
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;
  const fill = isOver
    ? "bg-danger"
    : tone === "brand"
      ? "bg-brand"
      : "bg-info";
  return (
    <div className="mt-1.5">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-ink-secondary">{label}</span>
          <span
            className={cn(
              "text-[11px] font-semibold font-mono",
              isOver ? "text-danger" : "text-ink",
            )}
          >
            ${value.toFixed(2)} / ${max}
          </span>
        </div>
      )}
      <div className="h-1.5 rounded-[3px] bg-surface-border-light overflow-hidden">
        <div
          className={cn("h-full rounded-[3px] transition-[width] duration-700", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const DOT_BY_PRIORITY: Record<Priority, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-ink-tertiary",
};

export function NoteItem({
  note,
  date,
  priority,
  isLast = false,
}: {
  note: string;
  date: string;
  priority: Priority;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 py-1.5",
        !isLast && "border-b border-surface-border-light",
      )}
    >
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
          DOT_BY_PRIORITY[priority],
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink leading-snug">{note}</p>
        <p className="text-[10px] text-ink-tertiary mt-px">{date}</p>
      </div>
    </div>
  );
}

export function ContextCard({
  title,
  icon,
  accent,
  defaultCollapsed = false,
  children,
}: {
  title: string;
  icon: string;
  accent?: { label: string; tone: TagTone };
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="bg-surface-raised border border-surface-border rounded-[14px] overflow-hidden shadow-xs transition-all">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "w-full flex items-center gap-2 px-3.5 py-3 hover:bg-surface transition-colors",
          !collapsed && "border-b border-surface-border-light",
        )}
      >
        <span className="text-[15px]">{icon}</span>
        <span className="flex-1 text-left text-xs font-semibold text-ink tracking-wide font-display">
          {title}
        </span>
        {accent && (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-semibold",
              TONE_CLASSES[accent.tone],
            )}
          >
            {accent.label}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-ink-tertiary transition-transform",
            collapsed && "-rotate-90",
          )}
          strokeWidth={2}
        />
      </button>
      {!collapsed && <div className="px-3.5 pt-2.5 pb-3.5">{children}</div>}
    </div>
  );
}
