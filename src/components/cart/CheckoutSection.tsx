import type { CartProfile } from "@/types";
import type { CartTotals } from "./math";

/**
 * Sticky bottom checkout panel: three review fields (delivery, time, payment)
 * + a big gradient CTA showing total cost and Bites earned.
 */
export function CheckoutSection({
  profile,
  totals,
  restaurantName,
  onPlaceOrder,
}: {
  profile: CartProfile;
  totals: CartTotals;
  restaurantName: string;
  onPlaceOrder: () => void;
}) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-2xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <ReviewField label="Delivery to" value={profile.deliveryAddress} />
        <ReviewField label="Time" value="Tomorrow at 12:00pm" />
        <ReviewField label="Payment" value="Visa •••• 4242" />
      </div>
      <button
        type="button"
        onClick={onPlaceOrder}
        className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-br from-brand to-brand-dark text-ink-inverse font-bold text-[14px] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 hover:shadow-[0_8px_24px_rgba(232,106,26,0.32)] transition-shadow"
      >
        <span>🍴 Place order at {restaurantName}</span>
        <span className="opacity-85 text-[13px] font-semibold">
          ${totals.subtotal.toFixed(2)} · earn {totals.totalBites.toLocaleString()} Bites
        </span>
      </button>
      <div className="text-[11px] text-ink-tertiary text-center mt-2 leading-snug">
        You&apos;ll be charged when the restaurant confirms · cancel free up to
        2h before delivery
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-surface">
      <div className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary mb-0.5">
        {label}
      </div>
      <div className="text-xs text-ink font-medium truncate">{value}</div>
    </div>
  );
}
