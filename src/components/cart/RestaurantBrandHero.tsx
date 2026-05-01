import { cn } from "@/lib/cn";
import type { CartProfile, Restaurant } from "@/types";
import type { CartTotals } from "./math";

/**
 * Tier 1 hero. Full-width gradient using the restaurant's brand color (or a
 * neutral fallback). Renders the restaurant identity, the active profile chip,
 * and a topline Bites forecast pinned to the right.
 */
export function RestaurantBrandHero({
  restaurant,
  profile,
  totals,
}: {
  restaurant: Restaurant;
  profile: CartProfile;
  totals: CartTotals;
}) {
  const accent =
    restaurant.brandColorAccent ?? restaurant.brandColor ?? "#2D5848";
  const base = restaurant.brandColor ?? "#1B3A2E";

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 md:px-7 py-5 md:py-6 text-ink-inverse"
      style={{
        background: `linear-gradient(135deg, ${base} 0%, ${accent} 100%)`,
      }}
    >
      <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_70%)]" />
      <div className="relative z-[1] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={cn(
              "h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md grid place-items-center text-3xl shrink-0",
            )}
          >
            {restaurant.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-85 font-display mb-0.5">
              Considering
            </div>
            <h1 className="font-display font-semibold text-2xl md:text-[28px] leading-tight tracking-tight">
              {restaurant.name}
            </h1>
            <div className="text-xs opacity-85 mt-1 flex flex-wrap gap-x-2 gap-y-1">
              <span>{restaurant.cuisine}</span>
              <span>·</span>
              <span>
                {restaurant.rating?.toFixed(1) ?? "—"}★
                {restaurant.reviewCount
                  ? ` (${restaurant.reviewCount.toLocaleString()})`
                  : ""}
              </span>
              <span>·</span>
              <span>{restaurant.baseRate}X base rate</span>
              {restaurant.sameDay && (
                <>
                  <span>·</span>
                  <span>⚡ Same-day</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold mb-1.5">
            {profile.icon} {profile.name}
          </div>
          <div className="flex items-baseline gap-1.5 md:justify-end">
            <span className="text-3xl font-bold font-display tracking-tight">
              {totals.totalBites.toLocaleString()}
            </span>
            <span className="text-xs opacity-85">Bites · ≈ ${(totals.totalBites / 100).toFixed(2)}</span>
          </div>
          <div className="text-[10px] opacity-80 md:text-right">
            {restaurant.baseRate}X base + Welcome 2X
          </div>
        </div>
      </div>
    </div>
  );
}
