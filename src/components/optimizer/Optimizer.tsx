"use client";

import { useCallback, useMemo, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Restaurant } from "@/types";
import { RESTAURANTS } from "@/data/restaurants";
import { ORDER_CTX, type InitialOrderContext } from "@/data/order-context";
import { WALLET } from "@/data/wallet";
import { Composer } from "./Composer";
import { OPTIMIZER_DEMO } from "./demo";
import { rankBy, calculateBites, calculateRedemption } from "./math";
import { MessageList, type AssistantMessage, type Message } from "./MessageList";
import { MODES, type OptimizerMode, getMode } from "./modes";
import { type Density } from "./OptionCard";
import { RightRail } from "./RightRail";

const FUNNEL_DELAY_MS = 1500;
const SHIMMER_DELAY_MS = 900;

const MOBILE_DEMO_INPUT =
  "Order tomorrow at 12 for Dr. Patel's office. 14 people, $15/pp, vegan + gluten-free + nut allergy must be covered. Pfizer rep brought sushi last week.";

export function Optimizer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentMode, setCurrentMode] = useState<OptimizerMode>("smart");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [density, setDensity] = useState<Density>("simple");
  const [pool, setPool] = useState<string[]>([]);
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showWorkingSet, setShowWorkingSet] = useState(false);
  const modeData = getMode(currentMode);

  const tier1Restaurants = useMemo(
    () => RESTAURANTS.filter((r) => r.tier !== 3),
    [],
  );
  const mobileRanked = useMemo(
    () => rankBy(tier1Restaurants, currentMode, ORDER_CTX).slice(0, 3),
    [currentMode, tier1Restaurants],
  );
  const mobileTier3 = useMemo(
    () => RESTAURANTS.find((r) => r.tier === 3) ?? null,
    [],
  );

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
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-3.5rem)]">
      {/* Header — responsive */}
      <div className="flex items-center gap-2 px-4 md:px-5 py-2.5 border-b border-surface-border bg-surface-raised shrink-0">
        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-2 w-full">
          <DensityToggle density={density} onChange={setDensity} />
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light">
            <span className="text-xs">👤</span>
            <span className="text-xs font-semibold text-brand-dark">
              Sally · {ORDER_CTX.office}
            </span>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink font-display leading-tight">
              AI Optimizer
            </div>
            <div className="text-[10px] text-ink-tertiary leading-none mt-0.5">
              Cascade ranking · {modeData.label}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModeSheet(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] border border-surface-border bg-surface text-[11px] font-bold text-ink shrink-0"
          >
            <span>{modeData.icon}</span>
            <span>{modeData.label}</span>
            <ChevronDown className="h-3 w-3 text-ink-tertiary" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-[14px] bg-brand-light shrink-0">
            <span className="text-xs">🪙</span>
            <span className="text-[11px] font-bold text-brand-dark font-mono">
              {(WALLET.bites / 1000).toFixed(1)}K
            </span>
          </div>
        </div>
      </div>

      {/* Mobile view — full card-based layout */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-surface">
          {/* User ask bubble */}
          <div className="px-3.5 pt-3 pb-1">
            <div className="flex justify-end animate-fadeIn">
              <div className="max-w-[92%] px-3.5 py-2.5 rounded-[16px_16px_4px_16px] bg-ink text-white text-[12.5px] leading-[1.45]">
                {MOBILE_DEMO_INPUT}
              </div>
            </div>
          </div>

          {/* Filter cascade */}
          <MobileVerticalCascade />

          <div className="px-3.5 pt-3.5 pb-6 flex flex-col gap-2.5">
            {/* AI summary */}
            <div className="flex gap-2 p-3 rounded-xl bg-surface-raised border border-surface-border animate-fadeIn">
              <div className="h-[22px] w-[22px] rounded-md shrink-0 bg-gradient-to-br from-brand to-brand-dark grid place-items-center">
                <span className="text-white text-[10px] font-bold font-display">W</span>
              </div>
              <div className="flex-1 text-[11.5px] text-ink leading-relaxed">
                From <strong>1,247</strong> Phoenix restaurants,{" "}
                <strong>3 top picks</strong> ranked by{" "}
                <strong>{modeData.label}</strong>. Avoiding Thai, Mediterranean,
                Indian, sushi (variety + competitor signal).
              </div>
            </div>

            {/* Compound play */}
            {mobileRanked[0] && (
              <MobileCompoundPlay topPick={mobileRanked[0]} ctx={ORDER_CTX} />
            )}

            {/* Hidden gem (Tier 3) */}
            {mobileTier3 && (
              <MobileHiddenInsight restaurant={mobileTier3} ctx={ORDER_CTX} />
            )}

            {/* Top picks header */}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-ink-tertiary font-display">
                ⭐ Top 3 picks
              </span>
              <span className="text-[10px] text-ink-tertiary">
                by {modeData.label}
              </span>
            </div>

            {/* Recommendation cards */}
            {mobileRanked.map((r, i) => (
              <MobileRecommendationCard
                key={r.id}
                restaurant={r}
                ctx={ORDER_CTX}
                mode={currentMode}
                position={i}
                isTopPick={i === 0}
              />
            ))}

            {/* Did you know */}
            <div className="p-3 bg-brand-light rounded-xl border border-dashed border-brand/40">
              <div className="text-[10px] font-bold text-brand tracking-[0.06em] uppercase mb-1 font-display">
                💡 Did you know?
              </div>
              <div className="text-[11px] text-ink-secondary leading-relaxed">
                Tap the mode chip in the header to switch optimization. Try
                &ldquo;Max Bites&rdquo; — True Food&apos;s 12X flash promo will
                surface as #1.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="shrink-0 px-3.5 py-2.5 bg-surface-raised border-t border-surface-border">
          <button
            type="button"
            onClick={() => setShowWorkingSet(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-border bg-surface text-[12px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors"
          >
            <span>📋</span>
            <span>See all {tier1Restaurants.length} options</span>
          </button>
        </div>
      </div>

      {/* Desktop view — chat interface */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
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

      <MobileModePicker
        open={showModeSheet}
        currentMode={currentMode}
        onSelect={setCurrentMode}
        onClose={() => setShowModeSheet(false)}
      />
      <MobileWorkingSetSheet
        open={showWorkingSet}
        onClose={() => setShowWorkingSet(false)}
        restaurants={tier1Restaurants}
        ctx={ORDER_CTX}
        mode={currentMode}
      />
    </div>
  );
}

// ─── Mobile cascade filter ───

const CASCADE_STEPS = [
  { count: 1247, label: "All Phoenix restaurants", filter: null, color: "text-ink-tertiary", dot: "bg-ink-tertiary" },
  { count: 312, label: "Match cuisine + headcount", filter: "headcount + lunch service", color: "text-info", dot: "bg-info" },
  { count: 89, label: "Cover all dietary needs", filter: "vegan · GF · nut allergy", color: "text-success", dot: "bg-success" },
  { count: 47, label: "Within budget + same-day", filter: "$15/pp · today fulfillment", color: "text-warning", dot: "bg-warning" },
  { count: 6, label: "Ranked options shown below", filter: "Smart Pick scoring", color: "text-brand", dot: "bg-brand" },
];

function MobileVerticalCascade() {
  return (
    <div className="px-3.5 py-3 bg-surface-raised border-t border-b border-surface-border">
      <div className="text-[9px] font-bold tracking-[0.06em] uppercase text-ink-tertiary mb-2.5 font-display">
        🔍 Filter cascade
      </div>
      <div className="relative pl-[18px]">
        {/* Connecting line */}
        <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-gradient-to-b from-ink-tertiary/20 to-brand/50" />
        {CASCADE_STEPS.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 py-[5px] relative animate-fadeInUp"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
          >
            {/* Bullet */}
            <div
              className={cn(
                "absolute -left-[18px] top-[11px] h-3 w-3 rounded-full border-2 border-surface-raised shadow-sm shrink-0",
                s.dot,
              )}
            />
            <span className={cn("text-[16px] font-bold font-mono min-w-[56px] text-right", s.color)}>
              {s.count.toLocaleString()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-ink font-medium">{s.label}</div>
              {s.filter && (
                <div className="text-[10px] text-ink-tertiary mt-px">
                  filter: {s.filter}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compound play callout ───

function MobileCompoundPlay({
  topPick,
  ctx,
}: {
  topPick: Restaurant;
  ctx: InitialOrderContext;
}) {
  const bites = calculateBites(topPick, ctx);
  const cashVal = (bites.total / 100).toFixed(0);
  const boostVal = topPick.restaurantBoost
    ? ((bites.total / 100) * topPick.restaurantBoost).toFixed(0)
    : null;

  return (
    <div className="p-3 rounded-xl border border-brand/30 bg-gradient-to-br from-brand/5 to-accent-purple/5 animate-fadeIn">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">⚡</span>
        <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-brand font-display">
          Compound play available
        </span>
      </div>
      <div className="text-[12px] text-ink leading-[1.55] mb-2">
        Stack <strong>Welcome 2X</strong> +{" "}
        <strong>{topPick.hasFlash ? "Flash 12X" : `${topPick.baseRate}X base`}</strong>{" "}
        + future redemption at{" "}
        <strong>{topPick.restaurantBoost ?? 1}X</strong> to maximize value.
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2 bg-surface-raised rounded-lg">
        <MobileCompoundStat label="Earn" value={bites.total.toLocaleString()} unit="Bites" color="text-brand" />
        <MobileCompoundStat label="Cash equiv" value={`$${cashVal}`} unit="" color="text-ink" />
        {boostVal ? (
          <MobileCompoundStat label="At restaurant" value={`$${boostVal}`} unit={`@${topPick.restaurantBoost}X`} color="text-accent-purple" />
        ) : (
          <MobileCompoundStat label="Per person" value={`$${(bites.total / 100 / ctx.headcount).toFixed(1)}`} unit="savings/pp" color="text-success" />
        )}
      </div>
    </div>
  );
}

function MobileCompoundStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold tracking-[0.06em] uppercase text-ink-tertiary mb-0.5">
        {label}
      </div>
      <div className={cn("text-[13px] font-bold font-mono leading-none", color)}>
        {value}
      </div>
      {unit && (
        <div className="text-[9px] text-ink-tertiary mt-0.5">{unit}</div>
      )}
    </div>
  );
}

// ─── Hidden gem (Tier 3 insight) ───

function MobileHiddenInsight({
  restaurant,
  ctx,
}: {
  restaurant: Restaurant;
  ctx: InitialOrderContext;
}) {
  const estimatedBites = Math.round(
    (restaurant.estimatedBaseRate ?? 5) * (restaurant.ppEstimate ?? 14) * ctx.headcount * (ctx.welcomeActive ? 2 : 1),
  );
  return (
    <button
      type="button"
      className="w-full text-left p-3 rounded-xl border border-dashed border-warning bg-warning-light animate-fadeIn"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">💡</span>
        <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-warning font-display">
          Hidden gem
        </span>
        <span className="ml-auto text-[8px] px-1.5 py-px rounded bg-warning text-white font-bold tracking-wider">
          📍 DISCOVERY
        </span>
      </div>
      <div className="text-[12.5px] text-ink leading-relaxed mb-1.5">
        <strong>{restaurant.name}</strong> ({restaurant.cuisine}) covers all
        dietary needs and is in budget — not yet a partner. Estimated{" "}
        <strong className="text-brand">~{estimatedBites.toLocaleString()} Bites</strong>{" "}
        if activated.
      </div>
      <div className="text-[10px] text-warning font-semibold">
        Tap to send quote request →
      </div>
    </button>
  );
}

// ─── Recommendation card ───

function mobileRationaleFor(
  r: Restaurant,
  mode: OptimizerMode,
  position: number,
  ctx: InitialOrderContext,
): string {
  if (mode === "max_bites") {
    if (r.hasFlash)
      return `Flash 12X promo pushes effective rate far above alternatives — highest Bites earn today.`;
    return `${r.baseRate}X base${r.restaurantBoost ? ` + ${r.restaurantBoost}X future boost` : ""} — top Bites earner in your set.`;
  }
  if (mode === "max_discount")
    return `Lowest per-person cost after filtering. Existing Bites worth most at redemption here.`;
  if (mode === "speed")
    return r.sameDay
      ? `Same-day catering confirmed — can fulfill today's order on short notice.`
      : `Scheduled delivery — next-day earliest, but strong dietary fit.`;
  if (mode === "compliance")
    return `Estimated spend keeps Dr. Patel safely under Open Payments threshold. Dietary fit ${Math.round((r.dietaryFit ?? 0) * 100)}%.`;
  // smart
  const fresh = !ctx.recentCuisines.includes(r.cuisine);
  if (position === 0) {
    return r.hasFlash
      ? `Flash promo + full diet coverage + variety score makes this the composite leader.`
      : `${fresh ? "Fresh cuisine choice — " : ""}strongest composite across Bites, dietary coverage, and variety. ${r.baseRate}X base.`;
  }
  if (position === 1)
    return `Runner-up: ${fresh ? "fresh cuisine, " : ""}solid Bites rate at ${r.baseRate}X base. Good diversity option.`;
  return `Third pick: ${r.cuisine} adds variety. Dietary fit ${Math.round((r.dietaryFit ?? 0) * 100)}%. ${r.baseRate}X base earn rate.`;
}

function MobileChip({
  label,
  color,
  bg,
  mono,
}: {
  label: string;
  color: string;
  bg: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold",
        color,
        bg,
        mono && "font-mono",
      )}
    >
      {label}
    </span>
  );
}

function MobileRecommendationCard({
  restaurant,
  ctx,
  mode,
  position,
  isTopPick,
}: {
  restaurant: Restaurant;
  ctx: InitialOrderContext;
  mode: OptimizerMode;
  position: number;
  isTopPick: boolean;
}) {
  const bites = calculateBites(restaurant, ctx);
  const redemption = calculateRedemption(restaurant);
  const fullCoverage = (restaurant.dietaryFit ?? 0) >= 0.9;
  const isOver = restaurant.ppEstimate > ctx.budgetPerPerson;
  const isFresh = !ctx.recentCuisines.includes(restaurant.cuisine);

  const base = restaurant.brandColor ?? "#1B3A2E";
  const accent = restaurant.brandColorAccent ?? base;

  return (
    <div
      className={cn(
        "rounded-[14px] overflow-hidden bg-surface-raised",
        isTopPick
          ? "border-[1.5px] border-brand shadow-[0_4px_16px_rgba(232,106,26,0.18)]"
          : "border border-surface-border shadow-sm",
      )}
      style={{ animation: `fadeIn 0.3s ${position * 80}ms ease backwards` }}
    >
      {/* Brand hero strip */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 88,
          background: `linear-gradient(135deg, ${base}, ${accent})`,
        }}
      >
        {/* Big emoji behind */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[64px] opacity-35 drop-shadow-md select-none">
          {restaurant.icon}
        </div>
        {/* Gradient for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${base}E0 0%, ${base}80 50%, transparent 100%)`,
          }}
        />
        {/* Badge */}
        {isTopPick ? (
          <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded-full bg-brand text-white text-[9px] font-bold tracking-[0.08em] uppercase flex items-center gap-1">
            <span>★</span>
            <span>Top Pick</span>
          </div>
        ) : (
          <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold font-mono">
            #{position + 1}
          </div>
        )}
        {/* Flash badge */}
        {restaurant.hasFlash && (
          <div className="absolute top-2.5 right-3 px-2 py-1 rounded-full bg-warning text-white text-[9px] font-bold tracking-wider flex items-center gap-1">
            <span>🔥</span>
            <span>Flash 12X</span>
          </div>
        )}
        {/* Restaurant info */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
          <div className="text-[16px] font-bold font-display" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            {restaurant.name}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] opacity-90 mt-px">
            <span>{restaurant.cuisine}</span>
            <span className="opacity-50">·</span>
            <span>★ {restaurant.rating?.toFixed(1) ?? "—"}</span>
            <span className="opacity-50">·</span>
            <span>${restaurant.ppEstimate}/pp</span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5">
        {/* Bites + total row */}
        <div className="flex justify-between items-start mb-2.5 gap-2.5">
          <div>
            <div className="text-[9px] font-bold tracking-[0.06em] uppercase text-ink-tertiary mb-0.5">
              You&apos;ll earn
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-bold text-brand font-display leading-none">
                {bites.total.toLocaleString()}
              </span>
              <span className="text-[10px] text-ink-tertiary font-semibold">Bites</span>
            </div>
            <div className="text-[10px] text-ink-tertiary mt-0.5">
              ≈ ${(bites.total / 100).toFixed(2)}
              {redemption
                ? ` · $${redemption.value.toFixed(2)} @ ${redemption.multiplier}X here`
                : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold tracking-[0.06em] uppercase text-ink-tertiary mb-0.5">
              Total
            </div>
            <div
              className={cn(
                "text-[16px] font-bold font-mono",
                isOver ? "text-danger" : "text-ink",
              )}
            >
              ${bites.subtotal.toFixed(0)}
            </div>
            {isOver && (
              <div className="text-[9px] text-danger font-semibold">Over budget</div>
            )}
          </div>
        </div>

        {/* Multiplier chips */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          <MobileChip
            label={`${bites.baseRate}X base`}
            color="text-brand"
            bg="bg-brand-light"
            mono
          />
          {ctx.welcomeActive && (
            <MobileChip label="+2X welcome" color="text-brand" bg="bg-brand-light" />
          )}
          {restaurant.hasFlash && (
            <MobileChip label="🔥 flash applied" color="text-warning" bg="bg-warning-light" />
          )}
          {fullCoverage ? (
            <MobileChip label="✓ full diet" color="text-success" bg="bg-success-light" />
          ) : (
            <MobileChip label="⚠ limited diet" color="text-warning" bg="bg-warning-light" />
          )}
          {isFresh && (
            <MobileChip label="✨ fresh cuisine" color="text-accent-purple" bg="bg-accent-purple-light" />
          )}
          {restaurant.sameDay && (
            <MobileChip label="⚡ same-day" color="text-info" bg="bg-info-light" />
          )}
        </div>

        {/* Rationale */}
        <div className="px-2.5 py-2 rounded-lg bg-surface text-[11px] text-ink-secondary leading-[1.45] mb-2.5">
          <span className="font-semibold text-ink">Why: </span>
          {mobileRationaleFor(restaurant, mode, position, ctx)}
        </div>

        {/* Action */}
        <button
          type="button"
          className={cn(
            "w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all",
            isTopPick
              ? "bg-gradient-to-br from-brand to-brand-dark text-white shadow-[0_2px_8px_rgba(232,106,26,0.25)]"
              : "bg-surface border border-surface-border text-ink",
          )}
        >
          <span>🍴</span>
          <span>{isTopPick ? "Build cart →" : "Pick this option →"}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Mode picker bottom sheet ───

function MobileModePicker({
  open,
  currentMode,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentMode: OptimizerMode;
  onSelect: (m: OptimizerMode) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-2xl animate-slideUp max-h-[70%] flex flex-col overflow-hidden">
        <div className="flex justify-center pt-2.5 pb-1.5 shrink-0">
          <div className="h-1 w-9 rounded-full bg-surface-border" />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border shrink-0">
          <span className="text-base font-bold text-ink font-display">
            Optimization mode
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-surface-raised flex items-center justify-center text-ink-tertiary hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="p-3.5 flex flex-col gap-2 overflow-y-auto">
          {MODES.map((m) => {
            const on = currentMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelect(m.id);
                  onClose();
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3.5 py-3 rounded-xl border text-left transition-all",
                  on
                    ? "bg-brand-light border-brand"
                    : "bg-surface-raised border-surface-border",
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0",
                    on ? "bg-brand" : "bg-surface-border-light",
                  )}
                >
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-ink font-display">
                    {m.label}
                  </div>
                  <div className="text-[11px] text-ink-tertiary leading-snug">
                    {m.desc}
                  </div>
                </div>
                {on && (
                  <div className="h-5 w-5 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Working set bottom sheet ───

function MobileWorkingSetSheet({
  open,
  onClose,
  restaurants,
  ctx,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  ctx: InitialOrderContext;
  mode: OptimizerMode;
}) {
  if (!open) return null;
  const ranked = rankBy(restaurants, mode, ctx);
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-2xl animate-slideUp h-[85%] flex flex-col overflow-hidden">
        <div className="flex justify-center pt-2.5 pb-1.5 shrink-0">
          <div className="h-1 w-9 rounded-full bg-surface-border" />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border shrink-0">
          <div>
            <div className="text-base font-bold text-ink font-display">Working set</div>
            <div className="text-[11px] text-ink-tertiary mt-px">
              {restaurants.length} options after filter cascade · scored by {getMode(mode).label}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-surface-raised flex items-center justify-center text-ink-tertiary hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="p-3.5 flex flex-col gap-2 overflow-y-auto">
          {ranked.map((r, i) => {
            const calc = calculateBites(r, ctx);
            return (
              <div
                key={r.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-surface-border"
              >
                <div
                  className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-base"
                  style={{
                    background: `linear-gradient(135deg, ${r.brandColor ?? "#E86A1A"}, ${r.brandColorAccent ?? r.brandColor ?? "#C4540F"})`,
                  }}
                >
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-ink truncate">
                      {r.name}
                    </span>
                    {r.tier === 3 && (
                      <span className="text-[8px] px-1.5 py-px rounded bg-warning text-white font-bold">
                        📍 T3
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-tertiary">
                    {r.cuisine} · ${r.ppEstimate}/pp · {r.baseRate ?? r.estimatedBaseRate ?? 0}X
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-bold text-brand font-mono">
                    {calc.total.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-ink-tertiary">Bites</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop density toggle ───

function DensityToggle({
  density,
  onChange,
}: {
  density: Density;
  onChange: (d: Density) => void;
}) {
  const options: { id: Density; icon: string; label: string; title: string }[] = [
    { id: "simple", icon: "🎯", label: "Simple", title: "Clean view · just the essentials" },
    { id: "detailed", icon: "🔬", label: "Detailed", title: "Pro view · full multiplier math" },
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
