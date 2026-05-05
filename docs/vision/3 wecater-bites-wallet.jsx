import { useState, useEffect, useMemo } from "react";

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
  companyLane: "#54595F",
  companyBg: "#F4F4F2",
};

const font = `'DM Sans', -apple-system, sans-serif`;
const fontDisplay = `'Outfit', ${font}`;
const fontMono = `'JetBrains Mono', monospace`;

// ─── Demo wallet state ───
// 100 Bites = $1. Sally has a Gold-equivalent balance.
const WALLET = {
  bites: 27420, // $274.20 redemption value
  pendingBites: 1840,
  ytdBitesEarned: 58420,
  ytdBitesRedeemed: 31000,
  totalOrders: 47,
  blendedRate: 6.8, // average X across all orders YTD
  welcomeActive: true,
  welcomeDaysRemaining: 18,
  welcomeBonusEarned: 3240,
  welcomeBonusCap: 10000,
};

// ezCater earns ~1-2% effective. WeCater under our model earns blended
// across whatever rate Rob set per restaurant.
const EZCATER_COMPARISON = {
  wecaterBites: 58420, // $584.20 value
  wecaterValue: 584.20,
  ezcaterBitesEquivalent: 14605, // $146.05 (~25% of WeCater)
  ezcaterValue: 146.05,
  spread: 438.15,
  spreadPct: 300,
};

const MONTHLY_BITES = [
  { month: "Nov", value: 3800 },
  { month: "Dec", value: 5200 },
  { month: "Jan", value: 8900 },
  { month: "Feb", value: 7600 },
  { month: "Mar", value: 12400 },
  { month: "Apr", value: 16920 },
];

// Recent orders showing the variable-rate Rob-set system.
// Each restaurant chose its own X. Welcome accelerator adds +1X if active.
const RECENT_ORDERS = [
  {
    id: "O-2841", date: "Apr 27", office: "Dr. Patel's Cardiology",
    restaurant: "Barrio Queen", icon: "🌮",
    subtotal: 207.00, baseRate: 6, modifiers: [{ label: "Welcome 2X", bites: 1242 }],
    biteseEarned: 1242 + 1242, // 6X = 1242, +Welcome 2X means total earn doubles to 2484
    actualRate: 12, status: "pending", officeIcon: "🫀",
  },
  {
    id: "O-2837", date: "Apr 24", office: "Dr. Morrison's Internal Med",
    restaurant: "Pita Jungle", icon: "🥙",
    subtotal: 142.00, baseRate: 8, modifiers: [{ label: "Welcome 2X", bites: 1136 }],
    biteseEarned: 1136 + 1136,
    actualRate: 16, status: "pending", officeIcon: "🩺",
  },
  {
    id: "O-2832", date: "Apr 22", office: "Dr. Patel's Cardiology",
    restaurant: "Bangkok Garden", icon: "🍜",
    subtotal: 198.00, baseRate: 5, modifiers: [{ label: "Same-Day +2X", bites: 396 }, { label: "Welcome 2X", bites: 990 }],
    biteseEarned: 990 + 396 + 990,
    actualRate: 12, status: "available", officeIcon: "🫀",
  },
  {
    id: "O-2828", date: "Apr 18", office: "Westside Oncology",
    restaurant: "Flower Child", icon: "🥗",
    subtotal: 595.00, baseRate: 7, modifiers: [{ label: "Welcome 2X", bites: 4165 }],
    biteseEarned: 4165 + 4165,
    actualRate: 14, status: "available", officeIcon: "🏥",
  },
  {
    id: "O-2823", date: "Apr 16", office: "Dr. Chen's Pediatrics",
    restaurant: "Oregano's Pizza", icon: "🍕",
    subtotal: 285.00, baseRate: 4, modifiers: [],
    biteseEarned: 1140,
    actualRate: 4, status: "available", officeIcon: "👶",
  },
  {
    id: "O-2819", date: "Apr 11", office: "Dr. Patel's Cardiology",
    restaurant: "Pita Jungle", icon: "🥙",
    subtotal: 215.00, baseRate: 8, modifiers: [],
    biteseEarned: 1720,
    actualRate: 8, status: "available", officeIcon: "🫀",
  },
  {
    id: "O-2814", date: "Apr 4", office: "Sun Valley Family",
    restaurant: "Bobby Q", icon: "🥩",
    subtotal: 88.00, baseRate: 3, modifiers: [],
    biteseEarned: 264,
    actualRate: 3, status: "available", officeIcon: "🌵",
  },
  {
    id: "O-2810", date: "Apr 2", office: "Westside Oncology",
    restaurant: "Curry Corner", icon: "🍛",
    subtotal: 525.00, baseRate: 6, modifiers: [],
    biteseEarned: 3150,
    actualRate: 6, status: "available", officeIcon: "🏥",
  },
];

// Bites earned per restaurant — drives Restaurant Boost at checkout
const RESTAURANT_BUCKETS = [
  { name: "Pita Jungle", icon: "🥙", earnedBites: 4720, boostMultiplier: 1.4, boostable: true },
  { name: "Barrio Queen", icon: "🌮", earnedBites: 3680, boostMultiplier: 1.3, boostable: true },
  { name: "Flower Child", icon: "🥗", earnedBites: 8330, boostMultiplier: 1.5, boostable: true },
  { name: "Bangkok Garden", icon: "🍜", earnedBites: 2840, boostMultiplier: 1.2, boostable: true },
  { name: "Curry Corner", icon: "🍛", earnedBites: 3150, boostMultiplier: 0, boostable: false },
  { name: "Bobby Q", icon: "🥩", earnedBites: 590, boostMultiplier: 1.25, boostable: true },
];

const REDEMPTION_HISTORY = [
  { date: "Mar 28", bites: 5000, value: 50.00, type: "Amazon gift card", code: "WCR-X4D-7821" },
  { date: "Feb 15", bites: 6500, value: 65.00, type: "WeCater catering credit · 1.2X", code: "Used at Pita Jungle" },
  { date: "Jan 8", bites: 2500, value: 25.00, type: "Amazon gift card", code: "WCR-V9R-1209" },
];

// ─── Helpers ───

function CountUp({ value, duration = 1200, format = (v) => Math.floor(v).toLocaleString() }) {
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

function TopNav() {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 20px", background: T.card, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${T.brandGlow}` }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
        </div>
        <div>
          <span style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: fontDisplay }}>WeCater</span>
          <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: 6, fontWeight: 500 }}>Bites Wallet</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginLeft: 24, padding: 3, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {[
          { id: "chat", label: "Chat", icon: "💬" },
          { id: "profiles", label: "Profiles", icon: "👥" },
          { id: "rewards", label: "Bites", icon: "🍴" },
          { id: "compliance", label: "Compliance", icon: "📋" },
        ].map(tab => (
          <button key={tab.id} style={{
            padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: font,
            fontSize: 12, fontWeight: 500,
            background: tab.id === "rewards" ? T.card : "transparent",
            color: tab.id === "rewards" ? T.text : T.textSecondary,
            boxShadow: tab.id === "rewards" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
            transition: "all 0.15s",
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: T.brandLight, borderRadius: 20 }}>
        <span style={{ fontSize: 12 }}>👤</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.brandDark }}>Sally Chen · Pharma Rep</span>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: fontDisplay, letterSpacing: "0.02em", textTransform: "uppercase" }}>{title}</span>
      </div>
      {action && <button style={{ fontSize: 11, color: T.brand, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: font }}>{action}</button>}
    </div>
  );
}

function ModifierChip({ label, bites, color = T.brand }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
      background: `${color}15`, color, fontFamily: font,
    }}>
      ✨ {label} <span style={{ fontFamily: fontMono, fontWeight: 700 }}>+{bites.toLocaleString()}</span>
    </span>
  );
}

// ─── Redemption Modal ───
function RedeemModal({ availableBites, onClose }) {
  const [step, setStep] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState("amazon");
  const [selectedBites, setSelectedBites] = useState(5000);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Per-route minimum redemption thresholds.
  // WeCater catering credit gates at 2,500 to protect lifecycle margin
  // (see decisions doc — lifecycle math at 6.8X average + 15X ceiling).
  const ROUTE_MIN = { amazon: 1000, wecater: 2500, boost: 1000 };
  const wecaterLocked = selectedBites < ROUTE_MIN.wecater;

  const presets = [1000, 2500, 5000, Math.min(10000, availableBites - (availableBites % 100))];
  const valueAtRoute = useMemo(() => {
    if (selectedRoute === "amazon") return selectedBites / 100;
    if (selectedRoute === "wecater") return (selectedBites / 100) * 1.2;
    if (selectedRoute === "boost" && selectedRestaurant) return (selectedBites / 100) * selectedRestaurant.boostMultiplier;
    return 0;
  }, [selectedBites, selectedRoute, selectedRestaurant]);

  // If user lowers Bites amount while WeCater route is selected, fall back to Amazon
  useEffect(() => {
    if (selectedRoute === "wecater" && wecaterLocked) {
      setSelectedRoute("amazon");
    }
  }, [selectedRoute, wecaterLocked]);

  const boostableRestaurants = RESTAURANT_BUCKETS.filter(r => r.boostable && r.earnedBites >= 1000);
  const minForCurrentRoute = ROUTE_MIN[selectedRoute] || 1000;
  const canRedeem = selectedBites >= minForCurrentRoute && (selectedRoute !== "boost" || selectedRestaurant);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div style={{ width: 520, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto", background: T.card, borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,0.18)", animation: "scaleIn 0.25s ease" }} onClick={e => e.stopPropagation()}>

        {step === 0 && (
          <div>
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: fontDisplay, color: T.text }}>Redeem Bites</h2>
                <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
                  Available: <strong style={{ color: T.text, fontFamily: fontMono }}>{availableBites.toLocaleString()} Bites</strong> · ${(availableBites/100).toFixed(2)} base value
                </p>
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: T.surface, cursor: "pointer", color: T.textSecondary, fontSize: 16 }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Choose amount</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                {presets.map((p) => (
                  <button key={p} onClick={() => setSelectedBites(p)} style={{
                    padding: "12px 8px", borderRadius: 10, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13, cursor: "pointer",
                    border: `1.5px solid ${selectedBites === p ? T.brand : T.border}`,
                    background: selectedBites === p ? T.brandLight : T.card, color: selectedBites === p ? T.brandDark : T.text,
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontFamily: fontMono }}>{p.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2, fontFamily: font, fontWeight: 500 }}>${(p/100).toFixed(0)}</div>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Redemption route</div>

              {/* Route 1: WeCater catering credit (the kicker) — gated at 2,500 Bites for lifecycle margin */}
              <button onClick={() => !wecaterLocked && setSelectedRoute("wecater")} disabled={wecaterLocked} style={{
                width: "100%", padding: 14, borderRadius: 10, marginBottom: 6,
                cursor: wecaterLocked ? "not-allowed" : "pointer",
                opacity: wecaterLocked ? 0.65 : 1,
                fontFamily: font, textAlign: "left",
                border: `1.5px solid ${selectedRoute === "wecater" ? T.brand : wecaterLocked ? T.borderLight : T.border}`,
                background: selectedRoute === "wecater" ? T.brandLight : T.card,
                display: "flex", alignItems: "center", gap: 12, position: "relative",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 22 }}>{wecaterLocked ? "🔒" : "🍴"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>WeCater catering credit</span>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: wecaterLocked ? T.textTertiary : T.brand, color: "#fff", fontWeight: 700, letterSpacing: "0.04em" }}>
                      {wecaterLocked ? "LOCKED" : "1.2X BONUS"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: wecaterLocked ? T.warning : T.textTertiary, marginTop: 2, lineHeight: 1.45 }}>
                    {wecaterLocked
                      ? <>Save up to <strong>2,500 Bites</strong> to unlock the 1.2X bonus on WeCater catering credit</>
                      : <>Use Bites toward your next WeCater order at any restaurant · {selectedBites.toLocaleString()} Bites = ${((selectedBites/100)*1.2).toFixed(2)} of credit</>}
                  </div>
                </div>
                {!wecaterLocked && (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedRoute === "wecater" ? T.brand : T.border}`, position: "relative", flexShrink: 0 }}>
                    {selectedRoute === "wecater" && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: T.brand }} />}
                  </div>
                )}
              </button>

              {/* Route 2: Restaurant Boost */}
              <button onClick={() => { setSelectedRoute("boost"); if (!selectedRestaurant) setSelectedRestaurant(boostableRestaurants[0]); }} style={{
                width: "100%", padding: 14, borderRadius: 10, marginBottom: 6, cursor: "pointer", fontFamily: font, textAlign: "left",
                border: `1.5px solid ${selectedRoute === "boost" ? T.brand : T.border}`,
                background: selectedRoute === "boost" ? T.brandLight : T.card,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>🚀</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Restaurant Boost</span>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: T.purple, color: "#fff", fontWeight: 700, letterSpacing: "0.04em" }}>UP TO 1.5X</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>Spend at a restaurant where you earned Bites — they boost the redemption rate</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedRoute === "boost" ? T.brand : T.border}`, position: "relative", flexShrink: 0 }}>
                  {selectedRoute === "boost" && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: T.brand }} />}
                </div>
              </button>

              {selectedRoute === "boost" && (
                <div style={{ marginLeft: 0, marginBottom: 8, padding: 10, background: T.surface, borderRadius: 8, animation: "fadeIn 0.2s ease" }}>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Pick a restaurant</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {boostableRestaurants.map(r => (
                      <button key={r.name} onClick={() => setSelectedRestaurant(r)} style={{
                        padding: "6px 10px", borderRadius: 8,
                        border: `1px solid ${selectedRestaurant?.name === r.name ? T.brand : T.border}`,
                        background: selectedRestaurant?.name === r.name ? T.brandLight : T.card,
                        cursor: "pointer", fontFamily: font, fontSize: 11, color: T.text,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span>{r.icon}</span>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                        <span style={{ color: T.purple, fontWeight: 700, fontFamily: fontMono, fontSize: 10 }}>{r.boostMultiplier}X</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Route 3: Amazon */}
              <button onClick={() => setSelectedRoute("amazon")} style={{
                width: "100%", padding: 14, borderRadius: 10, marginBottom: 6, cursor: "pointer", fontFamily: font, textAlign: "left",
                border: `1.5px solid ${selectedRoute === "amazon" ? T.brand : T.border}`,
                background: selectedRoute === "amazon" ? T.brandLight : T.card,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>📦</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Amazon Gift Card</span>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>Sent to your personal email · standard 1.0X rate · min 1,000 Bites</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedRoute === "amazon" ? T.brand : T.border}`, position: "relative", flexShrink: 0 }}>
                  {selectedRoute === "amazon" && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: T.brand }} />}
                </div>
              </button>

              {/* Summary */}
              <div style={{ marginTop: 16, padding: 14, background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`, borderRadius: 10, color: "#fff" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.9, marginBottom: 4 }}>You'll get</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, fontFamily: fontDisplay }}>${valueAtRoute.toFixed(2)}</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>
                    for {selectedBites.toLocaleString()} Bites
                    {selectedRoute !== "amazon" && (
                      <span style={{ fontSize: 11, marginLeft: 6, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
                        +${(valueAtRoute - selectedBites/100).toFixed(2)} bonus
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 24px", background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.textSecondary }}>Reported as a rebate, not income</span>
              <button onClick={() => setStep(1)} disabled={!canRedeem} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: !canRedeem ? T.border : T.brand,
                color: "#fff", fontWeight: 600, fontSize: 13,
                cursor: !canRedeem ? "default" : "pointer", fontFamily: font,
              }}>
                Redeem {selectedBites.toLocaleString()} Bites →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: T.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, animation: "scaleIn 0.4s ease" }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: fontDisplay, color: T.text, marginBottom: 8 }}>Redemption complete!</h2>
            <p style={{ fontSize: 13, color: T.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
              {selectedRoute === "wecater" && `$${valueAtRoute.toFixed(2)} in WeCater credit added to your account.`}
              {selectedRoute === "boost" && `${selectedBites.toLocaleString()} Bites locked in for your next ${selectedRestaurant?.name} order at ${selectedRestaurant?.boostMultiplier}X.`}
              {selectedRoute === "amazon" && `$${valueAtRoute.toFixed(2)} Amazon code sent to your personal email.`}
            </p>
            <div style={{ padding: "12px 16px", background: T.surface, borderRadius: 10, fontSize: 11, color: T.textSecondary, marginBottom: 20 }}>
              <strong style={{ color: T.text, fontFamily: fontMono }}>WCR-{Math.random().toString(36).substring(2,6).toUpperCase()}-{Math.random().toString(36).substring(2,6).toUpperCase()}-{Math.floor(Math.random()*9999)}</strong>
            </div>
            <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: T.text, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ───

export default function BitesWallet() {
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const wallet = WALLET;
  const maxMonthly = Math.max(...MONTHLY_BITES.map(m => m.value));
  const dollarValue = wallet.bites / 100;
  const welcomePct = (wallet.welcomeBonusEarned / wallet.welcomeBonusCap) * 100;

  return (
    <div style={{ fontFamily: font, height: "100vh", display: "flex", flexDirection: "column", background: T.surface, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(232,106,26,0.4); } 50% { box-shadow: 0 0 0 8px rgba(232,106,26,0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <TopNav />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>

        {/* ─── HERO BIG WALLET ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Bites balance card */}
          <div style={{
            position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`,
            borderRadius: 20, padding: "28px 32px", color: "#fff",
            boxShadow: `0 8px 32px ${T.brandGlow}`,
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: -30, left: -30, width: 140, height: 140, background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)", borderRadius: "50%" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: fontDisplay }}>Your Bites Balance</span>
                {wallet.welcomeActive && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(255,255,255,0.22)", borderRadius: 20, backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 600 }}>
                    🎁 Welcome 2X · {wallet.welcomeDaysRemaining}d left
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 700, fontFamily: fontDisplay, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  <CountUp value={wallet.bites} />
                </span>
                <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.85, fontFamily: fontDisplay }}>Bites</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 22 }}>
                ≈ <strong>${dollarValue.toFixed(2)}</strong> at 1X · up to <strong>${(dollarValue * 1.5).toFixed(2)}</strong> with Restaurant Boost · {wallet.pendingBites.toLocaleString()} pending
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setRedeemOpen(true)} style={{
                  padding: "12px 22px", borderRadius: 12, border: "none",
                  background: "#fff", color: T.brand, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font,
                  display: "flex", alignItems: "center", gap: 8, transition: "transform 0.15s",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >🍴 Redeem Bites</button>
                <button style={{
                  padding: "12px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: font,
                  backdropFilter: "blur(8px)",
                }}>Auto-redeem at 5,000 Bites</button>
              </div>

              {/* Welcome accelerator progress (only if active) */}
              {wallet.welcomeActive && (
                <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.18)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, opacity: 0.92 }}>
                    <span>🎁 <strong>Welcome 2X accelerator</strong> · {wallet.welcomeDaysRemaining} days remaining</span>
                    <span style={{ fontFamily: fontMono }}>{wallet.welcomeBonusEarned.toLocaleString()} / {wallet.welcomeBonusCap.toLocaleString()} bonus</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${welcomePct}%`, background: "#fff", borderRadius: 3, transition: "width 1.2s ease" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side: comparison + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: 20, background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, fontFamily: fontDisplay }}>vs. ezCater this year</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: T.success, fontFamily: fontDisplay }}>+${EZCATER_COMPARISON.spread.toFixed(0)}</span>
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: T.successBg, color: T.success, fontWeight: 700, fontFamily: fontMono }}>+{EZCATER_COMPARISON.spreadPct}%</span>
              </div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
                For the same orders, you'd have earned <strong style={{ color: T.text }}>{EZCATER_COMPARISON.ezcaterBitesEquivalent.toLocaleString()} ezCater points (${EZCATER_COMPARISON.ezcaterValue.toFixed(2)})</strong>. WeCater earned you <strong style={{ color: T.brand }}>{EZCATER_COMPARISON.wecaterBites.toLocaleString()} Bites (${EZCATER_COMPARISON.wecaterValue.toFixed(2)})</strong>.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: T.text, fontWeight: 500 }}>WeCater · 6.8% blended</span>
                    <span style={{ color: T.brand, fontWeight: 700, fontFamily: fontMono }}>{EZCATER_COMPARISON.wecaterBites.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: T.brandLight, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "100%", background: `linear-gradient(90deg, ${T.brand}, ${T.brandDark})`, borderRadius: 4 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: T.textTertiary }}>ezCater · ~1.5% effective</span>
                    <span style={{ color: T.textTertiary, fontFamily: fontMono }}>{EZCATER_COMPARISON.ezcaterBitesEquivalent.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: T.borderLight, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(EZCATER_COMPARISON.ezcaterBitesEquivalent / EZCATER_COMPARISON.wecaterBites) * 100}%`, background: T.textTertiary, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: 14, background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: fontMono }}>{wallet.ytdBitesEarned.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.textTertiary, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>YTD earned</div>
              </div>
              <div style={{ padding: 14, background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: fontMono }}>{wallet.totalOrders}</div>
                <div style={{ fontSize: 10, color: T.textTertiary, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Orders YTD</div>
              </div>
              <div style={{ padding: 14, background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.brand, fontFamily: fontMono }}>{wallet.blendedRate}X</div>
                <div style={{ fontSize: 10, color: T.textTertiary, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Blended rate</div>
              </div>
              <div style={{ padding: 14, background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: fontMono }}>{Math.round(wallet.ytdBitesEarned * 12 / 5).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.textTertiary, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Projected EOY</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Two-lane separator ─── */}
        <div style={{ marginBottom: 18, padding: "20px 24px", background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>🛡️</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: fontDisplay, letterSpacing: "0.02em" }}>Two distinct money lanes — by design</span>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: T.successBg, color: T.success, fontWeight: 700 }}>CMS-COMPLIANT</span>
            <button onClick={() => setShowHowItWorks(!showHowItWorks)} style={{ marginLeft: "auto", fontSize: 11, color: T.brand, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: font }}>
              {showHowItWorks ? "Hide" : "How it works"} →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: "16px 18px", background: T.companyBg, borderRadius: 12, border: `1px solid ${T.border}`, position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 700, color: T.companyLane, letterSpacing: "0.06em", textTransform: "uppercase" }}>Lane 1</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🏢</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.companyLane, fontFamily: fontDisplay }}>Your company pays for the meal</span>
              </div>
              <div style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.55 }}>
                The full meal cost is charged to your corporate card and reported under <strong style={{ color: T.text }}>CMS Open Payments</strong> as a transfer of value to attending physicians. Standard business expense.
              </div>
            </div>

            <div style={{ padding: "16px 18px", background: T.brandLight, borderRadius: 12, border: `1px solid ${T.brand}33`, position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 700, color: T.brandDark, letterSpacing: "0.06em", textTransform: "uppercase" }}>Lane 2</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🍴</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.brandDark, fontFamily: fontDisplay }}>You earn loyalty Bites</span>
              </div>
              <div style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.55 }}>
                Restaurants offer Bites as a <strong style={{ color: T.text }}>loyalty incentive</strong> to win your future business. Treated as a <strong style={{ color: T.text }}>rebate</strong>, not income — same legal model the airlines use.
              </div>
            </div>
          </div>

          {showHowItWorks && (
            <div style={{ marginTop: 16, padding: 16, background: T.surface, borderRadius: 12, border: `1px dashed ${T.border}`, animation: "fadeIn 0.25s ease" }}>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.65 }}>
                <strong style={{ color: T.text }}>The structure:</strong> Your company pays the restaurant directly for catering — that's a normal business expense reported per-physician for compliance. Restaurants on WeCater offer Bites as a marketing incentive, similar to how credit cards offer points or airlines award miles. The Bites are a discount on future spending, paid to <strong>you, the buyer</strong>, never to the company.
                <br /><br />
                <strong style={{ color: T.text }}>The legal model:</strong> Per <button onClick={() => setShowLegal(true)} style={{ color: T.brand, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: font, fontSize: 12, fontWeight: 600, padding: 0 }}>IRS Announcement 2002-18</button>, promotional benefits earned through business spending — like frequent-flyer miles — are not treated as taxable personal income. Bites follow the same rebate doctrine. Always confirm with your employer's expense policy.
                <br /><br />
                <strong style={{ color: T.text }}>What's tracked:</strong> The meal cost goes on your company card and to CMS Open Payments. Bites accrue to your personal WeCater account. Two separate ledgers, no commingling.
              </div>
            </div>
          )}
        </div>

        {/* ─── Bottom layout: activity + sidebar ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>

          {/* Activity */}
          <div>
            <SectionHeader icon="📋" title="Recent Activity" action="View all" />
            <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px 120px", padding: "10px 16px", background: T.surface, borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                <span>Date</span>
                <span>Order</span>
                <span style={{ textAlign: "right" }}>Co. paid</span>
                <span style={{ textAlign: "right" }}>Bites earned</span>
              </div>

              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} style={{
                  padding: "12px 16px",
                  borderBottom: i < RECENT_ORDERS.length - 1 ? `1px solid ${T.borderLight}` : "none",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px 120px", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: T.text, fontWeight: 500, fontFamily: fontMono }}>{o.date}</div>
                      <div style={{ fontSize: 9, color: T.textTertiary, fontFamily: fontMono }}>{o.id}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{o.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{o.restaurant}</div>
                        <div style={{ fontSize: 10, color: T.textTertiary }}>{o.officeIcon} {o.office}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: T.companyLane, fontFamily: fontMono, fontWeight: 600 }}>${o.subtotal.toFixed(2)}</span>
                      <div style={{ fontSize: 9, color: T.textTertiary }}>company</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 13, color: T.brand, fontFamily: fontMono, fontWeight: 700 }}>+{o.biteseEarned.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: T.textTertiary }}>Bites</span>
                      </div>
                      <div style={{ fontSize: 9, color: o.status === "pending" ? T.warning : T.success, fontWeight: 600 }}>
                        {o.actualRate}X · {o.status === "pending" ? "pending" : "available"}
                      </div>
                    </div>
                  </div>
                  {/* Modifier chips row */}
                  {o.modifiers.length > 0 && (
                    <div style={{ display: "flex", gap: 5, marginTop: 6, paddingLeft: 80, flexWrap: "wrap" }}>
                      <ModifierChip label={`Base ${o.baseRate}X`} bites={o.subtotal * o.baseRate} color={T.text} />
                      {o.modifiers.map((m, j) => <ModifierChip key={j} label={m.label} bites={m.bites} color={m.label.includes("Welcome") ? T.brand : T.purple} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: chart, restaurant boost catalog, redemption history */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Chart */}
            <div>
              <SectionHeader icon="📈" title="Monthly Bites" />
              <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, marginBottom: 8 }}>
                  {MONTHLY_BITES.map((m, i) => {
                    const h = (m.value / maxMonthly) * 100;
                    const isLast = i === MONTHLY_BITES.length - 1;
                    return (
                      <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "flex-end" }}>
                          <div style={{
                            width: "100%", height: `${h}%`,
                            background: isLast ? `linear-gradient(180deg, ${T.brand}, ${T.brandDark})` : T.borderLight,
                            borderRadius: "6px 6px 2px 2px", transition: "height 0.6s ease", position: "relative",
                          }}>
                            {isLast && (
                              <span style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: T.brand, fontFamily: fontMono, whiteSpace: "nowrap" }}>
                                {m.value.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: T.textTertiary, fontWeight: 500 }}>{m.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: T.textTertiary }}>Trend</span>
                  <span style={{ color: T.success, fontWeight: 600 }}>↑ 36% MoM growth</span>
                </div>
              </div>
            </div>

            {/* Restaurant Boost catalog */}
            <div>
              <SectionHeader icon="🚀" title="Restaurant Boost Available" />
              <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 4 }}>
                <div style={{ padding: "8px 12px", fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>
                  Bites earned at these restaurants redeem at a higher rate <strong>at that same restaurant</strong>:
                </div>
                {RESTAURANT_BUCKETS.filter(r => r.boostable && r.earnedBites >= 1000).slice(0, 4).map((r, i, arr) => (
                  <div key={r.name} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", padding: "10px 14px", borderTop: i === 0 ? "none" : `1px solid ${T.borderLight}`, gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: T.textTertiary, fontFamily: fontMono }}>{r.earnedBites.toLocaleString()} eligible Bites</div>
                    </div>
                    <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 6, background: T.purpleBg, color: T.purple, fontWeight: 700, fontFamily: fontMono }}>
                      {r.boostMultiplier}X
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redemption history */}
            <div>
              <SectionHeader icon="💸" title="Redemption History" />
              <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 4 }}>
                {REDEMPTION_HISTORY.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: i < REDEMPTION_HISTORY.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.brandLight, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, fontSize: 14 }}>
                      {r.type.includes("WeCater") ? "🍴" : "📦"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{r.type}</div>
                      <div style={{ fontSize: 10, color: T.textTertiary, fontFamily: fontMono }}>{r.code}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: fontMono }}>{r.bites.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: T.textTertiary }}>${r.value.toFixed(2)} · {r.date}</div>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: 8 }}>
                  <button style={{ fontSize: 11, color: T.brand, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: font }}>
                    Download tax statement →
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Footer FAQ ─── */}
        <div style={{ marginTop: 24, padding: 16, background: T.infoBg, borderRadius: 12, border: `1px solid #c7d7f5`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.info, marginBottom: 2 }}>"My company pays for the food. Are these Bites taxable income to me?"</div>
            <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>
              <strong>No.</strong> Per IRS Announcement 2002-18, promotional benefits earned through business spending — like frequent-flyer miles or loyalty points — are treated as a rebate on the original purchase, not personal income. WeCater Bites follow the same model. <button onClick={() => setShowLegal(true)} style={{ color: T.info, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: font, fontSize: 11, padding: 0, fontWeight: 600 }}>Read the legal note →</button>
            </div>
          </div>
        </div>
      </div>

      {redeemOpen && <RedeemModal availableBites={wallet.bites} onClose={() => setRedeemOpen(false)} />}

      {showLegal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowLegal(false)}>
          <div style={{ width: 540, maxWidth: "92vw", maxHeight: "85vh", overflowY: "auto", background: T.card, borderRadius: 18, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: fontDisplay, color: T.text }}>Legal & Tax Note</h2>
              <button onClick={() => setShowLegal(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: T.surface, cursor: "pointer", color: T.textSecondary, fontSize: 16 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>IRS Announcement 2002-18:</strong> The IRS has stated it will not pursue tax enforcement on the personal use of frequent-flyer miles or other in-kind promotional benefits earned through business or official travel. The same rebate doctrine applies broadly to loyalty points earned on business spending — including catering loyalty programs.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>Rebate doctrine:</strong> Loyalty points (including WeCater Bites) are treated as a discount on the original purchase price rather than taxable income to the recipient. This is the same legal framework used by airlines, hotels, and credit card rewards programs.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>Employer policy:</strong> Some employers have policies addressing whether employees may keep loyalty rewards earned on business spending. Always check your company's expense reimbursement and gifts/perks policy. WeCater does not direct or interpret your employer's policy on your behalf.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>CMS Open Payments:</strong> Pharmaceutical companies are required to report transfers of value to physicians (including catered meals) under the Sunshine Act. The full meal cost is what's reported — not the Bites you earn. Bites are a separate vendor-to-buyer loyalty incentive and do not affect Open Payments reporting.
              </p>
              <p style={{ fontSize: 11, color: T.textTertiary, marginTop: 16, fontStyle: "italic" }}>
                This is informational only and not tax or legal advice. Consult your tax advisor for your specific situation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
