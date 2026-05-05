"use client";

import { useCallback, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatMessage, OrderContext } from "@/types";
import { CHAT_DEMO } from "@/data/chat-demo";
import { ChatInput } from "./ChatInput";
import { ChatStream } from "./ChatStream";
import { ContextPanel } from "./ContextPanel";
import { ComplianceRibbon } from "./ComplianceRibbon";
import { MobileContextBar } from "./MobileContextBar";
import { MobileBottomSheet } from "./MobileBottomSheet";

const TYPING_DELAY_MS = 1400;
const ANIMATE_FOR_MS = 800;

export function ChatConcierge() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<OrderContext>({});
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [animating, setAnimating] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetScrollTo, setSheetScrollTo] = useState<string | null>(null);

  const applyMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    if (msg.contextUpdate) {
      const update = msg.contextUpdate;
      setContext((prev) => mergeContext(prev, update));
      const keys = Object.keys(update);
      setAnimating((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.add(k));
        return next;
      });
      window.setTimeout(() => {
        setAnimating((prev) => {
          const next = new Set(prev);
          keys.forEach((k) => next.delete(k));
          return next;
        });
      }, ANIMATE_FOR_MS);
    }
  }, []);

  const advance = useCallback((): boolean => {
    if (step >= CHAT_DEMO.length) return false;
    const current = CHAT_DEMO[step];
    if (current.role !== "user") return false;

    applyMessage(current);
    setStep((s) => s + 1);

    const next = CHAT_DEMO[step + 1];
    if (next?.role === "assistant") {
      setIsTyping(true);
      window.setTimeout(() => {
        setIsTyping(false);
        applyMessage(next);
        setStep((s) => s + 1);
      }, TYPING_DELAY_MS);
    }
    return true;
  }, [step, applyMessage]);

  const handleChipTap = useCallback((section: string) => {
    setSheetScrollTo(section);
    setSheetOpen(true);
  }, []);

  const nextUser = CHAT_DEMO[step];
  const placeholder =
    nextUser?.role === "user" ? nextUser.text : "Type your catering request…";
  const totalUserTurns = Math.ceil(CHAT_DEMO.length / 2);
  const currentTurn = Math.min(Math.ceil(step / 2 + 1), totalUserTurns);
  const stepLabel =
    step < CHAT_DEMO.length
      ? `Press Enter to send next message (${currentTurn} of ${totalUserTurns})`
      : "✅ Demo complete";

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-3.5rem)]">
      {/* Sub-header */}
      <div className="flex items-center gap-2 px-4 md:px-5 py-2.5 border-b border-surface-border bg-surface-raised">
        {context.activeProfile && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-light min-w-0">
            <span className="text-sm shrink-0">{context.activeProfile.icon}</span>
            <span className="text-xs font-semibold text-brand-dark truncate max-w-[140px] md:max-w-[200px]">
              {context.activeProfile.name}
            </span>
          </div>
        )}
        <div className="flex-1" />
        {/* Desktop-only Context toggle */}
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className={cn(
            "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0",
            panelOpen
              ? "border-brand bg-brand-light text-brand"
              : "border-surface-border bg-transparent text-ink-secondary hover:border-surface-border-strong",
          )}
        >
          {panelOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          Context
        </button>
      </div>

      {/* Mobile compliance ribbon */}
      {context.budget?.compliance && (
        <ComplianceRibbon
          compliance={context.budget.compliance}
          onTap={() => handleChipTap("budget")}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-surface-raised">
          <ChatStream
            messages={messages}
            isTyping={isTyping}
            onSelectPrompt={advance}
          />
          {/* Mobile chips bar — above input, hidden on desktop */}
          <MobileContextBar context={context} onChipTap={handleChipTap} />
          <ChatInput
            placeholder={placeholder}
            onSend={advance}
            stepLabel={stepLabel}
            disabled={step >= CHAT_DEMO.length}
          />
        </div>
        {/* Desktop right panel */}
        <ContextPanel
          context={context}
          animatingKeys={animating}
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      </div>

      {/* Mobile bottom sheet */}
      <MobileBottomSheet
        open={sheetOpen}
        context={context}
        scrollTo={sheetScrollTo}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

function mergeContext(
  prev: OrderContext,
  update: Partial<OrderContext>,
): OrderContext {
  const next: OrderContext = { ...prev };
  for (const key of Object.keys(update) as (keyof OrderContext)[]) {
    const value = update[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (next as any)[key] = value;
    } else if (typeof value === "object" && value !== null) {
      const existing = prev[key];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (next as any)[key] =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? { ...existing, ...value }
          : value;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (next as any)[key] = value;
    }
  }
  return next;
}
