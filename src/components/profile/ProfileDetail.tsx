"use client";

import { useState } from "react";
import { Pencil, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Profile, Priority, ProfileNote } from "@/types";
import { FLAG_LABELS } from "./flag-labels";
import {
  PriorityDot,
  SectionHeader,
  SourceBadge,
  StatBlock,
} from "./atoms";

const DIET_CARDS: {
  key: keyof Profile["dietary"]["breakdown"];
  label: string;
  icon: string;
  /** Tailwind class triple: text + bg + border tint when count > 0 */
  on: { text: string; bg: string; ring: string };
}[] = [
  {
    key: "vegetarian",
    label: "Vegetarian",
    icon: "🌿",
    on: { text: "text-success", bg: "bg-success-light", ring: "border-success/20" },
  },
  {
    key: "vegan",
    label: "Vegan",
    icon: "🌱",
    on: { text: "text-success", bg: "bg-success-light", ring: "border-success/20" },
  },
  {
    key: "glutenFree",
    label: "Gluten-free",
    icon: "🌾",
    on: { text: "text-warning", bg: "bg-warning-light", ring: "border-warning/20" },
  },
  {
    key: "nutAllergy",
    label: "Nut allergy",
    icon: "⚠️",
    on: { text: "text-danger", bg: "bg-danger-light", ring: "border-danger/20" },
  },
];

const PRIORITY_PILLS: { id: Priority; label: string; on: string; text: string }[] = [
  { id: "high", label: "High", on: "border-danger bg-danger-light", text: "text-danger" },
  { id: "medium", label: "Medium", on: "border-warning bg-warning-light", text: "text-warning" },
  { id: "low", label: "Low", on: "border-ink-tertiary bg-surface-border-light", text: "text-ink-tertiary" },
];

export function ProfileDetail({
  profile,
  onAddNote,
}: {
  profile: Profile;
  onAddNote: (note: ProfileNote) => void;
}) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");

  const pinned = profile.notes.find((n) => n.pinned);
  const dietPct = (n: number) =>
    profile.dietary.total ? Math.round((n / profile.dietary.total) * 100) : 0;

  const submitNote = () => {
    if (!draft.trim()) return;
    onAddNote({
      text: draft.trim(),
      date: "Apr 28",
      priority: draftPriority,
      pinned: false,
    });
    setDraft("");
    setShowAddNote(false);
  };

  return (
    <div
      key={profile.id}
      className="flex-1 md:overflow-y-auto px-5 md:px-7 py-6 animate-fadeIn"
    >
      <header className="flex items-start gap-4 mb-4">
        <div className="h-14 w-14 rounded-2xl bg-surface-raised border border-surface-border grid place-items-center text-2xl shrink-0">
          {profile.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display font-semibold text-[22px] text-ink leading-tight">
              {profile.name}
            </h1>
            {profile.flags.map((f) => {
              const flag = FLAG_LABELS[f];
              return flag ? (
                <span
                  key={f}
                  className={cn(
                    "text-[10px] px-[7px] py-0.5 rounded-xl font-semibold",
                    flag.chip,
                  )}
                >
                  {flag.label}
                </span>
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-secondary">
            <span>📍 {profile.address}</span>
            <span className="text-ink-tertiary">•</span>
            <span>
              👤 {profile.contact.name} ({profile.contact.role})
            </span>
            <span className="text-ink-tertiary">•</span>
            <span className="font-mono">{profile.contact.phone}</span>
          </div>
        </div>
        <div className="hidden sm:flex gap-1.5 shrink-0">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-surface-border bg-surface-raised text-ink-secondary text-xs flex items-center gap-1.5 hover:border-surface-border-strong transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} /> Edit
          </button>
          <button
            type="button"
            className="px-3.5 py-2 rounded-lg bg-brand text-ink-inverse text-xs font-semibold flex items-center gap-1.5 hover:bg-brand-dark transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.2} /> Order Now
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <StatBlock value={profile.headcount} label="Headcount" mono={false} />
        <StatBlock
          value={profile.frequency}
          label="Frequency"
          mono={false}
          className="text-brand"
        />
        <StatBlock value={profile.history.length} label="Total orders" />
        <StatBlock
          value={profile.dietary.people.length}
          label="Dietary flags"
          className={
            profile.dietary.people.length > 0 ? "text-warning" : "text-ink-secondary"
          }
        />
        <StatBlock value={profile.notes.length} label="Notes" />
        <StatBlock
          value={profile.competitors.length}
          label="Competitor obs."
          className="text-accent-purple"
        />
      </div>

      {pinned && (
        <div
          className={cn(
            "mt-4 px-3.5 py-3 rounded-[10px] border flex items-center gap-2.5",
            pinned.priority === "high"
              ? "bg-danger-light border-danger/30"
              : "bg-warning-light border-warning/30",
          )}
        >
          <span className="text-lg">📌</span>
          <div className="flex-1">
            <div
              className={cn(
                "text-[11px] font-semibold tracking-wider uppercase mb-0.5",
                pinned.priority === "high" ? "text-danger" : "text-warning",
              )}
            >
              Pinned reminder
            </div>
            <div className="text-[13px] text-ink font-medium">{pinned.text}</div>
          </div>
        </div>
      )}

      {/* Dietary Memory */}
      <SectionHeader
        icon="🥗"
        title="Dietary Memory"
        count={profile.dietary.people.length}
        action="+ Add restriction"
      />
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-4">
        <div className="flex flex-wrap gap-2 mb-3.5">
          {DIET_CARDS.map((d) => {
            const count = profile.dietary.breakdown[d.key];
            const on = count > 0;
            return (
              <div
                key={d.key}
                className={cn(
                  "flex-[1_1_140px] px-3 py-2.5 rounded-[10px] border",
                  on
                    ? `${d.on.bg} ${d.on.ring}`
                    : "bg-surface border-surface-border-light",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{d.icon}</span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      on ? d.on.text : "text-ink-tertiary",
                    )}
                  >
                    {d.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-lg font-bold font-mono",
                      on ? d.on.text : "text-ink-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  <span className="text-[10px] text-ink-tertiary">
                    of {profile.dietary.total} ({dietPct(count)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {profile.dietary.people.length > 0 ? (
          <div className="border-t border-surface-border-light pt-3">
            <div className="text-[10px] font-bold text-ink-tertiary mb-2 tracking-wider uppercase">
              Specific restrictions
            </div>
            {profile.dietary.people.map((person, i) => (
              <div
                key={`${person.name}-${i}`}
                className={cn(
                  "flex items-center gap-2.5 py-2",
                  i < profile.dietary.people.length - 1 &&
                    "border-b border-surface-border-light",
                )}
              >
                <PriorityDot priority={person.priority} />
                <div className="flex-1">
                  <div className="text-[13px] text-ink">
                    <strong>{person.name}</strong> — {person.restriction}
                    <SourceBadge source={person.source} />
                  </div>
                  <div className="text-[10px] text-ink-tertiary mt-px">
                    Recorded {person.learned}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 text-[11px] text-ink-tertiary hover:text-ink transition-colors"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t border-surface-border-light mt-1 py-5 text-center text-ink-tertiary text-xs">
            No specific restrictions recorded yet. The chatbot will ask Tina at the next visit.
          </div>
        )}
      </div>

      {/* Compliance */}
      {profile.physicians.length > 0 && (
        <>
          <SectionHeader
            icon="📋"
            title="Open Payments Compliance"
            count={profile.physicians.length}
          />
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-4">
            {profile.physicians.map((phys, i) => {
              const pct = (phys.ytd / phys.threshold) * 100;
              const remaining = phys.threshold - phys.ytd;
              const danger = pct > 90;
              const warning = !danger && pct > 70;
              const tone = danger
                ? "text-danger"
                : warning
                  ? "text-warning"
                  : "text-success";
              const bar = danger
                ? "bg-danger"
                : warning
                  ? "bg-warning"
                  : "bg-success";
              return (
                <div
                  key={phys.npi}
                  className={cn(i < profile.physicians.length - 1 && "mb-4")}
                >
                  <div className="flex justify-between items-baseline mb-1.5 gap-3 flex-wrap">
                    <div>
                      <span className="text-[13px] font-semibold text-ink">
                        {phys.name}
                      </span>
                      <span className="text-[10px] text-ink-tertiary ml-2 font-mono">
                        NPI {phys.npi}
                      </span>
                    </div>
                    <span className={cn("text-[11px] font-semibold font-mono", tone)}>
                      ${phys.ytd.toFixed(2)} / ${phys.threshold}{" "}
                      <span className="text-ink-tertiary font-medium">YTD</span>
                    </span>
                  </div>
                  <div className="h-2 rounded bg-surface-border-light overflow-hidden relative">
                    <div
                      className={cn("h-full rounded transition-[width] duration-500", bar)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-tertiary mt-1">
                    ${remaining.toFixed(2)} remaining before $100 de minimis threshold
                    {danger
                      ? " — ⚠️ very close"
                      : warning
                        ? " — heads up"
                        : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Notes */}
      <SectionHeader
        icon="📝"
        title="Relationship Notes"
        count={profile.notes.length}
        action={showAddNote ? "Cancel" : "+ Add note"}
        onAction={() => setShowAddNote((s) => !s)}
      />
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-4">
        {showAddNote && (
          <div className="mb-3 p-2.5 bg-surface rounded-[10px] border border-dashed border-surface-border animate-fadeIn">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNote();
              }}
              placeholder="Add a note… e.g., 'Office prefers pickup over delivery'"
              className="w-full px-2 py-1.5 bg-transparent text-[13px] text-ink mb-2 placeholder:text-ink-tertiary"
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-1.5">
                {PRIORITY_PILLS.map((p) => {
                  const on = draftPriority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDraftPriority(p.id)}
                      className={cn(
                        "px-2.5 py-[3px] rounded-xl text-[10px] font-semibold border transition-all",
                        on
                          ? `${p.on} ${p.text}`
                          : `border-transparent bg-surface-raised ${p.text}`,
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={submitNote}
                disabled={!draft.trim()}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors",
                  draft.trim()
                    ? "bg-brand text-ink-inverse hover:bg-brand-dark cursor-pointer"
                    : "bg-surface-border text-ink-inverse cursor-not-allowed",
                )}
              >
                Save note
              </button>
            </div>
          </div>
        )}

        {profile.notes.length > 0 ? (
          profile.notes.map((n, i) => (
            <div
              key={`${n.text}-${i}`}
              className={cn(
                "flex items-start gap-2.5 py-2.5",
                i < profile.notes.length - 1 && "border-b border-surface-border-light",
              )}
            >
              {n.pinned ? (
                <span className="text-xs mt-0.5">📌</span>
              ) : (
                <PriorityDot priority={n.priority} />
              )}
              <div className="flex-1">
                <p className="text-[13px] text-ink leading-relaxed">{n.text}</p>
                <span className="text-[10px] text-ink-tertiary mt-1 inline-block">
                  {n.date}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-2.5 text-center text-ink-tertiary text-xs">
            No notes yet.
          </div>
        )}
      </div>

      {/* Order History */}
      {profile.history.length > 0 && (
        <>
          <SectionHeader
            icon="📋"
            title="Order History"
            count={profile.history.length}
            action="View all"
          />
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-1">
            {profile.history.map((o, i) => (
              <div
                key={`${o.date}-${o.restaurant}`}
                className={cn(
                  "grid grid-cols-[60px_1fr_84px_72px] items-center px-3.5 py-2.5",
                  i < profile.history.length - 1 && "border-b border-surface-border-light",
                )}
              >
                <span className="text-[11px] text-ink-tertiary font-mono">{o.date}</span>
                <div>
                  <div className="text-[13px] font-medium text-ink">{o.restaurant}</div>
                  <div className="text-[10px] text-ink-tertiary">{o.cuisine}</div>
                </div>
                <span className="text-[11px] text-ink-tertiary font-mono">
                  ${o.perPp.toFixed(2)}/pp
                </span>
                <span className="text-[13px] font-semibold text-ink font-mono text-right">
                  ${o.amount}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Competitor Activity */}
      {profile.competitors.length > 0 && (
        <>
          <SectionHeader
            icon="🕵️"
            title="Competitor Activity"
            count={profile.competitors.length}
          />
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-4">
            <div className="text-[11px] text-ink-secondary mb-2.5 leading-relaxed">
              Other reps observed at this office. The chatbot uses this to suggest
              differentiated cuisines.
            </div>
            {profile.competitors.map((c, i) => (
              <div
                key={`${c.rep}-${c.date}`}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 bg-accent-purple-light rounded-lg",
                  i < profile.competitors.length - 1 && "mb-1.5",
                )}
              >
                <div>
                  <span className="text-[13px] font-medium text-ink">{c.rep}</span>
                  <span className="text-xs text-ink-secondary ml-1.5">
                    brought <strong>{c.brought}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-accent-purple font-mono font-semibold">
                  {c.date}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h-10" />
    </div>
  );
}
