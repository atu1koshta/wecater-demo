"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/cn";

/**
 * Sticky 56px header. Desktop: shown on the right of the sidebar with a
 * breadcrumb (active screen + order context). Mobile: full-width with a
 * hamburger-less compact layout (logo + active screen label + avatar).
 *
 * Order-context breadcrumb segments are placeholder strings for now; they'll
 * be wired to the Zustand store in Phase 3 when the store lands.
 */
export function TopHeader() {
  const pathname = usePathname();
  const active = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-14",
        "bg-surface-raised/85 backdrop-blur-md border-b border-surface-border",
        "flex items-center px-4 md:px-6",
      )}
    >
      <div className="md:hidden flex items-center gap-2 flex-1 min-w-0">
        <Logo size={28} showWordmark={false} />
        <span className="font-display font-semibold text-ink truncate">
          {active?.short ?? "weCater"}
        </span>
      </div>

      <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 text-sm">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-ink-tertiary hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="font-medium">Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-tertiary" />
        <span className="font-display font-semibold text-ink">
          {active?.label ?? "weCater"}
        </span>

        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-surface-border text-ink-secondary">
          <span className="text-xs">👤</span>
          <span className="font-medium">Sally Chen</span>
          <ChevronRight className="h-3 w-3 text-ink-tertiary" />
          <span>Dr. Patel&apos;s Cardiology</span>
          <ChevronRight className="h-3 w-3 text-ink-tertiary" />
          <span className="text-ink-tertiary">14 people · Tomorrow lunch</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-light text-brand-dark text-xs font-mono font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          27,420 Bites
        </div>
        <div className="md:hidden h-8 w-8 rounded-full bg-brand text-ink-inverse grid place-items-center font-display font-semibold text-sm">
          S
        </div>
      </div>
    </header>
  );
}
