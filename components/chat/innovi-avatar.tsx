"use client";

import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { InnoviState } from "./innovi-fab";

/**
 * Frame segments for each Innovi state inside the Lottie animation (60 fps).
 *
 * `mode`:
 *   "play"  → play segment, loop controls repeat
 *   "pause" → jump to `pauseFrame` and freeze (active/idle hold)
 */
type SegmentConfig =
  | { mode: "play"; frames: [number, number]; loop: boolean }
  | { mode: "pause"; pauseFrame: number }
  | { mode: "transition"; frames: [number, number]; pauseFrame: number };

const STATE_SEGMENTS: Record<InnoviState, SegmentConfig> = {
  neutral: { mode: "transition", frames: [511, 600], pauseFrame: 1 },
  happy: { mode: "transition", frames: [0, 135], pauseFrame: 135 },
  thinking: { mode: "play", frames: [135, 295], loop: true },
  speaking: { mode: "play", frames: [295, 481], loop: true },
  error: { mode: "play", frames: [0, 135], loop: false },
};

type InnoviAvatarProps = {
  state: InnoviState;
  size?: number;
  className?: string;
};

export function InnoviAvatar({
  state,
  size = 32,
  className,
}: InnoviAvatarProps) {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);

  useEffect(() => {
    if (!dotLottie) return;
    const config = STATE_SEGMENTS[state];
    let cancelled = false;
    let onComplete: (() => void) | null = null;

    const applySegmentForState = () => {
      if (cancelled) return;
      dotLottie.stop();
      dotLottie.setLoop(false);

      if (config.mode === "pause") {
        dotLottie.setFrame(config.pauseFrame);
        return;
      }

      const [start, end] = config.frames;
      dotLottie.setSegment(start, end);

      if (config.mode === "transition") {
        onComplete = () => {
          if (cancelled) return;
          dotLottie.removeEventListener("complete", onComplete!);
          dotLottie.setFrame(config.pauseFrame);
        };
        dotLottie.addEventListener("complete", onComplete);
        dotLottie.play();
        return;
      }

      dotLottie.setLoop(config.loop);
      dotLottie.play();
    };

    dotLottie.addEventListener("load", applySegmentForState);
    applySegmentForState();

    return () => {
      cancelled = true;
      dotLottie.removeEventListener("load", applySegmentForState);
      if (onComplete) {
        dotLottie.removeEventListener("complete", onComplete);
      }
    };
  }, [state, dotLottie]);

  return (
    <span
      className={cn("block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <DotLottieReact
        src="/assets/Innovi/Innovi_Animated.json"
        dotLottieRefCallback={setDotLottie}
        loop={false}
        autoplay={false}
        useFrameInterpolation
        style={{ width: size, height: size }}
      />
    </span>
  );
}
