import type { EzcaterComparison, Wallet } from "@/types";

export function WalletStats({
  wallet,
  ez,
}: {
  wallet: Wallet;
  ez: EzcaterComparison;
}) {
  const ezBarPct = (ez.ezcaterBitesEquivalent / ez.wecaterBites) * 100;
  // Project EOY by extrapolating Apr (5 months in) → Dec (12 months in).
  const projectedEoy = Math.round((wallet.ytdBitesEarned * 12) / 5);

  return (
    <div className="flex flex-col gap-3">
      <div className="p-5 bg-surface-raised rounded-2xl border border-surface-border">
        <div className="text-[10px] font-bold text-ink-tertiary tracking-widest uppercase mb-2 font-display">
          vs. ezCater this year
        </div>
        <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
          <span className="text-[28px] font-bold text-success font-display">
            +${ez.spread.toFixed(0)}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-success-light text-success font-bold font-mono">
            +{ez.spreadPct}%
          </span>
        </div>
        <div className="text-[11px] text-ink-secondary mb-3 leading-relaxed">
          For the same orders, you&apos;d have earned{" "}
          <strong className="text-ink">
            {ez.ezcaterBitesEquivalent.toLocaleString()} ezCater points (
            ${ez.ezcaterValue.toFixed(2)})
          </strong>
          . WeCater earned you{" "}
          <strong className="text-brand">
            {ez.wecaterBites.toLocaleString()} Bites (${ez.wecaterValue.toFixed(2)})
          </strong>
          .
        </div>
        <div className="flex flex-col gap-1.5">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-ink font-medium">WeCater · 6.8% blended</span>
              <span className="text-brand font-bold font-mono">
                {ez.wecaterBites.toLocaleString()}
              </span>
            </div>
            <div className="h-2 rounded bg-brand-light overflow-hidden">
              <div className="h-full w-full rounded bg-gradient-to-r from-brand to-brand-dark" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-ink-tertiary">ezCater · ~1.5% effective</span>
              <span className="text-ink-tertiary font-mono">
                {ez.ezcaterBitesEquivalent.toLocaleString()}
              </span>
            </div>
            <div className="h-2 rounded bg-surface-border-light overflow-hidden">
              <div
                className="h-full rounded bg-ink-tertiary"
                style={{ width: `${ezBarPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          value={wallet.ytdBitesEarned.toLocaleString()}
          label="YTD earned"
        />
        <StatTile value={wallet.totalOrders} label="Orders YTD" />
        <StatTile
          value={`${wallet.blendedRate}X`}
          label="Blended rate"
          highlight
        />
        <StatTile value={projectedEoy.toLocaleString()} label="Projected EOY" />
      </div>
    </div>
  );
}

function StatTile({
  value,
  label,
  highlight = false,
}: {
  value: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-3.5 py-3.5 bg-surface-raised rounded-xl border border-surface-border">
      <div
        className={
          highlight
            ? "text-lg font-bold text-brand font-mono"
            : "text-lg font-bold text-ink font-mono"
        }
      >
        {value}
      </div>
      <div className="text-[10px] text-ink-tertiary font-semibold tracking-wider uppercase mt-0.5">
        {label}
      </div>
    </div>
  );
}
