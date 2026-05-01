import { cn } from "@/lib/cn";
import type {
  MonthlyBites,
  Redemption,
  RestaurantBucket,
} from "@/types";
import { SectionHeader } from "./atoms";

export function Insights({
  monthly,
  buckets,
  redemptions,
}: {
  monthly: MonthlyBites[];
  buckets: RestaurantBucket[];
  redemptions: Redemption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <MonthlyChart data={monthly} />
      <BoostCatalog buckets={buckets} />
      <RedemptionList redemptions={redemptions} />
    </div>
  );
}

function MonthlyChart({ data }: { data: MonthlyBites[] }) {
  const max = Math.max(...data.map((m) => m.value));
  return (
    <div>
      <SectionHeader icon="📈" title="Monthly Bites" />
      <div className="bg-surface-raised rounded-[14px] border border-surface-border p-4">
        <div className="flex items-end gap-2 h-[120px] mb-2">
          {data.map((m, i) => {
            const h = (m.value / max) * 100;
            const isLast = i === data.length - 1;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="relative w-full h-full flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-[height] duration-700",
                      isLast
                        ? "bg-gradient-to-b from-brand to-brand-dark"
                        : "bg-surface-border-light",
                    )}
                    style={{ height: `${h}%` }}
                  >
                    {isLast && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-brand font-mono whitespace-nowrap">
                        {m.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-ink-tertiary font-medium">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
        <div className="pt-3 border-t border-surface-border-light flex justify-between text-[11px]">
          <span className="text-ink-tertiary">Trend</span>
          <span className="text-success font-semibold">↑ 36% MoM growth</span>
        </div>
      </div>
    </div>
  );
}

function BoostCatalog({ buckets }: { buckets: RestaurantBucket[] }) {
  const eligible = buckets
    .filter((b) => b.boostable && b.earnedBites >= 1000)
    .slice(0, 4);
  return (
    <div>
      <SectionHeader icon="🚀" title="Restaurant Boost Available" />
      <div className="bg-surface-raised rounded-[14px] border border-surface-border p-1">
        <div className="px-3 py-2 text-[11px] text-ink-secondary leading-relaxed">
          Bites earned at these restaurants redeem at a higher rate{" "}
          <strong>at that same restaurant</strong>:
        </div>
        {eligible.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-center px-3.5 py-2.5 gap-2.5",
              i > 0 && "border-t border-surface-border-light",
            )}
          >
            <span className="text-lg">{r.icon}</span>
            <div>
              <div className="text-xs font-medium text-ink">{r.name}</div>
              <div className="text-[10px] text-ink-tertiary font-mono">
                {r.earnedBites.toLocaleString()} eligible Bites
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-accent-purple-light text-accent-purple font-bold font-mono">
              {r.boostMultiplier}X
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedemptionList({ redemptions }: { redemptions: Redemption[] }) {
  return (
    <div>
      <SectionHeader icon="💸" title="Redemption History" />
      <div className="bg-surface-raised rounded-[14px] border border-surface-border p-1">
        {redemptions.map((r, i) => (
          <div
            key={r.code}
            className={cn(
              "flex items-center px-3.5 py-2.5",
              i < redemptions.length - 1 && "border-b border-surface-border-light",
            )}
          >
            <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center mr-2.5 text-sm">
              {r.type.includes("WeCater") ? "🍴" : "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-ink truncate">{r.type}</div>
              <div className="text-[10px] text-ink-tertiary font-mono truncate">
                {r.code}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[13px] font-bold text-ink font-mono">
                {r.bites.toLocaleString()}
              </div>
              <div className="text-[10px] text-ink-tertiary">
                ${r.value.toFixed(2)} · {r.date}
              </div>
            </div>
          </div>
        ))}
        <div className="text-center py-2">
          <button
            type="button"
            className="text-[11px] text-brand font-semibold hover:text-brand-dark transition-colors"
          >
            Download tax statement →
          </button>
        </div>
      </div>
    </div>
  );
}
