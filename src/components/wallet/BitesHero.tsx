"use client";

import { Utensils } from "lucide-react";
import type { Wallet } from "@/types";
import { CountUp } from "./atoms";

export function BitesHero({
  wallet,
  onRedeem,
}: {
  wallet: Wallet;
  onRedeem: () => void;
}) {
  const dollarValue = wallet.bites / 100;
  const welcomePct = (wallet.welcomeBonusEarned / wallet.welcomeBonusCap) * 100;

  return (
    <div className="relative overflow-hidden rounded-[20px] px-7 py-7 text-ink-inverse shadow-[0_8px_32px_rgba(232,106,26,0.18)] bg-gradient-to-br from-brand to-brand-dark">
      <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-7 -left-7 w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />

      <div className="relative z-[1]">
        <div className="flex items-center justify-between mb-3.5 gap-3 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-widest font-display opacity-90">
            Your Bites Balance
          </span>
          {wallet.welcomeActive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full backdrop-blur-md text-[11px] font-semibold">
              🎁 Welcome 2X · {wallet.welcomeDaysRemaining}d left
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="text-5xl md:text-[56px] font-bold font-display leading-none tracking-tight">
            <CountUp value={wallet.bites} />
          </span>
          <span className="text-lg font-semibold opacity-85 font-display">Bites</span>
        </div>
        <div className="text-[13px] opacity-85 mb-5">
          ≈ <strong>${dollarValue.toFixed(2)}</strong> at 1X · up to{" "}
          <strong>${(dollarValue * 1.5).toFixed(2)}</strong> with Restaurant Boost
          {" · "}
          {wallet.pendingBites.toLocaleString()} pending
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onRedeem}
            className="px-5 py-3 rounded-xl bg-white text-brand font-bold text-[13px] flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-px transition-transform"
          >
            <Utensils className="h-4 w-4" strokeWidth={2.4} />
            Redeem Bites
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-xl border border-white/30 bg-white/10 text-ink-inverse text-[13px] font-medium backdrop-blur-md hover:bg-white/15 transition-colors"
          >
            Auto-redeem at 5,000 Bites
          </button>
        </div>

        {wallet.welcomeActive && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex justify-between text-[11px] mb-1.5 opacity-90 gap-3 flex-wrap">
              <span>
                🎁 <strong>Welcome 2X accelerator</strong> ·{" "}
                {wallet.welcomeDaysRemaining} days remaining
              </span>
              <span className="font-mono">
                {wallet.welcomeBonusEarned.toLocaleString()} /{" "}
                {wallet.welcomeBonusCap.toLocaleString()} bonus
              </span>
            </div>
            <div className="h-1.5 rounded-[3px] bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-[3px] bg-white transition-[width] duration-1000"
                style={{ width: `${welcomePct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
