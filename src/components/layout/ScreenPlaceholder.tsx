import { type LucideIcon } from "lucide-react";

export function ScreenPlaceholder({
  icon: Icon,
  title,
  blurb,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  blurb: string;
  phase: string;
}) {
  return (
    <div className="px-4 md:px-8 py-10 md:py-16">
      <div className="max-w-xl mx-auto text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand-dark mb-5">
          <Icon className="h-7 w-7" strokeWidth={2.2} />
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">{title}</h1>
        <p className="text-ink-secondary mt-2">{blurb}</p>
        <div className="inline-flex items-center gap-2 mt-6 px-3 py-1.5 rounded-full bg-surface-sunken text-xs font-mono text-ink-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          {phase}
        </div>
      </div>
    </div>
  );
}
