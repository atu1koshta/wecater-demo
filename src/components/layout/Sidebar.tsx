"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col",
        "fixed inset-y-0 left-0 z-30",
        "w-[72px] lg:w-[240px]",
        "bg-surface-raised border-r border-surface-border",
      )}
    >
      <div className="h-14 flex items-center px-4 border-b border-surface-border">
        <Logo size={32} showWordmark={false} className="lg:hidden" />
        <Logo size={32} className="hidden lg:flex" />
      </div>

      <nav className="flex-1 p-2 lg:p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                "lg:justify-start justify-center",
                active
                  ? "bg-brand-light text-brand-dark"
                  : "text-ink-secondary hover:bg-surface-sunken hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
              <span className="hidden lg:inline text-sm font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-surface-sunken">
          <div className="h-8 w-8 rounded-full bg-brand text-ink-inverse grid place-items-center font-display font-semibold text-sm">
            S
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold text-ink truncate">Sally Chen</div>
            <div className="text-[11px] text-ink-tertiary truncate">Pharma rep · TerraMed</div>
          </div>
        </div>
      </div>

      <div className="lg:hidden p-2 border-t border-surface-border">
        <div className="h-9 w-9 mx-auto rounded-full bg-brand text-ink-inverse grid place-items-center font-display font-semibold text-sm">
          S
        </div>
      </div>
    </aside>
  );
}
