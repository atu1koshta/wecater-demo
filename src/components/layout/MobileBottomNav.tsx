"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/cn";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-30",
        "bg-surface-raised/95 backdrop-blur-md border-t border-surface-border",
        "h-16 pb-[env(safe-area-inset-bottom)]",
        "flex items-stretch",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
              active ? "text-brand-dark" : "text-ink-tertiary",
            )}
          >
            <Icon
              className={cn("h-5 w-5", active && "scale-110")}
              strokeWidth={active ? 2.4 : 2}
            />
            <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
              {item.short}
            </span>
            {active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
