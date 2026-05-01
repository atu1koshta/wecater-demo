"use client";

import { MessageCircle } from "lucide-react";
import type { Profile } from "@/types";
import { FALLBACK_INSIGHT, getInsightForProfile } from "./ai-insights";

const QUICK_ACTIONS = [
  { icon: "🔁", label: "Reorder last", buildDesc: (p: Profile) =>
      p.lastOrder ? `${p.lastOrder.restaurant} · $${p.lastOrder.amount}` : "No previous orders" },
  { icon: "📐", label: "Save as template", buildDesc: () => "Reusable order with variables" },
  { icon: "🔄", label: "Switch context", buildDesc: () => "Change to another office" },
  { icon: "📤", label: "Transfer profile", buildDesc: () => "Hand off to another rep" },
  { icon: "📥", label: "Export profile", buildDesc: () => "Download as CSV" },
];

export function ProfileSidekick({ profile }: { profile: Profile }) {
  const insight = getInsightForProfile(profile.id);
  const explicit = profile.dietary.people.filter((p) => p.source === "explicit").length;
  const implicit = profile.dietary.people.filter((p) => p.source === "implicit").length;

  return (
    <aside className="hidden xl:flex xl:w-[300px] xl:shrink-0 flex-col bg-surface border-l border-surface-border xl:h-full xl:overflow-y-auto p-4">
      <span className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display">
        Next Steps
      </span>

      {profile.nextScheduled && (
        <div className="mt-3 p-3.5 bg-brand-light rounded-xl border border-brand/20">
          <div className="text-[10px] font-bold text-brand tracking-wider uppercase mb-1">
            Upcoming
          </div>
          <div className="text-sm font-semibold text-ink font-display mb-2">
            {profile.nextScheduled}
          </div>
          <button
            type="button"
            className="w-full py-2 rounded-lg bg-brand text-ink-inverse text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-dark transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.2} /> Plan this order
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1.5">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] border border-surface-border bg-surface-raised text-left hover:border-brand hover:bg-brand-light/40 transition-colors"
          >
            <span className="text-base">{a.icon}</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-ink">{a.label}</div>
              <div className="text-[10px] text-ink-tertiary mt-px">
                {a.buildDesc(profile)}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <span className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display">
          AI Insights
        </span>
        <div className="mt-2.5 p-3 bg-surface-raised rounded-[10px] border border-surface-border">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-[18px] w-[18px] rounded-[5px] bg-gradient-to-br from-brand to-brand-dark grid place-items-center">
              <span className="text-ink-inverse text-[9px] font-bold font-display">W</span>
            </div>
            <span className="text-[11px] font-semibold text-ink">
              Concierge has noticed:
            </span>
          </div>
          <div className="text-xs text-ink-secondary leading-relaxed">
            {insight ?? FALLBACK_INSIGHT}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-surface-raised rounded-[10px] border border-surface-border">
        <div className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase mb-2">
          Memory bank
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-ink-tertiary">Explicit</div>
            <div className="font-semibold text-ink font-mono text-sm">{explicit}</div>
          </div>
          <div>
            <div className="text-ink-tertiary">Learned</div>
            <div className="font-semibold text-ink font-mono text-sm">{implicit}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
