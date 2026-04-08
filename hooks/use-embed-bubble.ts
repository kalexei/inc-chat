"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { useEffect, useRef, useState } from "react";

/**
 * Manages the speech-bubble text shown next to the FAB when
 * the embed panel is closed.
 *
 * - Shows an intro prompt after 2.5 s if the user never opened the panel.
 * - After closing, shows a truncated preview of the last assistant message.
 * - Auto-hides the bubble after 4.5 s for cleaner UX.
 */
export function useEmbedBubble(isOpen: boolean, messages: ChatMessage[]) {
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const hasOpenedRef = useRef(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasOpenedRef.current)
        setBubbleText(
          "Hi! I\u2019m Sky \u{1F44B} \u2014 ask me anything about Innovation City.",
        );
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      const t = window.setTimeout(() => setBubbleText(null), 0);
      return () => window.clearTimeout(t);
    } else if (hasOpenedRef.current) {
      const lastAsst = [...messagesRef.current]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAsst) {
        const plain = lastAsst.content
          .replace(/\|[^\n]*/g, "")
          .replace(/[*#`_~[\]]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const preview = plain.slice(0, 72) + (plain.length > 72 ? "\u2026" : "");
        const t = window.setTimeout(() => setBubbleText(preview), 0);
        return () => window.clearTimeout(t);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!bubbleText || isOpen) return;
    const t = window.setTimeout(() => setBubbleText(null), 4500);
    return () => window.clearTimeout(t);
  }, [bubbleText, isOpen]);

  return bubbleText;
}
