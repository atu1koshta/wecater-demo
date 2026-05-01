"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RedemptionRouteId, RestaurantBucket } from "@/types";
import { ROUTE_MIN } from "@/data/wallet";
import { RouteRadio } from "./atoms";

export function RedeemModal({
  availableBites,
  buckets,
  onClose,
}: {
  availableBites: number;
  buckets: RestaurantBucket[];
  onClose: () => void;
}) {
  const [step, setStep] = useState<0 | 1>(0);
  const [route, setRoute] = useState<RedemptionRouteId>("amazon");
  const [bites, setBites] = useState(5000);
  const [restaurant, setRestaurant] = useState<RestaurantBucket | null>(null);

  const wecaterLocked = bites < ROUTE_MIN.wecater;

  const presets = useMemo(
    () => [
      1000,
      2500,
      5000,
      Math.min(10000, availableBites - (availableBites % 100)),
    ],
    [availableBites],
  );

  const valueAtRoute = useMemo(() => {
    if (route === "amazon") return bites / 100;
    if (route === "wecater") return (bites / 100) * 1.2;
    if (route === "boost" && restaurant) {
      return (bites / 100) * restaurant.boostMultiplier;
    }
    return 0;
  }, [bites, route, restaurant]);

  // If user lowers below the WeCater floor while it's selected, fall back to Amazon.
  useEffect(() => {
    if (route === "wecater" && wecaterLocked) setRoute("amazon");
  }, [route, wecaterLocked]);

  const boostable = useMemo(
    () => buckets.filter((b) => b.boostable && b.earnedBites >= 1000),
    [buckets],
  );

  const minForRoute = ROUTE_MIN[route];
  const canRedeem =
    bites >= minForRoute && (route !== "boost" || restaurant !== null);

  return (
    <div
      className="fixed inset-0 bg-surface-overlay z-[100] flex items-center justify-center animate-fadeIn p-4"
      style={{ background: "rgba(26,23,20,0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-[520px] max-w-full max-h-[90vh] overflow-y-auto bg-surface-raised rounded-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 0 ? (
          <RedeemPicker
            availableBites={availableBites}
            bites={bites}
            setBites={setBites}
            presets={presets}
            route={route}
            setRoute={setRoute}
            restaurant={restaurant}
            setRestaurant={setRestaurant}
            wecaterLocked={wecaterLocked}
            valueAtRoute={valueAtRoute}
            boostable={boostable}
            canRedeem={canRedeem}
            onClose={onClose}
            onConfirm={() => setStep(1)}
          />
        ) : (
          <RedeemConfirmation
            route={route}
            bites={bites}
            valueAtRoute={valueAtRoute}
            restaurant={restaurant}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function RedeemPicker({
  availableBites,
  bites,
  setBites,
  presets,
  route,
  setRoute,
  restaurant,
  setRestaurant,
  wecaterLocked,
  valueAtRoute,
  boostable,
  canRedeem,
  onClose,
  onConfirm,
}: {
  availableBites: number;
  bites: number;
  setBites: (b: number) => void;
  presets: number[];
  route: RedemptionRouteId;
  setRoute: (r: RedemptionRouteId) => void;
  restaurant: RestaurantBucket | null;
  setRestaurant: (r: RestaurantBucket) => void;
  wecaterLocked: boolean;
  valueAtRoute: number;
  boostable: RestaurantBucket[];
  canRedeem: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <div className="px-6 pt-6 flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl font-semibold font-display text-ink">
            Redeem Bites
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Available:{" "}
            <strong className="text-ink font-mono">
              {availableBites.toLocaleString()} Bites
            </strong>{" "}
            · ${(availableBites / 100).toFixed(2)} base value
          </p>
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

      <div className="p-6">
        <div className="text-[11px] font-bold text-ink-tertiary tracking-wider uppercase mb-2.5">
          Choose amount
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presets.map((p) => {
            const on = bites === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setBites(p)}
                className={cn(
                  "px-2 py-3 rounded-[10px] font-display font-semibold text-[13px] border-[1.5px] transition-all",
                  on
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-surface-border bg-surface-raised text-ink hover:border-surface-border-strong",
                )}
              >
                <div className="font-mono">{p.toLocaleString()}</div>
                <div className="text-[10px] text-ink-tertiary mt-0.5 font-body font-medium">
                  ${(p / 100).toFixed(0)}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-bold text-ink-tertiary tracking-wider uppercase mb-2.5">
          Redemption route
        </div>

        {/* WeCater catering credit — gated at 2,500 Bites */}
        <RouteButton
          icon={wecaterLocked ? "🔒" : "🍴"}
          title="WeCater catering credit"
          badge={wecaterLocked ? "LOCKED" : "1.2X BONUS"}
          badgeTone={wecaterLocked ? "muted" : "brand"}
          selected={route === "wecater"}
          disabled={wecaterLocked}
          onClick={() => !wecaterLocked && setRoute("wecater")}
          subtitle={
            wecaterLocked ? (
              <>
                Save up to <strong>2,500 Bites</strong> to unlock the 1.2X bonus on
                WeCater catering credit
              </>
            ) : (
              <>
                Use Bites toward your next WeCater order at any restaurant ·{" "}
                {bites.toLocaleString()} Bites = ${((bites / 100) * 1.2).toFixed(2)}{" "}
                of credit
              </>
            )
          }
          subtitleTone={wecaterLocked ? "warning" : "tertiary"}
        />

        {/* Restaurant Boost */}
        <RouteButton
          icon="🚀"
          title="Restaurant Boost"
          badge="UP TO 1.5X"
          badgeTone="purple"
          selected={route === "boost"}
          onClick={() => {
            setRoute("boost");
            if (!restaurant && boostable.length > 0) setRestaurant(boostable[0]);
          }}
          subtitle={
            <>
              Spend at a restaurant where you earned Bites — they boost the
              redemption rate
            </>
          }
        />

        {route === "boost" && (
          <div className="mb-2 p-2.5 bg-surface rounded-lg animate-fadeIn">
            <div className="text-[10px] text-ink-tertiary mb-1.5 font-semibold tracking-wider uppercase">
              Pick a restaurant
            </div>
            <div className="flex flex-wrap gap-1.5">
              {boostable.map((r) => {
                const on = restaurant?.name === r.name;
                return (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => setRestaurant(r)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border text-[11px] text-ink flex items-center gap-1.5 transition-all",
                      on
                        ? "border-brand bg-brand-light"
                        : "border-surface-border bg-surface-raised hover:border-surface-border-strong",
                    )}
                  >
                    <span>{r.icon}</span>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-accent-purple font-bold font-mono text-[10px]">
                      {r.boostMultiplier}X
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Amazon */}
        <RouteButton
          icon="📦"
          title="Amazon Gift Card"
          selected={route === "amazon"}
          onClick={() => setRoute("amazon")}
          subtitle={
            <>Sent to your personal email · standard 1.0X rate · min 1,000 Bites</>
          }
        />

        {/* Summary */}
        <div className="mt-4 p-3.5 rounded-[10px] bg-gradient-to-br from-brand to-brand-dark text-ink-inverse">
          <div className="text-[10px] font-bold tracking-wider uppercase opacity-90 mb-1">
            You&apos;ll get
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[26px] font-bold font-display">
              ${valueAtRoute.toFixed(2)}
            </span>
            <span className="text-xs opacity-85">
              for {bites.toLocaleString()} Bites
              {route !== "amazon" && (
                <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-white/20 font-bold">
                  +${(valueAtRoute - bites / 100).toFixed(2)} bonus
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-surface border-t border-surface-border flex justify-between items-center gap-3 flex-wrap">
        <span className="text-[11px] text-ink-secondary">
          Reported as a rebate, not income
        </span>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canRedeem}
          className={cn(
            "px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-ink-inverse transition-colors",
            canRedeem
              ? "bg-brand hover:bg-brand-dark cursor-pointer"
              : "bg-surface-border cursor-not-allowed",
          )}
        >
          Redeem {bites.toLocaleString()} Bites →
        </button>
      </div>
    </div>
  );
}

function RouteButton({
  icon,
  title,
  badge,
  badgeTone = "brand",
  subtitle,
  subtitleTone = "tertiary",
  selected,
  disabled = false,
  onClick,
}: {
  icon: string;
  title: string;
  badge?: string;
  badgeTone?: "brand" | "muted" | "purple";
  subtitle: React.ReactNode;
  subtitleTone?: "tertiary" | "warning";
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const badgeClass =
    badgeTone === "brand"
      ? "bg-brand text-ink-inverse"
      : badgeTone === "purple"
        ? "bg-accent-purple text-ink-inverse"
        : "bg-ink-tertiary text-ink-inverse";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full px-3.5 py-3.5 rounded-[10px] mb-1.5 text-left flex items-center gap-3 border-[1.5px] transition-colors relative",
        selected
          ? "border-brand bg-brand-light"
          : "border-surface-border bg-surface-raised hover:border-surface-border-strong",
        disabled && "opacity-65 cursor-not-allowed border-surface-border-light",
      )}
    >
      <span className="text-[22px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-semibold text-ink">{title}</span>
          {badge && (
            <span
              className={cn(
                "text-[9px] px-1.5 py-px rounded font-bold tracking-wider",
                badgeClass,
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          className={cn(
            "text-[11px] mt-0.5 leading-snug",
            subtitleTone === "warning" ? "text-warning" : "text-ink-tertiary",
          )}
        >
          {subtitle}
        </div>
      </div>
      {!disabled && <RouteRadio selected={selected} />}
    </button>
  );
}

function RedeemConfirmation({
  route,
  bites,
  valueAtRoute,
  restaurant,
  onClose,
}: {
  route: RedemptionRouteId;
  bites: number;
  valueAtRoute: number;
  restaurant: RestaurantBucket | null;
  onClose: () => void;
}) {
  const message =
    route === "wecater"
      ? `$${valueAtRoute.toFixed(2)} in WeCater credit added to your account.`
      : route === "boost"
        ? `${bites.toLocaleString()} Bites locked in for your next ${restaurant?.name} order at ${restaurant?.boostMultiplier}X.`
        : `$${valueAtRoute.toFixed(2)} Amazon code sent to your personal email.`;

  return (
    <div className="px-6 py-10 text-center">
      <div className="h-16 w-16 rounded-2xl mx-auto mb-5 bg-success-light grid place-items-center text-3xl animate-scaleIn">
        ✅
      </div>
      <h2 className="text-xl font-semibold font-display text-ink mb-2">
        Redemption complete!
      </h2>
      <p className="text-[13px] text-ink-secondary mb-4 leading-relaxed">{message}</p>
      <div className="px-4 py-3 bg-surface rounded-[10px] text-[11px] text-ink-secondary mb-5 inline-block">
        <strong className="text-ink font-mono">
          WCR-{Math.random().toString(36).slice(2, 6).toUpperCase()}-
          {Math.random().toString(36).slice(2, 6).toUpperCase()}-
          {Math.floor(Math.random() * 9999)}
        </strong>
      </div>
      <div>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-[10px] bg-ink text-ink-inverse text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}
