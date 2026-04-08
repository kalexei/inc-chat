"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Scroll-tracking for the embed chat panel.
 *
 * - Auto-scrolls to bottom on new messages while the user is near the bottom.
 * - On typing-indicator dismiss, scrolls to top of the new assistant reply.
 * - Exposes `showJumpToLatest` and `scrollToLatest()` for a jump button.
 */
export function useEmbedScroll(
  scrollAreaRef: RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  shouldRenderPanel: boolean,
  hasMessages: boolean,
  messages: ChatMessage[],
  typing: boolean,
) {
  const nearBottomRef = useRef(true);
  const scrollTypingRef = useRef(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const getViewport = useCallback(
    () =>
      scrollAreaRef.current?.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]',
      ) ?? null,
    [scrollAreaRef],
  );

  // Auto-scroll on new messages / typing state changes
  useEffect(() => {
    if (!isOpen || !hasMessages) return;
    const viewport = getViewport();
    if (!viewport) return;

    const wasTyping = scrollTypingRef.current;
    scrollTypingRef.current = typing;

    if (wasTyping && !typing) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        requestAnimationFrame(() => {
          const els = viewport.querySelectorAll<HTMLElement>(
            '[data-chat-role="assistant"]',
          );
          const last = els[els.length - 1];
          if (!last) return;
          const relTop =
            last.getBoundingClientRect().top -
            viewport.getBoundingClientRect().top +
            viewport.scrollTop;
          viewport.scrollTo({
            top: Math.max(0, relTop - 8),
            behavior: "smooth",
          });
        });
        return;
      }
    }

    if (!nearBottomRef.current) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [isOpen, hasMessages, messages, typing, getViewport]);

  // Near-bottom detection
  useEffect(() => {
    if (!isOpen) {
      nearBottomRef.current = true;
      return;
    }
    const viewport = getViewport();
    if (!viewport) return;

    const update = () => {
      const dist =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      nearBottomRef.current = dist <= 90;
      setShowJumpToLatest(dist > 90);
    };

    update();
    viewport.addEventListener("scroll", update, { passive: true });
    return () => viewport.removeEventListener("scroll", update);
  }, [isOpen, shouldRenderPanel, hasMessages, getViewport]);

  const scrollToLatest = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    nearBottomRef.current = true;
    setShowJumpToLatest(false);
  }, [getViewport]);

  return { showJumpToLatest, scrollToLatest };
}
