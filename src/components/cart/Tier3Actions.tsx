"use client";

import { Phone, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

export type QuoteStatus = "idle" | "sent";

/**
 * The two big no-commit actions under a Tier 3 cart: Contact restaurant
 * (neutral outline) and Send quote request (brand-orange filled). Once the
 * user has fired off a quote, the second button locks into a "✓ Quote
 * request sent" state.
 */
export function Tier3Actions({
  quoteStatus,
  onContact,
  onRequestQuote,
}: {
  quoteStatus: QuoteStatus;
  onContact: () => void;
  onRequestQuote: () => void;
}) {
  const sent = quoteStatus === "sent";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={onContact}
        className="px-4 py-3 rounded-xl border border-surface-border bg-surface-raised text-ink font-semibold text-sm flex items-center justify-center gap-2 hover:border-surface-border-strong transition-colors"
      >
        <Phone className="h-4 w-4" strokeWidth={2.2} />
        Contact restaurant
      </button>
      <button
        type="button"
        onClick={onRequestQuote}
        disabled={sent}
        className={cn(
          "px-4 py-3 rounded-xl text-ink-inverse font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(232,106,26,0.25)]",
          sent
            ? "bg-success cursor-not-allowed shadow-none"
            : "bg-gradient-to-br from-brand to-brand-dark hover:shadow-brand cursor-pointer",
        )}
      >
        <FileText className="h-4 w-4" strokeWidth={2.2} />
        {sent ? "✓ Quote request sent" : "Send quote request"}
      </button>
      <div className="md:col-span-2 text-[11px] text-ink-tertiary text-center mt-1 leading-snug">
        No commitment · we&apos;ll email the restaurant on your behalf · Bites
        earned only after they activate
      </div>
    </div>
  );
}
