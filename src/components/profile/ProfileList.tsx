"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";
import { FLAG_LABELS } from "./flag-labels";

export type ListFilter = "all" | "active" | "compliance_warning" | "incomplete";
export type ListSort = "recent" | "alphabetical" | "headcount";

const FILTERS: { id: ListFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "🔥 Active" },
  { id: "compliance_warning", label: "⚠️ Compliance" },
  { id: "incomplete", label: "✨ New" },
];

export function ProfileList({
  profiles,
  activeId,
  search,
  filter,
  sort,
  onSelect,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: {
  profiles: Profile[];
  activeId: string;
  search: string;
  filter: ListFilter;
  sort: ListSort;
  onSelect: (id: string) => void;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: ListFilter) => void;
  onSortChange: (s: ListSort) => void;
}) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-surface-raised md:border-r md:border-surface-border",
        "md:w-[280px] xl:w-[320px] md:shrink-0",
        "md:h-full md:overflow-hidden",
      )}
    >
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-surface-border-light">
        <div className="relative mb-2.5">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-tertiary"
            strokeWidth={1.6}
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 6 profiles…"
            className="w-full pl-[33px] pr-2.5 py-2 rounded-lg border border-surface-border bg-surface text-xs text-ink placeholder:text-ink-tertiary focus:border-brand transition-colors"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all",
                filter === f.id
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-surface-border bg-surface-raised text-ink-secondary hover:border-surface-border-strong",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 md:overflow-y-auto">
        {profiles.length === 0 ? (
          <div className="px-7 py-8 text-center text-ink-tertiary text-xs">
            No profiles match.
          </div>
        ) : (
          profiles.map((p) => (
            <ProfileListItem
              key={p.id}
              profile={p}
              active={p.id === activeId}
              onClick={() => onSelect(p.id)}
            />
          ))
        )}
      </div>

      <div className="px-3.5 py-2.5 border-t border-surface-border-light flex items-center gap-2">
        <span className="text-[10px] text-ink-tertiary font-semibold tracking-wider uppercase">
          Sort
        </span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ListSort)}
          className="flex-1 px-2 py-1 rounded-md border border-surface-border bg-surface text-[11px] text-ink-secondary cursor-pointer"
        >
          <option value="recent">Recent activity</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="headcount">Headcount</option>
        </select>
      </div>
    </aside>
  );
}

function ProfileListItem({
  profile,
  active,
  onClick,
}: {
  profile: Profile;
  active: boolean;
  onClick: () => void;
}) {
  const flagId = profile.flags[0];
  const flag = flagId ? FLAG_LABELS[flagId] : null;
  const breakdown = profile.dietary.breakdown;
  const totalRestrictions =
    breakdown.vegetarian +
    breakdown.vegan +
    breakdown.glutenFree +
    breakdown.nutAllergy;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3.5 py-3 border-b border-surface-border-light transition-colors",
        "border-l-[3px]",
        active
          ? "bg-brand-light border-l-brand"
          : "border-l-transparent hover:bg-surface",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "h-9 w-9 rounded-[10px] shrink-0 grid place-items-center text-lg border",
            active
              ? "bg-surface-raised border-brand"
              : "bg-surface border-surface-border",
          )}
        >
          {profile.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5 gap-2">
            <span className="text-[13px] font-semibold text-ink truncate">
              {profile.name}
            </span>
            <span className="text-[10px] text-ink-tertiary font-mono shrink-0">
              {profile.headcount}p
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] text-ink-secondary">
              {profile.frequency}
            </span>
            {totalRestrictions > 0 && (
              <>
                <span className="text-[9px] text-ink-tertiary">•</span>
                <span className="text-[10px] text-ink-secondary">
                  {totalRestrictions} dietary
                </span>
              </>
            )}
          </div>
          {flag && (
            <span
              className={cn(
                "inline-block text-[9px] px-1.5 py-px rounded font-semibold",
                flag.chip,
              )}
            >
              {flag.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
