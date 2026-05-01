import { cn } from "@/lib/cn";
import type { OrderContext } from "@/types";
import { ContextCard, MiniProgress, NoteItem, Tag } from "./atoms";

export function ProfileCard({
  profile,
}: {
  profile: NonNullable<OrderContext["activeProfile"]>;
}) {
  const stats: [string, string][] = [
    ["Headcount", `${profile.headcount} people`],
    ["Frequency", profile.orderFrequency],
    ["Contact", profile.contactPerson],
    ["Last order", profile.lastOrder],
  ];
  return (
    <ContextCard
      title="Active Profile"
      icon="👤"
      accent={{
        label: profile.type === "pharma" ? "Pharma Rep" : "EA",
        tone: "brand",
      }}
    >
      <div className="text-[15px] font-semibold text-ink font-display mb-2">
        {profile.icon} {profile.name}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {stats.map(([label, value]) => (
          <div key={label} className="px-2 py-1.5 bg-surface rounded-lg">
            <div className="text-[10px] text-ink-tertiary mb-px">{label}</div>
            <div className="text-[11px] font-medium text-ink">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 px-2 py-1.5 bg-surface rounded-lg">
        <div className="text-[10px] text-ink-tertiary mb-px">Address</div>
        <div className="text-[11px] text-ink">{profile.address}</div>
      </div>
    </ContextCard>
  );
}

export function DietaryCard({
  dietary,
}: {
  dietary: NonNullable<OrderContext["dietary"]>;
}) {
  return (
    <ContextCard
      title="Dietary Map"
      icon="🥗"
      accent={{ label: `${dietary.total} people`, tone: "success" }}
    >
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Tag tone="success">🌿 {dietary.vegetarian} vegetarian</Tag>
        <Tag tone="success">🌱 {dietary.vegan} vegan</Tag>
        <Tag tone="warning">🌾 {dietary.glutenFree} GF</Tag>
        <Tag tone="danger">⚠️ {dietary.nutAllergy} nut allergy</Tag>
      </div>
      {dietary.flags.map((f, i) => (
        <div
          key={f}
          className={cn(
            "text-[11px] text-ink-secondary py-1",
            i > 0 && "border-t border-surface-border-light",
          )}
        >
          ⚡ {f}
        </div>
      ))}
    </ContextCard>
  );
}

export function BudgetCard({
  budget,
}: {
  budget: NonNullable<OrderContext["budget"]>;
}) {
  const c = budget.compliance;
  const projected = c.projected ?? c.ytdSpend;
  const overThreshold = projected > c.threshold;
  return (
    <ContextCard title="Budget & Compliance" icon="💰">
      <div className="flex gap-2 mb-2.5">
        <BudgetTile value={`$${budget.perPerson}`} label="per person" />
        <BudgetTile value={`$${budget.total}`} label="total budget" />
      </div>
      <div
        className={cn(
          "px-2.5 py-2 rounded-lg",
          overThreshold ? "bg-danger-light" : "bg-info-light",
        )}
      >
        <div
          className={cn(
            "text-[11px] font-semibold mb-1",
            overThreshold ? "text-danger" : "text-info",
          )}
        >
          ☂️ Open Payments — {c.physician}
        </div>
        <MiniProgress
          value={projected}
          max={c.threshold}
          label="YTD spend vs. de minimis"
        />
        {c.thisOrder !== null && c.projected !== undefined && (
          <div className="text-[10px] text-ink-secondary mt-1">
            This order adds ${c.thisOrder.toFixed(2)} → ${c.projected.toFixed(2)}{" "}
            projected
          </div>
        )}
      </div>
    </ContextCard>
  );
}

function BudgetTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-2.5 py-2 bg-surface rounded-lg text-center">
      <div className="text-lg font-bold text-ink font-mono">{value}</div>
      <div className="text-[10px] text-ink-tertiary">{label}</div>
    </div>
  );
}

export function RewardsCard({
  rewards,
}: {
  rewards: NonNullable<OrderContext["rewards"]>;
}) {
  return (
    <ContextCard
      title="Your Bites Wallet"
      icon="🎁"
      accent={{ label: rewards.tier, tone: "warning" }}
    >
      <div className="flex items-baseline gap-1.5 mb-px">
        <span className="text-[22px] font-bold text-brand font-mono">
          {rewards.balance.toLocaleString()}
        </span>
        <span className="text-[11px] text-ink-tertiary font-semibold">Bites</span>
      </div>
      <div className="text-[11px] text-ink-tertiary mb-2">
        ≈ ${(rewards.balance / 100).toFixed(2)} redemption value
      </div>
      {rewards.welcomeActive && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md mb-2 bg-brand-light border border-brand/20">
          <span className="text-[11px]">🎉</span>
          <span className="text-[10px] font-bold text-brand tracking-wider">
            Welcome 2X · {rewards.welcomeDaysLeft}d left
          </span>
        </div>
      )}
      {rewards.thisOrderEstimate !== null && (
        <div className="px-2.5 py-2 bg-success-light rounded-lg">
          <div className="text-xs text-success font-semibold">
            +{rewards.thisOrderEstimate.toLocaleString()} Bites from this order
          </div>
          <div className="text-[10px] text-success/85 mt-px">
            Redeem to Amazon · restaurant credit · or future orders
          </div>
        </div>
      )}
    </ContextCard>
  );
}

export function VarietyCard({
  variety,
}: {
  variety: NonNullable<OrderContext["variety"]>;
}) {
  return (
    <ContextCard title="Variety Engine" icon="🔄">
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-ink-tertiary mb-1 uppercase tracking-wider">
          Avoiding
        </div>
        <div className="flex flex-wrap gap-1">
          {variety.avoid.map((c) => (
            <Tag key={c} tone="danger">
              ✕ {c}
            </Tag>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold text-ink-tertiary mb-1 uppercase tracking-wider">
          Suggesting
        </div>
        <div className="flex flex-wrap gap-1">
          {variety.suggested.map((c) => (
            <Tag key={c} tone="success">
              ✓ {c}
            </Tag>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-ink-tertiary mt-1.5">{variety.reason}</div>
    </ContextCard>
  );
}

export function CompetitorCard({
  intel,
}: {
  intel: NonNullable<OrderContext["competitorIntel"]>;
}) {
  return (
    <ContextCard
      title="Competitor Intel"
      icon="🕵️"
      accent={{ label: "NEW", tone: "danger" }}
    >
      {intel.map((c, i) => (
        <div
          key={`${c.competitor}-${c.when}`}
          className={cn(
            "px-2.5 py-2 bg-surface rounded-lg",
            i < intel.length - 1 && "mb-1.5",
          )}
        >
          <div className="text-xs text-ink font-medium">
            {c.competitor} brought <strong>{c.brought}</strong>
          </div>
          <div className="text-[10px] text-ink-tertiary">
            {c.when} · {c.office}
          </div>
        </div>
      ))}
    </ContextCard>
  );
}

export function NotesCard({
  notes,
}: {
  notes: NonNullable<OrderContext["relationshipNotes"]>;
}) {
  return (
    <ContextCard title="Relationship Notes" icon="📝">
      {notes.map((n, i) => (
        <NoteItem
          key={`${n.date}-${i}`}
          note={n.note}
          date={n.date}
          priority={n.priority}
          isLast={i === notes.length - 1}
        />
      ))}
    </ContextCard>
  );
}

export function OrdersCard({
  orders,
}: {
  orders: NonNullable<OrderContext["recentOrders"]>;
}) {
  return (
    <ContextCard title="Order History" icon="📋" defaultCollapsed>
      {orders.map((o, i) => (
        <div
          key={`${o.date}-${o.restaurant}`}
          className={cn(
            "flex justify-between items-center py-1.5",
            i < orders.length - 1 && "border-b border-surface-border-light",
          )}
        >
          <div>
            <div className="text-xs font-medium text-ink">{o.restaurant}</div>
            <div className="text-[10px] text-ink-tertiary">
              {o.cuisine} · {o.date}
            </div>
          </div>
          <span className="text-xs font-semibold text-ink font-mono">
            {o.amount}
          </span>
        </div>
      ))}
    </ContextCard>
  );
}

export function CartOptionsCard({
  options,
  selected,
}: {
  options: NonNullable<OrderContext["cartOptions"]>;
  selected: OrderContext["selectedOption"];
}) {
  return (
    <ContextCard title="Cart Comparison" icon="🛒">
      {options.map((c, i) => {
        const isSelected = selected === c.name;
        const dietaryTone = c.dietary.includes("✅") ? "success" : "warning";
        return (
          <div
            key={c.name}
            className={cn(
              "p-2.5 rounded-lg relative",
              i < options.length - 1 && "mb-1.5",
              isSelected
                ? "bg-brand-light border-[1.5px] border-brand"
                : "bg-surface border border-surface-border-light",
            )}
          >
            {isSelected && (
              <span className="absolute top-1.5 right-2 text-[10px] font-bold text-brand">
                ✓ SELECTED
              </span>
            )}
            <div className="text-[13px] font-semibold text-ink">{c.name}</div>
            <div className="flex gap-2.5 mt-1 items-center flex-wrap">
              <span className="text-[11px] text-ink-secondary">${c.pp}/pp</span>
              <span className="text-[11px] text-ink-secondary">${c.total} total</span>
              <span className="text-[10px] px-1.5 py-px rounded-sm bg-brand-light text-brand font-bold font-mono">
                {c.baseRate}X
              </span>
              <span className="text-[11px] text-brand font-semibold font-mono">
                {c.bites.toLocaleString()} Bites
              </span>
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              <Tag tone={dietaryTone}>{c.dietary}</Tag>
              {c.overBudget && <Tag tone="danger">Over budget</Tag>}
            </div>
          </div>
        );
      })}
    </ContextCard>
  );
}

export function OrderStatusBanner() {
  return (
    <div className="px-3 py-3 bg-success-light rounded-[14px] border border-success/30 text-center animate-fadeIn">
      <span className="text-[13px] font-semibold text-success">
        ✅ Order ready to confirm
      </span>
      <div className="text-[11px] text-success/85 mt-0.5">
        Barrio Queen · 14 people · $207
      </div>
    </div>
  );
}
