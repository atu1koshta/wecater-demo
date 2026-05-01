"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Restaurant } from "@/types";
import type { InitialOrderContext } from "@/data/order-context";
import { calculateBites, rankBy } from "./math";
import { type DemoMode, type OptimizerMode, getMode } from "./modes";
import { CompareAllView, filterPool } from "./CompareAllView";
import { FunnelCascade, HiddenInsight } from "./atoms";
import { type Density, OptionCard } from "./OptionCard";
import { OPTIMIZER_PROMPTS } from "./demo";

export type AssistantMessage = {
  role: "assistant";
  text: string;
  mode: DemoMode;
  options?: string[];
  surfaceMore?: boolean;
  showHiddenInsight?: boolean;
  showCompoundStrategy?: boolean;
  showCompareAll?: boolean;
};

export type Message =
  | { role: "user"; text: string }
  | AssistantMessage;

export function MessageList({
  messages,
  isCalculating,
  step,
  density,
  ctx,
  restaurants,
  sessionPool,
  currentMode,
  onSelectPrompt,
}: {
  messages: Message[];
  isCalculating: boolean;
  step: number;
  density: Density;
  ctx: InitialOrderContext;
  restaurants: Restaurant[];
  sessionPool: string[];
  currentMode: OptimizerMode;
  onSelectPrompt: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCalculating]);

  // The latest assistant message that surfaced options is the "live" turn —
  // mode-pill clicks should re-rank and re-label its cards. Older turns stay
  // frozen so their intro text stays consistent with the cards underneath.
  let latestOptionsIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.options && m.options.length > 0) {
      latestOptionsIdx = i;
      break;
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 md:px-6 pt-5 pb-2.5">
      {messages.length === 0 && <EmptyState onSelectPrompt={onSelectPrompt} />}

      {messages.map((msg, i) => (
        <div key={i} className="mb-4 animate-fadeIn">
          {msg.role === "user" ? (
            <UserBubble text={msg.text} />
          ) : (
            <AssistantTurn
              msg={msg}
              ctx={ctx}
              density={density}
              restaurants={restaurants}
              sessionPool={sessionPool}
              currentMode={currentMode}
              isLatestWithOptions={i === latestOptionsIdx}
            />
          )}
        </div>
      ))}

      {isCalculating && <CalculatingBubble step={step} />}
      <div ref={endRef} />
    </div>
  );
}

function EmptyState({ onSelectPrompt }: { onSelectPrompt: () => void }) {
  return (
    <div className="text-center py-12 md:py-16 animate-fadeIn">
      <div className="h-14 w-14 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-brand to-brand-dark grid place-items-center shadow-[0_4px_20px_rgba(232,106,26,0.18)]">
        <span className="text-2xl">🎯</span>
      </div>
      <h2 className="text-xl font-semibold font-display text-ink mb-1.5">
        What are we optimizing for?
      </h2>
      <p className="text-[13px] text-ink-tertiary max-w-[440px] mx-auto leading-relaxed">
        Tell me what you need or use a slash command. I&apos;ll compare all 8
        partner restaurants across Bites earned, dietary fit, compliance, and
        variety — in real time.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-5">
        {OPTIMIZER_PROMPTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={onSelectPrompt}
            className="px-3.5 py-2 rounded-full border border-surface-border bg-surface-raised text-xs text-ink-secondary hover:border-brand hover:text-brand transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] px-3.5 py-2.5 rounded-[16px_16px_4px_16px] bg-ink text-ink-inverse text-[13px] leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function AssistantTurn({
  msg,
  ctx,
  density,
  restaurants,
  sessionPool,
  currentMode,
  isLatestWithOptions,
}: {
  msg: AssistantMessage;
  ctx: InitialOrderContext;
  density: Density;
  restaurants: Restaurant[];
  sessionPool: string[];
  currentMode: OptimizerMode;
  isLatestWithOptions: boolean;
}) {
  // The latest options-bearing turn follows the live mode pill; older turns
  // keep their original mode for badge/rationale consistency with their intro.
  const effectiveMode: OptimizerMode = isLatestWithOptions
    ? currentMode
    : msg.mode === "compare"
      ? currentMode
      : (msg.mode as OptimizerMode);

  const meta =
    effectiveMode !== "smart" ? getMode(effectiveMode) : null;

  return (
    <div>
      <div className="flex gap-2.5 mb-2.5">
        <Avatar />
        <div className="flex-1 min-w-0">
          {meta && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] bg-brand-light text-brand-dark text-[10px] font-bold tracking-wider uppercase mb-1.5">
              {meta.icon} {meta.label} mode
            </div>
          )}
          <div className="px-4 py-3 rounded-[16px_16px_16px_4px] bg-[#F6F3EF] text-[13.5px] leading-relaxed text-ink whitespace-pre-wrap">
            {renderInlineBold(msg.text)}
          </div>
        </div>
      </div>

      {msg.showHiddenInsight && (
        <div className="ml-[38px]">
          <HiddenInsight />
        </div>
      )}

      {msg.options && msg.options.length > 0 && (
        <OptionsBlock
          msg={msg}
          ctx={ctx}
          density={density}
          restaurants={restaurants}
          sessionPool={sessionPool}
          optionMode={effectiveMode}
          rerank={isLatestWithOptions}
        />
      )}

      {msg.showCompareAll && (
        <div className="ml-[38px]">
          <CompareAllView
            restaurants={filterPool(restaurants, sessionPool)}
            ctx={ctx}
          />
        </div>
      )}
    </div>
  );
}

function OptionsBlock({
  msg,
  ctx,
  density,
  restaurants,
  sessionPool,
  optionMode,
  rerank,
}: {
  msg: AssistantMessage;
  ctx: InitialOrderContext;
  density: Density;
  restaurants: Restaurant[];
  sessionPool: string[];
  optionMode: OptimizerMode;
  rerank: boolean;
}) {
  const rawIds = msg.options ?? [];
  const [showCompare, setShowCompare] = useState(false);

  // Resolve restaurants, then optionally re-sort by the live mode. Tier 3
  // discovery items always sort to the bottom (they don't have real Bites).
  const resolved = rawIds.flatMap((id) => {
    const r = restaurants.find((x) => x.id === id);
    return r ? [r] : [];
  });

  let ordered: Restaurant[] = resolved;
  if (rerank && resolved.length > 1) {
    const t1 = resolved.filter((r) => r.tier !== 3);
    const t3 = resolved.filter((r) => r.tier === 3);
    ordered = [...rankBy(t1, optionMode, ctx), ...t3];
  }

  type Card = { r: Restaurant; idx: number; deltaToBest: number | undefined };
  const cards: Card[] = ordered.map((r, idx) => {
    const nextR = idx === 0 && ordered[1] ? ordered[1] : null;
    let deltaToBest: number | undefined;
    if (idx === 0 && nextR && r.tier !== 3 && nextR.tier !== 3) {
      deltaToBest =
        calculateBites(r, ctx).total - calculateBites(nextR, ctx).total;
    }
    return { r, idx, deltaToBest };
  });

  return (
    <div className="ml-[38px] mt-2.5">
      {msg.surfaceMore && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-brand-light text-brand-dark text-[10px] font-bold tracking-wider uppercase mb-2 font-display">
          ➕ Added to your working set
        </div>
      )}

      <div
        className={cn(
          "grid gap-2.5",
          ordered.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        )}
      >
        {cards.map(({ r, idx, deltaToBest }) => (
          <OptionCard
            key={r.id}
            restaurant={r}
            ctx={ctx}
            isTopPick={idx === 0 && r.tier !== 3}
            deltaToBest={deltaToBest}
            baseDelayMs={idx * 100}
            mode={optionMode}
            position={idx}
            isCompound={msg.showCompoundStrategy && idx === 0}
            density={density}
          />
        ))}
      </div>

      {!msg.showCompareAll && ordered.length > 1 && (
        <button
          type="button"
          onClick={() => setShowCompare((s) => !s)}
          className={cn(
            "mt-2.5 w-full px-3.5 py-2.5 rounded-[10px] border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-colors",
            showCompare
              ? "border-brand bg-brand-light text-brand-dark"
              : "border-surface-border bg-surface-raised text-ink-secondary hover:border-brand hover:text-brand",
          )}
        >
          <span className="text-sm">📋</span>
          <span>
            {showCompare
              ? "Hide working-set comparison"
              : `Compare options surfaced so far (${sessionPool.length})`}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              showCompare && "rotate-180",
            )}
            strokeWidth={2}
          />
        </button>
      )}

      {showCompare && !msg.showCompareAll && (
        <CompareAllView
          restaurants={filterPool(restaurants, sessionPool)}
          ctx={ctx}
        />
      )}
    </div>
  );
}

function CalculatingBubble({ step }: { step: number }) {
  return (
    <div className="flex gap-2.5 mb-4 animate-fadeIn">
      <div className="h-7 w-7 rounded-lg shrink-0 bg-gradient-to-br from-brand to-brand-dark grid place-items-center [animation:spin_2s_linear_infinite]">
        <span className="text-ink-inverse text-xs font-bold font-display">W</span>
      </div>
      <div className="px-4 py-3.5 rounded-[16px_16px_16px_4px] bg-[#F6F3EF] text-[13px] text-ink-secondary min-w-[300px] max-w-full">
        {step === 0 ? (
          <FunnelCascade />
        ) : (
          <div className="flex items-center gap-2">
            <span>Re-ranking your working set against active multipliers</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-brand"
                  style={{ animation: `chat-pulse 1.2s ${d * 0.2}s infinite` }}
                />
              ))}
            </span>
          </div>
        )}
        <style jsx>{`
          @keyframes chat-pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="h-7 w-7 rounded-lg shrink-0 bg-gradient-to-br from-brand to-brand-dark grid place-items-center">
      <span className="text-ink-inverse text-xs font-bold font-display">W</span>
    </div>
  );
}

function renderInlineBold(text: string) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
  );
}
