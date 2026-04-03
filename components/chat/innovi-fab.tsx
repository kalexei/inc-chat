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

export function InnoviFab({
  state,
  isOpen,
  bubble,
  onToggle,
  onDismissBubble,
}: InnoviFabProps) {
  const showBubble = !isOpen && Boolean(bubble);

  return (
    <div className="fixed right-3 bottom-3 z-50 flex items-center gap-3">
      {/* Speech bubble wrapper — overflow-visible so the dismiss button can peek out */}
      <div
        className={cn(
          "relative transition-[opacity,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
          showBubble
            ? "pointer-events-auto opacity-100 translate-x-0"
            : "pointer-events-none opacity-0 translate-x-4",
        )}
      >
        {/* Dismiss button — sits outside the bubble card */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismissBubble();
          }}
          aria-label="Dismiss message"
          tabIndex={showBubble ? 0 : -1}
          className="absolute -top-2 -right-2 z-10 grid size-5 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/60 transition-colors hover:text-foreground"
        >
          <X className="size-3" />
        </button>

        {/* Bubble card */}
        <div
          aria-live="polite"
          className="relative max-w-[210px] rounded-2xl rounded-br-sm border border-border/70 bg-card/95 px-3.5 py-2.5 text-[13px] leading-snug text-foreground shadow-lg shadow-black/20 backdrop-blur"
        >
          {/* Arrow pointing right toward the FAB */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-[7px] -translate-y-1/2 block h-3 w-3 rotate-45 border-r border-b border-border/70 bg-card/95"
          />
          <p className="line-clamp-2 pr-1">{bubble}</p>
        </div>
      </div>

      {/* Innovi FAB */}
      <button
        type="button"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        onClick={onToggle}
        className={cn(
          "relative size-14 shrink-0 bg-transparent",
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
            sizes="56px"
            className={cn(
              "object-contain transition-opacity duration-500 ease-in-out",
              state === s
                ? "opacity-100 drop-shadow-[0_6px_20px_rgba(87,82,163,0.6)]"
                : "opacity-0",
            )}
          />
        ))}

        {/* X badge – top-right corner, visible when open */}
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
    </div>
  );
}
