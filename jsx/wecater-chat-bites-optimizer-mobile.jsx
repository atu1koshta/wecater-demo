import { useState, useEffect, useRef, useMemo } from "react";

// ─── Design tokens (matches desktop optimizer + mobile chatbot for visual continuity) ───
const T = {
  brand: "#E86A1A",
  brandLight: "#FEF3EB",
  brandDark: "#C4540F",
  brandGlow: "rgba(232,106,26,0.12)",
  surface: "#FAFAF8",
  surfaceAlt: "#F5F1EC",
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
  overlay: "rgba(20, 18, 15, 0.45)",
};
const font = `'DM Sans', -apple-system, sans-serif`;
const fontDisplay = `'Outfit', ${font}`;
const fontMono = `'JetBrains Mono', monospace`;

// ─── Restaurant universe ───
const RESTAURANTS = [
  {
    id: "pita-jungle",
    name: "Pita Jungle",
    cuisine: "Mediterranean",
    emoji: "🥙",
    brandColor: "#1B3A2E",
    brandColorAccent: "#2D5848",
    rating: 4.6,
    reviewCount: 2840,
    perPerson: 14.5,
    baseRate: 8,
    restaurantBoost: 1.4,
    sameDay: true,
    dietaryFit: {
      vegetarian: true,
      vegan: true,
      "gluten-free": true,
      "tree nut allergy": "mostly",
      halal: false,
    },
    flashPromo: null,
    recentlyOrdered: false,
    tier: 1,
    photoCategory: "mediterranean",
  },
  {
    id: "barrio-queen",
    name: "Barrio Queen",
    cuisine: "Mexican",
    emoji: "🌮",
    brandColor: "#7A1F2B",
    brandColorAccent: "#A5333E",
    rating: 4.7,
    reviewCount: 1920,
    perPerson: 14.8,
    baseRate: 6,
    restaurantBoost: 1.3,
    sameDay: true,
    dietaryFit: {
      vegetarian: true,
      vegan: true,
      "gluten-free": true,
      "tree nut allergy": true,
      halal: true,
    },
    flashPromo: null,
    recentlyOrdered: false,
    tier: 1,
    photoCategory: "mexican",
  },
  {
    id: "bobby-q",
    name: "Bobby Q",
    cuisine: "BBQ",
    emoji: "🥩",
    brandColor: "#5A2E1A",
    brandColorAccent: "#7C4023",
    rating: 4.5,
    reviewCount: 1340,
    perPerson: 15.0,
    baseRate: 5,
    restaurantBoost: 1.2,
    sameDay: false,
    dietaryFit: {
      vegetarian: "limited",
      vegan: false,
      "gluten-free": true,
      "tree nut allergy": true,
      halal: false,
    },
    flashPromo: null,
    recentlyOrdered: false,
    tier: 1,
    photoCategory: "bbq",
  },
  {
    id: "flower-child",
    name: "Flower Child",
    cuisine: "Healthy bowls",
    emoji: "🥗",
    brandColor: "#3D5A3D",
    brandColorAccent: "#5A7A5A",
    rating: 4.8,
    reviewCount: 2120,
    perPerson: 18.5,
    baseRate: 7,
    restaurantBoost: 1.5,
    sameDay: true,
    dietaryFit: {
      vegetarian: true,
      vegan: true,
      "gluten-free": true,
      "tree nut allergy": true,
      halal: false,
    },
    flashPromo: null,
    recentlyOrdered: false,
    tier: 1,
    photoCategory: "bowls",
  },
  {
    id: "true-food",
    name: "True Food Kitchen",
    cuisine: "Anti-inflammatory",
    emoji: "🌿",
    brandColor: "#2E5A4E",
    brandColorAccent: "#4A7A6E",
    rating: 4.6,
    reviewCount: 1830,
    perPerson: 16.5,
    baseRate: 6,
    restaurantBoost: 1.4,
    sameDay: false,
    dietaryFit: {
      vegetarian: true,
      vegan: true,
      "gluten-free": true,
      "tree nut allergy": true,
      halal: false,
    },
    flashPromo: {
      multiplier: 12,
      label: "12X today only",
      expiresIn: "ends 11pm",
    },
    recentlyOrdered: false,
    tier: 1,
    photoCategory: "bowls",
  },
  // Tier 3 — discovery
  {
    id: "saigon-pho",
    name: "Saigon Pho House",
    cuisine: "Vietnamese",
    emoji: "🍜",
    brandColor: "#5A2E2E",
    brandColorAccent: "#7C4040",
    rating: 4.7,
    reviewCount: 680,
    perPerson: 13.5,
    baseRate: null,
    restaurantBoost: null,
    sameDay: true,
    dietaryFit: {
      vegetarian: true,
      vegan: true,
      "gluten-free": true,
      "tree nut allergy": true,
      halal: false,
    },
    flashPromo: null,
    recentlyOrdered: false,
    tier: 3,
    estimatedBaseRate: 5,
    sourceData: { source: "Yelp", lastScraped: "8 days ago" },
    photoCategory: "asian",
  },
];

const ORDER_CTX = {
  headcount: 14,
  budgetPerPerson: 15,
  budgetTotal: 210,
  dietary: ["vegetarian", "vegan", "gluten-free", "tree nut allergy"],
  recentCuisinesByMonth: { Thai: 1, Mediterranean: 2, Indian: 1 },
  competitorBrought: ["Sushi"],
  welcomeActive: true,
  welcomeMultiplier: 2,
  welcomeDaysLeft: 18,
  bitesBalance: 12750,
  preferences: { freshness: "high", complianceTrack: "Dr. Patel" },
  isUrgent: false,
};

// ─── Calculation logic (shared with desktop) ───
function calculateBites(r, ctx, mode) {
  const subtotal = r.perPerson * ctx.headcount;
  const baseRate = r.baseRate || r.estimatedBaseRate || 0;
  const flash = r.flashPromo?.multiplier || baseRate;
  const effectiveRate = mode === "max-bites" && r.flashPromo ? flash : baseRate;
  const baseBites = Math.round(subtotal * effectiveRate);
  const welcomeBonus = ctx.welcomeActive
    ? Math.round(baseBites * (ctx.welcomeMultiplier - 1))
    : 0;
  const totalBites = baseBites + welcomeBonus;
  return {
    subtotal,
    baseBites,
    welcomeBonus,
    totalBites,
    effectiveRate,
    flashActive: mode === "max-bites" && r.flashPromo,
  };
}

function calculateRedemption(r, bites) {
  const cashValue = bites / 100;
  const restaurantValue = r.restaurantBoost
    ? cashValue * r.restaurantBoost
    : null;
  return { cashValue, restaurantValue };
}

function smartScore(r, ctx) {
  let score = 0;
  if (r.flashPromo) score += 30;
  ctx.dietary.forEach((d) => {
    if (r.dietaryFit[d] === true) score += 8;
    else if (r.dietaryFit[d] === "limited") score -= 3;
    else if (!r.dietaryFit[d]) score -= 10;
  });
  if ((ctx.recentCuisinesByMonth[r.cuisine] || 0) === 0) score += 12;
  if (r.perPerson <= ctx.budgetPerPerson) score += 10;
  score += (r.baseRate || r.estimatedBaseRate || 0) * 1.2;
  if (r.tier === 3) score -= 4;
  return score;
}

function rationaleFor(r, mode, position, ctx) {
  if (mode === "compliance" && ctx.preferences.complianceTrack) {
    return `Per-person $${r.perPerson} keeps ${ctx.preferences.complianceTrack} safely under threshold`;
  }
  if (mode === "max-bites" && r.flashPromo)
    return `${r.flashPromo.label} — highest effective Bites rate today`;
  if (mode === "max-discount")
    return `Lowest per-person cost in your filtered set`;
  if (mode === "same-day" && r.sameDay)
    return `Confirmed same-day delivery available`;
  if (position === 0) {
    if (r.flashPromo)
      return `${r.flashPromo.label} pushes Bites earnings well above alternatives`;
    if ((ctx.recentCuisinesByMonth[r.cuisine] || 0) === 0)
      return `Fresh cuisine choice (not used this month) plus solid Bites earn rate`;
    return `Strong dietary coverage and competitive Bites rate at your budget`;
  }
  return `Solid backup option with ${r.baseRate || r.estimatedBaseRate}X base earn rate`;
}

function rankBy(restaurants, mode, ctx) {
  const scored = restaurants.map((r) => ({ r, s: smartScore(r, ctx) }));
  if (mode === "smart") scored.sort((a, b) => b.s - a.s);
  if (mode === "max-bites")
    scored.sort(
      (a, b) =>
        calculateBites(b.r, ctx, mode).totalBites -
        calculateBites(a.r, ctx, mode).totalBites,
    );
  if (mode === "max-discount")
    scored.sort((a, b) => a.r.perPerson - b.r.perPerson);
  if (mode === "same-day")
    scored.sort(
      (a, b) => (b.r.sameDay ? 1 : 0) - (a.r.sameDay ? 1 : 0) || b.s - a.s,
    );
  if (mode === "compliance")
    scored.sort(
      (a, b) => Math.abs(15 - a.r.perPerson) - Math.abs(15 - b.r.perPerson),
    );
  return scored.map((x) => x.r);
}

const MODES = [
  {
    id: "smart",
    icon: "🎯",
    name: "Smart Pick",
    desc: "Balanced across all factors",
  },
  {
    id: "max-bites",
    icon: "🪙",
    name: "Max Bites",
    desc: "Optimize for highest earn",
  },
  {
    id: "max-discount",
    icon: "💵",
    name: "Max Discount",
    desc: "Lowest per-person price",
  },
  {
    id: "same-day",
    icon: "⚡",
    name: "Same-Day",
    desc: "Confirmed delivery today",
  },
  {
    id: "compliance",
    icon: "⚖️",
    name: "Compliance",
    desc: "Stay under physician threshold",
  },
];

const DEMO_INPUT =
  "Order tomorrow at 12 for Dr. Patel's office. 14 people, $15/pp, vegan + gluten-free + nut allergy must be covered. Pfizer rep brought sushi last week.";

// ─── Phone frame chrome ───
function PhoneStatusBar() {
  return (
    <div
      style={{
        height: 44,
        padding: "0 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: T.card,
        fontSize: 14,
        fontWeight: 600,
        color: T.text,
        fontFamily: font,
        position: "relative",
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: `-apple-system, ${font}` }}>9:41</span>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 8,
          transform: "translateX(-50%)",
          width: 110,
          height: 28,
          borderRadius: 18,
          background: "#000",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <g fill="currentColor">
            <rect x="0" y="7" width="3" height="4" rx="0.5" />
            <rect x="4" y="5" width="3" height="6" rx="0.5" />
            <rect x="8" y="3" width="3" height="8" rx="0.5" />
            <rect x="12" y="0" width="3" height="11" rx="0.5" />
          </g>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 11l1.5-1.5c-.4-.4-.95-.65-1.5-.65s-1.1.25-1.5.65L7.5 11zm0-3.7c1.18 0 2.27.43 3.13 1.13l1.42-1.42C10.74 5.85 9.18 5.13 7.5 5.13s-3.24.72-4.55 1.88l1.42 1.42c.86-.7 1.95-1.13 3.13-1.13zm0-3.7c2.34 0 4.49.84 6.13 2.27l1.42-1.42C13.07 2.61 10.4 1.5 7.5 1.5s-5.57 1.11-7.55 2.95l1.42 1.42C2.99 4.44 5.16 3.6 7.5 3.6z" />
        </svg>
        <div
          style={{
            width: 25,
            height: 12,
            border: `1.2px solid ${T.text}`,
            borderRadius: 3,
            position: "relative",
            padding: 1,
          }}
        >
          <div
            style={{
              height: "100%",
              width: "85%",
              background: T.text,
              borderRadius: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -2.5,
              top: 3,
              width: 1.5,
              height: 4,
              background: T.text,
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div
      style={{
        height: 22,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 6,
        background: T.card,
        position: "relative",
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      <div
        style={{ width: 134, height: 5, borderRadius: 3, background: T.text }}
      />
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 20px",
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #E5E1DC 0%, #D8D2CC 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily: font,
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 56,
          overflow: "hidden",
          background: T.card,
          boxShadow:
            "0 0 0 12px #1c1c1e, 0 0 0 14px #2a2a2d, 0 30px 80px rgba(0,0,0,0.35)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── App header with mode chip ───
function AppHeader({ mode, modeData, onModeTap, bites }) {
  return (
    <div
      style={{
        height: 56,
        padding: "0 14px",
        flexShrink: 0,
        background: T.card,
        borderBottom: `1px solid ${T.borderLight}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <button
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "none",
          background: T.surface,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 4l-4 4 4 4"
            stroke={T.text}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.text,
            fontFamily: fontDisplay,
            lineHeight: 1.2,
          }}
        >
          AI Optimizer
        </div>
        <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 1 }}>
          Cascade ranking · {modeData.name}
        </div>
      </div>
      {/* Mode chip — tap to open mode picker */}
      <button
        onClick={onModeTap}
        style={{
          padding: "7px 11px",
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          background: T.surface,
          fontFamily: font,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13 }}>{modeData.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
          {modeData.name}
        </span>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke={T.textTertiary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {bites != null && (
        <div
          style={{
            padding: "5px 9px",
            borderRadius: 14,
            background: T.brandLight,
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11 }}>🪙</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.brandDark,
              fontFamily: fontMono,
            }}
          >
            {(bites / 1000).toFixed(1)}K
          </span>
        </div>
      )}
    </div>
  );
}

// ─── User input bubble at top showing what was asked ───
function UserAsk({ text }) {
  return (
    <div style={{ padding: "12px 14px 4px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          animation: "fadeIn 0.25s ease",
        }}
      >
        <div
          style={{
            maxWidth: "92%",
            padding: "10px 13px",
            borderRadius: "16px 16px 4px 16px",
            background: T.userMsg,
            color: "#fff",
            fontSize: 12.5,
            lineHeight: 1.45,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

// ─── Vertical funnel cascade ───
function VerticalCascade() {
  const steps = [
    {
      count: 1247,
      label: "All Phoenix restaurants",
      filter: null,
      accent: T.textTertiary,
    },
    {
      count: 312,
      label: "Match cuisine + headcount",
      filter: "headcount + lunch service",
      accent: T.info,
    },
    {
      count: 89,
      label: "Cover all dietary needs",
      filter: "vegan · GF · nut allergy",
      accent: T.success,
    },
    {
      count: 47,
      label: "Within budget + same-day",
      filter: "$15/pp · today fulfillment",
      accent: T.warning,
    },
    {
      count: 6,
      label: "Ranked options shown below",
      filter: "Smart Pick scoring",
      accent: T.brand,
    },
  ];

  return (
    <div
      style={{
        padding: "12px 14px",
        background: T.card,
        borderTop: `1px solid ${T.borderLight}`,
        borderBottom: `1px solid ${T.borderLight}`,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: T.textTertiary,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 10,
          fontFamily: fontDisplay,
        }}
      >
        🔍 Filter cascade
      </div>
      <div style={{ position: "relative", paddingLeft: 18 }}>
        {/* Vertical connecting line */}
        <div
          style={{
            position: "absolute",
            left: 5,
            top: 6,
            bottom: 6,
            width: 2,
            background: `linear-gradient(to bottom, ${T.textTertiary}33, ${T.brand}55)`,
          }}
        />

        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 0",
              position: "relative",
              animation: `fadeIn 0.3s ${i * 80}ms ease backwards`,
            }}
          >
            {/* Bullet on the line */}
            <div
              style={{
                position: "absolute",
                left: -18,
                top: 12,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: s.accent,
                border: `2px solid ${T.card}`,
                boxShadow: `0 0 0 1px ${s.accent}55`,
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: s.accent,
                fontFamily: fontMono,
                minWidth: 56,
                textAlign: "right",
              }}
            >
              {s.count.toLocaleString()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>
                {s.label}
              </div>
              {s.filter && (
                <div
                  style={{ fontSize: 10, color: T.textTertiary, marginTop: 1 }}
                >
                  filter: {s.filter}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tier 3 hidden insight callout ───
function HiddenInsight({ restaurant, bites, onTap }) {
  return (
    <button
      onClick={onTap}
      style={{
        display: "block",
        width: "100%",
        padding: 12,
        marginBottom: 10,
        background: T.warningBg,
        border: `1.5px dashed ${T.warning}`,
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: font,
        animation: "fadeIn 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13 }}>💡</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.warning,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: fontDisplay,
          }}
        >
          Hidden gem
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 8,
            padding: "1px 5px",
            borderRadius: 3,
            background: T.warning,
            color: "#fff",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          📍 DISCOVERY
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: T.text,
          lineHeight: 1.5,
          marginBottom: 6,
        }}
      >
        <strong>{restaurant.name}</strong> ({restaurant.cuisine}) covers all
        dietary needs and is in your budget — but isn't yet a partner. Estimated{" "}
        <strong style={{ color: T.brand }}>
          ~{bites.toLocaleString()} Bites
        </strong>{" "}
        if activated.
      </div>
      <div style={{ fontSize: 10, color: T.warning, fontWeight: 600 }}>
        Tap to send quote request →
      </div>
    </button>
  );
}

// ─── Compound play strategy callout ───
function CompoundPlayCallout({ topPick, ctx }) {
  const bites = calculateBites(topPick, ctx, "max-bites");
  return (
    <div
      style={{
        padding: 12,
        marginBottom: 10,
        background: `linear-gradient(135deg, ${T.brand}10, ${T.purple}10)`,
        border: `1.5px solid ${T.brand}55`,
        borderRadius: 12,
        animation: "fadeIn 0.5s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>⚡</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.brand,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: fontDisplay,
          }}
        >
          Compound play available
        </span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: T.text,
          lineHeight: 1.55,
          marginBottom: 8,
        }}
      >
        Stack <strong>Welcome 2X</strong> +{" "}
        <strong>
          {topPick.flashPromo?.label || `${topPick.baseRate}X base`}
        </strong>{" "}
        + future redemption at <strong>{topPick.restaurantBoost}X</strong> to
        maximize value.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          padding: "8px 10px",
          background: T.card,
          borderRadius: 8,
        }}
      >
        <CompoundStat
          label="Earn"
          value={bites.totalBites.toLocaleString()}
          unit="Bites"
          color={T.brand}
        />
        <CompoundStat
          label="Cash equiv"
          value={`$${(bites.totalBites / 100).toFixed(0)}`}
          unit=""
          color={T.text}
        />
        <CompoundStat
          label="At restaurant"
          value={`$${((bites.totalBites / 100) * (topPick.restaurantBoost || 1)).toFixed(0)}`}
          unit={`@${topPick.restaurantBoost}X`}
          color={T.purple}
        />
      </div>
    </div>
  );
}

function CompoundStat({ label, value, unit, color }) {
  return (
    <div>
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: T.textTertiary,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color,
          fontFamily: fontMono,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {unit && (
        <div style={{ fontSize: 9, color: T.textTertiary, marginTop: 1 }}>
          {unit}
        </div>
      )}
    </div>
  );
}

// ─── Recommendation card (single column, brand-backdrop hero) ───
function RecommendationCard({ restaurant, ctx, mode, position, isTopPick }) {
  const bites = calculateBites(restaurant, ctx, mode);
  const redemption = calculateRedemption(restaurant, bites.totalBites);
  const dietaryFlags = ctx.dietary.map((d) => ({
    tag: d,
    fit: restaurant.dietaryFit[d],
  }));
  const fullCoverage = dietaryFlags.every((d) => d.fit === true);
  const isOver = restaurant.perPerson > ctx.budgetPerPerson;
  const isFresh = (ctx.recentCuisinesByMonth[restaurant.cuisine] || 0) === 0;
  const rationale = rationaleFor(restaurant, mode, position, ctx);

  return (
    <div
      style={{
        marginBottom: 10,
        borderRadius: 14,
        overflow: "hidden",
        background: T.card,
        border: isTopPick ? `1.5px solid ${T.brand}` : `1px solid ${T.border}`,
        boxShadow: isTopPick
          ? `0 4px 16px ${T.brandGlow}`
          : "0 1px 3px rgba(0,0,0,0.04)",
        animation: `fadeIn 0.3s ${position * 80}ms ease backwards`,
      }}
    >
      {/* Brand hero strip */}
      <div
        style={{
          position: "relative",
          height: 88,
          background: `linear-gradient(135deg, ${restaurant.brandColor}, ${restaurant.brandColorAccent})`,
          overflow: "hidden",
        }}
      >
        {/* Large emoji as hero subject (would be real photo in production) */}
        <div
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 64,
            opacity: 0.35,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
          }}
        >
          {restaurant.emoji}
        </div>
        {/* Gradient overlay for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${restaurant.brandColor}E0 0%, ${restaurant.brandColor}80 50%, transparent 100%)`,
          }}
        />
        {/* Top pick badge */}
        {isTopPick && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              padding: "3px 9px",
              borderRadius: 14,
              background: T.brand,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>★</span>
            <span>Top Pick</span>
          </div>
        )}
        {/* Position pill */}
        {!isTopPick && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              padding: "3px 8px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              backdropFilter: "blur(6px)",
              fontSize: 10,
              fontWeight: 700,
              fontFamily: fontMono,
            }}
          >
            #{position + 1}
          </div>
        )}
        {/* Flash promo */}
        {restaurant.flashPromo && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              padding: "3px 8px",
              borderRadius: 14,
              background: T.warning,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
              animation: "pulse-warn 2s infinite",
            }}
          >
            <span>🔥</span>
            <span>{restaurant.flashPromo.label}</span>
          </div>
        )}
        {/* Restaurant name overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 14,
            right: 14,
            color: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: fontDisplay,
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {restaurant.name}
          </div>
          <div
            style={{
              fontSize: 10,
              opacity: 0.9,
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{restaurant.cuisine}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>★ {restaurant.rating}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>${restaurant.perPerson}/pp</span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "12px 14px" }}>
        {/* Bites + price row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              You'll earn
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: T.brand,
                  fontFamily: fontDisplay,
                }}
              >
                {bites.totalBites.toLocaleString()}
              </span>
              <span
                style={{ fontSize: 10, color: T.textTertiary, fontWeight: 600 }}
              >
                Bites
              </span>
            </div>
            <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 1 }}>
              ≈ ${redemption.cashValue.toFixed(2)}
              {redemption.restaurantValue
                ? ` · $${redemption.restaurantValue.toFixed(2)} @ ${restaurant.restaurantBoost}X here`
                : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Total
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isOver ? T.danger : T.text,
                fontFamily: fontMono,
              }}
            >
              ${bites.subtotal.toFixed(0)}
            </div>
            {isOver && (
              <div style={{ fontSize: 9, color: T.danger, fontWeight: 600 }}>
                Over budget
              </div>
            )}
          </div>
        </div>

        {/* Multiplier chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            marginBottom: 10,
          }}
        >
          <ChipMini
            label={`${bites.effectiveRate}X base`}
            color={T.brand}
            bg={T.brandLight}
            mono
          />
          {ctx.welcomeActive && (
            <ChipMini
              label={`+${ctx.welcomeMultiplier}X welcome`}
              color={T.brand}
              bg={T.brandLight}
            />
          )}
          {restaurant.flashPromo && mode === "max-bites" && (
            <ChipMini
              label="🔥 flash applied"
              color={T.warning}
              bg={T.warningBg}
            />
          )}
          {fullCoverage && (
            <ChipMini label="✓ full diet" color={T.success} bg={T.successBg} />
          )}
          {!fullCoverage && (
            <ChipMini
              label="⚠ limited diet"
              color={T.warning}
              bg={T.warningBg}
            />
          )}
          {isFresh && (
            <ChipMini
              label="✨ fresh cuisine"
              color={T.purple}
              bg={T.purpleBg}
            />
          )}
          {restaurant.sameDay && (
            <ChipMini label="⚡ same-day" color={T.info} bg={T.infoBg} />
          )}
        </div>

        {/* Rationale */}
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: T.surface,
            fontSize: 11,
            color: T.textSecondary,
            lineHeight: 1.45,
            marginBottom: 10,
          }}
        >
          <span style={{ fontWeight: 600, color: T.text }}>Why: </span>
          {rationale}
        </div>

        {/* Action button */}
        <button
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "none",
            background: isTopPick
              ? `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`
              : T.surface,
            color: isTopPick ? "#fff" : T.text,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: font,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: isTopPick ? `0 2px 8px ${T.brandGlow}` : "none",
            border: isTopPick ? "none" : `1px solid ${T.border}`,
          }}
        >
          <span>🍴</span>
          <span>{isTopPick ? "Build cart →" : "Pick this option →"}</span>
        </button>
      </div>
    </div>
  );
}

function ChipMini({ label, color, bg, mono }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: "3px 7px",
        borderRadius: 5,
        background: bg,
        color: color,
        fontWeight: 700,
        fontFamily: mono ? fontMono : font,
        letterSpacing: mono ? "0.02em" : "0",
      }}
    >
      {label}
    </span>
  );
}

// ─── Mode picker bottom sheet ───
function ModePickerSheet({ open, currentMode, onSelect, onClose }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: T.overlay,
          zIndex: 40,
          animation: "fadeIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: T.card,
          zIndex: 41,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
          maxHeight: "70%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 0 6px",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              background: T.border,
            }}
          />
        </div>
        <div
          style={{
            padding: "4px 18px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: T.text,
              fontFamily: fontDisplay,
            }}
          >
            Optimization mode
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: T.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              color: T.text,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "0 14px 24px", overflowY: "auto" }}>
          {MODES.map((m) => {
            const isSelected = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelect(m.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 6,
                  borderRadius: 12,
                  background: isSelected ? T.brandLight : T.surface,
                  border: `1px solid ${isSelected ? T.brand : T.border}`,
                  cursor: "pointer",
                  fontFamily: font,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: isSelected ? T.brand : T.card,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {m.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                      fontFamily: fontDisplay,
                      marginBottom: 1,
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.textTertiary,
                      lineHeight: 1.3,
                    }}
                  >
                    {m.desc}
                  </div>
                </div>
                {isSelected && (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: T.brand,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Working set bottom sheet (the broader pool) ───
function WorkingSetSheet({ open, onClose, restaurants, ctx, mode }) {
  if (!open) return null;
  const ranked = rankBy(restaurants, mode, ctx);
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: T.overlay,
          zIndex: 40,
          animation: "fadeIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: T.card,
          zIndex: 41,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
          height: "85%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 0 6px",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              background: T.border,
            }}
          />
        </div>
        <div
          style={{
            padding: "4px 18px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: T.text,
                fontFamily: fontDisplay,
              }}
            >
              Working set
            </div>
            <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 1 }}>
              {restaurants.length} options after filter cascade · scored by{" "}
              {mode}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: T.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              color: T.text,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "0 14px 24px", overflowY: "auto" }}>
          {ranked.map((r, i) => {
            const bites = calculateBites(r, ctx, mode);
            return (
              <div
                key={r.id}
                style={{
                  padding: "10px 12px",
                  marginBottom: 6,
                  borderRadius: 10,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${r.brandColor}, ${r.brandColorAccent})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {r.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span>{r.name}</span>
                    {r.tier === 3 && (
                      <span
                        style={{
                          fontSize: 8,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: T.warning,
                          color: "#fff",
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                        }}
                      >
                        📍 T3
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: T.textTertiary }}>
                    {r.cuisine} · ${r.perPerson}/pp ·{" "}
                    {r.baseRate || r.estimatedBaseRate || 0}X
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.brand,
                      fontFamily: fontMono,
                    }}
                  >
                    {bites.totalBites.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 9, color: T.textTertiary }}>
                    Bites
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Bottom action bar ───
function BottomActionBar({ onSeeAll, count }) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "10px 14px",
        background: T.card,
        borderTop: `1px solid ${T.borderLight}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <button
        onClick={onSeeAll}
        style={{
          flex: 1,
          padding: "11px 14px",
          borderRadius: 11,
          border: `1px solid ${T.border}`,
          background: T.surface,
          color: T.text,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: font,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <span>📋</span>
        <span>See all {count} options</span>
      </button>
    </div>
  );
}

// ─── Main ───
export default function MobileChatBitesOptimizer() {
  const [mode, setMode] = useState("smart");
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showWorkingSet, setShowWorkingSet] = useState(false);
  const modeData = MODES.find((m) => m.id === mode);

  // Top 3 ranked by current mode
  const tier1Restaurants = RESTAURANTS.filter((r) => r.tier === 1);
  const ranked = useMemo(
    () => rankBy(tier1Restaurants, mode, ORDER_CTX).slice(0, 3),
    [mode],
  );
  const tier3 = RESTAURANTS.find((r) => r.tier === 3);
  const tier3Bites = useMemo(() => {
    const subtotal = tier3.perPerson * ORDER_CTX.headcount;
    const base = subtotal * tier3.estimatedBaseRate;
    const welcome = ORDER_CTX.welcomeActive ? base : 0;
    return Math.round(base + welcome);
  }, []);

  return (
    <PhoneFrame>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse-warn { 0%, 100% { box-shadow: 0 0 0 0 rgba(217,123,11,0.4); } 50% { box-shadow: 0 0 0 6px rgba(217,123,11,0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      <PhoneStatusBar />
      <AppHeader
        mode={mode}
        modeData={modeData}
        onModeTap={() => setShowModeSheet(true)}
        bites={ORDER_CTX.bitesBalance}
      />

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", background: T.surface }}>
        <UserAsk text={DEMO_INPUT} />
        <VerticalCascade />

        <div style={{ padding: "14px 14px 6px" }}>
          {/* AI summary line */}
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 12,
              background: T.aiMsg,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>
                W
              </span>
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 11.5,
                color: T.text,
                lineHeight: 1.5,
              }}
            >
              From <strong>1,247</strong> Phoenix restaurants,{" "}
              <strong>3 top picks</strong> ranked by{" "}
              <strong>{modeData.name}</strong>. Avoiding Thai, Mediterranean,
              Indian, sushi (variety + competitor signal).
            </div>
          </div>

          {/* Compound play callout */}
          {ranked[0] && (
            <CompoundPlayCallout topPick={ranked[0]} ctx={ORDER_CTX} />
          )}

          {/* Tier 3 hidden insight */}
          {tier3 && (
            <HiddenInsight
              restaurant={tier3}
              bites={tier3Bites}
              onTap={() => {}}
            />
          )}

          {/* Top picks header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 6,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: fontDisplay,
              }}
            >
              ⭐ Top 3 picks
            </span>
            <span style={{ fontSize: 10, color: T.textTertiary }}>
              by {modeData.name}
            </span>
          </div>

          {/* Recommendation cards */}
          {ranked.map((r, i) => (
            <RecommendationCard
              key={r.id}
              restaurant={r}
              ctx={ORDER_CTX}
              mode={mode}
              position={i}
              isTopPick={i === 0}
            />
          ))}

          {/* Footer info */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              marginTop: 4,
              marginBottom: 8,
              background: T.brandLight,
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
                marginBottom: 4,
              }}
            >
              💡 Did you know?
            </div>
            <div
              style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}
            >
              Tap the mode chip in the header to switch optimization. Try "Max
              Bites" — True Food's 12X flash promo will surface as #1.
            </div>
          </div>
        </div>
      </div>

      <BottomActionBar
        count={tier1Restaurants.length}
        onSeeAll={() => setShowWorkingSet(true)}
      />

      <ModePickerSheet
        open={showModeSheet}
        currentMode={mode}
        onSelect={setMode}
        onClose={() => setShowModeSheet(false)}
      />

      <WorkingSetSheet
        open={showWorkingSet}
        onClose={() => setShowWorkingSet(false)}
        restaurants={tier1Restaurants}
        ctx={ORDER_CTX}
        mode={mode}
      />

      <HomeIndicator />
    </PhoneFrame>
  );
}
