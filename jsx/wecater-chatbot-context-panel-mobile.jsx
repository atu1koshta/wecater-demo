import { useState, useEffect, useRef, useMemo } from "react";

// ─── Design tokens (matches desktop chatbot for visual continuity) ───
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

// ─── Demo conversation — same 6 turns as desktop, Bites-native ───
const DEMO = [
  {
    role: "user",
    text: "Order for Dr. Patel's office tomorrow at noon. 14 people, $15/pp.",
    contextUpdate: {
      activeProfile: { name: "Dr. Patel's Cardiology", icon: "🏥", lastOrder: "Apr 18" },
      dietary: {
        restrictions: [
          { tag: "Vegetarian", count: 3 },
          { tag: "Vegan", count: 1 },
          { tag: "Gluten-free", count: 2 },
          { tag: "Tree nut allergy", count: 1 },
        ],
        flags: ["Dr. Patel — strict vegetarian", "Nurse Kim — celiac"],
      },
      budget: {
        perPerson: 15, total: 210,
        compliance: { physician: "Dr. Patel", ytdSpend: 68, threshold: 100, thisOrder: null },
      },
      relationshipNotes: [
        { note: "Always call Maria before placing the order — she approves all rep lunches", date: "Mar 12", priority: "high" },
        { note: "Office prefers pickup over delivery. Parking lot entrance at rear.", date: "Feb 28", priority: "medium" },
        { note: "Dr. Patel likes variety — don't repeat within 3 weeks", date: "Jan 15", priority: "low" },
      ],
      recentOrders: [
        { date: "Apr 18", restaurant: "Bangkok Garden", cuisine: "Thai", amount: "$198" },
        { date: "Apr 4", restaurant: "Pita Jungle", cuisine: "Mediterranean", amount: "$215" },
        { date: "Mar 21", restaurant: "Curry Corner", cuisine: "Indian", amount: "$204" },
      ],
      rewards: { balance: 12750, thisOrderEstimate: null, tier: "Gold", welcomeActive: true, welcomeDaysLeft: 18 },
    },
  },
  {
    role: "assistant",
    text: "Loading Dr. Patel's profile…\n\n⚠️ **Heads up — call Maria at (602) 555-0142 first** — she approves all rep lunches.\n\nHere's what I have:\n• 14 people, $210 budget\n• Dietary: 3 veg · 1 vegan · 2 GF · 1 nut allergy\n• Recent: Thai, Mediterranean, Indian\n\nAvoiding those for variety. Finding options…",
    contextUpdate: {
      variety: {
        avoid: ["Thai", "Mediterranean", "Indian"],
        suggested: ["BBQ", "Mexican", "American", "Japanese"],
        reason: "All three used within last 30 days",
      },
    },
  },
  {
    role: "user",
    text: "Pfizer rep brought sushi last week. Something different and impressive.",
    contextUpdate: {
      competitorIntel: [
        { competitor: "Pfizer rep", brought: "Sushi", when: "Last week", office: "Dr. Patel's" },
      ],
      variety: {
        avoid: ["Thai", "Mediterranean", "Indian", "Sushi/Japanese"],
        suggested: ["BBQ", "Mexican", "American", "Farm-to-table"],
        reason: "Competitor brought sushi + 3 recent cuisines excluded",
      },
    },
  },
  {
    role: "assistant",
    text: "Sushi off the table too. 3 options that'll stand out:",
    contextUpdate: {
      budget: {
        perPerson: 15, total: 210,
        compliance: { physician: "Dr. Patel", ytdSpend: 68, threshold: 100, thisOrder: 14.86, projected: 82.86 },
      },
      rewards: { balance: 12750, thisOrderEstimate: 2484, tier: "Gold", welcomeActive: true, welcomeDaysLeft: 18 },
      cartOptions: [
        { name: "Flower Child", emoji: "🥗", cuisine: "Healthy bowls", pp: 18.5, total: 259, baseRate: 7, bites: 3626, dietary: "Full", overBudget: true },
        { name: "Barrio Queen", emoji: "🌮", cuisine: "Upscale Mexican", pp: 14.8, total: 207, baseRate: 6, bites: 2484, dietary: "Full", overBudget: false },
        { name: "Bobby Q", emoji: "🥩", cuisine: "BBQ Platters", pp: 15.0, total: 210, baseRate: 5, bites: 2100, dietary: "Limited vegan", overBudget: false },
      ],
    },
  },
  {
    role: "user",
    text: "Option 2. And note Maria said the office loves churros.",
    contextUpdate: {
      selectedOption: "Barrio Queen",
      relationshipNotes: [
        { note: "Always call Maria before placing the order — she approves all rep lunches", date: "Mar 12", priority: "high" },
        { note: "Office loves churros — add as dessert when available", date: "Apr 27", priority: "medium" },
        { note: "Office prefers pickup over delivery. Parking lot entrance at rear.", date: "Feb 28", priority: "medium" },
        { note: "Dr. Patel likes variety — don't repeat within 3 weeks", date: "Jan 15", priority: "low" },
      ],
      rewards: { balance: 12750, thisOrderEstimate: 2484, tier: "Gold", welcomeActive: true, welcomeDaysLeft: 18 },
      budget: {
        perPerson: 14.8, total: 207,
        compliance: { physician: "Dr. Patel", ytdSpend: 68, threshold: 100, thisOrder: 14.79, projected: 82.79 },
      },
    },
  },
  {
    role: "assistant",
    text: "Done!\n\n**Barrio Queen — Upscale Mexican**\n14 people · $207\nPickup at 4530 E Shea Blvd\n\n📋 Compliance: Dr. Patel YTD $82.79 — under $100 threshold ✓\n\n🎁 Earning **2,484 Bites** (≈$24.84). Welcome 2X applied.\n\n📝 \"Office loves churros\" saved.\n\nFinalize and route?",
    contextUpdate: { orderStatus: "ready_to_confirm" },
  },
];

const NOTE_COLOR = { high: T.danger, medium: T.warning, low: T.textTertiary };

// ─── Helpers ───
function buildContextUpTo(idx) {
  const ctx = {};
  for (let i = 0; i <= idx && i < DEMO.length; i++) {
    if (DEMO[i].contextUpdate) Object.assign(ctx, DEMO[i].contextUpdate);
  }
  return ctx;
}

// ─── Phone frame chrome ───
function PhoneStatusBar() {
  return (
    <div style={{
      height: 44, padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: T.card, fontSize: 14, fontWeight: 600, color: T.text, fontFamily: font,
      position: "relative", zIndex: 30,
    }}>
      <span style={{ fontFamily: `-apple-system, ${font}` }}>9:41</span>
      {/* Dynamic Island */}
      <div style={{
        position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)",
        width: 110, height: 28, borderRadius: 18, background: "#000",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {/* Signal */}
        <svg width="16" height="11" viewBox="0 0 16 11"><g fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5" /><rect x="4" y="5" width="3" height="6" rx="0.5" /><rect x="8" y="3" width="3" height="8" rx="0.5" /><rect x="12" y="0" width="3" height="11" rx="0.5" /></g></svg>
        {/* Wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 11l1.5-1.5c-.4-.4-.95-.65-1.5-.65s-1.1.25-1.5.65L7.5 11zm0-3.7c1.18 0 2.27.43 3.13 1.13l1.42-1.42C10.74 5.85 9.18 5.13 7.5 5.13s-3.24.72-4.55 1.88l1.42 1.42c.86-.7 1.95-1.13 3.13-1.13zm0-3.7c2.34 0 4.49.84 6.13 2.27l1.42-1.42C13.07 2.61 10.4 1.5 7.5 1.5s-5.57 1.11-7.55 2.95l1.42 1.42C2.99 4.44 5.16 3.6 7.5 3.6z" /></svg>
        {/* Battery */}
        <div style={{ width: 25, height: 12, border: `1.2px solid ${T.text}`, borderRadius: 3, position: "relative", padding: 1 }}>
          <div style={{ height: "100%", width: "85%", background: T.text, borderRadius: 1 }} />
          <div style={{ position: "absolute", right: -2.5, top: 3, width: 1.5, height: 4, background: T.text, borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ height: 22, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, background: T.card, position: "relative", zIndex: 30 }}>
      <div style={{ width: 134, height: 5, borderRadius: 3, background: T.text }} />
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{
      minHeight: "100vh", padding: "30px 20px", boxSizing: "border-box",
      background: "linear-gradient(135deg, #E5E1DC 0%, #D8D2CC 100%)",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      fontFamily: font,
    }}>
      <div style={{
        width: 390, height: 844, borderRadius: 56, overflow: "hidden",
        background: T.card,
        boxShadow: "0 0 0 12px #1c1c1e, 0 0 0 14px #2a2a2d, 0 30px 80px rgba(0,0,0,0.35)",
        position: "relative",
        display: "flex", flexDirection: "column",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── App header ───
function AppHeader({ profile, bites }) {
  return (
    <div style={{
      height: 56, padding: "0 16px", flexShrink: 0,
      background: T.card, borderBottom: `1px solid ${T.borderLight}`,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <button style={{
        width: 36, height: 36, borderRadius: 10, border: "none", background: T.surface,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 4l-4 4 4 4" stroke={T.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: fontDisplay, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {profile?.icon || "💬"} {profile?.name || "WeCater AI"}
        </div>
        <div style={{ fontSize: 10, color: T.success, fontWeight: 500, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.success, display: "inline-block" }} />
          AI online · learns as you order
        </div>
      </div>
      {bites != null && (
        <div style={{
          padding: "6px 11px", borderRadius: 18, background: T.brandLight,
          display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12 }}>🪙</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.brandDark, fontFamily: fontMono }}>
            {(bites/1000).toFixed(1)}K
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Compliance ribbon — only for pharma profile, embedded horizontal bar ───
function ComplianceRibbon({ compliance, onTap }) {
  if (!compliance) return null;
  const projected = compliance.projected ?? compliance.ytdSpend;
  const pct = Math.min((projected / compliance.threshold) * 100, 100);
  const willCross = projected > compliance.threshold;
  const willApproach = projected > compliance.threshold * 0.9 && !willCross;
  const color = willCross ? T.danger : willApproach ? T.warning : T.success;
  const bg = willCross ? T.dangerBg : willApproach ? T.warningBg : T.successBg;

  return (
    <button onClick={onTap} style={{
      height: 36, padding: "0 14px", flexShrink: 0,
      background: bg, border: "none", borderBottom: `1px solid ${color}22`,
      display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left",
      width: "100%", fontFamily: font,
    }}>
      <span style={{ fontSize: 14 }}>⚖️</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {compliance.physician}
        </span>
        <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: fontMono }}>
          ${compliance.ytdSpend} → ${projected.toFixed(2)}
        </span>
        <div style={{ flex: 1, height: 4, background: `${color}22`, borderRadius: 2, overflow: "hidden", maxWidth: 80 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, whiteSpace: "nowrap" }}>
        {willCross ? "⚠️ Over" : willApproach ? "Tight" : "✓ Safe"}
      </span>
    </button>
  );
}

// ─── Chat bubbles ───
function UserBubble({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, animation: "fadeIn 0.25s ease" }}>
      <div style={{
        maxWidth: "82%", padding: "10px 14px", borderRadius: "18px 18px 4px 18px",
        background: T.userMsg, color: "#fff", fontSize: 14, lineHeight: 1.45,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}>
        {text}
      </div>
    </div>
  );
}

function AIBubble({ text, children }) {
  const lines = text ? text.split("\n").map((line, i) => (
    <div key={i} style={{ marginBottom: line.trim() === "" ? 4 : 0 }}>
      {line.split("**").map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}
    </div>
  )) : null;

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10, animation: "fadeIn 0.3s ease" }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {text && (
          <div style={{
            padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
            background: T.aiMsg, color: T.text, fontSize: 14, lineHeight: 1.5,
            display: "inline-block", maxWidth: "100%", boxSizing: "border-box",
          }}>
            {lines}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Inline cart option (single-column, mobile-optimized) ───
function InlineCartOption({ option, isSelected, onSelect }) {
  const isOver = option.overBudget;
  const dietColor = option.dietary === "Full" ? T.success : T.warning;
  const dietBg = option.dietary === "Full" ? T.successBg : T.warningBg;

  return (
    <button onClick={onSelect} style={{
      display: "block", width: "100%", marginTop: 8, padding: 12,
      borderRadius: 12, textAlign: "left",
      background: isSelected ? T.brandLight : T.card,
      border: isSelected ? `1.5px solid ${T.brand}` : `1px solid ${T.border}`,
      boxShadow: isSelected ? `0 4px 12px ${T.brandGlow}` : "0 1px 2px rgba(0,0,0,0.03)",
      cursor: "pointer", fontFamily: font,
      animation: "slideIn 0.3s ease backwards",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: T.surface, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          {option.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: fontDisplay }}>{option.name}</span>
            {isSelected && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: T.brand, color: "#fff", fontWeight: 700, letterSpacing: "0.04em" }}>✓ PICKED</span>}
          </div>
          <div style={{ fontSize: 11, color: T.textTertiary }}>{option.cuisine}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isOver ? T.danger : T.text, fontFamily: fontMono }}>
            ${option.total}
          </div>
          <div style={{ fontSize: 10, color: T.textTertiary }}>${option.pp}/pp</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        <span style={{
          fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700, fontFamily: fontMono,
          background: T.brandLight, color: T.brand,
        }}>
          {option.baseRate}X
        </span>
        <span style={{ fontSize: 12, color: T.brand, fontWeight: 700, fontFamily: fontMono }}>
          {option.bites.toLocaleString()} Bites
        </span>
        <span style={{ fontSize: 10, color: T.textTertiary }}>· w/ Welcome 2X</span>
        <span style={{ flex: 1 }} />
        <span style={{
          fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600,
          background: dietBg, color: dietColor,
        }}>
          {option.dietary === "Full" ? "✓ Full diet" : "⚠ Limited"}
        </span>
        {isOver && (
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: T.dangerBg, color: T.danger }}>
            Over budget
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Order ready banner ───
function OrderReadyBanner({ context }) {
  return (
    <div style={{
      padding: "12px 14px", marginTop: 8,
      background: T.successBg, borderRadius: 12, border: `1px solid ${T.success}33`,
      animation: "slideIn 0.4s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>✅</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>Order ready to confirm</span>
      </div>
      <div style={{ fontSize: 11, color: "#1a7a43", marginBottom: 10 }}>
        Barrio Queen · 14 people · $207 · earn 2,484 Bites
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
          flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.success}55`,
          background: "#fff", color: T.success, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
        }}>Edit</button>
        <button style={{
          flex: 2, padding: "9px 12px", borderRadius: 8, border: "none",
          background: T.success, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font,
        }}>🍴 Confirm & route</button>
      </div>
    </div>
  );
}

// ─── Context chips bar (above input) ───
function ContextChip({ icon, label, value, color, onTap, urgent }) {
  return (
    <button onClick={onTap} style={{
      flex: "0 0 auto",
      padding: "6px 11px", borderRadius: 18,
      background: urgent ? T.brandLight : T.surface,
      border: `1px solid ${urgent ? T.brand + "55" : T.border}`,
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 11, fontFamily: font, cursor: "pointer", whiteSpace: "nowrap",
      transition: "all 0.15s",
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ color: T.textTertiary, fontWeight: 500 }}>{label}</span>
      <span style={{ color: color || T.text, fontWeight: 700, fontFamily: fontMono }}>{value}</span>
    </button>
  );
}

function ContextBar({ context, onChipTap }) {
  const { dietary, budget, rewards } = context;
  const dietaryCovered = dietary?.restrictions?.filter(r => r.count > 0).length || 0;
  const dietaryTotal = dietary?.restrictions?.length || 0;
  const isOverBudget = budget?.compliance?.thisOrder && budget.compliance.thisOrder > budget.perPerson;

  return (
    <div style={{
      flexShrink: 0, background: T.card, borderTop: `1px solid ${T.borderLight}`,
      padding: "8px 14px", display: "flex", gap: 6, overflowX: "auto",
      scrollbarWidth: "none", msOverflowStyle: "none",
    }}>
      <style>{`.chips-row::-webkit-scrollbar { display: none; }`}</style>
      {rewards && (
        <ContextChip
          icon="🪙" label="Bites"
          value={rewards.balance.toLocaleString()}
          color={T.brand}
          onTap={() => onChipTap("rewards")}
        />
      )}
      {dietary && (
        <ContextChip
          icon="🥗" label="Diet"
          value={`${dietaryCovered}/${dietaryTotal}`}
          color={T.success}
          onTap={() => onChipTap("dietary")}
        />
      )}
      {budget && (
        <ContextChip
          icon="💵" label="Budget"
          value={`$${budget.compliance?.thisOrder?.toFixed(0) || budget.perPerson}/${budget.perPerson}`}
          color={isOverBudget ? T.danger : T.text}
          onTap={() => onChipTap("budget")}
        />
      )}
      {rewards?.welcomeActive && (
        <ContextChip
          icon="🎁" label="Welcome 2X"
          value={`${rewards.welcomeDaysLeft}d`}
          color={T.brand}
          urgent
          onTap={() => onChipTap("rewards")}
        />
      )}
    </div>
  );
}

// ─── Bottom sheet ───
function BottomSheet({ open, onClose, context, scrollTo }) {
  const sheetRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (open && scrollTo && sectionRefs.current[scrollTo]) {
      setTimeout(() => {
        sectionRefs.current[scrollTo]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 320);
    }
  }, [open, scrollTo]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: T.overlay, zIndex: 40,
        animation: "fadeIn 0.25s ease",
      }} />
      {/* Sheet */}
      <div ref={sheetRef} style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: "78%", background: T.card, zIndex: 41,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        overflow: "hidden", display: "flex", flexDirection: "column",
        animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
      }}>
        {/* Handle */}
        <div style={{ padding: "10px 0 6px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: T.border }} />
        </div>
        {/* Header */}
        <div style={{ padding: "4px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: fontDisplay }}>
            Active context
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: "none", background: T.surface,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 14, color: T.text,
          }}>✕</button>
        </div>
        {/* Cards */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
          <SheetCards context={context} sectionRefs={sectionRefs} />
        </div>
      </div>
    </>
  );
}

function SheetCards({ context, sectionRefs }) {
  const { activeProfile, dietary, budget, rewards, variety, competitorIntel, relationshipNotes, recentOrders } = context;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Bites Wallet — always first when present */}
      {rewards && (
        <div ref={el => sectionRefs.current.rewards = el}>
          <SheetCard title="Your Bites Wallet" icon="🪙" accent={rewards.tier}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: T.brand, fontFamily: fontDisplay, letterSpacing: "-0.01em" }}>
                {rewards.balance.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: T.textTertiary, fontWeight: 600 }}>Bites</span>
            </div>
            <div style={{ fontSize: 12, color: T.textTertiary, marginBottom: 10 }}>
              ≈ ${(rewards.balance / 100).toFixed(2)} redemption value
            </div>
            {rewards.welcomeActive && (
              <div style={{
                padding: "8px 11px", borderRadius: 9, marginBottom: 8,
                background: T.brandLight, border: `1px solid ${T.brand}33`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>🎁</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.brand }}>Welcome 2X active</div>
                  <div style={{ fontSize: 10, color: T.textSecondary }}>All Bites doubled · {rewards.welcomeDaysLeft} days left</div>
                </div>
              </div>
            )}
            {rewards.thisOrderEstimate && (
              <div style={{
                padding: "8px 11px", borderRadius: 9,
                background: T.successBg, border: `1px solid ${T.success}33`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.success }}>
                  +{rewards.thisOrderEstimate.toLocaleString()} Bites from this order
                </div>
                <div style={{ fontSize: 10, color: T.success, opacity: 0.85, marginTop: 1 }}>
                  Redeem to Amazon · restaurant credit · or future orders
                </div>
              </div>
            )}
          </SheetCard>
        </div>
      )}

      {/* Active profile */}
      {activeProfile && (
        <div ref={el => sectionRefs.current.profile = el}>
          <SheetCard title="Active profile" icon={activeProfile.icon || "📋"}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{activeProfile.name}</div>
            <div style={{ fontSize: 11, color: T.textTertiary }}>
              Last order: {activeProfile.lastOrder}
            </div>
          </SheetCard>
        </div>
      )}

      {/* Dietary */}
      {dietary && (
        <div ref={el => sectionRefs.current.dietary = el}>
          <SheetCard title="Dietary map" icon="🥗">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {dietary.restrictions.filter(r => r.count > 0).map(r => (
                <span key={r.tag} style={{
                  fontSize: 11, padding: "3px 9px", borderRadius: 6,
                  background: T.successBg, color: T.success, fontWeight: 600,
                }}>
                  ✓ {r.tag} ({r.count})
                </span>
              ))}
            </div>
            {dietary.flags?.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5, marginTop: 6 }}>
                  Individual flags
                </div>
                {dietary.flags.map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textSecondary, padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.warning }} />
                    {f}
                  </div>
                ))}
              </>
            )}
          </SheetCard>
        </div>
      )}

      {/* Budget */}
      {budget && (
        <div ref={el => sectionRefs.current.budget = el}>
          <SheetCard title="Budget" icon="💵">
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: fontMono }}>${budget.total}</span>
              <span style={{ fontSize: 11, color: T.textTertiary }}>· ${budget.perPerson}/pp target</span>
            </div>
            {budget.compliance?.thisOrder && (
              <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                This order: <strong style={{ color: T.text, fontFamily: fontMono }}>${budget.compliance.thisOrder.toFixed(2)}/pp</strong>
              </div>
            )}
            {budget.compliance && (
              <div style={{
                marginTop: 8, padding: "8px 11px", borderRadius: 8,
                background: T.infoBg, border: `1px solid ${T.info}22`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.info, marginBottom: 3 }}>
                  ⚖️ Open Payments compliance
                </div>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>
                  {budget.compliance.physician}: <strong style={{ color: T.text }}>${budget.compliance.ytdSpend} YTD</strong>
                  {budget.compliance.projected && (
                    <> → <strong style={{ color: T.info }}>${budget.compliance.projected.toFixed(2)}</strong></>
                  )}
                  <span style={{ color: T.textTertiary }}> / ${budget.compliance.threshold} threshold</span>
                </div>
              </div>
            )}
          </SheetCard>
        </div>
      )}

      {/* Variety */}
      {variety && (
        <div ref={el => sectionRefs.current.variety = el}>
          <SheetCard title="Variety engine" icon="🔄">
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
              Avoiding
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {variety.avoid.map(c => (
                <span key={c} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: T.dangerBg, color: T.danger, fontWeight: 600 }}>✕ {c}</span>
              ))}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
              Suggesting
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {variety.suggested.map(c => (
                <span key={c} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: T.successBg, color: T.success, fontWeight: 600 }}>✓ {c}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.textTertiary, lineHeight: 1.5 }}>{variety.reason}</div>
          </SheetCard>
        </div>
      )}

      {/* Competitor intel */}
      {competitorIntel && (
        <div ref={el => sectionRefs.current.competitor = el}>
          <SheetCard title="Competitor intel" icon="🕵️" accent="NEW" accentColor={T.danger}>
            {competitorIntel.map((c, i) => (
              <div key={i} style={{
                padding: "8px 11px", background: T.surface, borderRadius: 8,
                marginBottom: i < competitorIntel.length - 1 ? 6 : 0,
              }}>
                <div style={{ fontSize: 12, color: T.text }}>
                  <strong>{c.competitor}</strong> brought <strong>{c.brought}</strong>
                </div>
                <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>{c.when} · {c.office}</div>
              </div>
            ))}
          </SheetCard>
        </div>
      )}

      {/* Relationship notes */}
      {relationshipNotes && (
        <div ref={el => sectionRefs.current.notes = el}>
          <SheetCard title="Relationship notes" icon="📝">
            {relationshipNotes.map((n, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, padding: "8px 0",
                borderBottom: i < relationshipNotes.length - 1 ? `1px solid ${T.borderLight}` : "none",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: NOTE_COLOR[n.priority], marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{n.note}</div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>{n.date}</div>
                </div>
              </div>
            ))}
          </SheetCard>
        </div>
      )}

      {/* Recent orders */}
      {recentOrders && (
        <div ref={el => sectionRefs.current.history = el}>
          <SheetCard title="Order history" icon="📋">
            {recentOrders.map((o, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: i < recentOrders.length - 1 ? `1px solid ${T.borderLight}` : "none",
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{o.restaurant}</div>
                  <div style={{ fontSize: 10, color: T.textTertiary }}>{o.cuisine} · {o.date}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: fontMono }}>{o.amount}</span>
              </div>
            ))}
          </SheetCard>
        </div>
      )}

      {/* Did you know tip */}
      <div style={{
        padding: "10px 12px", borderRadius: 10,
        background: T.brandLight, border: `1px dashed ${T.brand}55`,
        marginTop: 4,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.brand, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
          💡 Did you know?
        </div>
        <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.55 }}>
          Tap any chip above the input to jump straight to that section. The AI updates context as you chat.
        </div>
      </div>
    </div>
  );
}

function SheetCard({ title, icon, accent, accentColor, children }) {
  return (
    <div style={{
      padding: 14, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: fontDisplay }}>
          {title}
        </span>
        {accent && (
          <span style={{
            marginLeft: "auto", fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.06em",
            background: accentColor ? `${accentColor}22` : T.warningBg,
            color: accentColor || T.warning,
          }}>
            {accent}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Input bar ───
function InputBar({ value, onChange, onSend, placeholder, disabled }) {
  return (
    <div style={{
      flexShrink: 0, background: T.card, padding: "8px 12px 10px",
      borderTop: `1px solid ${T.borderLight}`,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <button style={{
        width: 40, height: 40, borderRadius: 12, border: "none", background: T.surface,
        cursor: "pointer", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      title="Voice input (coming soon)"
      onClick={() => {}}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="6.5" y="2" width="5" height="9" rx="2.5" stroke={T.textSecondary} strokeWidth="1.5" />
          <path d="M3.5 8c0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5M9 13.5V16M6 16h6" stroke={T.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", gap: 6,
        padding: "4px 4px 4px 14px", borderRadius: 22,
        background: T.surface, border: `1px solid ${T.border}`, minHeight: 40,
      }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !disabled) onSend(); }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: 14, color: T.text, fontFamily: font, minWidth: 0,
          }}
        />
        <button onClick={onSend} disabled={disabled} style={{
          width: 32, height: 32, borderRadius: 16, border: "none",
          background: disabled ? T.border : T.brand,
          cursor: disabled ? "default" : "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main ───
export default function MobileChatbotContextPanel() {
  const [step, setStep] = useState(-1); // -1 = empty, 0..N = messages shown up to this index
  const [thinking, setThinking] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetScrollTo, setSheetScrollTo] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const chatEndRef = useRef(null);

  const visibleMessages = useMemo(() => DEMO.slice(0, step + 1), [step]);
  const context = useMemo(() => buildContextUpTo(step), [step]);
  const profile = context.activeProfile;
  const compliance = context.budget?.compliance?.physician ? context.budget.compliance : null;

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [step, thinking]);

  // Track selected from context
  useEffect(() => {
    if (context.selectedOption) setSelectedOption(context.selectedOption);
  }, [context.selectedOption]);

  const advance = () => {
    if (step >= DEMO.length - 1) return;
    const next = DEMO[step + 1];
    if (next.role === "assistant") {
      setThinking(true);
      setTimeout(() => {
        setThinking(false);
        setStep(s => s + 1);
      }, 900);
    } else {
      setStep(s => s + 1);
    }
    setInputValue("");
  };

  const handleChipTap = (section) => {
    setSheetScrollTo(section);
    setSheetOpen(true);
  };

  const placeholder = step >= DEMO.length - 1
    ? "Demo complete"
    : DEMO[step + 1]?.role === "user"
      ? DEMO[step + 1].text.length > 35 ? DEMO[step + 1].text.slice(0, 32) + "..." : DEMO[step + 1].text
      : "Press send to continue…";

  return (
    <PhoneFrame>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      <PhoneStatusBar />
      <AppHeader profile={profile} bites={context.rewards?.balance} />
      <ComplianceRibbon compliance={compliance} onTap={() => handleChipTap("budget")} />

      {/* Chat thread */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 14px 6px",
        background: T.surface,
        position: "relative",
      }}>
        {step === -1 && (
          <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeIn 0.5s ease" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
              background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${T.brandGlow}`,
            }}>
              <span style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.text, fontFamily: fontDisplay, marginBottom: 4 }}>
              Your AI catering concierge
            </div>
            <div style={{ fontSize: 12, color: T.textTertiary, lineHeight: 1.5, marginBottom: 18 }}>
              Tell me who's eating and I'll handle the rest.
            </div>
            <button onClick={advance} style={{
              padding: "10px 20px", borderRadius: 22, border: "none",
              background: T.brand, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font,
              boxShadow: `0 4px 12px ${T.brandGlow}`,
            }}>
              Start demo →
            </button>
          </div>
        )}

        {visibleMessages.map((msg, i) => (
          <div key={i}>
            {msg.role === "user" ? (
              <UserBubble text={msg.text} />
            ) : (
              <AIBubble text={msg.text}>
                {/* Inline cart options */}
                {context.cartOptions && i === visibleMessages.length - 1 && step === 3 && (
                  <div style={{ marginTop: 4 }}>
                    {context.cartOptions.map((opt, j) => (
                      <div key={j} style={{ animationDelay: `${j * 100}ms`, animationFillMode: "backwards" }}>
                        <InlineCartOption
                          option={opt}
                          isSelected={selectedOption === opt.name}
                          onSelect={() => setSelectedOption(opt.name)}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* Order ready */}
                {context.orderStatus === "ready_to_confirm" && i === visibleMessages.length - 1 && (
                  <OrderReadyBanner context={context} />
                )}
              </AIBubble>
            )}
          </div>
        ))}

        {thinking && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
            </div>
            <div style={{
              padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
              background: T.aiMsg, display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(d => (
                <span key={d} style={{
                  width: 6, height: 6, borderRadius: "50%", background: T.textTertiary,
                  animation: `pulse 1.2s ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Context chips bar */}
      {Object.keys(context).length > 0 && (
        <ContextBar context={context} onChipTap={handleChipTap} />
      )}

      {/* Input */}
      <InputBar
        value={inputValue}
        onChange={setInputValue}
        onSend={advance}
        placeholder={placeholder}
        disabled={step >= DEMO.length - 1}
      />

      {/* Bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        context={context}
        scrollTo={sheetScrollTo}
      />

      <HomeIndicator />
    </PhoneFrame>
  );
}