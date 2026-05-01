"use client";

import { Sparkles, Check, X } from "lucide-react";

export type NLPreviewLine =
  | { kind: "add"; text: string }
  | { kind: "remove"; text: string }
  | { kind: "change"; text: string };

export type NLPreview = {
  /** What the user just said in natural language. */
  command: string;
  /** Bullet diff lines explaining what would happen. */
  changes: NLPreviewLine[];
  /** Net cost impact, e.g. "+$8.50" or "-$3.00" */
  netCost?: string;
  /** Net Bites impact, e.g. "+85 Bites" */
  netBites?: string;
  /** Dietary note, e.g. "Keto ✓" */
  dietary?: string;
};

/**
 * Banner that appears above the cart when the AI proposes changes from a NL
 * edit ("Swap 2 wraps to falafel"). User clicks Accept to commit / Reject to
 * dismiss. Hidden when no preview is pending.
 */
export function NLEditPreview({
  preview,
  onAccept,
  onReject,
}: {
  preview: NLPreview | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!preview) return null;
  return (
    <div className="px-4 py-3 rounded-2xl border-[1.5px] border-brand bg-gradient-to-br from-brand-light to-surface-raised animate-fadeIn">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-brand" strokeWidth={2.4} />
        <span className="text-[11px] font-bold text-brand tracking-wider uppercase font-display">
          AI proposed change
        </span>
      </div>
      <div className="text-xs text-ink-secondary mb-2 italic">
        &ldquo;{preview.command}&rdquo;
      </div>
      <div className="flex flex-col gap-1 mb-3">
        {preview.changes.map((c, i) => {
          const symbol =
            c.kind === "add" ? "+" : c.kind === "remove" ? "−" : "→";
          const tone =
            c.kind === "add"
              ? "text-success"
              : c.kind === "remove"
                ? "text-danger"
                : "text-info";
          return (
            <div key={i} className="flex gap-2 text-xs">
              <span className={`font-mono font-bold ${tone}`}>{symbol}</span>
              <span className="text-ink leading-snug">{c.text}</span>
            </div>
          );
        })}
      </div>
      {(preview.netCost || preview.netBites || preview.dietary) && (
        <div className="grid grid-cols-3 gap-2 mb-3 px-0.5">
          {preview.netCost && (
            <div className="px-2.5 py-2 rounded-lg bg-surface text-center">
              <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-bold mb-0.5">Cost</div>
              <div className="text-[12px] font-mono font-semibold text-ink">{preview.netCost}</div>
            </div>
          )}
          {preview.netBites && (
            <div className="px-2.5 py-2 rounded-lg bg-surface text-center">
              <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-bold mb-0.5">Bites</div>
              <div className="text-[12px] font-mono font-semibold text-brand">{preview.netBites}</div>
            </div>
          )}
          {preview.dietary && (
            <div className="px-2.5 py-2 rounded-lg bg-surface text-center">
              <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-bold mb-0.5">Dietary</div>
              <div className="text-[12px] font-semibold text-success">{preview.dietary}</div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onReject}
          className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-raised text-ink-secondary text-xs font-medium flex items-center gap-1 hover:border-surface-border-strong transition-colors"
        >
          <X className="h-3 w-3" strokeWidth={2.4} />
          Reject
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="px-3 py-1.5 rounded-lg bg-brand text-ink-inverse text-xs font-semibold flex items-center gap-1 hover:bg-brand-dark transition-colors"
        >
          <Check className="h-3 w-3" strokeWidth={2.6} />
          Accept changes
        </button>
      </div>
    </div>
  );
}
