"use client";

import { cn } from "@/lib/cn";
import type { Restaurant } from "@/types";
import { WALLET } from "@/data/wallet";
import type { InitialOrderContext } from "@/data/order-context";
import { calculateBites } from "./math";
import { type OptimizerMode, getMode } from "./modes";
import { CountUp } from "./atoms";

export function RightRail({
  ctx,
  mode,
  selected,
  pool,
  step,
  totalSteps,
}: {
  ctx: InitialOrderContext;
  mode: OptimizerMode;
  selected: Restaurant | null;
  pool: Restaurant[];
  step: number;
  totalSteps: number;
}) {
  const meta = getMode(mode);
  const ytdPct = (ctx.physician.ytd / ctx.physician.threshold) * 100;
  const tier1Count = pool.filter((r) => r.tier !== 3).length;
  const tier3Count = pool.filter((r) => r.tier === 3).length;

  return (
    <aside className="hidden lg:flex w-[320px] shrink-0 flex-col border-l border-surface-border bg-surface overflow-y-auto p-3.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-ink-tertiary tracking-widest uppercase font-display">
          Live Optimization
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-light text-success font-bold">
          {meta.icon} {meta.label}
        </span>
      </div>

      <ForecastCard restaurant={selected} ctx={ctx} />

      {pool.length > 0 && (
        <WorkingSetCard
          tier1Count={tier1Count}
          tier3Count={tier3Count}
          poolSize={pool.length}
          showHint={pool.length >= 3 && step < totalSteps - 1}
        />
      )}

      <WalletSnapshot />

      <ActiveMultipliers />

      <OrderContextCard ctx={ctx} ytdPct={ytdPct} />

      <ProTip step={step} />
    </aside>
  );
}

function ForecastCard({
  restaurant,
  ctx,
}: {
  restaurant: Restaurant | null;
  ctx: InitialOrderContext;
}) {
  const calc = restaurant ? calculateBites(restaurant, ctx) : null;
  return (
    <div className="rounded-[14px] p-4 mb-3 text-ink-inverse shadow-[0_4px_16px_rgba(232,106,26,0.18)] bg-gradient-to-br from-brand to-brand-dark">
      <div className="text-[10px] font-bold opacity-85 tracking-widest uppercase mb-1.5 font-display">
        Bites Forecast
      </div>
      {calc ? (
        <>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-[32px] font-bold font-display tracking-tight">
              <CountUp value={calc.total} />
            </span>
            <span className="text-xs opacity-85">Bites</span>
          </div>
          <div className="text-[11px] opacity-85">
            ≈ <strong>${(calc.total / 100).toFixed(2)}</strong> redemption value
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-1">
            <Pill>{calc.baseRate}X base</Pill>
            {calc.modifiers.map((m) => (
              <Pill key={m.id}>{m.label}</Pill>
            ))}
          </div>
        </>
      ) : (
        <div className="text-xs opacity-85 py-1">
          Tell me what you&apos;re ordering and I&apos;ll calculate your projected
          Bites in real time.
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-semibold">
      {children}
    </span>
  );
}

function WorkingSetCard({
  tier1Count,
  tier3Count,
  poolSize,
  showHint,
}: {
  tier1Count: number;
  tier3Count: number;
  poolSize: number;
  showHint: boolean;
}) {
  return (
    <div className="bg-surface-raised rounded-xl border border-surface-border p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase font-display">
          🎒 Working Set
        </span>
        <span className="text-[11px] font-bold text-brand font-mono">{poolSize}</span>
      </div>
      <div className="text-[11px] text-ink-secondary mb-2 leading-snug">
        Options we&apos;ve considered together this session.
      </div>
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-brand" />
          <span className="text-[11px] text-ink">
            {tier1Count} partner restaurants
          </span>
        </div>
        {tier3Count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm border border-dashed border-ink-tertiary" />
            <span className="text-[11px] text-ink">
              {tier3Count} discovery options
            </span>
          </div>
        )}
      </div>
      {showHint && (
        <div className="text-[10px] text-ink-tertiary italic leading-snug">
          Say &ldquo;compare what we&apos;ve seen&rdquo; anytime to view all together.
        </div>
      )}
    </div>
  );
}

function WalletSnapshot() {
  const balance = WALLET.bites;
  const pct = Math.min((balance / (WALLET.ytdBitesEarned || 1)) * 100, 100);
  return (
    <div className="bg-surface-raised rounded-xl border border-surface-border p-3 mb-3">
      <div className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase mb-2 font-display">
        Your Wallet
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-[22px] font-bold text-brand font-mono">
          {balance.toLocaleString()}
        </span>
        <span className="text-[11px] text-ink-tertiary">
          Bites · ${(balance / 100).toFixed(2)}
        </span>
      </div>
      <div className="h-[5px] bg-surface-border-light rounded-[3px] overflow-hidden mb-1">
        <div
          className="h-full bg-brand rounded-[3px]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-ink-tertiary">
        {WALLET.pendingBites.toLocaleString()} Bites pending ·{" "}
        {WALLET.welcomeDaysRemaining} days left in Welcome 2X
      </div>
    </div>
  );
}

function ActiveMultipliers() {
  const items: { icon: string; label: string; desc: string; tone: string }[] = [
    {
      icon: "🎁",
      label: "Welcome 2X",
      desc: "All Bites earned doubled · 18d left",
      tone: "text-brand",
    },
    {
      icon: "🚀",
      label: "Restaurant Boost",
      desc: "5 restaurants offer up to 1.5X redemption",
      tone: "text-accent-purple",
    },
    {
      icon: "🔥",
      label: "Flash Promo",
      desc: "True Food Kitchen 12X — until 5pm today",
      tone: "text-danger",
    },
  ];
  return (
    <div className="bg-surface-raised rounded-xl border border-surface-border p-3 mb-3">
      <div className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase mb-2 font-display">
        Active Multipliers
      </div>
      {items.map((m, i) => (
        <div
          key={m.label}
          className={cn(
            "flex gap-2 py-1.5",
            i > 0 && "border-t border-surface-border-light",
          )}
        >
          <span className="text-sm mt-0.5">{m.icon}</span>
          <div className="flex-1">
            <div className={cn("text-[11px] font-semibold", m.tone)}>{m.label}</div>
            <div className="text-[10px] text-ink-secondary leading-snug mt-px">
              {m.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderContextCard({
  ctx,
  ytdPct,
}: {
  ctx: InitialOrderContext;
  ytdPct: number;
}) {
  return (
    <div className="bg-surface-raised rounded-xl border border-surface-border p-3 mb-3">
      <div className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase mb-2 font-display">
        Order Context
      </div>
      <div className="text-xs text-ink mb-1">{ctx.office}</div>
      <div className="text-[11px] text-ink-secondary mb-2">
        {ctx.headcount} people · ${ctx.budgetTotal} budget
      </div>
      <div className="px-2.5 py-1.5 bg-info-light rounded-md">
        <div className="text-[10px] font-semibold text-info mb-1">
          ☂️ {ctx.physician.name} YTD
        </div>
        <div className="h-[5px] bg-info/15 rounded-[3px] overflow-hidden">
          <div
            className="h-full bg-info rounded-[3px]"
            style={{ width: `${Math.min(ytdPct, 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-info font-mono mt-1">
          ${ctx.physician.ytd} / ${ctx.physician.threshold}
        </div>
      </div>
    </div>
  );
}

function ProTip({ step }: { step: number }) {
  return (
    <div className="p-3 bg-brand-light rounded-[10px] border border-dashed border-brand/40">
      <div className="text-[10px] font-bold text-brand tracking-wider uppercase mb-1.5">
        💡 Did you know?
      </div>
      <div className="text-[11px] text-ink-secondary leading-relaxed">
        {step <= 1 && (
          <>
            I filtered <strong className="text-ink">1,247 Phoenix partners</strong>{" "}
            down to 47 viable matches before picking these top 3. Tap{" "}
            <strong className="text-brand">&ldquo;How is this calculated?&rdquo;</strong>{" "}
            on any card to see the full math — or say{" "}
            <strong className="text-brand">&ldquo;show me more&rdquo;</strong> to
            expand your working set.
          </>
        )}
        {step === 2 && (
          <>
            Discovery options (📍 dashed border) aren&apos;t WeCater partners yet.
            They show up when no current partner fills a specific gap. Sally
            requests a quote — we email them; they activate; everyone wins.
          </>
        )}
        {step === 3 && (
          <>
            Try{" "}
            <code className="bg-surface-raised px-1 rounded text-[10px] font-mono text-brand">
              /maximize discount
            </code>{" "}
            to apply your existing 27,420 Bites for the biggest discount on this
            order.
          </>
        )}
        {step === 4 && (
          <>
            Compare All shows your <strong className="text-ink">working set</strong>{" "}
            — the options we&apos;ve considered together this session — sortable by
            Bites, price, or dietary fit. Discovery options grouped at the bottom.
          </>
        )}
        {step >= 5 && (
          <>
            Six discovery paths: density toggle, expand a card, mode pills, slash
            commands, plain English, &ldquo;show me more.&rdquo; Working set
            persists across all of them.
          </>
        )}
      </div>
    </div>
  );
}
