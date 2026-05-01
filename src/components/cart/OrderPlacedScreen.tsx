import { CheckCircle2, RotateCcw } from "lucide-react";
import type { CartLine, CartProfile, Restaurant } from "@/types";
import { calcCartTotals, getMenuItem } from "./math";

/**
 * End-state screen shown after Place Order. Centered card with brand-color
 * hero band, headline, total cost, Bites earned, and a Reset Demo CTA.
 */
export function OrderPlacedScreen({
  restaurant,
  cart,
  profile,
  onReset,
}: {
  restaurant: Restaurant;
  cart: CartLine[];
  profile: CartProfile;
  onReset: () => void;
}) {
  const totals = calcCartTotals(cart, restaurant);
  const heroLine = [...cart].sort((a, b) => b.qty - a.qty)[0];
  const heroItem = heroLine ? getMenuItem(restaurant.id, heroLine.itemId) : null;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] grid place-items-center px-4 py-10 bg-surface">
      <div className="w-[520px] max-w-full bg-surface-raised rounded-[20px] border border-surface-border shadow-lg overflow-hidden">
        <div
          className="relative h-[200px] flex items-end p-5 text-ink-inverse overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${restaurant.brandColor ?? "#1B3A2E"}, ${restaurant.brandColorAccent ?? "#2D5848"})`,
          }}
        >
          <div className="absolute -top-8 -right-8 text-[160px] opacity-30 select-none leading-none">
            {restaurant.icon}
          </div>
          <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-success grid place-items-center text-ink-inverse shadow-md">
            <CheckCircle2 className="h-6 w-6" strokeWidth={2.4} />
          </div>
          <div className="relative z-[1]">
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-85 font-display">
              On the way to {profile.name}
            </div>
            <div className="text-lg font-semibold mt-1">
              {heroLine?.qty ?? 0} × {heroItem?.name ?? "—"}
            </div>
            {cart.length > 1 && (
              <div className="text-xs opacity-85 mt-0.5">
                + {cart.length - 1} other items
              </div>
            )}
          </div>
        </div>

        <div className="px-7 py-6">
          <h2 className="text-2xl font-bold font-display text-ink">
            Order placed at {restaurant.name}
          </h2>
          <p className="text-sm text-ink-secondary mt-1.5">
            {profile.name} · {profile.headcount} people · Tomorrow at 12:00pm to{" "}
            {profile.deliveryAddress}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <Stat
              label="Total charged"
              value={`$${totals.subtotal.toFixed(2)}`}
            />
            <Stat
              label="Bites earned"
              value={`+${totals.totalBites.toLocaleString()}`}
              brand
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            className="mt-6 w-full px-4 py-3 rounded-xl border border-surface-border bg-surface text-ink-secondary font-semibold text-sm flex items-center justify-center gap-2 hover:border-surface-border-strong transition-colors"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
            Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  brand = false,
}: {
  label: string;
  value: string;
  brand?: boolean;
}) {
  return (
    <div className="px-4 py-3 rounded-xl bg-surface">
      <div className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary mb-0.5">
        {label}
      </div>
      <div
        className={
          brand
            ? "text-xl font-bold font-mono text-brand"
            : "text-xl font-bold font-mono text-ink"
        }
      >
        {value}
      </div>
    </div>
  );
}
