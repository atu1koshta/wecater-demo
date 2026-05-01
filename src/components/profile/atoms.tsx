import { cn } from "@/lib/cn";
import type { Priority, DietarySource } from "@/types";

export function StatBlock({
  value,
  label,
  className,
  mono = true,
}: {
  value: React.ReactNode;
  label: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex-1 px-3 py-2.5 bg-surface rounded-[10px] text-center">
      <div
        className={cn(
          "text-xl font-bold leading-tight",
          mono ? "font-mono" : "font-display",
          className,
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-ink-tertiary mt-[3px] tracking-wider uppercase font-semibold">
        {label}
      </div>
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  count,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-5 mb-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold text-ink font-display tracking-wide uppercase">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] px-[7px] py-[2px] rounded-[10px] bg-surface-border-light text-ink-secondary font-semibold">
            {count}
          </span>
        )}
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

export function SourceBadge({ source }: { source: DietarySource }) {
  const isExplicit = source === "explicit";
  return (
    <span
      className={cn(
        "text-[9px] font-bold ml-1.5 px-1.5 py-px rounded tracking-wider uppercase",
        isExplicit
          ? "bg-brand-light text-brand-dark"
          : "bg-surface-border-light text-ink-tertiary",
      )}
    >
      {isExplicit ? "Told" : "Learned"}
    </span>
  );
}

const DOT_BY_PRIORITY: Record<Priority, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-ink-tertiary",
};

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <div
      className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        DOT_BY_PRIORITY[priority],
      )}
    />
  );
}
