"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
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
  thinking: { mode: "play", frames: [135, 300], loop: true },
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
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animData, setAnimData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/assets/Innovi/Innovi_Animated.json")
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const inst = lottieRef.current?.animationItem;
    if (!inst) return;
    const config = STATE_SEGMENTS[state];
    let cancelled = false;

    inst.loop = false;
    inst.stop();
    inst.resetSegments(true);

    if (config.mode === "pause") {
      inst.goToAndStop(config.pauseFrame, true);
      return;
    }

    const [start, end] = config.frames;

    const onComplete = () => {
      if (cancelled) return;
      if (config.mode === "transition") {
        inst.resetSegments(true);
        inst.goToAndStop(config.pauseFrame, true);
      } else if (config.mode === "play" && config.loop) {
        inst.playSegments([start, end], true);
      }
    };

    inst.addEventListener("complete", onComplete);
    inst.playSegments([start, end], true);

    return () => {
      cancelled = true;
      inst.removeEventListener("complete", onComplete);
    };
  }, [state, animData]);

  if (!animData) {
    return (
      <span
        className={cn("block shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn("block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animData}
        loop={false}
        autoplay={false}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
