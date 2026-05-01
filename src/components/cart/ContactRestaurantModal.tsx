"use client";

import { Phone, Mail, ExternalLink, X } from "lucide-react";
import type { CartProfile, Restaurant } from "@/types";

/**
 * Modal that surfaces the Tier 3 restaurant's direct contact info plus a
 * "What to ask" script tailored to the active profile (mentions WeCater,
 * dietary tags, headcount, budget). All three rows are real native links —
 * tel:, mailto:, and an external website.
 */
export function ContactRestaurantModal({
  open,
  restaurant,
  profile,
  onClose,
}: {
  open: boolean;
  restaurant: Restaurant;
  profile: CartProfile;
  onClose: () => void;
}) {
  if (!open) return null;

  const contact = restaurant.contact;
  if (!contact) return null;

  const accent =
    restaurant.brandColorAccent ?? restaurant.brandColor ?? "#5C2D2D";
  const base = restaurant.brandColor ?? "#5C2D2D";

  const dietary = profile.dietaryRestrictions
    .filter((d) => d.count > 0)
    .map((d) => d.tag)
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(20,18,15,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-[520px] max-w-full max-h-[90vh] overflow-y-auto bg-surface-raised rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative px-6 pt-6 pb-5 text-ink-inverse rounded-t-[18px]"
          style={{
            background: `linear-gradient(135deg, ${base}, ${accent})`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 h-7 w-7 rounded-lg bg-white/15 backdrop-blur-md grid place-items-center hover:bg-white/25 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-[10px] font-bold tracking-widest uppercase opacity-85 font-display mb-1">
            Contact directly
          </div>
          <h2 className="text-2xl font-semibold font-display">
            {restaurant.icon} {restaurant.name}
          </h2>
          <div className="text-xs opacity-85 mt-1">{contact.address}</div>
        </div>

        <div className="p-5 flex flex-col gap-2">
          <ContactRow
            icon={<Phone className="h-4 w-4" strokeWidth={2.2} />}
            href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
            label="Call"
            value={contact.phone}
          />
          <ContactRow
            icon={<Mail className="h-4 w-4" strokeWidth={2.2} />}
            href={`mailto:${contact.email}?subject=${encodeURIComponent(
              `Catering inquiry from WeCater (${profile.name})`,
            )}`}
            label="Email"
            value={contact.email}
          />
          <ContactRow
            icon={<ExternalLink className="h-4 w-4" strokeWidth={2.2} />}
            href={`https://${contact.website}`}
            external
            label="Website"
            value={contact.website}
          />
        </div>

        <div className="mx-5 mb-5 px-4 py-3.5 rounded-xl border border-dashed border-brand bg-brand-light">
          <div className="text-[10px] font-bold text-brand tracking-wider uppercase mb-1.5 font-display">
            💡 What to ask
          </div>
          <p className="text-xs text-ink leading-relaxed">
            Mention you&apos;re calling through WeCater — they&apos;ll know your
            dietary requirements{dietary ? ` (${dietary})` : ""} are pre-vetted.
            Confirm {profile.headcount}-person catering and ask if they can match
            your ${profile.budgetTotal} budget.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  href,
  label,
  value,
  external = false,
}: {
  icon: React.ReactNode;
  href: string;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-surface-border bg-surface hover:border-brand hover:bg-brand-light/40 transition-colors"
    >
      <div className="h-9 w-9 rounded-lg bg-brand-light text-brand-dark grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary">
          {label}
        </div>
        <div className="text-sm font-semibold text-ink truncate">{value}</div>
      </div>
      {external && (
        <ExternalLink className="h-3.5 w-3.5 text-ink-tertiary" strokeWidth={2} />
      )}
    </a>
  );
}
