import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { NAV_ITEMS } from "@/components/layout/nav-config";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-2xl">
        <Logo size={44} className="mb-8" />

        <h1 className="font-display font-bold text-3xl md:text-4xl text-ink leading-tight">
          The catering rewards marketplace
        </h1>
        <p className="text-ink-secondary mt-3 max-w-lg">
          Order office lunches your company pays for and earn personal Bites.
          Five connected screens — pick any to start.
        </p>

        <div className="grid gap-2.5 mt-8">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 p-4 bg-surface-raised rounded-xl border border-surface-border hover:border-brand hover:shadow-md transition-all"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-light text-brand-dark grid place-items-center group-hover:bg-brand group-hover:text-ink-inverse transition-colors">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-ink">{item.label}</div>
                  <div className="text-sm text-ink-secondary truncate">{item.blurb}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-tertiary group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-ink-tertiary mt-8 text-center">
          Each screen runs an independent demo. Phase 2 — AppShell live.
        </p>
      </div>
    </main>
  );
}
