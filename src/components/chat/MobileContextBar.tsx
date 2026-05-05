"use client";

import { cn } from "@/lib/cn";
import type { OrderContext } from "@/types";

export function MobileContextBar({
  context,
  onChipTap,
}: {
  context: OrderContext;
  onChipTap: (section: string) => void;
}) {
  const { dietary, budget, rewards } = context;
  const hasAny = Object.values(context).some((v) => v != null);
  if (!hasAny) return null;

  const dietaryCovered = dietary
    ? [dietary.vegetarian, dietary.vegan, dietary.glutenFree, dietary.nutAllergy].filter(
        (n) => n > 0,
      ).length
    : 0;

  const isOverBudget =
    budget?.compliance?.thisOrder != null &&
    budget.compliance.thisOrder > budget.perPerson;

  return (
    <div className="lg:hidden shrink-0 bg-surface-raised border-t border-surface-border-light">
      <div
        className="flex gap-1.5 overflow-x-auto px-3 py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {rewards && (
          <ContextChip
            icon="🪙"
            label="Bites"
            value={`${(rewards.balance / 1000).toFixed(1)}K`}
            valueClass="text-brand"
            onTap={() => onChipTap("rewards")}
          />
        )}
        {dietary && (
          <ContextChip
            icon="🥗"
            label="Diet"
            value={`${dietaryCovered}/4`}
            valueClass="text-success"
            onTap={() => onChipTap("dietary")}
          />
        )}
        {budget && (
          <ContextChip
            icon="💵"
            label="Budget"
            value={`$${budget.compliance?.thisOrder?.toFixed(0) ?? budget.perPerson}/$${budget.perPerson}`}
            valueClass={isOverBudget ? "text-danger" : "text-ink"}
            onTap={() => onChipTap("budget")}
          />
        )}
        {rewards?.welcomeActive && (
          <ContextChip
            icon="🎁"
            label="Welcome 2X"
            value={`${rewards.welcomeDaysLeft}d`}
            valueClass="text-brand"
            urgent
            onTap={() => onChipTap("rewards")}
          />
        )}
      </div>
    </div>
  );
}

function ContextChip({
  icon,
  label,
  value,
  valueClass,
  urgent,
  onTap,
}: {
  icon: string;
  label: string;
  value: string;
  valueClass: string;
  urgent?: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] whitespace-nowrap transition-all active:scale-95",
        urgent ? "bg-brand-light border-brand/30" : "bg-surface border-surface-border",
      )}
    >
      <span className="text-xs">{icon}</span>
      <span className="text-ink-tertiary font-medium">{label}</span>
      <span className={cn("font-bold font-mono", valueClass)}>{value}</span>
    </button>
  );
}
