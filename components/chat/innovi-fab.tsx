"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type InnoviState =
  | "neutral"
  | "happy"
  | "thinking"
  | "speaking"
  | "surprised"
  | "error";

const ICONS: Record<InnoviState, string> = {
  neutral: "/assets/Innovi/Innovi_Neutral.svg",
  happy: "/assets/Innovi/Innovi_Happy.svg",
  thinking: "/assets/Innovi/Innovi_Thinking.svg",
  speaking: "/assets/Innovi/Innovi_Speaking.svg",
  surprised: "/assets/Innovi/Innovi_Surprised.svg",
  error: "/assets/Innovi/Innovi_Error.svg",
};

const ALL_STATES = Object.keys(ICONS) as InnoviState[];

type InnoviFabProps = {
  state: InnoviState;
  isOpen: boolean;
  bubble: string | null;
  onToggle: () => void;
  onDismissBubble: () => void;
};

/**
 * Renders the speech bubble + FAB button as a plain fragment.
 * Positioning is handled by the parent wrapper in chat-embed.tsx.
 */
export function InnoviFab({
  state,
  isOpen,
  bubble,
  onToggle,
  onDismissBubble,
}: InnoviFabProps) {
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
            : "pointer-events-none max-w-0 opacity-0 translate-x-4",
        )}
      >
        <div
          aria-live="polite"
          className="relative w-[210px] rounded-2xl rounded-br-sm border border-border/70 bg-card/95 text-[13px] leading-snug text-foreground shadow-lg shadow-black/20 backdrop-blur"
        >
          {/* Arrow pointing right toward FAB — sits in the 10px gap between card and wrapper edge */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-[7px] -translate-y-1/2 block h-3 w-3 rotate-45 border-r border-b border-border/70 bg-card/95"
          />
          {/* Content row with inline dismiss button — no overflow issues */}
          <div className="flex items-start gap-2 px-3 py-2.5">
            <p className="flex-1 line-clamp-2 pr-0.5">{bubble}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismissBubble();
              }}
              aria-label="Dismiss message"
              tabIndex={showBubble ? 0 : -1}
              className="mt-0.5 shrink-0 grid size-4 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/60 transition-colors hover:text-foreground"
            >
              <X className="size-2.5" />
            </button>
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
          !isOpen && "hover:-translate-y-1",
        )}
      >
        {/* Crossfading Innovi state icons */}
        {ALL_STATES.map((s) => (
          <Image
            key={s}
            src={ICONS[s]}
            alt=""
            aria-hidden="true"
            fill
            sizes="64px"
            className={cn(
              "object-contain transition-opacity duration-500 ease-in-out",
              state === s
                ? "opacity-100 drop-shadow-[0_-4px_16px_rgba(87,82,163,0.65)]"
                : "opacity-0",
            )}
          />
        ))}

        {/* X badge – top-right corner, visible when chat is open */}
        <span
          className={cn(
            "absolute -top-1 -right-1 z-10 grid size-5 place-items-center rounded-full",
            "bg-[#0F0F2B] ring-1 ring-white/20",
            "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isOpen
              ? "pointer-events-auto opacity-100 scale-100"
              : "pointer-events-none opacity-0 scale-50",
          )}
        >
          <X className="size-3 text-white" />
        </span>
      </button>
    </>
  );
}
