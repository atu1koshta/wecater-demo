"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { Restaurant } from "@/types";
import { RESTAURANTS } from "@/data/restaurants";
import { ORDER_CTX } from "@/data/order-context";
import { Composer } from "./Composer";
import { OPTIMIZER_DEMO } from "./demo";
import { rankBy } from "./math";
import { MessageList, type AssistantMessage, type Message } from "./MessageList";
import { type OptimizerMode } from "./modes";
import { type Density } from "./OptionCard";
import { RightRail } from "./RightRail";

const FUNNEL_DELAY_MS = 1500;
const SHIMMER_DELAY_MS = 900;

export function Optimizer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentMode, setCurrentMode] = useState<OptimizerMode>("smart");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [density, setDensity] = useState<Density>("simple");
  const [pool, setPool] = useState<string[]>([]);

  const advance = useCallback(() => {
    if (step >= OPTIMIZER_DEMO.length) return;
    const turn = OPTIMIZER_DEMO[step];

    setMessages((prev) => [...prev, { role: "user", text: turn.user }]);

    const calcDelay = step === 0 ? FUNNEL_DELAY_MS : SHIMMER_DELAY_MS;
    setIsCalculating(true);

    window.setTimeout(() => {
      setIsCalculating(false);
      if (turn.mode !== "compare") setCurrentMode(turn.mode);

      if (turn.addToPool && turn.options) {
        setPool((prev) => {
          const set = new Set(prev);
          turn.options!.forEach((id) => set.add(id));
          return Array.from(set);
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: turn.aiText,
          mode: turn.mode,
          options: turn.options,
          surfaceMore: turn.surfaceMore,
          showHiddenInsight: turn.showHiddenInsight,
          showCompoundStrategy: turn.showCompoundStrategy,
          showCompareAll: turn.showCompareAll,
        },
      ]);

      if (turn.options && turn.options.length > 0) {
        const top = RESTAURANTS.find((r) => r.id === turn.options![0]);
        if (top) setSelected(top);
      }

      setStep((s) => s + 1);
    }, calcDelay);
  }, [step]);

  const placeholder =
    step < OPTIMIZER_DEMO.length ? OPTIMIZER_DEMO[step].user : "Demo complete";
  const poolRestaurants = pool
    .map((id) => RESTAURANTS.find((r) => r.id === id))
    .filter((r): r is Restaurant => Boolean(r));

  // Bites Forecast follows the live mode pill: take whatever the latest
  // assistant turn surfaced, restrict to Tier 1 (no fake forecasts for
  // discovery options), re-rank, and show the top.
  const liveSelected = useMemo<Restaurant | null>(() => {
    let latestOpts: string[] | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && (m as AssistantMessage).options?.length) {
        latestOpts = (m as AssistantMessage).options;
        break;
      }
    }
    if (!latestOpts || latestOpts.length === 0) return selected;
    const tier1 = latestOpts
      .map((id) => RESTAURANTS.find((r) => r.id === id))
      .filter((r): r is Restaurant => Boolean(r) && r!.tier !== 3);
    if (tier1.length === 0) return selected;
    return rankBy(tier1, currentMode, ORDER_CTX)[0];
  }, [messages, currentMode, selected]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      {/* Density toggle + Sally chip */}
      <div className="flex items-center gap-2 px-4 md:px-5 py-2.5 border-b border-surface-border bg-surface-raised">
        <DensityToggle density={density} onChange={setDensity} />
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light">
          <span className="text-xs">👤</span>
          <span className="text-xs font-semibold text-brand-dark">
            Sally · {ORDER_CTX.office}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-surface-raised">
          <MessageList
            messages={messages}
            isCalculating={isCalculating}
            step={step}
            density={density}
            ctx={ORDER_CTX}
            restaurants={RESTAURANTS}
            sessionPool={pool}
            currentMode={currentMode}
            onSelectPrompt={advance}
          />
          <Composer
            placeholder={placeholder}
            onSend={advance}
            disabled={step >= OPTIMIZER_DEMO.length || isCalculating}
            step={step}
            totalSteps={OPTIMIZER_DEMO.length}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
          />
        </div>

        <RightRail
          ctx={ORDER_CTX}
          mode={currentMode}
          selected={liveSelected}
          pool={poolRestaurants}
          step={step}
          totalSteps={OPTIMIZER_DEMO.length}
        />
      </div>
    </div>
  );
}

function DensityToggle({
  density,
  onChange,
}: {
  density: Density;
  onChange: (d: Density) => void;
}) {
  const options: { id: Density; icon: string; label: string; title: string }[] = [
    {
      id: "simple",
      icon: "🎯",
      label: "Simple",
      title: "Clean view · just the essentials",
    },
    {
      id: "detailed",
      icon: "🔬",
      label: "Detailed",
      title: "Pro view · full multiplier math",
    },
  ];
  return (
    <div className="flex p-[3px] bg-surface rounded-lg border border-surface-border">
      {options.map((opt) => {
        const on = density === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.title}
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all",
              on
                ? "bg-surface-raised text-ink shadow-xs"
                : "bg-transparent text-ink-tertiary hover:text-ink",
            )}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
