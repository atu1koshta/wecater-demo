export type OptimizerMode =
  | "smart"
  | "max_bites"
  | "max_discount"
  | "speed"
  | "compliance";

/** Special pseudo-mode used by the demo's "compare what we've seen" turn. */
export type DemoMode = OptimizerMode | "compare";

export type ModeMeta = {
  id: OptimizerMode;
  icon: string;
  label: string;
  desc: string;
};

export const MODES: ModeMeta[] = [
  { id: "smart", icon: "🤖", label: "Smart", desc: "Balanced across all factors" },
  { id: "max_bites", icon: "💎", label: "Max Bites", desc: "Earn the most points" },
  {
    id: "max_discount",
    icon: "💸",
    label: "Max Discount",
    desc: "Use Bites you already have",
  },
  { id: "speed", icon: "⚡", label: "Same-Day", desc: "Available right now" },
  {
    id: "compliance",
    icon: "🛡️",
    label: "Compliance Safe",
    desc: "Stay under physician threshold",
  },
];

export function getMode(id: OptimizerMode): ModeMeta {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}
