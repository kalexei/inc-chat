"use client";

import { cn } from "@/lib/utils";
import { InnoviAvatar } from "./innovi-avatar";

export type InnoviState =
  | "neutral"
  | "happy"
  | "thinking"
  | "speaking"
  | "surprised"
  | "error";

type InnoviFabProps = {
  state: InnoviState;
  isOpen: boolean;
  bubble: string | null;
  onToggle: () => void;
};

/**
 * Renders the speech bubble + FAB button as a plain fragment.
 * Positioning is handled by the parent wrapper in chat-embed.tsx.
 */
export function InnoviFab({ state, isOpen, bubble, onToggle }: InnoviFabProps) {
  const showBubble = !isOpen && Boolean(bubble);

  return (
    <>
      {/*
       * Speech bubble — max-width collapses to 0 when hidden.
       * This layout change is picked up by the parent's ResizeObserver,
       * which automatically resizes the iframe to fit.
       *
       * The wrapper is 220px wide (210px card + 10px room for the 7px arrow),
       * keeping the arrow within the overflow:hidden clip boundary.
       */}
      <div
        className={cn(
          "overflow-hidden transition-[opacity,transform,max-width] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
          showBubble
            ? "pointer-events-auto max-w-[220px] opacity-100 translate-x-0"
            : "pointer-events-none max-w-0 opacity-0 translate-x-4"
        )}
      >
        <div
          aria-live="polite"
          className="relative w-[210px] rounded-2xl rounded-br-sm border border-border/70 bg-card text-[13px] leading-snug text-foreground shadow-[0_3px_12px_rgba(0,0,0,0.22)]"
        >
          {/* Arrow pointing right toward FAB — sits in the 10px gap between card and wrapper edge */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-[7px] -translate-y-1/2 block h-3 w-3 rotate-45 border-r border-b border-border/70 bg-card"
          />
          <div className="px-3 py-2.5">
            <p className="line-clamp-2 pr-0.5">{bubble}</p>
          </div>
        </div>
      </div>

      {/* Innovi FAB button */}
      <button
        type="button"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        onClick={onToggle}
        className={cn(
          "relative size-16 shrink-0 bg-transparent",
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "active:scale-95",
          !isOpen && "hover:-translate-y-1"
        )}
      >
        <InnoviAvatar
          state={state}
          size={64}
          className="drop-shadow-[0_2px_7px_rgba(87,82,163,0.42)]"
        />

      </button>
    </>
  );
}
