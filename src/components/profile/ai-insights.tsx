import type { ReactNode } from "react";

/**
 * Per-profile insight strings rendered by the right-rail "Concierge has noticed"
 * card. Returns null for profiles without a tailored message — the caller falls
 * back to a generic "steady relationship" line.
 */
export function getInsightForProfile(profileId: string): ReactNode | null {
  switch (profileId) {
    case "patel":
      return (
        <>
          Last 3 orders all $14–16/pp — your sweet spot. Avoid Asian cuisines
          this week (used twice in April). The Pfizer rep brought sushi 6 days
          ago — go contrasting.
        </>
      );
    case "morrison":
      return (
        <>
          Dr. Morrison at <strong className="text-warning">$84.25 YTD</strong>.
          Next order should be ≤ $15.75 to stay compliant. Suggested: Bobby Q
          ($14/pp) or Oregano&apos;s pizza ($13/pp).
        </>
      );
    case "phx-heart":
      return (
        <>
          First visit on May 5.{" "}
          <strong className="text-warning">No dietary info yet</strong> — ask
          Tina at check-in. Plan a safe-bet order: Mediterranean or Mexican
          (broad appeal).
        </>
      );
    default:
      return null;
  }
}

export const FALLBACK_INSIGHT =
  "Steady relationship. Last order pattern suggests trying something new for variety on the next visit.";
