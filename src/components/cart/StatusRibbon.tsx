import { cn } from "@/lib/cn";
import type { CartProfile } from "@/types";
import type { CartTotals } from "./math";
import { getDietaryCoverage } from "./math";
import { Bar } from "./atoms";

/**
 * Horizontal status pill row sitting under the brand hero. Renders four
 * blocks: Budget / Dietary coverage / Bites forecast / (Compliance for pharma
 * personas only — replaces a generic context tile).
 */
export function StatusRibbon({
  profile,
  totals,
}: {
  profile: CartProfile;
  totals: CartTotals;
}) {
  const budgetPct = (totals.subtotal / profile.budgetTotal) * 100;
  const overBudget = totals.subtotal > profile.budgetTotal;
  const overByPp = (totals.subtotal - profile.budgetTotal) / profile.headcount;
  const coverage = getDietaryCoverage(profile);
  const coveragePct = Math.round(coverage.ratio * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
      <RibbonTile
        icon="💰"
        label="Budget"
        primary={
          <>
            <span
              className={cn(
                "font-mono font-bold",
                overBudget ? "text-danger" : "text-ink",
              )}
            >
              ${totals.subtotal.toFixed(2)}
            </span>
            <span className="text-ink-tertiary"> / ${profile.budgetTotal}</span>
          </>
        }
        sub={
          overBudget
            ? `Over by $${overByPp.toFixed(2)}/pp`
            : `${profile.headcount} people · $${(totals.subtotal / profile.headcount).toFixed(2)}/pp`
        }
        bar={
          <Bar
            pct={budgetPct}
            fillClass={overBudget ? "bg-danger" : "bg-success"}
          />
        }
      />

      <RibbonTile
        icon="🥗"
        label="Dietary coverage"
        primary={
          <>
            <span className="font-mono font-bold text-ink">
              {coverage.covered}
            </span>
            <span className="text-ink-tertiary"> / {coverage.total} categories</span>
          </>
        }
        sub={
          <span className="flex flex-wrap gap-1">
            {profile.dietaryRestrictions.slice(0, 4).map((d) => (
              <span
                key={d.tag}
                className={cn(
                  "px-1.5 py-px rounded text-[10px] font-semibold",
                  d.source === "told"
                    ? "bg-success-light text-success"
                    : "bg-surface-border-light text-ink-tertiary",
                )}
              >
                {d.count > 0 ? `${d.count} ` : ""}
                {d.tag}
              </span>
            ))}
          </span>
        }
        bar={<Bar pct={coveragePct} fillClass="bg-success" />}
      />

      <RibbonTile
        icon="🎁"
        label="Bites forecast"
        primary={
          <>
            <span className="text-brand font-mono font-bold">
              {totals.totalBites.toLocaleString()}
            </span>
            <span className="text-ink-tertiary"> Bites</span>
          </>
        }
        sub={
          <>
            ≈ ${(totals.totalBites / 100).toFixed(2)} ·{" "}
            <span className="text-brand font-semibold">Welcome 2X live</span>
          </>
        }
        bar={<Bar pct={Math.min((totals.totalBites / 5000) * 100, 100)} fillClass="bg-brand" />}
      />

      {profile.complianceTracking && profile.physicians ? (
        <ComplianceTile profile={profile} totals={totals} />
      ) : (
        <RibbonTile
          icon="📍"
          label="Delivery"
          primary={
            <span className="text-[13px] font-semibold text-ink">
              {profile.name}
            </span>
          }
          sub={profile.deliveryAddress}
        />
      )}
    </div>
  );
}

function ComplianceTile({
  profile,
  totals,
}: {
  profile: CartProfile;
  totals: CartTotals;
}) {
  const physicians = profile.physicians ?? [];
  const attending = physicians.filter((p) => p.attending);
  const perPhysicianAdd =
    attending.length > 0 ? totals.subtotal / attending.length / 1 : 0;
  const worst = attending.reduce(
    (acc, p) => {
      const projected = p.ytd + perPhysicianAdd;
      return projected > acc.projected ? { phys: p, projected } : acc;
    },
    { phys: attending[0], projected: 0 },
  );
  const projected = worst.projected;
  const danger = projected > worst.phys.threshold;
  const warning = !danger && projected > worst.phys.threshold * 0.85;
  const tone = danger
    ? "bg-danger-light text-danger"
    : warning
      ? "bg-warning-light text-warning"
      : "bg-info-light text-info";
  return (
    <div
      className={cn(
        "px-3 py-2.5 rounded-xl border bg-surface-raised border-surface-border",
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">☂️</span>
        <span className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary font-display">
          Open Payments
        </span>
        <span
          className={cn(
            "ml-auto text-[10px] px-1.5 py-px rounded font-bold",
            tone,
          )}
        >
          {danger ? "Over" : warning ? "Tight" : "Safe"}
        </span>
      </div>
      <div className="text-[11px] font-semibold text-ink mb-1">
        {worst.phys.name} ·{" "}
        <span className="font-mono">
          ${projected.toFixed(2)} / ${worst.phys.threshold}
        </span>
      </div>
      <Bar
        pct={(projected / worst.phys.threshold) * 100}
        fillClass={danger ? "bg-danger" : warning ? "bg-warning" : "bg-info"}
      />
    </div>
  );
}

function RibbonTile({
  icon,
  label,
  primary,
  sub,
  bar,
}: {
  icon: string;
  label: string;
  primary: React.ReactNode;
  sub: React.ReactNode;
  bar?: React.ReactNode;
}) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-surface-border">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary font-display">
          {label}
        </span>
      </div>
      <div className="text-[13px] mb-1">{primary}</div>
      <div className="text-[10px] text-ink-tertiary mb-1.5 leading-snug">
        {sub}
      </div>
      {bar}
    </div>
  );
}
