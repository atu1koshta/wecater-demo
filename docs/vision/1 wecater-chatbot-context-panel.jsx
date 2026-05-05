import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens ───
const T = {
  brand: "#E86A1A",
  brandLight: "#FEF3EB",
  brandDark: "#C4540F",
  brandGlow: "rgba(232,106,26,0.12)",
  surface: "#FAFAF8",
  card: "#FFFFFF",
  cardHover: "#FEFDFB",
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
  aiMsg: "#F6F3EF",
  userMsg: "#1A1714",
  radius: 14,
  radiusSm: 8,
  shadow: "0 1px 3px rgba(0,0,0,0.04)",
  shadowLg: "0 4px 16px rgba(0,0,0,0.06)",
};

const font = `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`;
const fontDisplay = `'Outfit', ${font}`;
const fontMono = `'JetBrains Mono', monospace`;

// ─── Simulated conversation scenario ───
const DEMO_CONVERSATION = [
  {
    role: "user",
    text: "Order for Dr. Patel's office — Tuesday lunch, 14 people",
    contextUpdate: {
      activeProfile: {
        name: "Dr. Patel's Cardiology Office",
        type: "pharma",
        icon: "🏥",
        headcount: 14,
        address: "4530 E Shea Blvd, Suite 220, Phoenix AZ 85028",
        contactPerson: "Maria — Office Manager",
        contactPhone: "(602) 555-0142",
        lastOrder: "Apr 18 — Thai from Bangkok Garden",
        orderFrequency: "2× monthly",
      },
      dietary: {
        vegetarian: 3,
        vegan: 1,
        glutenFree: 2,
        nutAllergy: 1,
        total: 14,
        flags: ["Dr. Patel — strict vegetarian", "Nurse Kim — celiac"],
      },
      budget: {
        perPerson: 15,
        total: 210,
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
    text: "Loading Dr. Patel's office profile… \n\n⚠️ **Heads up — call Maria at (602) 555-0142 first** — she approves all rep lunches.\n\nHere's what I know:\n• 14 people, $15/person budget ($210 total)\n• Dietary: 3 vegetarian, 1 vegan, 2 GF, 1 nut allergy\n• Recent: Thai (Apr 18), Mediterranean (Apr 4), Indian (Mar 21)\n\nAvoiding those three cuisines for variety. Let me find options…",
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
    text: "Also the Pfizer rep brought sushi last week. Something different and impressive.",
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
    text: "Got it — sushi is off the table too. That rules out Thai, Mediterranean, Indian, and Japanese.\n\nHere are 3 options that'll stand out:\n\n**🔥 Option 1: Flower Child** — Healthy bowls & salads\n$18.50/person · $259 total · 7X base = **3,626 Bites** with Welcome 2X (≈$36.26)\nDietary coverage: ✅ all 7 restrictions met\n⚠️ $1.50 over budget/head — want me to trim?\n\n**🌮 Option 2: Barrio Queen** — Upscale Mexican\n$14.80/person · $207 total · 6X base = **2,484 Bites** with Welcome 2X (≈$24.84)\nDietary coverage: ✅ all met\n✅ Under budget\n\n**🥩 Option 3: Bobby Q** — BBQ Platters\n$15.00/person · $210 total · 5X base = **2,100 Bites** with Welcome 2X (≈$21.00)\nDietary coverage: ⚠️ vegan option limited (1 side only)\n✅ On budget\n\nWhich one, or want me to adjust?",
    contextUpdate: {
      budget: {
        perPerson: 15,
        total: 210,
        compliance: { physician: "Dr. Patel", ytdSpend: 68, threshold: 100, thisOrder: 14.86, projected: 82.86 },
      },
      rewards: { balance: 12750, thisOrderEstimate: 2484, tier: "Gold", welcomeActive: true, welcomeDaysLeft: 18 },
      cartOptions: [
        { name: "Flower Child", pp: 18.5, total: 259, baseRate: 7, bites: 3626, dietary: "✅ Full", overBudget: true },
        { name: "Barrio Queen", pp: 14.8, total: 207, baseRate: 6, bites: 2484, dietary: "✅ Full", overBudget: false },
        { name: "Bobby Q", pp: 15.0, total: 210, baseRate: 5, bites: 2100, dietary: "⚠️ Limited vegan", overBudget: false },
      ],
    },
  },
  {
    role: "user",
    text: "Go with option 2. And add a note that Maria said the office loves churros.",
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
        perPerson: 14.8,
        total: 207,
        compliance: { physician: "Dr. Patel", ytdSpend: 68, threshold: 100, thisOrder: 14.79, projected: 82.79 },
      },
    },
  },
  {
    role: "assistant",
    text: "Done! Here's your order summary:\n\n**Barrio Queen — Upscale Mexican**\n14 people · $207 total ($14.80/pp)\nPickup at 4530 E Shea Blvd\n\n📋 Compliance: Dr. Patel's per-physician cost is $14.79. YTD total moves to $82.79 — safely under the $100 threshold.\n\n🎁 You'll earn **2,484 Bites** (≈$24.84 value) — base 6X doubled by your active Welcome 2X. Redeem to Amazon, restaurant credit at 1.4X, or future WeCater orders at 1.2X.\n\n📝 Note saved: \"Office loves churros\" added to Dr. Patel's profile.\n\nShall I finalize and route to Barrio Queen?",
    contextUpdate: {
      orderStatus: "ready_to_confirm",
    },
  },
];

// ─── Helper components ───

function ContextCard({ title, icon, children, accent, collapsed: defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      overflow: "hidden",
      boxShadow: T.shadow,
      transition: "all 0.2s ease",
    }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: font,
          borderBottom: collapsed ? "none" : `1px solid ${T.borderLight}`,
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 600, color: T.text, letterSpacing: "0.02em", fontFamily: fontDisplay }}>{title}</span>
        {accent && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: accent.bg, color: accent.color, fontWeight: 600 }}>{accent.label}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke={T.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {!collapsed && <div style={{ padding: "10px 14px 14px" }}>{children}</div>}
    </div>
  );
}

function Tag({ children, color = T.textSecondary, bg = T.borderLight }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color, background: bg, padding: "3px 8px", borderRadius: 6, fontFamily: font }}>{children}</span>
  );
}

function MiniProgress({ value, max, color = T.brand, label }) {
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;
  return (
    <div style={{ marginTop: 6 }}>
      {label && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: T.textSecondary }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: isOver ? T.danger : T.text, fontFamily: fontMono }}>${value.toFixed(2)} / ${max}</span>
      </div>}
      <div style={{ height: 6, borderRadius: 3, background: T.borderLight, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: isOver ? T.danger : color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function NoteItem({ note, date, priority }) {
  const dotColor = priority === "high" ? T.danger : priority === "medium" ? T.warning : T.textTertiary;
  return (
    <div style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: `1px solid ${T.borderLight}` }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: T.text, margin: 0, lineHeight: 1.45 }}>{note}</p>
        <p style={{ fontSize: 10, color: T.textTertiary, margin: "2px 0 0" }}>{date}</p>
      </div>
    </div>
  );
}

// ─── Main App ───

export default function WeCaterChatbot() {
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const addMessage = useCallback((msg, ctxUpdate) => {
    setMessages(prev => [...prev, msg]);
    if (ctxUpdate) {
      setContext(prev => {
        const merged = { ...prev };
        Object.entries(ctxUpdate).forEach(([key, val]) => {
          if (Array.isArray(val)) merged[key] = val;
          else if (typeof val === "object" && val !== null) merged[key] = { ...prev[key], ...val };
          else merged[key] = val;
        });
        return merged;
      });
      // Animate new cards
      Object.keys(ctxUpdate).forEach(k => {
        setAnimatingCards(prev => new Set(prev).add(k));
        setTimeout(() => setAnimatingCards(prev => { const n = new Set(prev); n.delete(k); return n; }), 800);
      });
    }
  }, []);

  const handleSend = useCallback(() => {
    if (currentStep >= DEMO_CONVERSATION.length) return;
    const step = DEMO_CONVERSATION[currentStep];
    if (step.role === "user") {
      addMessage({ role: "user", text: step.text }, step.contextUpdate);
      setCurrentStep(prev => prev + 1);
      setInputValue("");
      // Auto-trigger assistant reply
      const nextStep = DEMO_CONVERSATION[currentStep + 1];
      if (nextStep && nextStep.role === "assistant") {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage({ role: "assistant", text: nextStep.text }, nextStep.contextUpdate);
          setCurrentStep(prev => prev + 1);
        }, 1400);
      }
    }
  }, [currentStep, addMessage]);

  const nextUserMsg = DEMO_CONVERSATION[currentStep];
  const placeholder = nextUserMsg?.role === "user" ? nextUserMsg.text : "Type your catering request…";

  // Determine what panels to show
  const { activeProfile, dietary, budget, relationshipNotes, recentOrders, rewards, variety, competitorIntel, cartOptions, orderStatus } = context;

  const panelCardStyle = (key) => ({
    animation: animatingCards.has(key) ? "slideInRight 0.4s ease" : "none",
  });

  return (
    <div style={{
      fontFamily: font,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: T.surface,
      color: T.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes slideInRight { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        height: 56,
        padding: "0 20px",
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 8px ${T.brandGlow}`,
          }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: fontDisplay }}>WeCater</span>
            <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: 6, fontWeight: 500 }}>AI Concierge</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {activeProfile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 12px",
            background: T.brandLight, borderRadius: 20, marginRight: 12,
          }}>
            <span style={{ fontSize: 13 }}>{activeProfile.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.brandDark }}>{activeProfile.name}</span>
          </div>
        )}

        <button
          onClick={() => setPanelOpen(!panelOpen)}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
            background: panelOpen ? T.brandLight : "transparent",
            border: `1px solid ${panelOpen ? T.brand : T.border}`,
            borderRadius: 8, cursor: "pointer", fontFamily: font,
            color: panelOpen ? T.brand : T.textSecondary, fontSize: 12, fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <line x1="9" y1="1" x2="9" y2="13" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Context
        </button>
      </div>

      {/* ─── Main area ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ─── Chat panel ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 10px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 20px", animation: "fadeIn 0.5s ease" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                  background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 20px ${T.brandGlow}`,
                }}>
                  <span style={{ fontSize: 24 }}>🍽️</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: fontDisplay, color: T.text, marginBottom: 6 }}>
                  What are we ordering today?
                </h2>
                <p style={{ fontSize: 13, color: T.textTertiary, maxWidth: 380, margin: "0 auto", lineHeight: 1.5 }}>
                  Tell me who it's for and I'll load their profile, dietary needs, budget, and suggest something they haven't had recently.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}>
                  {["Order for Dr. Patel's office", "Tuesday lunch, 20 people", "/weekly-standup", "What haven't we tried?"].map(s => (
                    <button key={s} onClick={() => { if (currentStep === 0) handleSend(); }} style={{
                      padding: "8px 14px", borderRadius: 20, border: `1px solid ${T.border}`,
                      background: T.card, fontSize: 12, color: T.textSecondary, cursor: "pointer",
                      fontFamily: font, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = T.brand; e.target.style.color = T.brand; }}
                    onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textSecondary; }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 16,
                animation: "fadeIn 0.3s ease",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 10, marginTop: 2,
                    background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
                  </div>
                )}
                <div style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? T.userMsg : T.aiMsg,
                  color: msg.role === "user" ? "#fff" : T.text,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.text.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, animation: "fadeIn 0.2s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
                </div>
                <div style={{ padding: "12px 18px", borderRadius: "18px 18px 18px 4px", background: T.aiMsg, display: "flex", gap: 5 }}>
                  {[0, 1, 2].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: T.textTertiary, animation: `pulse 1.2s ${d * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 20px 20px", borderTop: `1px solid ${T.borderLight}`, background: T.card }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
              padding: "4px 4px 4px 16px",
              transition: "border-color 0.15s",
            }}>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                placeholder={placeholder}
                style={{
                  flex: 1, border: "none", background: "none", outline: "none",
                  fontSize: 13.5, color: T.text, fontFamily: font,
                }}
              />
              <button
                onClick={handleSend}
                disabled={currentStep >= DEMO_CONVERSATION.length}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: currentStep < DEMO_CONVERSATION.length ? T.brand : T.border,
                  cursor: currentStep < DEMO_CONVERSATION.length ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 10, color: T.textTertiary }}>
                {currentStep < DEMO_CONVERSATION.length ? `Press Enter to send next message (${Math.ceil(currentStep/2 + 1)} of ${Math.ceil(DEMO_CONVERSATION.length/2)})` : "✅ Demo complete"}
              </span>
              <span style={{ fontSize: 10, color: T.textTertiary }}>WeCater.ai · AI Concierge</span>
            </div>
          </div>
        </div>

        {/* ─── Context Panel ─── */}
        {panelOpen && (
          <div style={{
            width: 340, flexShrink: 0, borderLeft: `1px solid ${T.border}`,
            background: T.surface, overflowY: "auto", padding: 14,
            display: "flex", flexDirection: "column", gap: 10,
            animation: "slideInRight 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: fontDisplay }}>Live Context</span>
              {Object.keys(context).length > 0 && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: T.successBg, color: T.success, fontWeight: 600 }}>
                  {Object.keys(context).filter(k => context[k]).length} active
                </span>
              )}
            </div>

            {Object.keys(context).length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: T.borderLight, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke={T.textTertiary} strokeWidth="1.2" strokeDasharray="3 3" /></svg>
                </div>
                <p style={{ fontSize: 12, color: T.textTertiary, lineHeight: 1.5 }}>Context cards will appear here as you chat. Start by telling me who the order is for.</p>
              </div>
            )}

            {/* Active Profile */}
            {activeProfile && (
              <div style={panelCardStyle("activeProfile")}>
                <ContextCard title="Active Profile" icon="👤" accent={{ label: activeProfile.type === "pharma" ? "Pharma Rep" : "EA", bg: T.brandLight, color: T.brandDark }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: fontDisplay, marginBottom: 8 }}>{activeProfile.icon} {activeProfile.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[
                      ["Headcount", `${activeProfile.headcount} people`],
                      ["Frequency", activeProfile.orderFrequency],
                      ["Contact", activeProfile.contactPerson],
                      ["Last order", activeProfile.lastOrder],
                    ].map(([l, v]) => (
                      <div key={l} style={{ padding: "6px 8px", background: T.surface, borderRadius: T.radiusSm }}>
                        <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: T.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, padding: "6px 8px", background: T.surface, borderRadius: T.radiusSm }}>
                    <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 2 }}>Address</div>
                    <div style={{ fontSize: 11, color: T.text }}>{activeProfile.address}</div>
                  </div>
                </ContextCard>
              </div>
            )}

            {/* Dietary */}
            {dietary && (
              <div style={panelCardStyle("dietary")}>
                <ContextCard title="Dietary Map" icon="🥗" accent={{ label: `${dietary.total} people`, bg: T.successBg, color: T.success }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    <Tag color="#16653a" bg={T.successBg}>🌿 {dietary.vegetarian} vegetarian</Tag>
                    <Tag color="#16653a" bg={T.successBg}>🌱 {dietary.vegan} vegan</Tag>
                    <Tag color={T.warning} bg={T.warningBg}>🌾 {dietary.glutenFree} GF</Tag>
                    <Tag color={T.danger} bg={T.dangerBg}>⚠️ {dietary.nutAllergy} nut allergy</Tag>
                  </div>
                  {dietary.flags.map((f, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.textSecondary, padding: "4px 0", borderTop: i > 0 ? `1px solid ${T.borderLight}` : "none" }}>⚡ {f}</div>
                  ))}
                </ContextCard>
              </div>
            )}

            {/* Budget & Compliance */}
            {budget && (
              <div style={panelCardStyle("budget")}>
                <ContextCard title="Budget & Compliance" icon="💰">
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: "8px 10px", background: T.surface, borderRadius: T.radiusSm, textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: fontMono }}>${budget.perPerson}</div>
                      <div style={{ fontSize: 10, color: T.textTertiary }}>per person</div>
                    </div>
                    <div style={{ flex: 1, padding: "8px 10px", background: T.surface, borderRadius: T.radiusSm, textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: fontMono }}>${budget.total}</div>
                      <div style={{ fontSize: 10, color: T.textTertiary }}>total budget</div>
                    </div>
                  </div>
                  {budget.compliance && (
                    <div style={{ padding: "8px 10px", background: budget.compliance.projected > budget.compliance.threshold ? T.dangerBg : T.infoBg, borderRadius: T.radiusSm }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: budget.compliance.projected > budget.compliance.threshold ? T.danger : T.info, marginBottom: 4 }}>
                        ☂️ Open Payments — {budget.compliance.physician}
                      </div>
                      <MiniProgress
                        value={budget.compliance.projected || budget.compliance.ytdSpend}
                        max={budget.compliance.threshold}
                        color={T.info}
                        label="YTD spend vs. de minimis"
                      />
                      {budget.compliance.thisOrder && (
                        <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>
                          This order adds ${budget.compliance.thisOrder.toFixed(2)} → ${budget.compliance.projected.toFixed(2)} projected
                        </div>
                      )}
                    </div>
                  )}
                </ContextCard>
              </div>
            )}

            {/* Rewards */}
            {rewards && (
              <div style={panelCardStyle("rewards")}>
                <ContextCard title="Your Bites Wallet" icon="🎁" accent={{ label: rewards.tier, bg: T.warningBg, color: T.warning }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: T.brand, fontFamily: fontMono }}>{rewards.balance.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 600 }}>Bites</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 8 }}>
                    ≈ ${(rewards.balance / 100).toFixed(2)} redemption value
                  </div>
                  {rewards.welcomeActive && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 8px", borderRadius: 5, marginBottom: 8,
                      background: "#FEF3EB", border: `1px solid ${T.brand}33`,
                    }}>
                      <span style={{ fontSize: 11 }}>🎉</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.brand, letterSpacing: "0.04em" }}>
                        Welcome 2X · {rewards.welcomeDaysLeft}d left
                      </span>
                    </div>
                  )}
                  {rewards.thisOrderEstimate && (
                    <div style={{ padding: "8px 10px", background: T.successBg, borderRadius: T.radiusSm }}>
                      <div style={{ fontSize: 12, color: T.success, fontWeight: 600 }}>
                        +{rewards.thisOrderEstimate.toLocaleString()} Bites from this order
                      </div>
                      <div style={{ fontSize: 10, color: T.success, opacity: 0.85, marginTop: 2 }}>
                        Redeem to Amazon · restaurant credit · or future orders
                      </div>
                    </div>
                  )}
                </ContextCard>
              </div>
            )}

            {/* Variety Engine */}
            {variety && (
              <div style={panelCardStyle("variety")}>
                <ContextCard title="Variety Engine" icon="🔄">
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textTertiary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Avoiding</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {variety.avoid.map(c => <Tag key={c} color={T.danger} bg={T.dangerBg}>✕ {c}</Tag>)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textTertiary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Suggesting</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {variety.suggested.map(c => <Tag key={c} color={T.success} bg={T.successBg}>✓ {c}</Tag>)}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 6 }}>{variety.reason}</div>
                </ContextCard>
              </div>
            )}

            {/* Competitor Intel */}
            {competitorIntel && (
              <div style={panelCardStyle("competitorIntel")}>
                <ContextCard title="Competitor Intel" icon="🕵️" accent={{ label: "NEW", bg: T.dangerBg, color: T.danger }}>
                  {competitorIntel.map((c, i) => (
                    <div key={i} style={{ padding: "8px 10px", background: T.surface, borderRadius: T.radiusSm, marginBottom: i < competitorIntel.length - 1 ? 6 : 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{c.competitor} brought <strong>{c.brought}</strong></div>
                      <div style={{ fontSize: 10, color: T.textTertiary }}>{c.when} · {c.office}</div>
                    </div>
                  ))}
                </ContextCard>
              </div>
            )}

            {/* Relationship Notes */}
            {relationshipNotes && (
              <div style={panelCardStyle("relationshipNotes")}>
                <ContextCard title="Relationship Notes" icon="📝">
                  {relationshipNotes.map((n, i) => <NoteItem key={i} {...n} />)}
                </ContextCard>
              </div>
            )}

            {/* Recent Orders */}
            {recentOrders && (
              <div style={panelCardStyle("recentOrders")}>
                <ContextCard title="Order History" icon="📋" collapsed>
                  {recentOrders.map((o, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < recentOrders.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{o.restaurant}</div>
                        <div style={{ fontSize: 10, color: T.textTertiary }}>{o.cuisine} · {o.date}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: fontMono }}>{o.amount}</span>
                    </div>
                  ))}
                </ContextCard>
              </div>
            )}

            {/* Cart Options */}
            {cartOptions && (
              <div style={panelCardStyle("cartOptions")}>
                <ContextCard title="Cart Comparison" icon="🛒">
                  {cartOptions.map((c, i) => {
                    const isSelected = context.selectedOption === c.name;
                    return (
                      <div key={i} style={{
                        padding: "10px",
                        background: isSelected ? T.brandLight : T.surface,
                        borderRadius: T.radiusSm,
                        marginBottom: i < cartOptions.length - 1 ? 6 : 0,
                        border: isSelected ? `1.5px solid ${T.brand}` : `1px solid ${T.borderLight}`,
                        position: "relative",
                      }}>
                        {isSelected && <span style={{ position: "absolute", top: 6, right: 8, fontSize: 10, fontWeight: 700, color: T.brand }}>✓ SELECTED</span>}
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</div>
                        <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: T.textSecondary }}>${c.pp}/pp</span>
                          <span style={{ fontSize: 11, color: T.textSecondary }}>${c.total} total</span>
                          <span style={{
                            fontSize: 10, padding: "1px 5px", borderRadius: 3,
                            background: T.brandLight, color: T.brand, fontWeight: 700, fontFamily: fontMono,
                          }}>{c.baseRate}X</span>
                          <span style={{ fontSize: 11, color: T.brand, fontWeight: 600, fontFamily: fontMono }}>
                            {c.bites.toLocaleString()} Bites
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          <Tag color={c.dietary.includes("✅") ? T.success : T.warning} bg={c.dietary.includes("✅") ? T.successBg : T.warningBg}>{c.dietary}</Tag>
                          {c.overBudget && <Tag color={T.danger} bg={T.dangerBg}>Over budget</Tag>}
                        </div>
                      </div>
                    );
                  })}
                </ContextCard>
              </div>
            )}

            {/* Order status */}
            {orderStatus === "ready_to_confirm" && (
              <div style={{ padding: "12px", background: T.successBg, borderRadius: T.radius, border: `1px solid #b5e3c8`, textAlign: "center", animation: "fadeIn 0.4s ease" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.success }}>✅ Order ready to confirm</span>
                <div style={{ fontSize: 11, color: "#1a7a43", marginTop: 4 }}>Barrio Queen · 14 people · $207</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
