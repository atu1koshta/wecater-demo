import { cn } from "@/lib/cn";

export function Logo({
  size = 36,
  showWordmark = true,
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="rounded-xl bg-brand text-ink-inverse grid place-items-center font-display font-bold shadow-brand"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        W
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display font-bold text-ink text-[15px] tracking-tight">
            weCater
          </div>
          <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-medium">
            Catering Rewards
          </div>
        </div>
      )}
    </div>
  );
}
