"use client";

import { useState } from "react";

export function LanesPanel({ onShowLegal }: { onShowLegal: () => void }) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="px-6 py-5 bg-surface-raised rounded-2xl border border-surface-border">
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <span className="text-sm">🛡️</span>
        <span className="text-[13px] font-bold text-ink font-display tracking-wide">
          Two distinct money lanes — by design
        </span>
        <span className="text-[10px] px-[7px] py-0.5 rounded-[10px] bg-success-light text-success font-bold">
          CMS-COMPLIANT
        </span>
        <button
          type="button"
          onClick={() => setShowHowItWorks((s) => !s)}
          className="ml-auto text-[11px] text-brand font-semibold hover:text-brand-dark transition-colors"
        >
          {showHowItWorks ? "Hide" : "How it works"} →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="relative px-4 py-4 bg-lane-company-bg rounded-xl border border-surface-border">
          <div className="absolute top-2.5 right-3 text-[10px] font-bold text-lane-company tracking-wider uppercase">
            Lane 1
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏢</span>
            <span className="text-[13px] font-semibold text-lane-company font-display">
              Your company pays for the meal
            </span>
          </div>
          <div className="text-[11px] text-ink-tertiary leading-relaxed">
            The full meal cost is charged to your corporate card and reported under{" "}
            <strong className="text-ink">CMS Open Payments</strong> as a transfer of
            value to attending physicians. Standard business expense.
          </div>
        </div>

        <div className="relative px-4 py-4 bg-brand-light rounded-xl border border-brand/20">
          <div className="absolute top-2.5 right-3 text-[10px] font-bold text-brand-dark tracking-wider uppercase">
            Lane 2
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🍴</span>
            <span className="text-[13px] font-semibold text-brand-dark font-display">
              You earn loyalty Bites
            </span>
          </div>
          <div className="text-[11px] text-ink-tertiary leading-relaxed">
            Restaurants offer Bites as a{" "}
            <strong className="text-ink">loyalty incentive</strong> to win your future
            business. Treated as a <strong className="text-ink">rebate</strong>, not
            income — same legal model the airlines use.
          </div>
        </div>
      </div>

      {showHowItWorks && (
        <div className="mt-4 p-4 bg-surface rounded-xl border border-dashed border-surface-border animate-fadeIn">
          <div className="text-xs text-ink-secondary leading-relaxed space-y-3">
            <p>
              <strong className="text-ink">The structure:</strong> Your company pays
              the restaurant directly for catering — that&apos;s a normal business
              expense reported per-physician for compliance. Restaurants on WeCater
              offer Bites as a marketing incentive, similar to how credit cards offer
              points or airlines award miles. The Bites are a discount on future
              spending, paid to <strong>you, the buyer</strong>, never to the company.
            </p>
            <p>
              <strong className="text-ink">The legal model:</strong> Per{" "}
              <button
                type="button"
                onClick={onShowLegal}
                className="text-brand underline font-semibold"
              >
                IRS Announcement 2002-18
              </button>
              , promotional benefits earned through business spending — like
              frequent-flyer miles — are not treated as taxable personal income. Bites
              follow the same rebate doctrine. Always confirm with your employer&apos;s
              expense policy.
            </p>
            <p>
              <strong className="text-ink">What&apos;s tracked:</strong> The meal cost
              goes on your company card and to CMS Open Payments. Bites accrue to
              your personal WeCater account. Two separate ledgers, no commingling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
