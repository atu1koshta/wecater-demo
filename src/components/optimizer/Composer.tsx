"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { MODES, type OptimizerMode } from "./modes";

export function Composer({
  placeholder,
  onSend,
  disabled,
  step,
  totalSteps,
  currentMode,
  onModeChange,
}: {
  placeholder: string;
  onSend: () => void;
  disabled: boolean;
  step: number;
  totalSteps: number;
  currentMode: OptimizerMode;
  onModeChange: (m: OptimizerMode) => void;
}) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (disabled) return;
    onSend();
    setValue("");
  };

  return (
    <div className="border-t border-surface-border-light bg-surface-raised px-4 md:px-5 pt-3 pb-4">
      <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-[10px] font-bold text-ink-tertiary tracking-wider uppercase self-center whitespace-nowrap mr-1">
          Optimize:
        </span>
        {MODES.map((m) => {
          const on = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              title={m.desc}
              onClick={() => onModeChange(m.id)}
              className={cn(
                "px-2.5 py-1 rounded-[14px] text-[11px] font-semibold border transition-colors flex items-center gap-1 whitespace-nowrap",
                on
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-surface-border bg-surface-raised text-ink-secondary hover:border-surface-border-strong",
              )}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 bg-surface rounded-[14px] border border-surface-border pl-4 pr-1 py-1 focus-within:border-brand transition-colors">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink-tertiary outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled}
          className={cn(
            "h-9 w-9 rounded-[10px] grid place-items-center transition-colors",
            disabled
              ? "bg-surface-border cursor-not-allowed"
              : "bg-brand hover:bg-brand-dark cursor-pointer",
          )}
          aria-label="Send"
        >
          <Send className="h-4 w-4 text-ink-inverse" strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex justify-between mt-1.5 text-[10px] text-ink-tertiary">
        <span>
          {step < totalSteps
            ? `Press Enter to continue · step ${step + 1} of ${totalSteps}`
            : "✅ Demo complete — review the panels"}
        </span>
        <span className="hidden sm:inline">
          Try slash commands or natural language
        </span>
      </div>
    </div>
  );
}
