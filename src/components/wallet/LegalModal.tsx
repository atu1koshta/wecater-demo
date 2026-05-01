"use client";

import { X } from "lucide-react";

export function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(26,23,20,0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-[540px] max-w-full max-h-[85vh] overflow-y-auto bg-surface-raised rounded-[18px] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 gap-3">
          <h2 className="text-lg font-semibold font-display text-ink">
            Legal &amp; Tax Note
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-surface text-ink-secondary grid place-items-center hover:bg-surface-border-light transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-[13px] text-ink leading-relaxed space-y-3">
          <p>
            <strong>IRS Announcement 2002-18:</strong> The IRS has stated it will
            not pursue tax enforcement on the personal use of frequent-flyer miles
            or other in-kind promotional benefits earned through business or
            official travel. The same rebate doctrine applies broadly to loyalty
            points earned on business spending — including catering loyalty
            programs.
          </p>
          <p>
            <strong>Rebate doctrine:</strong> Loyalty points (including WeCater
            Bites) are treated as a discount on the original purchase price rather
            than taxable income to the recipient. This is the same legal framework
            used by airlines, hotels, and credit card rewards programs.
          </p>
          <p>
            <strong>Employer policy:</strong> Some employers have policies
            addressing whether employees may keep loyalty rewards earned on
            business spending. Always check your company&apos;s expense
            reimbursement and gifts/perks policy. WeCater does not direct or
            interpret your employer&apos;s policy on your behalf.
          </p>
          <p>
            <strong>CMS Open Payments:</strong> Pharmaceutical companies are
            required to report transfers of value to physicians (including catered
            meals) under the Sunshine Act. The full meal cost is what&apos;s
            reported — not the Bites you earn. Bites are a separate vendor-to-buyer
            loyalty incentive and do not affect Open Payments reporting.
          </p>
          <p className="text-[11px] text-ink-tertiary italic mt-4">
            This is informational only and not tax or legal advice. Consult your
            tax advisor for your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
}
