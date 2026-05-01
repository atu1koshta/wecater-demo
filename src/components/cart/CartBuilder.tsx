"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Send, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CartLine, Persona } from "@/types";
import { CART_PROFILES } from "@/data/cart-profiles";
import { INITIAL_CARTS } from "@/data/cart-drafts";
import { RESTAURANTS, getRestaurant } from "@/data/restaurants";
import { CartLineItem } from "./CartLineItem";
import { CartSidebar, type QuoteRequestRecord } from "./CartSidebar";
import { CART_DEMO, CART_HINTS } from "./demo";
import { CheckoutSection } from "./CheckoutSection";
import { CompareCartsView } from "./CompareCartsView";
import { ContactRestaurantModal } from "./ContactRestaurantModal";
import { calcCartTotals } from "./math";
import { NLEditPreview, type NLPreview } from "./NLEditPreview";
import { OrderPlacedScreen } from "./OrderPlacedScreen";
import { PersonaToggle } from "./atoms";
import { PerPersonTable } from "./PerPersonTable";
import { QuoteRequestModal } from "./QuoteRequestModal";
import { RestaurantBrandHero } from "./RestaurantBrandHero";
import { StatusRibbon } from "./StatusRibbon";
import { Tier3Actions, type QuoteStatus } from "./Tier3Actions";
import { Tier3Hero } from "./Tier3Hero";
import { Tier3LightCart } from "./Tier3LightCart";
import { WhatCanIAskPanel } from "./WhatCanIAskPanel";

const HINT_INTERVAL_MS = 3500;

const BARRIO_SEED: CartLine[] = INITIAL_CARTS.ea["barrio-queen"];

export function CartBuilder() {
  const [persona, setPersona] = useState<Persona>("ea");
  const [activeKey, setActiveKey] = useState<string>("pita-jungle");
  const [carts, setCarts] = useState<Record<string, CartLine[]>>(
    () => INITIAL_CARTS.ea,
  );
  const [step, setStep] = useState(0);
  const [aiInline, setAiInline] = useState<string | null>(null);
  const [proactive, setProactive] = useState<
    { text: string; action: string } | null
  >(null);
  const [nlPreview, setNlPreview] = useState<NLPreview | null>(null);
  const [perPersonLineId, setPerPersonLineId] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequestRecord[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);

  const profile = CART_PROFILES[persona];
  const restaurant = getRestaurant(activeKey) ?? RESTAURANTS[0];
  const cart = carts[activeKey] ?? [];
  const totals = useMemo(
    () => calcCartTotals(cart, restaurant),
    [cart, restaurant],
  );
  const isTier3 = restaurant.tier === 3;
  const tier3QuoteStatus: QuoteStatus = quoteRequests.some(
    (q) => q.restaurantKey === activeKey,
  )
    ? "sent"
    : "idle";
  const perPersonLine =
    perPersonLineId !== null ? cart.find((l) => l.id === perPersonLineId) : null;

  // Reset everything when persona flips
  useEffect(() => {
    setCarts(INITIAL_CARTS[persona]);
    setActiveKey("pita-jungle");
    setStep(0);
    setNlPreview(null);
    setPerPersonLineId(null);
    setShowCompare(false);
    setShowContact(false);
    setShowQuote(false);
    setQuoteRequests([]);
    setOrderPlaced(false);
  }, [persona]);

  // Initial AI inline + proactive on first mount / step 0
  useEffect(() => {
    if (step === 0) {
      const first = CART_DEMO[0];
      setAiInline(first.aiInline ?? null);
      setProactive(first.proactive ?? null);
    }
  }, [step]);

  // Hint rotation
  useEffect(() => {
    const id = window.setInterval(
      () => setHintIdx((i) => (i + 1) % CART_HINTS.length),
      HINT_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const updateLine = useCallback(
    (key: string, line: CartLine) => {
      setCarts((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((l) => (l.id === line.id ? line : l)),
      }));
    },
    [],
  );

  const removeLine = useCallback((key: string, id: string) => {
    setCarts((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((l) => l.id !== id),
    }));
  }, []);

  const addLine = useCallback((key: string, line: CartLine) => {
    setCarts((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), line],
    }));
  }, []);

  const applyKeto = useCallback(() => {
    setCarts((prev) => {
      const lines = prev[activeKey] ?? [];
      const next = lines
        .filter((l) => l.itemId !== "hummus-platter")
        .map((l) => {
          if (l.itemId === "power-bowl" || l.itemId === "med-bowl") {
            return { ...l, modifiers: { ...l.modifiers, base: "Greens" } };
          }
          return l;
        });
      next.push({
        id: "line-greek",
        itemId: "greek-salad",
        qty: 2,
        basePrice: 10.95,
        modifiers: { addProtein: "Chicken" },
        appliesTo: "Replaces hummus carbs",
      });
      return { ...prev, [activeKey]: next };
    });
    setNlPreview(null);
    setAiInline(
      "Done. Cart is now keto-friendly: greens base across bowls, hummus dropped, two Greek salads added.",
    );
  }, [activeKey]);

  const advance = useCallback(() => {
    if (step >= CART_DEMO.length) return;
    const node = CART_DEMO[step];
    if (node.aiInline !== undefined) setAiInline(node.aiInline ?? null);

    if (node.edit?.lineId && node.edit.modifierKey && node.edit.value !== undefined) {
      const current = carts[activeKey]?.find((l) => l.id === node.edit!.lineId);
      if (current) {
        updateLine(activeKey, {
          ...current,
          modifiers: {
            ...current.modifiers,
            [node.edit.modifierKey]: node.edit.value,
          },
        });
      }
    }
    if (node.edit?.addLine) {
      addLine(activeKey, node.edit.addLine);
      setProactive(null);
    }
    if (node.nlPreview) setNlPreview(node.nlPreview);
    if (node.showPerPerson) setPerPersonLineId(node.showPerPerson);
    if (node.addParallelCart) {
      setCarts((prev) =>
        prev[node.addParallelCart!]
          ? prev
          : { ...prev, [node.addParallelCart!]: BARRIO_SEED },
      );
    }
    if (node.showCompareCarts) setShowCompare(true);
    if (node.switchToRestaurant) {
      setCarts((prev) =>
        prev[node.switchToRestaurant!]
          ? prev
          : { ...prev, [node.switchToRestaurant!]: [] },
      );
      setActiveKey(node.switchToRestaurant);
      setShowCompare(false);
    }

    setStep((s) => s + 1);
  }, [step, carts, activeKey, addLine, updateLine]);

  const acceptProactive = useCallback(() => {
    addLine(activeKey, {
      id: "line-baklava",
      itemId: "baklava",
      qty: 1,
      basePrice: 24.0,
      modifiers: {},
      appliesTo: "Shared dessert",
    });
    setProactive(null);
  }, [activeKey, addLine]);

  const reset = useCallback(() => {
    setCarts(INITIAL_CARTS[persona]);
    setActiveKey("pita-jungle");
    setStep(0);
    setOrderPlaced(false);
    setQuoteRequests([]);
    setShowCompare(false);
  }, [persona]);

  if (orderPlaced) {
    return (
      <OrderPlacedScreen
        restaurant={restaurant}
        cart={cart}
        profile={profile}
        onReset={reset}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      <div className="flex items-center gap-3 px-4 md:px-5 py-2.5 border-b border-surface-border bg-surface-raised">
        <PersonaToggle persona={persona} onChange={setPersona} />
        <div className="hidden md:flex flex-1 items-center gap-1.5 text-xs text-ink-secondary truncate">
          <span>{restaurant.icon}</span>
          <span className="font-medium text-ink">{restaurant.name}</span>
          <span className="text-ink-tertiary">·</span>
          <span>{profile.icon}</span>
          <span className="truncate">{profile.name}</span>
          <span className="text-ink-tertiary">·</span>
          <span className="truncate">
            {profile.headcount} people · Tomorrow lunch
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((s) => !s)}
          className="ml-auto px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface text-ink-secondary text-xs font-medium flex items-center gap-1 hover:border-brand hover:text-brand transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
          What can I ask?
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-surface">
          <div className="px-4 md:px-6 py-4 max-w-[920px] mx-auto flex flex-col gap-4">
            {isTier3 ? (
              <Tier3Hero restaurant={restaurant} profile={profile} />
            ) : (
              <>
                <RestaurantBrandHero
                  restaurant={restaurant}
                  profile={profile}
                  totals={totals}
                />
                <StatusRibbon profile={profile} totals={totals} />
              </>
            )}

            {aiInline && <AiInlineBanner text={aiInline} onDismiss={() => setAiInline(null)} />}

            {isTier3 ? (
              <>
                <Tier3LightCart restaurant={restaurant} />
                <Tier3Actions
                  quoteStatus={tier3QuoteStatus}
                  onContact={() => setShowContact(true)}
                  onRequestQuote={() => setShowQuote(true)}
                />
              </>
            ) : (
              <>
                {nlPreview && (
                  <NLEditPreview
                    preview={nlPreview}
                    onAccept={applyKeto}
                    onReject={() => setNlPreview(null)}
                  />
                )}
                {proactive && (
                  <ProactiveSuggestion
                    proactive={proactive}
                    onAccept={acceptProactive}
                    onDismiss={() => setProactive(null)}
                  />
                )}
                <div className="flex flex-col gap-3">
                  {cart.map((line) => (
                    <CartLineItem
                      key={line.id}
                      line={line}
                      restaurant={restaurant}
                      onChange={(next) => updateLine(activeKey, next)}
                      onRemove={() => removeLine(activeKey, line.id)}
                      onCustomizePerPerson={() => setPerPersonLineId(line.id)}
                    />
                  ))}
                  <button
                    type="button"
                    className="px-4 py-3 rounded-xl border border-dashed border-surface-border text-ink-tertiary text-sm flex items-center justify-center gap-1 hover:border-brand hover:text-brand transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Add another item · or just type what you want
                  </button>
                </div>
                <CheckoutSection
                  profile={profile}
                  totals={totals}
                  restaurantName={restaurant.name}
                  onPlaceOrder={() => setOrderPlaced(true)}
                />
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col w-[340px] shrink-0 border-l border-surface-border bg-surface">
          <CartSidebar
            carts={carts}
            restaurants={RESTAURANTS}
            activeKey={activeKey}
            onSelect={setActiveKey}
            onAddBarrio={() =>
              setCarts((prev) =>
                prev["barrio-queen"]
                  ? prev
                  : { ...prev, "barrio-queen": BARRIO_SEED },
              )
            }
            onCompare={() => setShowCompare(true)}
            quoteRequests={quoteRequests}
            step={step}
            isTier3Active={isTier3}
            activeRestaurantBoost={restaurant.restaurantBoost}
            activeRestaurantName={restaurant.name}
          />
          <ChatBar
            advance={advance}
            placeholder={
              step < CART_DEMO.length
                ? CART_DEMO[step].user ?? `Try: "${CART_HINTS[hintIdx]}"`
                : "✅ Demo complete"
            }
            disabled={step >= CART_DEMO.length}
            step={step}
            total={CART_DEMO.length}
          />
        </div>
      </div>

      <CompareCartsView
        open={showCompare}
        carts={carts}
        restaurants={RESTAURANTS}
        profile={profile}
        onClose={() => setShowCompare(false)}
        onPlaceOrder={(key) => {
          setActiveKey(key);
          setShowCompare(false);
          setOrderPlaced(true);
        }}
      />

      <PerPersonTable
        open={perPersonLine !== null}
        line={perPersonLine ?? null}
        restaurant={restaurant}
        profile={profile}
        onClose={() => setPerPersonLineId(null)}
        onSave={() => setPerPersonLineId(null)}
      />

      <WhatCanIAskPanel open={showHelp} onClose={() => setShowHelp(false)} />

      <ContactRestaurantModal
        open={showContact}
        restaurant={restaurant}
        profile={profile}
        onClose={() => setShowContact(false)}
      />

      <QuoteRequestModal
        open={showQuote}
        restaurant={restaurant}
        profile={profile}
        onClose={() => setShowQuote(false)}
        onSent={(ref) =>
          setQuoteRequests((prev) => [
            ...prev.filter((q) => q.restaurantKey !== activeKey),
            {
              ref,
              restaurant: restaurant.name,
              restaurantKey: activeKey,
              sentAt: new Date().toISOString(),
            },
          ])
        }
      />
    </div>
  );
}

function AiInlineBanner({
  text,
  onDismiss,
}: {
  text: string;
  onDismiss: () => void;
}) {
  return (
    <div className="px-4 py-3.5 rounded-2xl bg-surface-raised border border-surface-border flex gap-3 animate-fadeIn">
      <div className="h-7 w-7 rounded-lg shrink-0 bg-gradient-to-br from-brand to-brand-dark grid place-items-center">
        <span className="text-ink-inverse text-xs font-bold font-display">W</span>
      </div>
      <div className="flex-1 text-[13px] text-ink leading-relaxed whitespace-pre-wrap">
        {text.split("**").map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="h-6 w-6 rounded grid place-items-center text-ink-tertiary hover:text-ink hover:bg-surface-border-light transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

function ProactiveSuggestion({
  proactive,
  onAccept,
  onDismiss,
}: {
  proactive: { text: string; action: string };
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="px-4 py-3 rounded-2xl border border-dashed border-accent-purple/40 bg-accent-purple-light flex items-start gap-3 flex-wrap animate-fadeIn">
      <div className="text-accent-purple text-base">✨</div>
      <div className="flex-1 min-w-[200px] text-[13px] text-ink leading-snug">
        {proactive.text}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onAccept}
          className="px-3 py-1.5 rounded-lg bg-accent-purple text-ink-inverse text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          {proactive.action}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="h-7 w-7 rounded grid place-items-center text-accent-purple hover:bg-accent-purple/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function ChatBar({
  placeholder,
  advance,
  disabled,
  step,
  total,
}: {
  placeholder: string;
  advance: () => void;
  disabled: boolean;
  step: number;
  total: number;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (disabled) return;
    advance();
    setValue("");
  };
  return (
    <div className="border-t border-surface-border-light px-4 py-3 bg-surface-raised">
      <div className="text-[10px] font-bold tracking-wider uppercase text-ink-tertiary mb-1.5 font-display">
        💬 Chat for higher-level intent
      </div>
      <div className="flex items-center gap-2 bg-surface rounded-xl border border-surface-border pl-3.5 pr-1 py-1 focus-within:border-brand transition-colors">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-tertiary outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className={cn(
            "h-8 w-8 rounded-md grid place-items-center transition-colors",
            disabled
              ? "bg-surface-border cursor-not-allowed"
              : "bg-brand hover:bg-brand-dark cursor-pointer",
          )}
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5 text-ink-inverse" strokeWidth={2.2} />
        </button>
      </div>
      <div className="text-[10px] text-ink-tertiary mt-1.5">
        {step < total
          ? `Press Enter to continue · step ${step + 1} of ${total}`
          : "✅ Demo complete"}
      </div>
    </div>
  );
}
