import type { ProfileFlag } from "@/types";

/**
 * Display metadata for each ProfileFlag — Tailwind classes for background,
 * border tint, and text color so chips render the same in the list, the hero,
 * and the filter pill row.
 */
export type FlagDisplay = {
  label: string;
  /** bg + text classes used for chips */
  chip: string;
};

export const FLAG_LABELS: Record<ProfileFlag, FlagDisplay> = {
  compliance_warning: {
    label: "⚠️ Compliance",
    chip: "bg-warning-light text-warning",
  },
  compliance_safe: {
    label: "✓ Compliant",
    chip: "bg-success-light text-success",
  },
  active_relationship: {
    label: "🔥 Active",
    chip: "bg-brand-light text-brand-dark",
  },
  high_volume: {
    label: "📊 High Volume",
    chip: "bg-accent-purple-light text-accent-purple",
  },
  large_team: {
    label: "👥 Large Team",
    chip: "bg-info-light text-info",
  },
  new_relationship: {
    label: "✨ New",
    chip: "bg-accent-purple-light text-accent-purple",
  },
  incomplete_profile: {
    label: "⚡ Incomplete",
    chip: "bg-warning-light text-warning",
  },
  dormant: {
    label: "💤 Dormant",
    chip: "bg-surface-border-light text-ink-tertiary",
  },
};
