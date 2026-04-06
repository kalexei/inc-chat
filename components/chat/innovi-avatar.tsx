"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InnoviState } from "./innovi-fab";

const ICONS: Record<InnoviState, string> = {
  neutral: "/assets/Innovi/Innovi_Neutral.svg",
  happy: "/assets/Innovi/Innovi_Happy.svg",
  thinking: "/assets/Innovi/Innovi_Thinking.svg",
  speaking: "/assets/Innovi/Innovi_Speaking.svg",
  surprised: "/assets/Innovi/Innovi_Surprised.svg",
  error: "/assets/Innovi/Innovi_Error.svg",
};

const ALL_STATES = Object.keys(ICONS) as InnoviState[];

type InnoviAvatarProps = {
  state: InnoviState;
  size?: number;
  className?: string;
  glow?: boolean;
};

/**
 * Crossfading Innovi mascot that reflects the current agent state.
 * Reusable across the FAB, embed header, and main chat header.
 */
export function InnoviAvatar({
  state,
  size = 32,
  className,
  glow = false,
}: InnoviAvatarProps) {
  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {ALL_STATES.map((s) => (
        <Image
          key={s}
          src={ICONS[s]}
          alt=""
          aria-hidden="true"
          fill
          sizes={`${size}px`}
          loading="eager"
          className={cn(
            "object-contain transition-opacity duration-500 ease-in-out",
            state === s ? "opacity-100" : "opacity-0",
            glow &&
              state === s &&
              "drop-shadow-[0_-4px_16px_rgba(87,82,163,0.65)]",
          )}
        />
      ))}
    </span>
  );
}
