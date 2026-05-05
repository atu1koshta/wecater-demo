"use client";

import { useEffect, useRef } from "react";
import type { OrderContext } from "@/types";
import {
  BudgetCard,
  CompetitorCard,
  DietaryCard,
  NotesCard,
  OrdersCard,
  ProfileCard,
  RewardsCard,
  VarietyCard,
} from "./context-cards";

const SECTION_ID: Record<string, string> = {
  rewards: "ms-rewards",
  dietary: "ms-dietary",
  budget: "ms-budget",
  profile: "ms-profile",
  notes: "ms-notes",
  history: "ms-history",
};

export function MobileBottomSheet({
  open,
  context,
  scrollTo,
  onClose,
}: {
  open: boolean;
  context: OrderContext;
  scrollTo: string | null;
  onClose: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !scrollTo) return;
    const id = SECTION_ID[scrollTo];
    if (!id) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [open, scrollTo]);

  if (!open) return null;

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[50] bg-black/45 animate-fadeIn"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[51] flex flex-col bg-surface-raised rounded-t-[28px] shadow-2xl overflow-hidden animate-slideUp"
        style={{ height: "78dvh" }}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-surface-border" />
        </div>
        {/* Header */}
        <div className="px-4 pb-3 flex items-center justify-between shrink-0">
          <span className="text-base font-bold text-ink font-display">Active context</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center text-ink-secondary text-sm hover:bg-surface-border transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Scrollable content */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 flex flex-col gap-2.5"
        >
          {context.rewards && (
            <div id="ms-rewards">
              <RewardsCard rewards={context.rewards} />
            </div>
          )}
          {context.activeProfile && (
            <div id="ms-profile">
              <ProfileCard profile={context.activeProfile} />
            </div>
          )}
          {context.dietary && (
            <div id="ms-dietary">
              <DietaryCard dietary={context.dietary} />
            </div>
          )}
          {context.budget && (
            <div id="ms-budget">
              <BudgetCard budget={context.budget} />
            </div>
          )}
          {context.variety && (
            <div id="ms-variety">
              <VarietyCard variety={context.variety} />
            </div>
          )}
          {context.competitorIntel && context.competitorIntel.length > 0 && (
            <div id="ms-competitor">
              <CompetitorCard intel={context.competitorIntel} />
            </div>
          )}
          {context.relationshipNotes && context.relationshipNotes.length > 0 && (
            <div id="ms-notes">
              <NotesCard notes={context.relationshipNotes} />
            </div>
          )}
          {context.recentOrders && context.recentOrders.length > 0 && (
            <div id="ms-history">
              <OrdersCard orders={context.recentOrders} />
            </div>
          )}
          {/* Tip */}
          <div className="p-3 rounded-xl bg-brand-light border border-dashed border-brand/30 mt-1">
            <div className="text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5">
              💡 Did you know?
            </div>
            <div className="text-[11px] text-ink-secondary leading-relaxed">
              Tap any chip above the input to jump straight to that section. The AI updates context as you chat.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
