"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type FrameState = {
  availHeight: number | null;
  availWidth: number | null;
  isMobile: boolean;
};

/**
 * Handles bidirectional postMessage communication with the host
 * page and keeps the iframe sized to the embed's rendered content.
 *
 * - Listens for `rak-inc-chat-host` messages that report available space.
 * - Uses a ResizeObserver on `wrapperRef` to auto-report dimensions.
 * - Sends open/close/fullscreen intent so the host can resize instantly.
 */
export function useEmbedFrame(
  wrapperRef: RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  bubbleText: string | null,
) {
  const embedId = "rak-inc-chat";

  const [availHeight, setAvailHeight] = useState<number | null>(null);
  const [availWidth, setAvailWidth] = useState<number | null>(null);
  const isMobile = availWidth !== null && availWidth < 500;

  const isOpenRef = useRef(false);
  const hasBubbleRef = useRef(false);
  const isFullscreenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Listen for host page constraints
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data as
        | { source?: string; availHeight?: number; availWidth?: number }
        | undefined;
      if (data?.source !== "rak-inc-chat-host") return;
      if (typeof data.availHeight === "number") setAvailHeight(data.availHeight);
      if (typeof data.availWidth === "number") setAvailWidth(data.availWidth);
    };
    window.addEventListener("message", handler);
    window.parent?.postMessage(
      { source: "rak-inc-chat-ready", id: embedId },
      "*",
    );
    return () => window.removeEventListener("message", handler);
  }, []);

  // ResizeObserver — measured dimensions
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 && height === 0) return;
      window.parent?.postMessage(
        {
          source: "rak-inc-chat",
          id: embedId,
          open: isOpenRef.current,
          hasBubble: hasBubbleRef.current,
          fullscreen: isFullscreenRef.current,
          width: Math.ceil(width),
          height: Math.ceil(height),
        },
        "*",
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [wrapperRef]);

  // Instant state-change message (before ResizeObserver fires)
  useEffect(() => {
    const hasBubble = !isOpen && Boolean(bubbleText);
    hasBubbleRef.current = hasBubble;
    const fullscreen = isMobile && isOpen;
    isFullscreenRef.current = fullscreen;

    const el = wrapperRef.current;
    const rect = el?.getBoundingClientRect();
    window.parent?.postMessage(
      {
        source: "rak-inc-chat",
        id: embedId,
        open: isOpen,
        hasBubble,
        fullscreen,
        ...(rect && rect.width > 0
          ? { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }
          : {}),
      },
      "*",
    );
  }, [isOpen, isMobile, bubbleText, wrapperRef]);

  return { availHeight, availWidth, isMobile } satisfies FrameState;
}
