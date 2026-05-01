import type { Restaurant } from "@/types";

/**
 * Dashed-border line items rendered for a Tier 3 restaurant. No qty steppers,
 * no modifiers — just generic categories from the restaurant's `estimatedCart`
 * with per-line price ranges. This is the visual cue that the user is
 * pre-partnership: WeCater hasn't ingested this restaurant's real menu yet.
 */
export function Tier3LightCart({ restaurant }: { restaurant: Restaurant }) {
  const lines = restaurant.estimatedCart ?? [];

  return (
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
  );
}
