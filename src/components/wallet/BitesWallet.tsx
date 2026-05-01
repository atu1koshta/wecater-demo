"use client";

import { useState } from "react";
import {
  EZCATER_COMPARISON,
  MONTHLY_BITES,
  RECENT_ORDERS,
  REDEMPTION_HISTORY,
  RESTAURANT_BUCKETS,
  WALLET,
} from "@/data/wallet";
import { BitesHero } from "./BitesHero";
import { Insights } from "./Insights";
import { LanesPanel } from "./LanesPanel";
import { LegalModal } from "./LegalModal";
import { RecentActivity } from "./RecentActivity";
import { RedeemModal } from "./RedeemModal";
import { WalletStats } from "./WalletStats";

export function BitesWallet() {
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  return (
    <div className="px-4 md:px-7 pt-6 pb-10 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
        <BitesHero wallet={WALLET} onRedeem={() => setRedeemOpen(true)} />
        <WalletStats wallet={WALLET} ez={EZCATER_COMPARISON} />
      </div>

      <div className="mb-4">
        <LanesPanel onShowLegal={() => setLegalOpen(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <RecentActivity orders={RECENT_ORDERS} />
        <Insights
          monthly={MONTHLY_BITES}
          buckets={RESTAURANT_BUCKETS}
          redemptions={REDEMPTION_HISTORY}
        />
      </div>

      {/* IRS rebate FAQ banner */}
      <div className="mt-6 p-4 rounded-xl border border-info/20 bg-info-light flex items-center gap-3 flex-wrap">
        <span className="text-2xl">💡</span>
        <div className="flex-1 min-w-[260px]">
          <div className="text-xs font-semibold text-info mb-0.5">
            &ldquo;My company pays for the food. Are these Bites taxable income to
            me?&rdquo;
          </div>
          <div className="text-[11px] text-ink-secondary leading-relaxed">
            <strong>No.</strong> Per IRS Announcement 2002-18, promotional benefits
            earned through business spending — like frequent-flyer miles or loyalty
            points — are treated as a rebate on the original purchase, not personal
            income. WeCater Bites follow the same model.{" "}
            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="text-info underline font-semibold"
            >
              Read the legal note →
            </button>
          </div>
        </div>
      </div>

      {redeemOpen && (
        <RedeemModal
          availableBites={WALLET.bites}
          buckets={RESTAURANT_BUCKETS}
          onClose={() => setRedeemOpen(false)}
        />
      )}
      {legalOpen && <LegalModal onClose={() => setLegalOpen(false)} />}
    </div>
  );
}
