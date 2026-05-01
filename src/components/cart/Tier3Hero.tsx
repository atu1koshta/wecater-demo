import type { CartProfile, Restaurant } from "@/types";

/**
 * Tier 3 hero — replaces the brand gradient with a dashed-border banner so it
 * visually reads as "discovery, not yet activated". Source attribution is
 * front-and-centre to manage expectations (menu data may be stale, prices
 * estimated). No Bites forecast — instead a "you'd earn ~X if activated" line.
 */
export function Tier3Hero({
  restaurant,
  profile,
}: {
  restaurant: Restaurant;
  profile: CartProfile;
}) {
  const source =
    typeof restaurant.sourceData === "string"
      ? restaurant.sourceData
      : `Menu data from ${restaurant.sourceData?.source ?? "Yelp"} · last scraped ${restaurant.sourceData?.lastScraped ?? "recently"}`;

  // Estimate using mid-point of estimatedCart price ranges (fallback: pp * headcount)
  const estPpMin =
    restaurant.estimatedCart?.reduce((s, l) => s + l.ppMin, 0) ?? restaurant.ppEstimate;
  const estPpMax =
    restaurant.estimatedCart?.reduce((s, l) => s + l.ppMax, 0) ?? restaurant.ppEstimate;
  const totalMin = (estPpMin * profile.headcount).toFixed(0);
  const totalMax = (estPpMax * profile.headcount).toFixed(0);

  const subtotalEst = ((Number(totalMin) + Number(totalMax)) / 2);
  const estBites = Math.round(subtotalEst * (restaurant.estimatedBaseRate ?? 5));

  return (
    <div className="relative rounded-2xl px-5 md:px-7 py-5 bg-[#FCFAF7] border-[1.5px] border-dashed border-ink-tertiary/40">
      <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-surface-raised text-ink-secondary border border-dashed border-ink-tertiary/55 text-[10px] font-bold tracking-wider uppercase font-display">
        📍 Discovery option
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-4 md:mt-1">
        <div className="flex items-start gap-4 min-w-0">
          <div className="h-14 w-14 rounded-2xl bg-surface grid place-items-center text-3xl shrink-0 border border-dashed border-ink-tertiary/40 saturate-75">
            {restaurant.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-widest uppercase text-ink-tertiary font-display mb-0.5">
              Considering
            </div>
            <h1 className="font-display font-semibold text-2xl md:text-[28px] leading-tight tracking-tight text-ink">
              {restaurant.name}
            </h1>
            <div className="text-xs text-ink-tertiary mt-1">{source}</div>
            {restaurant.quoteResponseHours && (
              <div className="text-xs text-ink-tertiary mt-0.5">
                Quote-only · ~{restaurant.quoteResponseHours}h response
              </div>
            )}
          </div>
        </div>

        <div className="text-left md:text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-border-light text-ink-secondary text-[11px] font-semibold mb-1.5">
            {profile.icon} {profile.name}
          </div>
          <div className="flex items-baseline gap-1.5 md:justify-end text-ink-secondary">
            <span className="text-[10px] italic">Est.</span>
            <span className="text-2xl md:text-3xl font-bold font-display tracking-tight">
              ~{estBites.toLocaleString()}
            </span>
            <span className="text-xs">Bites if activated</span>
          </div>
          <div className="text-[11px] text-ink-tertiary md:text-right">
            ${totalMin}–${totalMax} estimated · 📍 Not yet partnered
          </div>
        </div>
      </div>
    </div>
  );
}
