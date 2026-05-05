import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── Design tokens ───
const T = {
  brand: "#E86A1A",
  brandLight: "#FEF3EB",
  brandDark: "#C4540F",
  brandGlow: "rgba(232,106,26,0.12)",
  surface: "#FAFAF8",
  card: "#FFFFFF",
  border: "#EDE8E1",
  borderLight: "#F5F1EC",
  text: "#1A1714",
  textSecondary: "#6B6560",
  textTertiary: "#9C958E",
  success: "#1B874B",
  successBg: "#EDFCF2",
  warning: "#D97B0B",
  warningBg: "#FFF8ED",
  danger: "#D1342F",
  dangerBg: "#FEF0F0",
  info: "#2563EB",
  infoBg: "#EFF5FF",
  purple: "#7C3AED",
  purpleBg: "#F5F0FF",
  aiMsg: "#F6F3EF",
  userMsg: "#1A1714",
};

const font = `'DM Sans', -apple-system, sans-serif`;
const fontDisplay = `'Outfit', ${font}`;
const fontMono = `'JetBrains Mono', monospace`;

// ─── Restaurant data ───
// Tier 1 = Bookable (Stripe Connect partner, full Bites config, real-time order)
// Tier 3 = Discovery (scraped catalog, no partnership, "request a quote")
// Universe in Phoenix: ~1,247. Tier 1 partners shown here as a working set.
const RESTAURANTS = [
  {
    id: "pita-jungle",
    name: "Pita Jungle",
    icon: "🥙",
    cuisine: "Mediterranean",
    tier: 1,
    baseRate: 8,
    restaurantBoost: 1.4,
    sameDayBoost: 1,
    sameDay: true,
    sameDayCutoff: "11:30am",
    ppEstimate: 14.5,
    dietaryFit: 1.0,
    varietyPenalty: 0.4, // ordered recently
    earnedBites: 4720,
    complianceFit: 0.9,
  },
  {
    id: "barrio-queen",
    name: "Barrio Queen",
    icon: "🌮",
    cuisine: "Mexican",
    tier: 1,
    baseRate: 6,
    restaurantBoost: 1.3,
    sameDayBoost: 1,
    sameDay: true,
    sameDayCutoff: "11:00am",
    ppEstimate: 14.8,
    dietaryFit: 1.0,
    varietyPenalty: 0,
    earnedBites: 3680,
    complianceFit: 1.0,
  },
  {
    id: "bobby-q",
    name: "Bobby Q",
    icon: "🥩",
    cuisine: "BBQ",
    tier: 1,
    baseRate: 5,
    restaurantBoost: 1.25,
    sameDayBoost: 0,
    sameDay: true,
    sameDayCutoff: "10:30am",
    ppEstimate: 15.0,
    dietaryFit: 0.7,
    varietyPenalty: 0,
    earnedBites: 590,
    complianceFit: 1.0,
  },
  {
    id: "flower-child",
    name: "Flower Child",
    icon: "🥗",
    cuisine: "Healthy bowls",
    tier: 1,
    baseRate: 7,
    restaurantBoost: 1.5,
    sameDayBoost: 2,
    sameDay: true,
    sameDayCutoff: "12:00pm",
    ppEstimate: 18.5,
    dietaryFit: 1.0,
    varietyPenalty: 0,
    earnedBites: 8330,
    complianceFit: 0.6, // pushes over budget
  },
  {
    id: "bangkok-garden",
    name: "Bangkok Garden",
    icon: "🍜",
    cuisine: "Thai",
    tier: 1,
    baseRate: 5,
    restaurantBoost: 1.2,
    sameDayBoost: 0,
    sameDay: false,
    ppEstimate: 14.14,
    dietaryFit: 0.85,
    varietyPenalty: 0.5,
    earnedBites: 2840,
    complianceFit: 1.0,
  },
  {
    id: "curry-corner",
    name: "Curry Corner",
    icon: "🍛",
    cuisine: "Indian",
    tier: 1,
    baseRate: 6,
    restaurantBoost: 0,
    sameDayBoost: 0,
    sameDay: false,
    ppEstimate: 14.57,
    dietaryFit: 0.95,
    varietyPenalty: 0.45,
    earnedBites: 3150,
    complianceFit: 1.0,
  },
  {
    id: "oreganos",
    name: "Oregano's Pizza",
    icon: "🍕",
    cuisine: "Italian",
    tier: 1,
    baseRate: 4,
    restaurantBoost: 1.15,
    sameDayBoost: 0,
    sameDay: true,
    sameDayCutoff: "11:45am",
    ppEstimate: 12.95,
    dietaryFit: 0.6,
    varietyPenalty: 0,
    earnedBites: 0,
    complianceFit: 1.0,
  },
  {
    id: "true-food",
    name: "True Food Kitchen",
    icon: "🌿",
    cuisine: "Healthy",
    tier: 1,
    baseRate: 12,
    restaurantBoost: 1.5,
    sameDayBoost: 0,
    sameDay: false, // FLASH PROMO 12X!
    ppEstimate: 16.2,
    dietaryFit: 1.0,
    varietyPenalty: 0,
    earnedBites: 0,
    complianceFit: 0.85,
    hasFlash: true,
  },
  // ─── Tier 3 discovery restaurants ───
  // Light scraped data only. Surfaced when no Tier 1 fills a cuisine/dietary gap.
  // No real Bites earning until activated; estimated only.
  {
    id: "tonys-italian",
    name: "Tony's Italian Kitchen",
    icon: "🍝",
    cuisine: "Italian",
    tier: 3,
    ppEstimate: 16.2,
    dietaryFit: 0.9,
    varietyPenalty: 0,
    estimatedBaseRate: 5, // platform-average estimate for "if activated"
    earnedBites: 0,
    complianceFit: 1.0,
    discoveryReason:
      "Fills Italian + full dietary gap that no Tier 1 partner covers",
    sourceData:
      "Menu scraped from own website · 4.6★ Yelp · last updated 12 days ago",
    sameDay: false,
  },
  {
    id: "saigon-pho",
    name: "Saigon Pho House",
    icon: "🍲",
    cuisine: "Vietnamese",
    tier: 3,
    ppEstimate: 13.4,
    dietaryFit: 0.95,
    varietyPenalty: 0,
    estimatedBaseRate: 4,
    earnedBites: 0,
    complianceFit: 1.0,
    discoveryReason:
      "Vietnamese cuisine — broad dietary appeal, not represented in current partners",
    sourceData:
      "Menu scraped from ezCater · 4.4★ Google · last updated 6 days ago",
    sameDay: false,
  },
];

// Sally's order context for Dr. Patel's office
const ORDER_CTX = {
  office: "Dr. Patel's Cardiology",
  headcount: 14,
  budgetPerPerson: 15,
  budgetTotal: 210,
  isSameDay: false, // tomorrow's lunch
  welcomeActive: true, // Welcome 2X is active for Sally
  physician: { name: "Dr. Patel", ytd: 68, threshold: 100 },
  recentCuisines: ["Thai", "Mediterranean", "Indian"], // for variety penalty
};

// Calculation helpers
function calculateBites(r, ctx, mode) {
  const subtotal = r.ppEstimate * ctx.headcount;
  const baseBites = Math.round(subtotal * r.baseRate);

  const modifiers = [];
  if (ctx.welcomeActive) {
    modifiers.push({
      id: "welcome",
      label: "Welcome 2X",
      icon: "🎁",
      bites: baseBites,
      color: T.brand,
    });
  }
  if (r.sameDayBoost > 0 && ctx.isSameDay) {
    const sdBites = Math.round(subtotal * r.sameDayBoost);
    modifiers.push({
      id: "sameday",
      label: `Same-Day +${r.sameDayBoost}X`,
      icon: "⚡",
      bites: sdBites,
      color: T.purple,
    });
  }
  if (r.hasFlash) {
    modifiers.push({
      id: "flash",
      label: "Flash 12X (today only)",
      icon: "🔥",
      bites: 0,
      color: T.danger,
      isFlash: true,
    });
  }

  const total = baseBites + modifiers.reduce((s, m) => s + m.bites, 0);
  return { subtotal, baseBites, modifiers, total, baseRate: r.baseRate };
}

function calculateRedemption(r, sallyBitesAtThisRestaurant) {
  if (!r.restaurantBoost || sallyBitesAtThisRestaurant < 1000) return null;
  const value = (sallyBitesAtThisRestaurant / 100) * r.restaurantBoost;
  return {
    bites: sallyBitesAtThisRestaurant,
    multiplier: r.restaurantBoost,
    value,
  };
}

function smartScore(r, ctx) {
  const bites = calculateBites(r, ctx).total;
  const dietary = r.dietaryFit;
  const variety = 1 - r.varietyPenalty;
  const compliance = r.complianceFit;
  return bites * 0.3 + dietary * 1500 + variety * 800 + compliance * 600;
}

// One-line rationale per option — replaces multiplier breakdown in Simple mode.
// The AI's "why this pick" voice. Calibrated to position + mode + tradeoffs.
function rationaleFor(r, mode, position, ctx) {
  const calc = calculateBites(r, ctx);
  const overBudget = calc.subtotal > ctx.budgetTotal;
  const overByPp = (calc.subtotal - ctx.budgetTotal) / ctx.headcount;

  if (position === 0) {
    if (r.hasFlash) return "🔥 Flash promo today only — highest Bites";
    if (mode === "max_bites")
      return `Highest Bites · ${r.baseRate}X base + active multipliers`;
    if (mode === "max_discount")
      return "Most discount available with your existing Bites";
    if (mode === "speed") return `Available now · order by ${r.sameDayCutoff}`;
    if (mode === "compliance") return "Lowest physician YTD impact";
    return "Best balance: dietary fit, variety, and budget";
  }
  if (overBudget) return `⚠️ Over budget by $${overByPp.toFixed(2)}/pp`;
  if (r.dietaryFit < 0.8) return "Strong taste · limited dietary options";
  if (r.varietyPenalty > 0.3) return "Comfort pick · cuisine repeats recently";
  if (r.complianceFit < 0.8) return "High earner · pushes physician YTD";
  return "Solid alternative pick";
}

function rankBy(restaurants, mode, ctx) {
  return [...restaurants].sort((a, b) => {
    const aBites = calculateBites(a, ctx);
    const bBites = calculateBites(b, ctx);
    if (mode === "max_bites") return bBites.total - aBites.total;
    if (mode === "max_discount") {
      const aR = calculateRedemption(a, a.earnedBites);
      const bR = calculateRedemption(b, b.earnedBites);
      return (bR?.value || 0) - (aR?.value || 0);
    }
    if (mode === "speed") return (b.sameDay ? 1 : 0) - (a.sameDay ? 1 : 0);
    if (mode === "compliance") return b.complianceFit - a.complianceFit;
    return smartScore(b, ctx) - smartScore(a, ctx);
  });
}

// Optimization modes
const MODES = [
  {
    id: "smart",
    icon: "🤖",
    label: "Smart",
    desc: "Balanced across all factors",
  },
  {
    id: "max_bites",
    icon: "💎",
    label: "Max Bites",
    desc: "Earn the most points",
  },
  {
    id: "max_discount",
    icon: "💸",
    label: "Max Discount",
    desc: "Use Bites you already have",
  },
  { id: "speed", icon: "⚡", label: "Same-Day", desc: "Available right now" },
  {
    id: "compliance",
    icon: "🛡️",
    label: "Compliance Safe",
    desc: "Stay under physician threshold",
  },
];

// ─── Demo conversation ───
const DEMO = [
  {
    user: "Order for Dr. Patel's office. Tuesday lunch, 14 people, $15/pp budget.",
    aiText:
      "Loading Dr. Patel's profile — 14 people, 7 dietary restrictions, $210 budget. I scanned every Phoenix catering option that delivers Tuesday at noon and meets your hard constraints. **47 viable matches.** Top 3 below — Smart mode balances Bites earned, dietary fit, variety, and compliance:",
    mode: "smart",
    options: ["barrio-queen", "bobby-q", "flower-child"],
    addToPool: true,
    funnel: true,
  },
  {
    user: "Show me more options — different cuisines",
    aiText:
      "Adding to your working set. Here are 2 more partner options matching your dietary mix, plus 1 discovery option that fills a cuisine gap nothing else covers:",
    mode: "smart",
    options: ["pita-jungle", "curry-corner", "tonys-italian"],
    addToPool: true,
    surfaceMore: true,
  },
  {
    user: "/maximize bites",
    aiText:
      "Re-ranking your working set by Bites earned (Welcome 2X is live for 18 more days). I'm also adding one new partner I held back on — flash promo running today:",
    mode: "max_bites",
    options: ["true-food", "pita-jungle", "flower-child", "barrio-queen"],
    addToPool: true, // adds true-food to pool
    showHiddenInsight: true,
  },
  {
    user: "What about my Pita Jungle Bites? Can I use them on this order?",
    aiText:
      "Yes — and here's a compound play that would have taken you 20 min in a spreadsheet: order Pita Jungle now AND redeem your existing 4,720 Bites. You earn AND discount in the same transaction.",
    mode: "max_discount",
    options: ["pita-jungle"],
    showCompoundStrategy: true,
  },
  {
    user: "Compare what we've seen so far",
    aiText:
      "Here's everything we've considered together this session — sortable by any factor. Discovery options grouped at the bottom.",
    mode: "compare",
    showCompareAll: true,
  },
];

// ─── Components ───

function CountUp({
  value,
  duration = 800,
  format = (v) => Math.round(v).toLocaleString(),
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span>{format(display)}</span>;
}

function MultiplierChip({ modifier, delay = 0 }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 8,
        background: `${modifier.color}12`,
        border: `1px solid ${modifier.color}33`,
        opacity: shown ? 1 : 0,
        transform: shown
          ? "translateY(0) scale(1)"
          : "translateY(6px) scale(0.95)",
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        fontFamily: font,
      }}
    >
      <span style={{ fontSize: 13 }}>{modifier.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: modifier.color }}>
        {modifier.label}
      </span>
      {modifier.bites > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: modifier.color,
            fontFamily: fontMono,
          }}
        >
          +{modifier.bites.toLocaleString()}
        </span>
      )}
    </div>
  );
}

function OptionCard({
  restaurant,
  ctx,
  isTopPick,
  deltaToBest,
  baseDelay = 0,
  mode,
  position = 0,
  isCompound,
  density = "simple",
}) {
  const isTier3 = restaurant.tier === 3;
  const calc = useMemo(
    () => calculateBites(restaurant, ctx),
    [restaurant, ctx],
  );
  const redemption = useMemo(
    () => calculateRedemption(restaurant, restaurant.earnedBites),
    [restaurant],
  );
  const rationale = useMemo(
    () => rationaleFor(restaurant, mode, position, ctx),
    [restaurant, mode, position, ctx],
  );
  const [localExpanded, setLocalExpanded] = useState(false);

  // For Tier 3, calculate "if activated" estimated Bites using the platform-average rate
  const estimatedBites = useMemo(() => {
    if (!isTier3) return null;
    const subtotal = restaurant.ppEstimate * ctx.headcount;
    return Math.round(subtotal * (restaurant.estimatedBaseRate || 5));
  }, [isTier3, restaurant, ctx]);

  // Detail block shows in Detailed mode globally OR when user expands this single card in Simple mode
  const showDetail = density === "detailed" || localExpanded;

  const dietaryBadge =
    restaurant.dietaryFit >= 0.95
      ? {
          label: isTier3 ? "✅ Likely full coverage" : "✅ All dietary met",
          color: T.success,
          bg: T.successBg,
        }
      : restaurant.dietaryFit >= 0.7
        ? { label: "⚠️ Limited options", color: T.warning, bg: T.warningBg }
        : { label: "❌ Dietary gaps", color: T.danger, bg: T.dangerBg };

  const sameDayBadge = restaurant.sameDay
    ? {
        label: `⚡ Same-day until ${restaurant.sameDayCutoff}`,
        color: T.info,
        bg: T.infoBg,
      }
    : null;
  const overBudget = restaurant.ppEstimate * ctx.headcount > ctx.budgetTotal;

  return (
    <div
      style={{
        background: isTier3 ? "#FCFAF7" : T.card,
        borderRadius: 14,
        border: isTier3
          ? `1.5px dashed ${T.textTertiary}66`
          : isTopPick
            ? `2px solid ${T.brand}`
            : `1px solid ${T.border}`,
        boxShadow:
          isTopPick && !isTier3
            ? `0 8px 24px ${T.brandGlow}`
            : "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
        animation: `cardIn 0.4s ease ${baseDelay}ms backwards`,
        transition: "all 0.25s ease",
      }}
    >
      {/* Top-right badge: Top Pick (Tier 1) or Discovery (Tier 3) */}
      {isTier3 ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            padding: "3px 9px",
            borderRadius: 12,
            background: T.surface,
            color: T.textSecondary,
            border: `1px dashed ${T.textTertiary}88`,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: fontDisplay,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          📍 Discovery
        </div>
      ) : (
        isTopPick && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
              padding: "3px 9px",
              borderRadius: 12,
              background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: fontDisplay,
            }}
          >
            {mode === "max_bites"
              ? "💎 Max Bites"
              : mode === "max_discount"
                ? "💸 Best Value"
                : "Top Pick"}
          </div>
        )
      )}
      {restaurant.hasFlash && !isTier3 && (
        <div
          style={{
            padding: "6px 14px",
            background: `linear-gradient(90deg, ${T.danger}, ${T.warning})`,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🔥 FLASH PROMO · 12X Bites until 5pm today only
        </div>
      )}

      <div style={{ padding: 16, opacity: isTier3 ? 0.92 : 1 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: T.surface,
              border: isTier3
                ? `1px dashed ${T.textTertiary}66`
                : `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
              filter: isTier3 ? "saturate(0.7)" : "none",
            }}
          >
            {restaurant.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: T.text,
                fontFamily: fontDisplay,
              }}
            >
              {restaurant.name}
            </div>
            <div style={{ fontSize: 11, color: T.textTertiary }}>
              {restaurant.cuisine}
            </div>
            <div style={{ marginTop: 4, fontSize: 12 }}>
              <span
                style={{ fontWeight: 600, color: T.text, fontFamily: fontMono }}
              >
                {isTier3 && (
                  <span style={{ color: T.textTertiary, fontWeight: 500 }}>
                    est.{" "}
                  </span>
                )}
                ${restaurant.ppEstimate.toFixed(2)}/pp
              </span>
              <span style={{ color: T.textTertiary, margin: "0 6px" }}>·</span>
              <span
                style={{
                  fontWeight: 600,
                  color: overBudget ? T.danger : T.text,
                  fontFamily: fontMono,
                }}
              >
                ${(restaurant.ppEstimate * ctx.headcount).toFixed(2)} total
              </span>
              {overBudget && (
                <span
                  style={{
                    color: T.danger,
                    fontSize: 10,
                    marginLeft: 6,
                    fontWeight: 600,
                  }}
                >
                  over budget
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick badges */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 6,
              background: dietaryBadge.bg,
              color: dietaryBadge.color,
              fontWeight: 600,
            }}
          >
            {dietaryBadge.label}
          </span>
          {sameDayBadge && (
            <span
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 6,
                background: sameDayBadge.bg,
                color: sameDayBadge.color,
                fontWeight: 600,
              }}
            >
              {sameDayBadge.label}
            </span>
          )}
        </div>

        {/* Tier 3 — discovery info banner */}
        {isTier3 && (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              background: T.surface,
              border: `1px dashed ${T.textTertiary}55`,
              marginBottom: 10,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, marginTop: 1 }}>ℹ️</span>
            <div
              style={{
                flex: 1,
                fontSize: 11,
                color: T.textSecondary,
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: T.text }}>
                Not yet a WeCater partner.
              </strong>{" "}
              Available via quote request. {restaurant.sourceData}
            </div>
          </div>
        )}

        {/* Bites display — Simple mode shows just the number */}
        {!showDetail && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: T.surface,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 10,
              opacity: isTier3 ? 0.9 : 1,
            }}
          >
            <span style={{ fontSize: 16 }}>{isTier3 ? "🔮" : "🎁"}</span>
            {isTier3 ? (
              <>
                <span
                  style={{
                    fontSize: 11,
                    color: T.textTertiary,
                    fontStyle: "italic",
                  }}
                >
                  Est.
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.textSecondary,
                    fontFamily: fontDisplay,
                    letterSpacing: "-0.01em",
                  }}
                >
                  ~<CountUp value={estimatedBites} />
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: T.textTertiary,
                    fontWeight: 500,
                  }}
                >
                  Bites if activated · ≈ ${(estimatedBites / 100).toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.brand,
                    fontFamily: fontDisplay,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <CountUp value={calc.total} />
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: T.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Bites · ≈ ${(calc.total / 100).toFixed(2)}
                </span>
                {deltaToBest !== undefined && deltaToBest !== 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      color: deltaToBest < 0 ? T.danger : T.success,
                      fontWeight: 600,
                      fontFamily: fontMono,
                    }}
                  >
                    {deltaToBest > 0 ? "+" : ""}
                    {deltaToBest.toLocaleString()} vs next
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Rationale — always visible in Simple mode */}
        {density === "simple" && (
          <div
            style={{
              fontSize: 12,
              color: T.textSecondary,
              lineHeight: 1.4,
              marginBottom: 10,
              fontStyle: "italic",
            }}
          >
            {isTier3 ? `🔍 ${restaurant.discoveryReason}` : rationale}
          </div>
        )}

        {/* DETAILED breakdown — only for Tier 1 */}
        {showDetail && !isTier3 && (
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: T.surface,
                border: `1px dashed ${T.border}`,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textTertiary,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: fontDisplay,
                  }}
                >
                  🎁 You'll earn
                </span>
                {deltaToBest !== undefined && deltaToBest !== 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: deltaToBest < 0 ? T.danger : T.success,
                      fontWeight: 600,
                      fontFamily: fontMono,
                    }}
                  >
                    {deltaToBest > 0 ? "+" : ""}
                    {deltaToBest.toLocaleString()} vs next best
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <MultiplierChip
                  modifier={{
                    icon: "📊",
                    label: `Base ${restaurant.baseRate}X`,
                    bites: calc.baseBites,
                    color: T.text,
                  }}
                  delay={baseDelay}
                />
                {calc.modifiers.map((m, i) => (
                  <MultiplierChip
                    key={m.id}
                    modifier={m}
                    delay={baseDelay + (i + 1) * 150}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  paddingTop: 8,
                  borderTop: `1px solid ${T.borderLight}`,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: T.brand,
                    fontFamily: fontDisplay,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <CountUp value={calc.total} />
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: T.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Bites · ≈ ${(calc.total / 100).toFixed(2)}
                </span>
                {redemption && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      color: T.purple,
                      fontFamily: fontMono,
                      fontWeight: 700,
                    }}
                  >
                    {redemption.multiplier}X boost back
                  </span>
                )}
              </div>
            </div>

            {redemption && (
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: T.purpleBg,
                  border: `1px solid ${T.purple}22`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 14 }}>🚀</span>
                <div
                  style={{
                    flex: 1,
                    fontSize: 11,
                    color: T.textSecondary,
                    lineHeight: 1.4,
                  }}
                >
                  You have{" "}
                  <strong style={{ color: T.purple, fontFamily: fontMono }}>
                    {redemption.bites.toLocaleString()} Bites
                  </strong>{" "}
                  here. Order again next time and they redeem at{" "}
                  <strong style={{ color: T.purple }}>
                    {redemption.multiplier}X = ${redemption.value.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            {isCompound && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.brand}10, ${T.purple}10)`,
                  border: `1.5px solid ${T.brand}`,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.brand,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  ⚡ Compound play
                </div>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>
                  <div>
                    Apply 4,720 existing Bites at 1.4X ={" "}
                    <strong style={{ color: T.purple, fontFamily: fontMono }}>
                      −$66.08
                    </strong>
                  </div>
                  <div>
                    Earn {calc.total.toLocaleString()} new Bites ={" "}
                    <strong style={{ color: T.brand, fontFamily: fontMono }}>
                      ${(calc.total / 100).toFixed(2)} value
                    </strong>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: `1px dashed ${T.brand}44`,
                    }}
                  >
                    <strong>
                      Net cost: $
                      {(calc.subtotal - 66.08 - calc.total / 100).toFixed(2)}
                    </strong>{" "}
                    · effective{" "}
                    <strong style={{ color: T.success }}>
                      {Math.round(
                        ((66.08 + calc.total / 100) / calc.subtotal) * 100,
                      )}
                      % return
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per-card expand toggle — only in Simple mode AND only for Tier 1 (Tier 3 has no breakdown) */}
        {density === "simple" && !isTier3 && (
          <button
            onClick={() => setLocalExpanded(!localExpanded)}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px 0",
              color: T.brand,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: font,
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 10,
            }}
          >
            {localExpanded ? "Hide breakdown" : "How is this calculated?"}
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: localExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* CTA: Choose (Tier 1) or Request quote (Tier 3) */}
        <button
          style={{
            width: "100%",
            padding: "9px 14px",
            borderRadius: 10,
            border: isTier3 ? `1px solid ${T.border}` : "none",
            background: isTier3 ? T.card : isTopPick ? T.brand : T.surface,
            color: isTier3 ? T.text : isTopPick ? "#fff" : T.text,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: font,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          {isTier3
            ? "📨 Request a quote →"
            : isTopPick
              ? "🍴 Choose this option →"
              : "Select"}
        </button>

        {isTier3 && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              color: T.textTertiary,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            We'll email Tony's on your behalf. Bites earned only after they
            activate.
          </div>
        )}
      </div>
    </div>
  );
}

function CompareAllView({ restaurants, ctx, mode, onClose }) {
  const [sortBy, setSortBy] = useState("bites");

  // Split into Tier 1 partners and Tier 3 discovery, sorted within each group
  const { tier1, tier3 } = useMemo(() => {
    const enrich = (r) => ({
      ...r,
      calc:
        r.tier === 3
          ? {
              total: Math.round(
                r.ppEstimate * ctx.headcount * (r.estimatedBaseRate || 5),
              ),
              subtotal: r.ppEstimate * ctx.headcount,
            }
          : calculateBites(r, ctx),
      redemption: r.tier === 3 ? null : calculateRedemption(r, r.earnedBites),
    });
    const list = restaurants.map(enrich);
    if (sortBy === "bites") list.sort((a, b) => b.calc.total - a.calc.total);
    if (sortBy === "price") list.sort((a, b) => a.ppEstimate - b.ppEstimate);
    if (sortBy === "dietary") list.sort((a, b) => b.dietaryFit - a.dietaryFit);
    return {
      tier1: list.filter((r) => r.tier !== 3),
      tier3: list.filter((r) => r.tier === 3),
    };
  }, [restaurants, ctx, sortBy]);

  const renderRow = (r, i, isTier3 = false) => (
    <div
      key={r.id}
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 70px 80px 100px 70px 100px",
        padding: "10px 14px",
        alignItems: "center",
        borderTop: i > 0 ? `1px solid ${T.borderLight}` : "none",
        transition: "background 0.15s",
        opacity: isTier3 ? 0.85 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{ fontSize: 16, filter: isTier3 ? "saturate(0.7)" : "none" }}
        >
          {r.icon}
        </span>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: T.text,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {r.name}
            {isTier3 && (
              <span
                style={{
                  fontSize: 8,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: T.surface,
                  color: T.textTertiary,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  border: `1px dashed ${T.textTertiary}55`,
                }}
              >
                DISCOVERY
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: T.textTertiary }}>
            {r.cuisine} ·{" "}
            {isTier3 ? `est. ${r.estimatedBaseRate}X` : `${r.baseRate}X base`}
          </div>
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color: T.textSecondary,
          fontFamily: fontMono,
          textAlign: "right",
        }}
      >
        {isTier3 && (
          <span style={{ color: T.textTertiary, fontWeight: 500 }}>~</span>
        )}
        ${r.ppEstimate.toFixed(2)}
      </span>
      <span
        style={{
          fontSize: 11,
          color: T.text,
          fontFamily: fontMono,
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        ${r.calc.subtotal.toFixed(0)}
      </span>
      <span
        style={{
          fontSize: 12,
          color: isTier3 ? T.textSecondary : T.brand,
          fontFamily: fontMono,
          fontWeight: 700,
          textAlign: "right",
        }}
      >
        {isTier3 && (
          <span style={{ fontSize: 9, color: T.textTertiary, marginRight: 3 }}>
            ~
          </span>
        )}
        {r.calc.total.toLocaleString()}
      </span>
      <span
        style={{
          fontSize: 10,
          color: r.restaurantBoost ? T.purple : T.textTertiary,
          fontFamily: fontMono,
          fontWeight: 700,
          textAlign: "right",
        }}
      >
        {r.restaurantBoost ? `${r.restaurantBoost}X` : "—"}
      </span>
      <span style={{ textAlign: "center" }}>
        <span
          style={{
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 4,
            background:
              r.dietaryFit >= 0.95
                ? T.successBg
                : r.dietaryFit >= 0.7
                  ? T.warningBg
                  : T.dangerBg,
            color:
              r.dietaryFit >= 0.95
                ? T.success
                : r.dietaryFit >= 0.7
                  ? T.warning
                  : T.danger,
            fontWeight: 600,
          }}
        >
          {Math.round(r.dietaryFit * 100)}%
        </span>
      </span>
    </div>
  );

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        marginTop: 10,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: T.text,
            fontFamily: fontDisplay,
          }}
        >
          Your working set · {restaurants.length} options
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "bites", label: "Bites" },
            { id: "price", label: "Price" },
            { id: "dietary", label: "Dietary" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              style={{
                padding: "3px 9px",
                borderRadius: 12,
                border: `1px solid ${sortBy === s.id ? T.brand : T.border}`,
                background: sortBy === s.id ? T.brandLight : T.card,
                color: sortBy === s.id ? T.brandDark : T.textSecondary,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 70px 80px 100px 70px 100px",
          padding: "8px 14px",
          background: T.surface,
          fontSize: 9,
          fontWeight: 700,
          color: T.textTertiary,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span>Restaurant</span>
        <span style={{ textAlign: "right" }}>$/pp</span>
        <span style={{ textAlign: "right" }}>Total</span>
        <span style={{ textAlign: "right" }}>Bites</span>
        <span style={{ textAlign: "right" }}>Boost</span>
        <span style={{ textAlign: "center" }}>Dietary</span>
      </div>

      {/* Tier 1 partners */}
      {tier1.map((r, i) => renderRow(r, i, false))}

      {/* Tier 3 divider + group */}
      {tier3.length > 0 && (
        <>
          <div
            style={{
              padding: "8px 14px",
              borderTop: `1px dashed ${T.border}`,
              background: T.surface,
              fontSize: 9,
              fontWeight: 700,
              color: T.textTertiary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📍</span>
            <span>Discovery options · not yet partnered · request a quote</span>
          </div>
          {tier3.map((r, i) => renderRow(r, i, true))}
        </>
      )}
    </div>
  );
}

function HiddenInsight() {
  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.brand}08, ${T.purple}08)`,
        border: `1px dashed ${T.brand}55`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>🔍</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.brand,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: fontDisplay,
          }}
        >
          What Smart mode was hiding
        </span>
      </div>
      <p
        style={{
          fontSize: 12,
          color: T.textSecondary,
          lineHeight: 1.55,
          marginBottom: 6,
        }}
      >
        <strong style={{ color: T.text }}>True Food Kitchen</strong> is running
        a flash 12X promo today only. Smart mode demoted it because it's not a
        perfect compliance fit (Dr. Patel's YTD would jump from $68 → $91, still
        safe but tight).
      </p>
      <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.55 }}>
        For Max Bites, it's the clear winner.{" "}
        <strong style={{ color: T.text }}>2,722 Bites</strong> earned (+450 vs
        Pita Jungle, +1,480 vs Smart's top pick).
      </p>
    </div>
  );
}

function BitesForecastCard({ option, ctx }) {
  const calc = option ? calculateBites(option, ctx) : null;
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
        borderRadius: 14,
        padding: 16,
        color: "#fff",
        boxShadow: `0 4px 16px ${T.brandGlow}`,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          opacity: 0.85,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 6,
          fontFamily: fontDisplay,
        }}
      >
        Bites Forecast
      </div>
      {calc ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: fontDisplay,
                letterSpacing: "-0.02em",
              }}
            >
              <CountUp value={calc.total} />
            </span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Bites</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            ≈ <strong>${(calc.total / 100).toFixed(2)}</strong> redemption value
          </div>
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.18)",
                fontWeight: 600,
              }}
            >
              {calc.baseRate}X base
            </span>
            {calc.modifiers.map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.18)",
                  fontWeight: 600,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, opacity: 0.85, padding: "8px 0" }}>
          Tell me what you're ordering and I'll calculate your projected Bites
          in real time.
        </div>
      )}
    </div>
  );
}

// ─── Funnel cascade — shows AI filtering work for first message ───
function FunnelCascade() {
  const [stage, setStage] = useState(0);
  const stages = [
    {
      label: "Scanning Phoenix catering partners",
      value: "1,247",
      duration: 200,
    },
    {
      label: "Deliver to 4530 E Shea Blvd Tuesday at noon",
      value: "312",
      duration: 280,
    },
    {
      label: "Can serve 14 people in your time window",
      value: "89",
      duration: 280,
    },
    { label: "Cover all 7 dietary restrictions", value: "47", duration: 280 },
    { label: "Ranking by Smart score", value: "Top 3", duration: 240 },
  ];

  useEffect(() => {
    if (stage >= stages.length) return;
    const t = setTimeout(() => setStage(stage + 1), stages[stage].duration);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {stages.slice(0, stage + 1).map((s, i) => {
        const isLast = i === stages.length - 1;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeIn 0.25s ease",
              opacity: stage > i ? 0.55 : 1,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: fontMono,
                color: isLast && stage >= i ? T.brand : T.textTertiary,
                minWidth: 50,
                textAlign: "right",
              }}
            >
              {i === 0 ? "" : "→ "}
              {s.value}
            </span>
            <span
              style={{
                fontSize: 12,
                color: isLast && stage >= i ? T.text : T.textSecondary,
                fontWeight: isLast && stage >= i ? 600 : 400,
              }}
            >
              {s.label}
            </span>
            {stage === i && i < stages.length - 1 && (
              <span style={{ display: "flex", gap: 2, marginLeft: 4 }}>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: T.brand,
                      animation: `pulse 0.8s ${d * 0.15}s infinite`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ───
export default function ChatBitesOptimizer() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentMode, setCurrentMode] = useState("smart");
  const [inputValue, setInputValue] = useState("");
  const [showCompareAll, setShowCompareAll] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [density, setDensity] = useState("simple");
  // Session pool: restaurant IDs surfaced this session (in order, deduplicated).
  // Sally builds this set with the AI through "show me more" / cuisine asks / etc.
  const [sessionPool, setSessionPool] = useState([]);
  const [expandedCompare, setExpandedCompare] = useState({});
  const chatEndRef = useRef(null);

  // Get ranked options based on current mode
  const rankedOptions = useMemo(
    () => rankBy(RESTAURANTS, currentMode, ORDER_CTX),
    [currentMode],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCalculating]);

  const handleSend = useCallback(() => {
    if (step >= DEMO.length) return;
    const node = DEMO[step];

    setMessages((prev) => [...prev, { role: "user", text: node.user }]);
    setInputValue("");

    // First message uses the funnel cascade animation (~1.4s); others use shimmer (~1s)
    const calcDuration = step === 0 ? 1500 : 900;
    setIsCalculating(true);

    setTimeout(() => {
      setIsCalculating(false);
      setCurrentMode(node.mode === "compare" ? currentMode : node.mode);
      setShowCompareAll(node.showCompareAll || false);

      // Update session pool with newly surfaced options
      if (node.addToPool && node.options) {
        setSessionPool((prev) => {
          const set = new Set(prev);
          node.options.forEach((id) => set.add(id));
          return Array.from(set);
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: node.aiText,
          mode: node.mode,
          options: node.options,
          surfaceMore: node.surfaceMore,
          showHiddenInsight: node.showHiddenInsight,
          showCompoundStrategy: node.showCompoundStrategy,
          showCompareAll: node.showCompareAll,
        },
      ]);

      // Auto-set selected option to first option (top pick)
      if (node.options && node.options.length > 0) {
        const firstId = node.options[0];
        const top = RESTAURANTS.find((r) => r.id === firstId);
        if (top) setSelectedOption(top);
      }

      setStep((prev) => prev + 1);
    }, calcDuration);
  }, [step, currentMode]);

  const placeholder = step < DEMO.length ? DEMO[step].user : "Demo complete";

  return (
    <div
      style={{
        fontFamily: font,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: T.surface,
        color: T.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmerBg {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 56,
          padding: "0 20px",
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 8px ${T.brandGlow}`,
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: fontDisplay,
              }}
            >
              W
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: T.text,
                fontFamily: fontDisplay,
              }}
            >
              WeCater
            </span>
            <span
              style={{
                fontSize: 10,
                color: T.textTertiary,
                marginLeft: 6,
                fontWeight: 500,
              }}
            >
              AI Optimizer
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Density toggle — Simple (new user) ↔ Detailed (power user) */}
        <div
          style={{
            display: "flex",
            padding: 3,
            background: T.surface,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            marginRight: 10,
          }}
        >
          {[
            { id: "simple", icon: "🎯", label: "Simple" },
            { id: "detailed", icon: "🔬", label: "Detailed" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDensity(opt.id)}
              title={
                opt.id === "simple"
                  ? "Clean view · just the essentials"
                  : "Pro view · full multiplier math"
              }
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: "none",
                background: density === opt.id ? T.card : "transparent",
                color: density === opt.id ? T.text : T.textTertiary,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: font,
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow:
                  density === opt.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s",
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            background: T.brandLight,
            borderRadius: 20,
          }}
        >
          <span style={{ fontSize: 12 }}>👤</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.brandDark }}>
            Sally · {ORDER_CTX.office}
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Chat */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Messages */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "20px 24px 10px" }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  animation: "fadeIn 0.5s ease",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    margin: "0 auto 16px",
                    background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 20px ${T.brandGlow}`,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🎯</span>
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    fontFamily: fontDisplay,
                    color: T.text,
                    marginBottom: 6,
                  }}
                >
                  What are we optimizing for?
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: T.textTertiary,
                    maxWidth: 440,
                    margin: "0 auto",
                    lineHeight: 1.5,
                  }}
                >
                  Tell me what you need or use a slash command. I'll compare all
                  8 partner restaurants across Bites earned, dietary fit,
                  compliance, and variety — in real time.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                    marginTop: 20,
                  }}
                >
                  {[
                    "Order for Dr. Patel's office, Tue lunch, 14 people",
                    "/maximize bites",
                    "What's the best deal today?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => step === 0 && handleSend()}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        fontSize: 12,
                        color: T.textSecondary,
                        cursor: "pointer",
                        fontFamily: font,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = T.brand;
                        e.target.style.color = T.brand;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = T.border;
                        e.target.style.color = T.textSecondary;
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{ marginBottom: 18, animation: "fadeIn 0.3s ease" }}
              >
                {msg.role === "user" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "10px 14px",
                        borderRadius: "16px 16px 4px 16px",
                        background: T.userMsg,
                        color: "#fff",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* AI bubble */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: fontDisplay,
                          }}
                        >
                          W
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        {/* Mode tag */}
                        {msg.mode &&
                          msg.mode !== "smart" &&
                          msg.mode !== "compare" && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 9px",
                                borderRadius: 10,
                                background: T.brandLight,
                                color: T.brandDark,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                marginBottom: 6,
                              }}
                            >
                              {MODES.find((m) => m.id === msg.mode)?.icon}{" "}
                              {MODES.find((m) => m.id === msg.mode)?.label} mode
                            </div>
                          )}
                        <div
                          style={{
                            padding: "12px 16px",
                            borderRadius: "16px 16px 16px 4px",
                            background: T.aiMsg,
                            fontSize: 13.5,
                            lineHeight: 1.55,
                            color: T.text,
                          }}
                        >
                          {msg.text
                            .split("**")
                            .map((part, j) =>
                              j % 2 === 1 ? (
                                <strong key={j}>{part}</strong>
                              ) : (
                                <span key={j}>{part}</span>
                              ),
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Hidden insight callout */}
                    {msg.showHiddenInsight && (
                      <div style={{ marginLeft: 38 }}>
                        <HiddenInsight />
                      </div>
                    )}

                    {/* Option cards rendered from explicit IDs in this turn */}
                    {msg.options && msg.options.length > 0 && (
                      <div style={{ marginLeft: 38, marginTop: 10 }}>
                        {/* "Added to working set" indicator on surfaceMore turns */}
                        {msg.surfaceMore && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 9px",
                              borderRadius: 12,
                              background: T.brandLight,
                              color: T.brandDark,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              marginBottom: 8,
                              fontFamily: fontDisplay,
                            }}
                          >
                            ➕ Added to your working set
                          </div>
                        )}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              msg.options.length === 1 ? "1fr" : "1fr 1fr",
                            gap: 10,
                          }}
                        >
                          {msg.options.map((id, idx) => {
                            const r = RESTAURANTS.find((x) => x.id === id);
                            if (!r) return null;
                            // Compute deltaToBest only for top pick when there are multiple options
                            const nextOption = msg.options[1];
                            const nextR = nextOption
                              ? RESTAURANTS.find((x) => x.id === nextOption)
                              : null;
                            const calc = calculateBites(r, ORDER_CTX);
                            const nextCalc = nextR
                              ? calculateBites(nextR, ORDER_CTX)
                              : null;
                            const deltaToBest =
                              idx === 0 &&
                              nextCalc &&
                              r.tier !== 3 &&
                              nextR.tier !== 3
                                ? calc.total - nextCalc.total
                                : undefined;
                            return (
                              <OptionCard
                                key={r.id}
                                restaurant={r}
                                ctx={ORDER_CTX}
                                isTopPick={idx === 0 && r.tier !== 3}
                                deltaToBest={deltaToBest}
                                baseDelay={idx * 100}
                                mode={msg.mode}
                                position={idx}
                                isCompound={
                                  msg.showCompoundStrategy && idx === 0
                                }
                                density={density}
                              />
                            );
                          })}
                        </div>

                        {/* "See more options" button (formerly "See all") — drives expansion */}
                        {!msg.showCompareAll && msg.options.length > 1 && (
                          <button
                            onClick={() =>
                              setExpandedCompare((prev) => ({
                                ...prev,
                                [i]: !prev[i],
                              }))
                            }
                            style={{
                              marginTop: 10,
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 10,
                              border: `1px dashed ${expandedCompare[i] ? T.brand : T.border}`,
                              background: expandedCompare[i]
                                ? T.brandLight
                                : T.card,
                              color: expandedCompare[i]
                                ? T.brandDark
                                : T.textSecondary,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: font,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!expandedCompare[i]) {
                                e.currentTarget.style.borderColor = T.brand;
                                e.currentTarget.style.color = T.brand;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!expandedCompare[i]) {
                                e.currentTarget.style.borderColor = T.border;
                                e.currentTarget.style.color = T.textSecondary;
                              }
                            }}
                          >
                            <span style={{ fontSize: 14 }}>📋</span>
                            <span>
                              {expandedCompare[i]
                                ? `Hide working-set comparison`
                                : `Compare options surfaced so far (${sessionPool.length})`}
                            </span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              style={{
                                transform: expandedCompare[i]
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            >
                              <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}

                        {/* Inline expanded compare — shows session pool */}
                        {expandedCompare[i] && !msg.showCompareAll && (
                          <CompareAllView
                            restaurants={RESTAURANTS.filter((r) =>
                              sessionPool.includes(r.id),
                            )}
                            ctx={ORDER_CTX}
                            mode={msg.mode}
                          />
                        )}
                      </div>
                    )}

                    {/* Compare all (when AI explicitly opens it via "compare what we've seen") */}
                    {msg.showCompareAll && (
                      <div style={{ marginLeft: 38 }}>
                        <CompareAllView
                          restaurants={RESTAURANTS.filter((r) =>
                            sessionPool.includes(r.id),
                          )}
                          ctx={ORDER_CTX}
                          mode={currentMode}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Calculating animation — funnel cascade for first message, simpler shimmer for re-ranking */}
            {isCalculating && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 18,
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "spinSlow 2s linear infinite",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: fontDisplay,
                    }}
                  >
                    W
                  </span>
                </div>
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "16px 16px 16px 4px",
                    background: T.aiMsg,
                    fontSize: 13,
                    color: T.textSecondary,
                    minWidth: 360,
                  }}
                >
                  {step === 0 ? (
                    // First-message funnel: visualize the AI doing real work
                    <FunnelCascade />
                  ) : (
                    // Subsequent re-rank: simpler "thinking" indicator
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span>
                        Re-ranking your working set against active multipliers
                      </span>
                      <span style={{ display: "flex", gap: 3 }}>
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: T.brand,
                              animation: `pulse 1.2s ${d * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Optimization mode pills + input */}
          <div
            style={{
              borderTop: `1px solid ${T.borderLight}`,
              background: T.card,
              padding: "12px 20px 16px",
            }}
          >
            {/* Mode pills */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 10,
                overflowX: "auto",
                paddingBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.textTertiary,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  alignSelf: "center",
                  whiteSpace: "nowrap",
                  marginRight: 4,
                }}
              >
                Optimize:
              </span>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCurrentMode(m.id)}
                  title={m.desc}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 14,
                    whiteSpace: "nowrap",
                    border: `1px solid ${currentMode === m.id ? T.brand : T.border}`,
                    background: currentMode === m.id ? T.brandLight : T.card,
                    color: currentMode === m.id ? T.brandDark : T.textSecondary,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: font,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s",
                  }}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: T.surface,
                borderRadius: 14,
                border: `1px solid ${T.border}`,
                padding: "4px 4px 4px 16px",
              }}
            >
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={placeholder}
                style={{
                  flex: 1,
                  border: "none",
                  background: "none",
                  outline: "none",
                  fontSize: 13.5,
                  color: T.text,
                  fontFamily: font,
                }}
              />
              <button
                onClick={handleSend}
                disabled={step >= DEMO.length}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "none",
                  background: step < DEMO.length ? T.brand : T.border,
                  cursor: step < DEMO.length ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 10, color: T.textTertiary }}>
                {step < DEMO.length
                  ? `Press Enter to continue · step ${step + 1} of ${DEMO.length}`
                  : "✅ Demo complete — review the panels"}
              </span>
              <span style={{ fontSize: 10, color: T.textTertiary }}>
                Try slash commands or natural language
              </span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderLeft: `1px solid ${T.border}`,
            background: T.surface,
            overflowY: "auto",
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: fontDisplay,
              }}
            >
              Live Optimization
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 10,
                background: T.successBg,
                color: T.success,
                fontWeight: 700,
              }}
            >
              {MODES.find((m) => m.id === currentMode)?.icon}{" "}
              {MODES.find((m) => m.id === currentMode)?.label}
            </span>
          </div>

          {/* Bites Forecast */}
          <BitesForecastCard option={selectedOption} ctx={ORDER_CTX} />

          {/* Working Set — session pool tracker */}
          {sessionPool.length > 0 && (
            <div
              style={{
                background: T.card,
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textTertiary,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: fontDisplay,
                  }}
                >
                  🎒 Working Set
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.brand,
                    fontFamily: fontMono,
                  }}
                >
                  {sessionPool.length}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.textSecondary,
                  marginBottom: 8,
                  lineHeight: 1.45,
                }}
              >
                Options we've considered together this session.
              </div>
              {/* Mini breakdown by tier */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: T.brand,
                    }}
                  />
                  <span style={{ fontSize: 11, color: T.text }}>
                    {
                      sessionPool.filter(
                        (id) =>
                          RESTAURANTS.find((r) => r.id === id)?.tier !== 3,
                      ).length
                    }{" "}
                    partner restaurants
                  </span>
                </div>
                {sessionPool.filter(
                  (id) => RESTAURANTS.find((r) => r.id === id)?.tier === 3,
                ).length > 0 && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: T.textTertiary,
                        border: `1px dashed ${T.textTertiary}`,
                      }}
                    />
                    <span style={{ fontSize: 11, color: T.text }}>
                      {
                        sessionPool.filter(
                          (id) =>
                            RESTAURANTS.find((r) => r.id === id)?.tier === 3,
                        ).length
                      }{" "}
                      discovery options
                    </span>
                  </div>
                )}
              </div>
              {sessionPool.length >= 3 && step < DEMO.length - 1 && (
                <div
                  style={{
                    fontSize: 10,
                    color: T.textTertiary,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                  }}
                >
                  Say "compare what we've seen" anytime to view all together.
                </div>
              )}
            </div>
          )}

          {/* Wallet snapshot */}
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: fontDisplay,
              }}
            >
              Your Wallet
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: T.brand,
                  fontFamily: fontMono,
                }}
              >
                27,420
              </span>
              <span style={{ fontSize: 11, color: T.textTertiary }}>
                Bites · ${(27420 / 100).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                height: 5,
                background: T.borderLight,
                borderRadius: 3,
                overflow: "hidden",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: "65%",
                  height: "100%",
                  background: T.brand,
                  borderRadius: 3,
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: T.textTertiary }}>
              1,840 Bites pending · 18 days left in Welcome 2X
            </div>
          </div>

          {/* Active multipliers */}
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: fontDisplay,
              }}
            >
              Active Multipliers
            </div>
            {[
              {
                icon: "🎁",
                label: "Welcome 2X",
                desc: "All Bites earned doubled · 18d left",
                color: T.brand,
              },
              {
                icon: "🚀",
                label: "Restaurant Boost",
                desc: "5 restaurants offer up to 1.5X redemption",
                color: T.purple,
              },
              {
                icon: "🔥",
                label: "Flash Promo",
                desc: "True Food Kitchen 12X — until 5pm today",
                color: T.danger,
              },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "7px 0",
                  borderTop: i > 0 ? `1px solid ${T.borderLight}` : "none",
                }}
              >
                <span style={{ fontSize: 14, marginTop: 2 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 11, fontWeight: 600, color: m.color }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: T.textSecondary,
                      lineHeight: 1.4,
                      marginTop: 1,
                    }}
                  >
                    {m.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance & order context */}
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: fontDisplay,
              }}
            >
              Order Context
            </div>
            <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}>
              {ORDER_CTX.office}
            </div>
            <div
              style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8 }}
            >
              {ORDER_CTX.headcount} people · ${ORDER_CTX.budgetTotal} budget
            </div>
            <div
              style={{
                marginTop: 8,
                padding: "6px 10px",
                background: T.infoBg,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: T.info,
                  marginBottom: 3,
                }}
              >
                ☂️ {ORDER_CTX.physician.name} YTD
              </div>
              <div
                style={{
                  height: 5,
                  background: "rgba(37,99,235,0.15)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(ORDER_CTX.physician.ytd / ORDER_CTX.physician.threshold) * 100}%`,
                    height: "100%",
                    background: T.info,
                    borderRadius: 3,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: T.info,
                  fontFamily: fontMono,
                  marginTop: 3,
                }}
              >
                ${ORDER_CTX.physician.ytd} / ${ORDER_CTX.physician.threshold}
              </div>
            </div>
          </div>

          {/* Pro tip — contextual to demo step */}
          <div
            style={{
              padding: 12,
              background: T.brandLight,
              borderRadius: 10,
              border: `1px dashed ${T.brand}55`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.brand,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              💡 Did you know?
            </div>
            {step <= 1 && (
              <div
                style={{
                  fontSize: 11,
                  color: T.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                I filtered{" "}
                <strong style={{ color: T.text }}>
                  1,247 Phoenix partners
                </strong>{" "}
                down to 47 viable matches before picking these top 3. Tap{" "}
                <strong style={{ color: T.brand }}>
                  "How is this calculated?"
                </strong>{" "}
                on any card to see the full math — or say{" "}
                <strong style={{ color: T.brand }}>"show me more"</strong> to
                expand your working set.
              </div>
            )}
            {step === 2 && (
              <div
                style={{
                  fontSize: 11,
                  color: T.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                Discovery options (📍 dashed border) aren't WeCater partners
                yet. They show up when no current partner fills a specific gap.
                Sally requests a quote — we email them; they activate; everyone
                wins.
              </div>
            )}
            {step === 3 && (
              <div
                style={{
                  fontSize: 11,
                  color: T.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                Try{" "}
                <code
                  style={{
                    background: T.card,
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontSize: 10,
                    fontFamily: fontMono,
                    color: T.brand,
                  }}
                >
                  /maximize discount
                </code>{" "}
                to apply your existing 27,420 Bites for the biggest discount on
                this order.
              </div>
            )}
            {step === 4 && (
              <div
                style={{
                  fontSize: 11,
                  color: T.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                Compare All shows your{" "}
                <strong style={{ color: T.text }}>working set</strong> — the
                options we've considered together this session — sortable by
                Bites, price, or dietary fit. Discovery options grouped at the
                bottom.
              </div>
            )}
            {step >= 5 && (
              <div
                style={{
                  fontSize: 11,
                  color: T.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                Six discovery paths: density toggle, expand a card, mode pills,
                slash commands, plain English, "show me more." Working set
                persists across all of them.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
