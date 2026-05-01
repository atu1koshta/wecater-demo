"use client";

import { useEffect, useState } from "react";
import { X, FileText, Mail, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CartProfile, Restaurant } from "@/types";

type Step = "review" | "sent" | "pdf";

/**
 * Three-state modal for the Tier 3 quote-request flow:
 *  - review: auto-populated event details + dietary chips, send to confirm
 *  - sent: green check + WC-2026-04XX-XXXX reference + "Open PDF preview"
 *  - pdf: Adobe-Reader-style grey backdrop framing a serif (Georgia) document
 *    that mocks a real B2B catering quote (header, "QUOTE REQUEST" title,
 *    Sent To / Requested By, event details box, dietary bulleted with
 *    individual names, "What we need from {restaurant}" checklist, footer).
 */
export function QuoteRequestModal({
  open,
  restaurant,
  profile,
  onClose,
  onSent,
}: {
  open: boolean;
  restaurant: Restaurant;
  profile: CartProfile;
  onClose: () => void;
  onSent: (quoteRef: string) => void;
}) {
  const [step, setStep] = useState<Step>("review");
  const [quoteRef] = useState(
    () =>
      `WC-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, "0")}-${restaurant.id.slice(0, 4).toUpperCase()}`,
  );

  useEffect(() => {
    if (open) setStep("review");
  }, [open]);

  if (!open) return null;

  const widthClass = step === "pdf" ? "w-[720px]" : "w-[560px]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(20,18,15,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className={cn(
          "max-w-full max-h-[92vh] overflow-y-auto bg-surface-raised rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-scaleIn",
          widthClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "review" && (
          <ReviewStep
            restaurant={restaurant}
            profile={profile}
            quoteRef={quoteRef}
            onClose={onClose}
            onSend={() => {
              setStep("sent");
              onSent(quoteRef);
            }}
          />
        )}
        {step === "sent" && (
          <SentStep
            restaurant={restaurant}
            quoteRef={quoteRef}
            onOpenPdf={() => setStep("pdf")}
            onClose={onClose}
          />
        )}
        {step === "pdf" && (
          <PdfPreview
            restaurant={restaurant}
            profile={profile}
            quoteRef={quoteRef}
            onBack={() => setStep("sent")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  restaurant,
  profile,
  quoteRef,
  onClose,
  onSend,
}: {
  restaurant: Restaurant;
  profile: CartProfile;
  quoteRef: string;
  onClose: () => void;
  onSend: () => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDate = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <div className="px-6 pt-6 flex justify-between items-start gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-brand font-display mb-1">
            Quote request · review
          </div>
          <h2 className="text-xl font-semibold font-display text-ink">
            Send to {restaurant.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-lg bg-surface text-ink-secondary grid place-items-center hover:bg-surface-border-light transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        <Field label="Recipient">
          <div>{restaurant.name}</div>
          {restaurant.contact?.email && (
            <div className="text-ink-secondary text-[11px]">{restaurant.contact.email}</div>
          )}
        </Field>
        <Field label="Quote ref">
          <span className="font-mono text-[12px]">{quoteRef}</span>
        </Field>
        <Field label="Event date">{eventDate} · lunch</Field>
        <Field label="Headcount + budget">
          {profile.headcount} people · ${profile.budgetTotal} (${profile.budgetPerPerson}/pp)
        </Field>
        <Field label="Delivery to">{profile.deliveryAddress}</Field>
        <Field label="Response by">
          ~{restaurant.quoteResponseHours ?? 24}h SLA · email
        </Field>

        <div className="col-span-2 px-3.5 py-3 rounded-xl bg-brand-light border border-dashed border-brand/40 text-xs text-ink-secondary leading-relaxed">
          <strong className="text-ink">Restaurant enters our partner activation
          pipeline.</strong>{" "}
          If they sign up, you&apos;ll see them as a Tier 1 partner next time you
          search.
        </div>
      </div>

      <div className="px-6 py-4 bg-surface border-t border-surface-border flex justify-end items-center gap-3">
        <button
          type="button"
          onClick={onSend}
          className="px-5 py-2.5 rounded-[10px] bg-brand text-ink-inverse text-[13px] font-semibold hover:bg-brand-dark transition-colors flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2.4} />
          Send quote request
        </button>
      </div>
    </>
  );
}

function SentStep({
  restaurant,
  quoteRef,
  onOpenPdf,
  onClose,
}: {
  restaurant: Restaurant;
  quoteRef: string;
  onOpenPdf: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <div className="h-16 w-16 rounded-2xl mx-auto mb-5 bg-success-light grid place-items-center text-success animate-scaleIn">
        <CheckCircle2 className="h-9 w-9" strokeWidth={2.2} />
      </div>
      <h2 className="text-xl font-semibold font-display text-ink mb-2">
        Sent to {restaurant.name}
      </h2>
      <p className="text-[13px] text-ink-secondary mb-4 leading-relaxed">
        Awaiting response · ~{restaurant.quoteResponseHours ?? 24}h SLA. We&apos;ll
        notify you when they reply.
      </p>
      <div className="inline-block px-4 py-2 bg-surface rounded-[10px] text-xs text-ink-secondary mb-6">
        Quote ref{" "}
        <strong className="text-ink font-mono">{quoteRef}</strong>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          type="button"
          onClick={onOpenPdf}
          className="px-5 py-2.5 rounded-[10px] border border-surface-border bg-surface-raised text-ink text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:border-brand hover:text-brand transition-colors"
        >
          <FileText className="h-4 w-4" strokeWidth={2.2} />
          Open PDF preview
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-[10px] bg-ink text-ink-inverse text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function PdfPreview({
  restaurant,
  profile,
  quoteRef,
  onBack,
  onClose,
}: {
  restaurant: Restaurant;
  profile: CartProfile;
  quoteRef: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const dietary = profile.dietaryRestrictions.filter(
    (d) => d.count > 0 || d.source === "told",
  );

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 bg-[#3a3a3a] text-white rounded-t-[18px]">
        <div className="flex items-center gap-2 text-xs">
          <FileText className="h-4 w-4" strokeWidth={2.2} />
          <span className="font-mono">{quoteRef}.pdf</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] text-white/85 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 rounded grid place-items-center hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-[#525659] px-6 py-6 rounded-b-[18px]">
        <div
          className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] mx-auto max-w-[640px] px-12 py-10 text-[13px] leading-relaxed text-[#1A1714]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5DCD0]">
            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-brand to-brand-dark grid place-items-center">
              <span className="text-white text-base font-bold">W</span>
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">WeCater</div>
              <div className="text-[11px] text-[#6B6560]">Catering Rewards Marketplace</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#9C958E]">
                Quote ref
              </div>
              <div className="font-mono text-xs text-[#1A1714]">{quoteRef}</div>
            </div>
          </div>

          <h1 className="font-bold text-[22px] tracking-tight mt-5 mb-4">
            QUOTE REQUEST
          </h1>

          <div className="grid grid-cols-2 gap-6 mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#9C958E] mb-1">
                Sent to
              </div>
              <div className="font-semibold">{restaurant.name}</div>
              {restaurant.contact?.address && (
                <div className="text-[12px] text-[#6B6560]">
                  {restaurant.contact.address}
                </div>
              )}
              {restaurant.contact?.email && (
                <div className="text-[12px] text-[#6B6560]">
                  {restaurant.contact.email}
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#9C958E] mb-1">
                Requested by
              </div>
              <div className="font-semibold">Sally Chen</div>
              <div className="text-[12px] text-[#6B6560]">
                via WeCater AI Concierge
              </div>
              <div className="text-[12px] text-[#6B6560]">
                For: {profile.name}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-[#FAF7F2] border border-[#E5DCD0] rounded mb-5">
            <div className="text-[10px] uppercase tracking-wider text-[#9C958E] mb-1.5">
              Event details
            </div>
            <table className="w-full text-[12px]">
              <tbody>
                <tr>
                  <td className="py-0.5 text-[#6B6560] w-32">Date</td>
                  <td>Tomorrow, lunch</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-[#6B6560]">Headcount</td>
                  <td>{profile.headcount} people</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-[#6B6560]">Budget</td>
                  <td>${profile.budgetTotal} total (${profile.budgetPerPerson}/pp)</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-[#6B6560]">Setup</td>
                  <td>Lunch · pickup or delivery</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-[#6B6560]">Delivery to</td>
                  <td>{profile.deliveryAddress}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {dietary.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-wider text-[#9C958E] mb-1.5">
                Dietary requirements
              </div>
              <ul className="list-disc pl-5 text-[12px] space-y-0.5">
                {dietary.map((d) => (
                  <li key={d.tag}>
                    <strong>{d.tag}</strong>
                    {d.count > 0 && ` × ${d.count}`}
                    {d.individuals?.length
                      ? ` — ${d.individuals.join(", ")}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-wider text-[#9C958E] mb-1.5">
              What we need from {restaurant.name}
            </div>
            <ol className="list-decimal pl-5 text-[12px] space-y-1">
              <li>Proposed menu meeting the dietary requirements above.</li>
              <li>Itemized pricing for {profile.headcount} people.</li>
              <li>Delivery confirmation and setup notes.</li>
              <li>Order minimums or restrictions we should know.</li>
              <li>Reply by email to{" "}
                <span className="font-mono">quotes@wecater.com</span>{" "}
                (we&apos;ll route to Sally).</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-[#E5DCD0] text-[11px] text-[#6B6560] leading-relaxed">
            <strong>About WeCater:</strong> If {restaurant.name} accepts catering
            orders through our marketplace, we offer Stripe Connect onboarding,
            no monthly fees, and reps like Sally see your menu first when their
            office has matching dietary needs.
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[10px] bg-white text-ink text-[13px] font-semibold hover:bg-surface transition-colors"
          >
            Close preview
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase mb-1">
        {label}
      </div>
      <div className="text-[13px] text-ink">{children}</div>
    </div>
  );
}
