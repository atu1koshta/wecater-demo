"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/types";
import { CHAT_SUGGESTED_PROMPTS } from "@/data/chat-demo";

export function ChatStream({
  messages,
  isTyping,
  onSelectPrompt,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  onSelectPrompt: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-5 pt-5 pb-2.5">
      {messages.length === 0 && (
        <EmptyState onSelectPrompt={onSelectPrompt} />
      )}

      {messages.map((m, i) => (
        <ChatBubble key={i} message={m} />
      ))}

      {isTyping && <TypingBubble />}
      <div ref={endRef} />
    </div>
  );
}

function EmptyState({ onSelectPrompt }: { onSelectPrompt: () => void }) {
  return (
    <div className="text-center py-16 md:py-20 animate-fadeIn">
      <div className="h-14 w-14 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-brand to-brand-dark grid place-items-center shadow-[0_4px_20px_rgba(232,106,26,0.18)]">
        <span className="text-2xl">🍽️</span>
      </div>
      <h2 className="text-xl font-semibold font-display text-ink mb-1.5">
        What are we ordering today?
      </h2>
      <p className="text-[13px] text-ink-tertiary max-w-[380px] mx-auto leading-relaxed">
        Tell me who it&apos;s for and I&apos;ll load their profile, dietary needs,
        budget, and suggest something they haven&apos;t had recently.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-5">
        {CHAT_SUGGESTED_PROMPTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={onSelectPrompt}
            className="px-3.5 py-2 rounded-full border border-surface-border bg-surface-raised text-xs text-ink-secondary hover:border-brand hover:text-brand transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex mb-4 animate-fadeIn",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <Avatar />}
      <div
        className={cn(
          "max-w-[78%] px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-ink text-ink-inverse rounded-[18px_18px_4px_18px]"
            : "bg-[#F6F3EF] text-ink rounded-[18px_18px_18px_4px]",
        )}
      >
        {renderInlineBold(message.text)}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="h-7 w-7 rounded-lg shrink-0 mr-2.5 mt-0.5 bg-gradient-to-br from-brand to-brand-dark grid place-items-center">
      <span className="text-ink-inverse text-xs font-bold font-display">W</span>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-center gap-2.5 mb-4 animate-fadeIn">
      <Avatar />
      <div className="px-4 py-3 rounded-[18px_18px_18px_4px] bg-[#F6F3EF] flex gap-1.5">
        {[0, 1, 2].map((d) => (
          <div
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-ink-tertiary"
            style={{
              animation: `chat-pulse 1.2s ${d * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes chat-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/** Bold inline text wrapped in **stars**. */
function renderInlineBold(text: string) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
  );
}
