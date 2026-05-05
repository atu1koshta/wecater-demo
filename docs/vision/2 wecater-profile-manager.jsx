import { useState, useMemo, useCallback } from "react";

// ─── Design tokens (matched to chatbot) ───
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
};

const font = `'DM Sans', -apple-system, sans-serif`;
const fontDisplay = `'Outfit', ${font}`;
const fontMono = `'JetBrains Mono', monospace`;

// ─── Demo data: 6 medical offices for a pharma rep ───
const PROFILES = [
  {
    id: "patel",
    name: "Dr. Patel's Cardiology",
    icon: "🫀",
    headcount: 14,
    physicians: [
      { name: "Dr. Anika Patel", npi: "1234567890", ytd: 68.0, threshold: 100 },
    ],
    address: "4530 E Shea Blvd, Suite 220, Phoenix AZ",
    contact: { name: "Maria Espinoza", role: "Office Manager", phone: "(602) 555-0142" },
    frequency: "2× monthly",
    lastOrder: { date: "Apr 18", restaurant: "Bangkok Garden", cuisine: "Thai", amount: 198 },
    nextScheduled: "Tue Apr 29 — 12:00pm",
    dietary: {
      total: 14,
      breakdown: { vegetarian: 3, vegan: 1, glutenFree: 2, nutAllergy: 1 },
      people: [
        { name: "Dr. Patel", restriction: "Strict vegetarian", source: "explicit", priority: "high", learned: "Mar 12" },
        { name: "Nurse Kim", restriction: "Celiac — strict GF", source: "explicit", priority: "high", learned: "Feb 4" },
        { name: "James (PA)", restriction: "Vegan", source: "explicit", priority: "medium", learned: "Jan 22" },
        { name: "Office staff", restriction: "1 nut allergy (unconfirmed who)", source: "implicit", priority: "high", learned: "Apr 4" },
      ],
    },
    notes: [
      { text: "Always call Maria at (602) 555-0142 before placing the order — she approves all rep lunches", date: "Mar 12", priority: "high", pinned: true },
      { text: "Office loves churros — add as dessert when available", date: "Apr 27", priority: "medium" },
      { text: "Office prefers pickup over delivery. Parking lot entrance at rear.", date: "Feb 28", priority: "medium" },
      { text: "Dr. Patel likes variety — don't repeat within 3 weeks", date: "Jan 15", priority: "low" },
    ],
    history: [
      { date: "Apr 18", restaurant: "Bangkok Garden", cuisine: "Thai", amount: 198, perPp: 14.14 },
      { date: "Apr 4", restaurant: "Pita Jungle", cuisine: "Mediterranean", amount: 215, perPp: 15.36 },
      { date: "Mar 21", restaurant: "Curry Corner", cuisine: "Indian", amount: 204, perPp: 14.57 },
      { date: "Mar 7", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 230, perPp: 16.43 },
      { date: "Feb 21", restaurant: "Bobby Q", cuisine: "BBQ", amount: 195, perPp: 13.93 },
    ],
    competitors: [
      { rep: "Pfizer rep", brought: "Sushi platter", date: "Apr 22" },
      { rep: "Merck rep", brought: "Italian", date: "Apr 9" },
    ],
    flags: ["compliance_safe", "active_relationship"],
  },
  {
    id: "morrison",
    name: "Dr. Morrison's Internal Med",
    icon: "🩺",
    headcount: 8,
    physicians: [
      { name: "Dr. Lisa Morrison", npi: "9876543210", ytd: 84.25, threshold: 100 },
      { name: "Dr. James Chen", npi: "5678901234", ytd: 42.0, threshold: 100 },
    ],
    address: "1212 N Central Ave, Phoenix AZ",
    contact: { name: "Brenda Walsh", role: "Practice Admin", phone: "(602) 555-0287" },
    frequency: "3× monthly",
    lastOrder: { date: "Apr 24", restaurant: "Pita Jungle", cuisine: "Mediterranean", amount: 142 },
    nextScheduled: "Wed Apr 30 — 11:30am",
    dietary: {
      total: 8,
      breakdown: { vegetarian: 1, vegan: 0, glutenFree: 1, nutAllergy: 0 },
      people: [
        { name: "Dr. Morrison", restriction: "Pescatarian", source: "explicit", priority: "medium", learned: "Feb 11" },
        { name: "Office mgr Brenda", restriction: "Gluten-free preference", source: "implicit", priority: "low", learned: "Mar 3" },
      ],
    },
    notes: [
      { text: "Approaching $100 de minimis — only $15.75 remaining for Dr. Morrison this year", date: "Apr 24", priority: "high", pinned: true },
      { text: "Brenda confirms orders by text faster than email", date: "Mar 18", priority: "medium" },
    ],
    history: [
      { date: "Apr 24", restaurant: "Pita Jungle", cuisine: "Mediterranean", amount: 142, perPp: 17.75 },
      { date: "Apr 10", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 156, perPp: 19.50 },
    ],
    competitors: [],
    flags: ["compliance_warning"],
  },
  {
    id: "chen",
    name: "Dr. Chen's Pediatrics",
    icon: "👶",
    headcount: 22,
    physicians: [
      { name: "Dr. Wei Chen", npi: "2345678901", ytd: 32.5, threshold: 100 },
      { name: "Dr. Sarah Lee", npi: "3456789012", ytd: 28.0, threshold: 100 },
    ],
    address: "8800 N Scottsdale Rd, Suite 100, Scottsdale AZ",
    contact: { name: "Jenna Tom", role: "Lead RN", phone: "(480) 555-0399" },
    frequency: "monthly",
    lastOrder: { date: "Apr 11", restaurant: "Oregano's Pizza", cuisine: "Italian", amount: 285 },
    nextScheduled: "Mon May 12 — 12:00pm",
    dietary: {
      total: 22,
      breakdown: { vegetarian: 4, vegan: 1, glutenFree: 3, nutAllergy: 2 },
      people: [
        { name: "Dr. Lee", restriction: "Severe peanut allergy — separate prep required", source: "explicit", priority: "high", learned: "Jan 8" },
        { name: "Multiple staff", restriction: "Family-friendly variety preferred", source: "implicit", priority: "low", learned: "Mar 21" },
      ],
    },
    notes: [
      { text: "Large team — kid-friendly options score better. Staff often eats leftovers next day.", date: "Mar 21", priority: "medium" },
    ],
    history: [
      { date: "Apr 11", restaurant: "Oregano's Pizza", cuisine: "Italian", amount: 285, perPp: 12.95 },
      { date: "Mar 14", restaurant: "Barrio Queen", cuisine: "Mexican", amount: 308, perPp: 14.00 },
    ],
    competitors: [],
    flags: ["large_team"],
  },
  {
    id: "westside",
    name: "Westside Oncology Center",
    icon: "🏥",
    headcount: 35,
    physicians: [
      { name: "Dr. Marcus Webb", npi: "4567890123", ytd: 51.0, threshold: 100 },
      { name: "Dr. Priya Shah", npi: "5678901234", ytd: 47.5, threshold: 100 },
      { name: "Dr. Elena Ruiz", npi: "6789012345", ytd: 38.0, threshold: 100 },
    ],
    address: "10210 W Indian School Rd, Phoenix AZ",
    contact: { name: "Rachel Brown", role: "Clinic Manager", phone: "(623) 555-0671" },
    frequency: "2× monthly",
    lastOrder: { date: "Apr 16", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 595 },
    nextScheduled: "Thu May 1 — 11:30am",
    dietary: {
      total: 35,
      breakdown: { vegetarian: 7, vegan: 3, glutenFree: 4, nutAllergy: 1 },
      people: [
        { name: "Dr. Shah", restriction: "Halal only", source: "explicit", priority: "high", learned: "Feb 1" },
        { name: "Dr. Ruiz", restriction: "Low-sodium for cardiac patient lunch hours", source: "explicit", priority: "medium", learned: "Mar 5" },
      ],
    },
    notes: [
      { text: "High-volume clinic — order needs to feed 35 reliably; under-portioning damages relationship", date: "Mar 5", priority: "high", pinned: true },
    ],
    history: [
      { date: "Apr 16", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 595, perPp: 17.00 },
      { date: "Apr 2", restaurant: "Curry Corner", cuisine: "Indian", amount: 525, perPp: 15.00 },
    ],
    competitors: [
      { rep: "Bristol Myers", brought: "Mediterranean", date: "Apr 19" },
    ],
    flags: ["high_volume"],
  },
  {
    id: "phx-heart",
    name: "Phoenix Heart Specialists",
    icon: "❤️",
    headcount: 12,
    physicians: [
      { name: "Dr. Robert Kim", npi: "7890123456", ytd: 12.0, threshold: 100 },
    ],
    address: "5601 N 16th St, Phoenix AZ",
    contact: { name: "Tina Rodriguez", role: "Front Desk Lead", phone: "(602) 555-0844" },
    frequency: "first visit",
    lastOrder: null,
    nextScheduled: "Mon May 5 — 12:30pm",
    dietary: { total: 12, breakdown: { vegetarian: 0, vegan: 0, glutenFree: 0, nutAllergy: 0 }, people: [] },
    notes: [
      { text: "First visit. Confirmed lunch slot for May 5. No dietary info gathered yet — ask Tina at check-in.", date: "Apr 25", priority: "high", pinned: true },
    ],
    history: [],
    competitors: [],
    flags: ["new_relationship", "incomplete_profile"],
  },
  {
    id: "sun-valley",
    name: "Sun Valley Family Practice",
    icon: "🌵",
    headcount: 6,
    physicians: [
      { name: "Dr. Mark Sullivan", npi: "8901234567", ytd: 22.0, threshold: 100 },
    ],
    address: "12424 N Tatum Blvd, Phoenix AZ",
    contact: { name: "Carla Diaz", role: "Office Mgr", phone: "(602) 555-0915" },
    frequency: "monthly",
    lastOrder: { date: "Mar 28", restaurant: "Bobby Q", cuisine: "BBQ", amount: 88 },
    nextScheduled: null,
    dietary: {
      total: 6,
      breakdown: { vegetarian: 0, vegan: 0, glutenFree: 1, nutAllergy: 0 },
      people: [{ name: "Dr. Sullivan", restriction: "GF preferred not strict", source: "implicit", priority: "low", learned: "Mar 28" }],
    },
    notes: [],
    history: [{ date: "Mar 28", restaurant: "Bobby Q", cuisine: "BBQ", amount: 88, perPp: 14.67 }],
    competitors: [],
    flags: ["dormant"],
  },
];

const FLAG_LABELS = {
  compliance_warning: { label: "⚠️ Compliance", bg: T.warningBg, color: T.warning },
  compliance_safe: { label: "✓ Compliant", bg: T.successBg, color: T.success },
  active_relationship: { label: "🔥 Active", bg: T.brandLight, color: T.brandDark },
  high_volume: { label: "📊 High Volume", bg: T.purpleBg, color: T.purple },
  large_team: { label: "👥 Large Team", bg: T.infoBg, color: T.info },
  new_relationship: { label: "✨ New", bg: T.purpleBg, color: T.purple },
  incomplete_profile: { label: "⚡ Incomplete", bg: T.warningBg, color: T.warning },
  dormant: { label: "💤 Dormant", bg: T.borderLight, color: T.textTertiary },
};

// ─── Helper components ───

function StatBlock({ value, label, color = T.text, mono = true }) {
  return (
    <div style={{ flex: 1, padding: "10px 12px", background: T.surface, borderRadius: 10, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: mono ? fontMono : fontDisplay, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 3, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function SectionHeader({ icon, title, count, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: fontDisplay, letterSpacing: "0.02em", textTransform: "uppercase" }}>{title}</span>
        {count !== undefined && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: T.borderLight, color: T.textSecondary, fontWeight: 600 }}>{count}</span>}
      </div>
      {action && (
        <button style={{ fontSize: 11, color: T.brand, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: font }}>{action}</button>
      )}
    </div>
  );
}

function SourceBadge({ source }) {
  const isExplicit = source === "explicit";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, marginLeft: 6,
      background: isExplicit ? T.brandLight : T.borderLight,
      color: isExplicit ? T.brandDark : T.textTertiary,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {isExplicit ? "Told" : "Learned"}
    </span>
  );
}

function PriorityDot({ priority }) {
  const c = priority === "high" ? T.danger : priority === "medium" ? T.warning : T.textTertiary;
  return <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0 }} />;
}

// ─── Profile list item (sidebar) ───

function ProfileListItem({ profile, active, onClick }) {
  const flagToShow = profile.flags?.[0];
  const flag = flagToShow ? FLAG_LABELS[flagToShow] : null;
  const dietBreakdown = profile.dietary.breakdown;
  const totalRestrictions = dietBreakdown.vegetarian + dietBreakdown.vegan + dietBreakdown.glutenFree + dietBreakdown.nutAllergy;

  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "12px 14px", border: "none", textAlign: "left", cursor: "pointer", fontFamily: font,
      background: active ? T.brandLight : "transparent",
      borderLeft: `3px solid ${active ? T.brand : "transparent"}`,
      borderBottom: `1px solid ${T.borderLight}`,
      transition: "background 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: active ? T.card : T.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, border: `1px solid ${active ? T.brand : T.border}`,
        }}>{profile.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile.name}
            </span>
            <span style={{ fontSize: 10, color: T.textTertiary, fontFamily: fontMono, marginLeft: 8 }}>{profile.headcount}p</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: T.textSecondary }}>{profile.frequency}</span>
            {totalRestrictions > 0 && (
              <>
                <span style={{ fontSize: 9, color: T.textTertiary }}>•</span>
                <span style={{ fontSize: 10, color: T.textSecondary }}>{totalRestrictions} dietary</span>
              </>
            )}
          </div>
          {flag && (
            <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: flag.bg, color: flag.color, fontWeight: 600 }}>
              {flag.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main App ───

export default function ProfileManager() {
  const [activeId, setActiveId] = useState("patel");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [profilesData, setProfilesData] = useState(PROFILES);

  const active = useMemo(() => profilesData.find(p => p.id === activeId), [activeId, profilesData]);

  const filteredProfiles = useMemo(() => {
    let list = profilesData.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === "compliance_warning") list = list.filter(p => p.flags?.includes("compliance_warning"));
    if (filter === "active") list = list.filter(p => p.flags?.includes("active_relationship") || p.flags?.includes("high_volume"));
    if (filter === "incomplete") list = list.filter(p => p.flags?.includes("incomplete_profile") || p.flags?.includes("new_relationship"));
    if (sort === "alphabetical") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "headcount") list = [...list].sort((a, b) => b.headcount - a.headcount);
    return list;
  }, [profilesData, search, filter, sort]);

  const addNote = useCallback(() => {
    if (!newNote.trim()) return;
    setProfilesData(prev => prev.map(p => p.id === activeId ? {
      ...p,
      notes: [{ text: newNote, date: "Apr 28", priority: newPriority, pinned: false }, ...p.notes],
    } : p));
    setNewNote("");
    setShowAddNote(false);
  }, [newNote, newPriority, activeId]);

  if (!active) return null;

  const compliancePhysicians = active.physicians?.filter(p => p.ytd / p.threshold > 0.7) || [];
  const dietPct = (n) => active.dietary.total ? Math.round((n / active.dietary.total) * 100) : 0;

  return (
    <div style={{ fontFamily: font, height: "100vh", display: "flex", flexDirection: "column", background: T.surface, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        button:focus, input:focus, select:focus { outline: none; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 20px", background: T.card, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${T.brandGlow}` }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: fontDisplay }}>WeCater</span>
            <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: 6, fontWeight: 500 }}>Profiles</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginLeft: 24, padding: 3, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
          {[
            { id: "chat", label: "Chat", icon: "💬" },
            { id: "profiles", label: "Profiles", icon: "👥" },
            { id: "rewards", label: "Rewards", icon: "🎁" },
            { id: "compliance", label: "Compliance", icon: "📋" },
          ].map(tab => (
            <button key={tab.id} style={{
              padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: font,
              fontSize: 12, fontWeight: 500,
              background: tab.id === "profiles" ? T.card : "transparent",
              color: tab.id === "profiles" ? T.text : T.textSecondary,
              boxShadow: tab.id === "profiles" ? T.shadow : "none",
              transition: "all 0.15s",
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: T.textTertiary }}>
            <strong style={{ color: T.text, fontFamily: fontMono }}>{profilesData.length}</strong> profiles · <strong style={{ color: T.text, fontFamily: fontMono }}>{profilesData.reduce((a, p) => a + p.headcount, 0)}</strong> people
          </span>
          <button style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: font,
            background: T.brand, color: "#fff", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 5,
          }}>+ New Profile</button>
        </div>
      </div>

      {/* ─── Main 3-pane layout ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ─── LEFT: Profile list ─── */}
        <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${T.border}`, background: T.card, display: "flex", flexDirection: "column" }}>
          {/* Search */}
          <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${T.borderLight}` }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="6" cy="6" r="4.5" stroke={T.textTertiary} strokeWidth="1.4" />
                <path d="M9.5 9.5L12 12" stroke={T.textTertiary} strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search 6 profiles…"
                style={{
                  width: "100%", padding: "8px 10px 8px 33px", borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.surface, fontSize: 12, color: T.text, fontFamily: font,
                }}
              />
            </div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All" },
                { id: "active", label: "🔥 Active" },
                { id: "compliance_warning", label: "⚠️ Compliance" },
                { id: "incomplete", label: "✨ New" },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: "4px 10px", borderRadius: 12, border: `1px solid ${filter === f.id ? T.brand : T.border}`,
                  background: filter === f.id ? T.brandLight : T.card,
                  color: filter === f.id ? T.brandDark : T.textSecondary, fontSize: 11, fontWeight: 500,
                  cursor: "pointer", fontFamily: font, transition: "all 0.15s",
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredProfiles.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.textTertiary, fontSize: 12 }}>No profiles match.</div>
            ) : filteredProfiles.map(p => (
              <ProfileListItem key={p.id} profile={p} active={p.id === activeId} onClick={() => setActiveId(p.id)} />
            ))}
          </div>

          {/* Footer / sort */}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: T.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort</span>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              flex: 1, padding: "5px 8px", borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.surface, fontSize: 11, color: T.textSecondary, fontFamily: font, cursor: "pointer",
            }}>
              <option value="recent">Recent activity</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="headcount">Headcount</option>
            </select>
          </div>
        </div>

        {/* ─── CENTER: Profile detail ─── */}
        <div key={active.id} style={{ flex: 1, overflowY: "auto", padding: "24px 28px", animation: "fadeIn 0.25s ease" }}>
          {/* Hero */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{active.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, fontFamily: fontDisplay, letterSpacing: "-0.01em" }}>{active.name}</h1>
                {active.flags?.map(f => {
                  const flag = FLAG_LABELS[f];
                  return flag ? <span key={f} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 12, background: flag.bg, color: flag.color, fontWeight: 600 }}>{flag.label}</span> : null;
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: T.textSecondary }}>
                <span>📍 {active.address}</span>
                <span>•</span>
                <span>👤 {active.contact.name} ({active.contact.role})</span>
                <span>•</span>
                <span style={{ fontFamily: fontMono }}>{active.contact.phone}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 5 }}>
                ✏️ Edit
              </button>
              <button style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 5 }}>
                💬 Order Now
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <StatBlock value={active.headcount} label="Headcount" mono={false} />
            <StatBlock value={active.frequency} label="Frequency" color={T.brand} mono={false} />
            <StatBlock value={active.history.length} label="Total orders" />
            <StatBlock value={active.dietary.people.length} label="Dietary flags" color={active.dietary.people.length > 0 ? T.warning : T.textSecondary} />
            <StatBlock value={active.notes.length} label="Notes" />
            <StatBlock value={active.competitors.length} label="Competitor obs." color={T.purple} />
          </div>

          {/* Pinned alert if present */}
          {active.notes.find(n => n.pinned) && (
            <div style={{
              marginTop: 18, padding: "12px 14px", borderRadius: 10,
              background: active.notes.find(n => n.pinned)?.priority === "high" ? T.dangerBg : T.warningBg,
              border: `1px solid ${active.notes.find(n => n.pinned)?.priority === "high" ? "#fecaca" : "#fed7aa"}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>📌</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: active.notes.find(n => n.pinned)?.priority === "high" ? T.danger : T.warning, marginBottom: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>Pinned reminder</div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{active.notes.find(n => n.pinned)?.text}</div>
              </div>
            </div>
          )}

          {/* ─── Dietary Memory Engine ─── */}
          <SectionHeader icon="🥗" title="Dietary Memory" count={active.dietary.people.length} action="+ Add restriction" />
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            {/* Aggregate breakdown */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { label: "Vegetarian", count: active.dietary.breakdown.vegetarian, icon: "🌿", color: T.success, bg: T.successBg },
                { label: "Vegan", count: active.dietary.breakdown.vegan, icon: "🌱", color: T.success, bg: T.successBg },
                { label: "Gluten-free", count: active.dietary.breakdown.glutenFree, icon: "🌾", color: T.warning, bg: T.warningBg },
                { label: "Nut allergy", count: active.dietary.breakdown.nutAllergy, icon: "⚠️", color: T.danger, bg: T.dangerBg },
              ].map(d => (
                <div key={d.label} style={{ flex: "1 1 140px", padding: "10px 12px", borderRadius: 10, background: d.count > 0 ? d.bg : T.surface, border: `1px solid ${d.count > 0 ? d.color + "33" : T.borderLight}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{d.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: d.count > 0 ? d.color : T.textTertiary }}>{d.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: d.count > 0 ? d.color : T.textTertiary, fontFamily: fontMono }}>{d.count}</span>
                    <span style={{ fontSize: 10, color: T.textTertiary }}>of {active.dietary.total} ({dietPct(d.count)}%)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Specific restrictions per person */}
            {active.dietary.people.length > 0 ? (
              <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textTertiary, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Specific restrictions</div>
                {active.dietary.people.map((person, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < active.dietary.people.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                    <PriorityDot priority={person.priority} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: T.text }}>
                        <strong>{person.name}</strong> — {person.restriction}
                        <SourceBadge source={person.source} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 1 }}>Recorded {person.learned}</div>
                    </div>
                    <button style={{ padding: "4px 8px", border: "none", background: "transparent", cursor: "pointer", color: T.textTertiary, fontSize: 11, fontFamily: font }}>Edit</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px 0", textAlign: "center", color: T.textTertiary, fontSize: 12, borderTop: `1px solid ${T.borderLight}`, marginTop: 4 }}>
                No specific restrictions recorded yet. The chatbot will ask Tina at the next visit.
              </div>
            )}
          </div>

          {/* ─── Compliance (pharma) ─── */}
          {active.physicians && active.physicians.length > 0 && (
            <>
              <SectionHeader icon="📋" title="Open Payments Compliance" count={active.physicians.length} />
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                {active.physicians.map((phys, i) => {
                  const pct = (phys.ytd / phys.threshold) * 100;
                  const remaining = phys.threshold - phys.ytd;
                  const warning = pct > 70;
                  const danger = pct > 90;
                  return (
                    <div key={i} style={{ marginBottom: i < active.physicians.length - 1 ? 16 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{phys.name}</span>
                          <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: 8, fontFamily: fontMono }}>NPI {phys.npi}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: danger ? T.danger : warning ? T.warning : T.success, fontFamily: fontMono }}>
                          ${phys.ytd.toFixed(2)} / ${phys.threshold} <span style={{ color: T.textTertiary, fontWeight: 500 }}>YTD</span>
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: T.borderLight, overflow: "hidden", position: "relative" }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: danger ? T.danger : warning ? T.warning : T.success, borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 4 }}>
                        ${remaining.toFixed(2)} remaining before $100 de minimis threshold {danger ? "— ⚠️ very close" : warning ? "— heads up" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ─── Relationship Notes (CRM) ─── */}
          <SectionHeader icon="📝" title="Relationship Notes" count={active.notes.length} action={showAddNote ? "Cancel" : "+ Add note"} />
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            {showAddNote || true ? (
              <div style={{ marginBottom: active.notes.length ? 12 : 0, padding: 10, background: T.surface, borderRadius: 10, border: `1px dashed ${T.border}`, animation: "fadeIn 0.2s ease" }}>
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addNote(); }}
                  placeholder="Add a note… e.g., 'Office prefers pickup over delivery'"
                  style={{ width: "100%", padding: "6px 8px", border: "none", background: "transparent", fontSize: 13, color: T.text, fontFamily: font, marginBottom: 8 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { id: "high", label: "High", color: T.danger, bg: T.dangerBg },
                      { id: "medium", label: "Medium", color: T.warning, bg: T.warningBg },
                      { id: "low", label: "Low", color: T.textTertiary, bg: T.borderLight },
                    ].map(p => (
                      <button key={p.id} onClick={() => setNewPriority(p.id)} style={{
                        padding: "3px 9px", borderRadius: 12,
                        border: `1px solid ${newPriority === p.id ? p.color : "transparent"}`,
                        background: newPriority === p.id ? p.bg : T.card, color: p.color,
                        fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: font,
                      }}>{p.label}</button>
                    ))}
                  </div>
                  <button onClick={addNote} disabled={!newNote.trim()} style={{
                    padding: "5px 12px", borderRadius: 6, border: "none",
                    background: newNote.trim() ? T.brand : T.border, color: "#fff", fontSize: 11, fontWeight: 600,
                    cursor: newNote.trim() ? "pointer" : "default", fontFamily: font,
                  }}>Save note</button>
                </div>
              </div>
            ) : null}

            {active.notes.length > 0 ? active.notes.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < active.notes.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                {n.pinned && <span style={{ fontSize: 12, marginTop: 1 }}>📌</span>}
                {!n.pinned && <PriorityDot priority={n.priority} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{n.text}</p>
                  <span style={{ fontSize: 10, color: T.textTertiary, marginTop: 3, display: "inline-block" }}>{n.date}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding: "10px 0", textAlign: "center", color: T.textTertiary, fontSize: 12 }}>No notes yet.</div>
            )}
          </div>

          {/* ─── Order History ─── */}
          {active.history.length > 0 && (
            <>
              <SectionHeader icon="📋" title="Order History" count={active.history.length} action="View all" />
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 4 }}>
                {active.history.map((o, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 80px", alignItems: "center", padding: "10px 14px", borderBottom: i < active.history.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                    <span style={{ fontSize: 11, color: T.textTertiary, fontFamily: fontMono }}>{o.date}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{o.restaurant}</div>
                      <div style={{ fontSize: 10, color: T.textTertiary }}>{o.cuisine}</div>
                    </div>
                    <span style={{ fontSize: 11, color: T.textTertiary, fontFamily: fontMono }}>${o.perPp.toFixed(2)}/pp</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: fontMono, textAlign: "right" }}>${o.amount}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── Competitor Intel (pharma differentiator) ─── */}
          {active.competitors.length > 0 && (
            <>
              <SectionHeader icon="🕵️" title="Competitor Activity" count={active.competitors.length} />
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 10, lineHeight: 1.5 }}>
                  Other reps observed at this office. The chatbot uses this to suggest differentiated cuisines.
                </div>
                {active.competitors.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: T.purpleBg, borderRadius: 8, marginBottom: i < active.competitors.length - 1 ? 6 : 0 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{c.rep}</span>
                      <span style={{ fontSize: 12, color: T.textSecondary, marginLeft: 6 }}>brought <strong>{c.brought}</strong></span>
                    </div>
                    <span style={{ fontSize: 10, color: T.purple, fontFamily: fontMono, fontWeight: 600 }}>{c.date}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer space */}
          <div style={{ height: 40 }} />
        </div>

        {/* ─── RIGHT: Quick actions / next steps ─── */}
        <div style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${T.border}`, background: T.surface, padding: 16, overflowY: "auto" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: fontDisplay }}>Next Steps</span>

          {/* Next scheduled */}
          {active.nextScheduled && (
            <div style={{ marginTop: 12, padding: 14, background: T.brandLight, borderRadius: 12, border: `1px solid ${T.brand}33` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.brand, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Upcoming</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: fontDisplay, marginBottom: 8 }}>{active.nextScheduled}</div>
              <button style={{ width: "100%", padding: 9, borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
                💬 Plan this order
              </button>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { icon: "🔁", label: "Reorder last", desc: active.lastOrder ? `${active.lastOrder.restaurant} · $${active.lastOrder.amount}` : "No previous orders" },
              { icon: "📐", label: "Save as template", desc: "Reusable order with variables" },
              { icon: "🔄", label: "Switch context", desc: "Change to another office" },
              { icon: "📤", label: "Transfer profile", desc: "Hand off to another rep" },
              { icon: "📥", label: "Export profile", desc: "Download as CSV" },
            ].map(a => (
              <button key={a.label} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                borderRadius: 10, border: `1px solid ${T.border}`, background: T.card,
                cursor: "pointer", textAlign: "left", fontFamily: font,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.background = T.brandLight; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }}
              >
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.label}</div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 1 }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* AI insights */}
          <div style={{ marginTop: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: fontDisplay }}>AI Insights</span>
            <div style={{ marginTop: 10, padding: 12, background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: fontDisplay }}>W</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Concierge has noticed:</span>
              </div>
              {active.id === "patel" && (
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                  Last 3 orders all $14–16/pp — your sweet spot. Avoid Asian cuisines this week (used twice in April). The Pfizer rep brought sushi 6 days ago — go contrasting.
                </div>
              )}
              {active.id === "morrison" && (
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                  Dr. Morrison at <strong style={{ color: T.warning }}>$84.25 YTD</strong>. Next order should be ≤ $15.75 to stay compliant. Suggested: Bobby Q ($14/pp) or Oregano's pizza ($13/pp).
                </div>
              )}
              {active.id === "phx-heart" && (
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                  First visit on May 5. <strong style={{ color: T.warning }}>No dietary info yet</strong> — ask Tina at check-in. Plan a safe-bet order: Mediterranean or Mexican (broad appeal).
                </div>
              )}
              {!["patel", "morrison", "phx-heart"].includes(active.id) && (
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                  Steady relationship. Last order pattern suggests trying something new for variety on the next visit.
                </div>
              )}
            </div>
          </div>

          {/* Memory stats */}
          <div style={{ marginTop: 24, padding: 12, background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Memory bank</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
              <div>
                <div style={{ color: T.textTertiary }}>Explicit</div>
                <div style={{ fontWeight: 600, color: T.text, fontFamily: fontMono, fontSize: 14 }}>{active.dietary.people.filter(p => p.source === "explicit").length}</div>
              </div>
              <div>
                <div style={{ color: T.textTertiary }}>Learned</div>
                <div style={{ fontWeight: 600, color: T.text, fontFamily: fontMono, fontSize: 14 }}>{active.dietary.people.filter(p => p.source === "implicit").length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
