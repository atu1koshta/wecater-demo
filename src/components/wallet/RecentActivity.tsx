import { cn } from "@/lib/cn";
import type { WalletOrder } from "@/types";
import { ModifierChip, SectionHeader } from "./atoms";

export function RecentActivity({ orders }: { orders: WalletOrder[] }) {
  return (
    <div>
      <SectionHeader icon="📋" title="Recent Activity" action="View all" />
      <div className="bg-surface-raised rounded-[14px] border border-surface-border overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_88px_104px] md:grid-cols-[70px_1fr_110px_120px] px-4 py-2.5 bg-surface border-b border-surface-border text-[10px] font-bold text-ink-tertiary tracking-wider uppercase">
          <span>Date</span>
          <span>Order</span>
          <span className="text-right">Co. paid</span>
          <span className="text-right">Bites earned</span>
        </div>

        {orders.map((o, i) => (
          <div
            key={o.id}
            className={cn(
              "px-4 py-3 transition-colors hover:bg-surface",
              i < orders.length - 1 && "border-b border-surface-border-light",
            )}
          >
            <div className="grid grid-cols-[60px_1fr_88px_104px] md:grid-cols-[70px_1fr_110px_120px] items-center gap-2.5">
              <div>
                <div className="text-xs text-ink font-medium font-mono">{o.date}</div>
                <div className="text-[9px] text-ink-tertiary font-mono">{o.id}</div>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{o.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs text-ink font-medium truncate">
                    {o.restaurant}
                  </div>
                  <div className="text-[10px] text-ink-tertiary truncate">
                    {o.officeIcon} {o.office}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-lane-company font-mono font-semibold">
                  ${o.subtotal.toFixed(2)}
                </span>
                <div className="text-[9px] text-ink-tertiary">company</div>
              </div>
              <div className="text-right">
                <div className="flex justify-end items-baseline gap-1">
                  <span className="text-[13px] text-brand font-mono font-bold">
                    +{o.bitesEarned.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-ink-tertiary">Bites</span>
                </div>
                <div
                  className={cn(
                    "text-[9px] font-semibold",
                    o.status === "pending" ? "text-warning" : "text-success",
                  )}
                >
                  {o.actualRate}X · {o.status === "pending" ? "pending" : "available"}
                </div>
              </div>
            </div>

            {o.modifiers.length > 0 && (
              <div className="flex gap-1 mt-1.5 pl-[80px] flex-wrap">
                <ModifierChip
                  label={`Base ${o.baseRate}X`}
                  bites={o.subtotal * o.baseRate}
                  tone="ink"
                />
                {o.modifiers.map((m) => (
                  <ModifierChip
                    key={m.label}
                    label={m.label}
                    bites={m.bites}
                    tone={m.label.includes("Welcome") ? "brand" : "purple"}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
