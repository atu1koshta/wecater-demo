"use client";

import { cn } from "@/lib/cn";
import type { OrderContext } from "@/types";
import {
  BudgetCard,
  CartOptionsCard,
  CompetitorCard,
  DietaryCard,
  NotesCard,
  OrderStatusBanner,
  OrdersCard,
  ProfileCard,
  RewardsCard,
  VarietyCard,
} from "./context-cards";

export function ContextPanel({
  context,
  animatingKeys,
  open,
}: {
  context: OrderContext;
  animatingKeys: Set<string>;
  open: boolean;
}) {
  if (!open) return null;

  const activeCount = Object.keys(context).filter((k) => {
    const v = context[k as keyof OrderContext];
    return v !== undefined && v !== null;
  }).length;

  const hasContext = activeCount > 0;

  return (
    <aside className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-surface-border bg-surface overflow-y-auto p-3.5 gap-2.5 animate-slideInRight">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display">
          Live Context
        </span>
        {hasContext && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-light text-success font-semibold">
            {activeCount} active
          </span>
        )}
      </div>

      {!hasContext && (
        <div className="text-center py-10 px-4">
          <div className="h-10 w-10 rounded-xl bg-surface-border-light mx-auto mb-3 grid place-items-center text-ink-tertiary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle
                cx="9"
                cy="9"
                r="7.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            </svg>
          </div>
          <p className="text-xs text-ink-tertiary leading-relaxed">
            Context cards will appear here as you chat. Start by telling me who the
            order is for.
          </p>
        </div>
      )}

      {context.activeProfile && (
        <Animated keyName="activeProfile" animating={animatingKeys}>
          <ProfileCard profile={context.activeProfile} />
        </Animated>
      )}
      {context.dietary && (
        <Animated keyName="dietary" animating={animatingKeys}>
          <DietaryCard dietary={context.dietary} />
        </Animated>
      )}
      {context.budget && (
        <Animated keyName="budget" animating={animatingKeys}>
          <BudgetCard budget={context.budget} />
        </Animated>
      )}
      {context.rewards && (
        <Animated keyName="rewards" animating={animatingKeys}>
          <RewardsCard rewards={context.rewards} />
        </Animated>
      )}
      {context.variety && (
        <Animated keyName="variety" animating={animatingKeys}>
          <VarietyCard variety={context.variety} />
        </Animated>
      )}
      {context.competitorIntel && context.competitorIntel.length > 0 && (
        <Animated keyName="competitorIntel" animating={animatingKeys}>
          <CompetitorCard intel={context.competitorIntel} />
        </Animated>
      )}
      {context.relationshipNotes && context.relationshipNotes.length > 0 && (
        <Animated keyName="relationshipNotes" animating={animatingKeys}>
          <NotesCard notes={context.relationshipNotes} />
        </Animated>
      )}
      {context.recentOrders && context.recentOrders.length > 0 && (
        <Animated keyName="recentOrders" animating={animatingKeys}>
          <OrdersCard orders={context.recentOrders} />
        </Animated>
      )}
      {context.cartOptions && context.cartOptions.length > 0 && (
        <Animated keyName="cartOptions" animating={animatingKeys}>
          <CartOptionsCard
            options={context.cartOptions}
            selected={context.selectedOption}
          />
        </Animated>
      )}
      {context.orderStatus === "ready_to_confirm" && <OrderStatusBanner />}
    </aside>
  );
}

function Animated({
  keyName,
  animating,
  children,
}: {
  keyName: string;
  animating: Set<string>;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(animating.has(keyName) && "animate-slideInRight")}>
      {children}
    </div>
  );
}
