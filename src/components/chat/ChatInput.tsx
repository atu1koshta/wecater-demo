"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";

export function ChatInput({
  placeholder,
  onSend,
  stepLabel,
  disabled,
}: {
  placeholder: string;
  onSend: () => void;
  stepLabel: string;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (disabled) return;
    onSend();
    setValue("");
  };

  return (
    <div className="px-4 md:px-5 pt-3 pb-5 border-t border-surface-border-light bg-surface-raised">
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
      <div className="flex justify-between mt-2 text-[10px] text-ink-tertiary">
        <span>{stepLabel}</span>
        <span>WeCater.ai · AI Concierge</span>
      </div>
    </div>
  );
}
