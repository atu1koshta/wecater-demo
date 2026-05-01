import type { Restaurant } from "@/types";

export function Tier3LightCart({ restaurant }: { restaurant: Restaurant }) {
  const lines = restaurant.estimatedCart ?? [];
  const ppMin = lines.reduce((s, l) => s + l.ppMin, 0);
  const ppMax = lines.reduce((s, l) => s + l.ppMax, 0);
  const estimatedBites = restaurant.estimatedBaseRate
    ? Math.round(((ppMin + ppMax) / 2) * 14 * restaurant.estimatedBaseRate * 10)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary panel */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryTile label="Est. price range" value={`$${ppMin.toFixed(0)}–$${ppMax.toFixed(0)}/pp`} />
        <SummaryTile label="Est. Bites" value={estimatedBites > 0 ? `~${estimatedBites.toLocaleString()}` : "TBD"} accent />
        <SummaryTile label="Status" value="Not yet partnered" warn />
      </div>

      {/* Line items */}
      <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🍽️</span>
          <span className="text-xs font-bold text-ink font-display tracking-wide uppercase">
            Estimated cart
          </span>
          <span className="ml-auto text-[10px] text-ink-tertiary italic">
            Quantities and modifiers confirmed via quote
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {lines.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-ink-tertiary">
              No estimated items available — request a quote for a tailored menu.
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.id}
                className="px-3.5 py-3 rounded-xl border border-dashed border-ink-tertiary/40 bg-surface flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-ink mb-0.5">
                    {line.desc}
                  </div>
                  <div className="text-[11px] text-ink-secondary leading-snug mb-1">
                    {line.detail}
                  </div>
                  <div className="text-[10px] text-ink-tertiary">{line.coverage}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-mono font-semibold text-ink-secondary">
                    ${line.ppMin.toFixed(2)}–${line.ppMax.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-ink-tertiary">/pp range</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-ink-tertiary italic px-1">
        This is an estimate based on category averages from public menu data. Actual pricing and
        availability confirmed via the quote process.
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-surface-border text-center">
      <div className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase mb-1">
        {label}
      </div>
      <div className={`text-[13px] font-semibold ${accent ? "text-brand" : warn ? "text-warning" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
